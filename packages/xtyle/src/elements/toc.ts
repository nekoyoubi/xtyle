import { XtyleElement, define, type StyleMode } from "./base.js";
import { tocHostCss, type TocItem } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/toc/source.generated.js";

export type { TocItem };

export class XtyleToc extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "toc", {
		applyIntent: () => {},
		afterApply: () => this.paintActive(),
	});
	private observer: IntersectionObserver | null = null;
	private visible = new Set<string>();
	private activeId: string | null = null;

	static get observedAttributes(): string[] {
		return ["items", "label", "sticky"];
	}

	get items(): TocItem[] {
		const raw = this.getAttribute("items");
		if (!raw) return [];
		try {
			const parsed = JSON.parse(raw);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}
	set items(value: TocItem[]) {
		this.setAttribute("items", JSON.stringify(value));
	}

	get label(): string {
		return this.getAttribute("label") ?? "On this page";
	}
	set label(value: string | null | undefined) {
		this.reflectString("label", value);
	}

	get sticky(): boolean {
		return this.hasAttribute("sticky");
	}
	set sticky(value: boolean) {
		this.reflectBoolean("sticky", value);
	}

	disconnectedCallback(): void {
		this.observer?.disconnect();
		this.observer = null;
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return { items: this.items, label: this.label, sticky: this.sticky };
	}

	/** A signature of the list structure the `update` hook can't patch — the items. When the
	 * rows change, the list is rebuilt (a `mount`) rather than patched. */
	private shapeSignature(): string {
		return JSON.stringify(this.items);
	}

	private get links(): HTMLAnchorElement[] {
		return Array.from(this.root.querySelectorAll<HTMLAnchorElement>(".xtyle-toc__link"));
	}

	private setActive(id: string | null): void {
		if (id === this.activeId) return;
		this.activeId = id;
		this.paintActive();
	}

	/** Apply the active-link classes for the current `activeId`. Idempotent, so it can
	 * re-assert the highlight after the async fragment paint populates the links. */
	private paintActive(): void {
		for (const link of this.links) {
			const active = link.dataset.tocLink === this.activeId;
			link.classList.toggle("is-active", active);
			if (active) link.setAttribute("aria-current", "true");
			else link.removeAttribute("aria-current");
		}
	}

	private initSpy(): void {
		this.observer?.disconnect();
		this.observer = null;
		this.visible.clear();
		this.activeId = null;

		if (typeof IntersectionObserver === "undefined") return;
		const targets = this.items
			.map((item) => document.getElementById(item.id))
			.filter((el): el is HTMLElement => el !== null);
		if (targets.length === 0) return;

		this.observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) this.visible.add(entry.target.id);
					else this.visible.delete(entry.target.id);
				}
				const first = targets.find((t) => this.visible.has(t.id));
				if (first) this.setActive(first.id);
			},
			{ rootMargin: "-15% 0px -70% 0px", threshold: 0 },
		);
		for (const t of targets) this.observer.observe(t);
		this.setActive(targets[0]?.id ?? null);
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(tocHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		this.initSpy();
	}
}

define("xtyle-toc", XtyleToc);
