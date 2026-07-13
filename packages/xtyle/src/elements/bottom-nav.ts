import { XtyleElement, define, type StyleMode } from "./base.js";
import { bottomNavHostCss } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/bottom-nav/source.generated.js";
import type { BottomNavTab } from "../markup/bottom-nav.js";

/**
 * The thumb-reachable bottom tab bar that pairs with `mobile-shell` the way `statusbar` pairs with
 * `app-shell`. Fragment-backed like `tabs` and `segmented`: it renders the tablist itself, so a mod
 * can reshape a tab the same way it can reshape any other control.
 *
 * The runtime adds what markup can't: a roving tabindex, so the whole bar is a single tab stop and the
 * arrows (plus Home / End) move between sections inside it.
 */
export class XtyleBottomNav extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "bottom-nav", {
		applyIntent: () => {},
	});

	private wired = false;
	private tabsProp: BottomNavTab[] | null = null;

	static get observedAttributes(): string[] {
		return ["value", "label", "tabs"];
	}

	get value(): string {
		return this.getAttribute("value") ?? "";
	}
	set value(next: string) {
		if (next === this.value) return;
		this.setAttribute("value", next);
	}

	get label(): string {
		return this.getAttribute("label") ?? "Sections";
	}

	/** The tabs. Set the property with a real array, or the attribute with JSON for a static page. */
	get tabs(): BottomNavTab[] {
		if (this.tabsProp) return this.tabsProp;
		const raw = this.getAttribute("tabs");
		if (!raw) return [];
		try {
			const parsed: unknown = JSON.parse(raw);
			return Array.isArray(parsed) ? (parsed as BottomNavTab[]) : [];
		} catch {
			return [];
		}
	}
	set tabs(next: BottomNavTab[]) {
		this.tabsProp = next;
		if (this.root.firstChild) this.render();
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(bottomNavHostCss);
		this.fragment.update({ tabs: this.tabs, value: this.value, label: this.label });
		this.wire();
	}

	private wire(): void {
		if (this.wired) return;
		this.wired = true;
		// Click and keydown are composed, so they surface on the host from inside the shadow root; one
		// listener pair on the host covers every tab, and survives the fragment repainting them.
		this.addEventListener("click", (event) => {
			const tab = (event.composedPath()[0] as HTMLElement | null)?.closest?.<HTMLElement>("[data-value]");
			if (tab?.dataset.value) this.select(tab.dataset.value);
		});
		this.addEventListener("keydown", (event) => this.onKeydown(event));
	}

	private onKeydown(event: KeyboardEvent): void {
		const tabs = this.tabs;
		if (tabs.length === 0) return;
		const current = tabs.findIndex((t) => t.value === this.value);
		const from = current < 0 ? 0 : current;
		let next = -1;
		if (event.key === "ArrowRight") next = (from + 1) % tabs.length;
		else if (event.key === "ArrowLeft") next = (from - 1 + tabs.length) % tabs.length;
		else if (event.key === "Home") next = 0;
		else if (event.key === "End") next = tabs.length - 1;
		if (next < 0) return;
		event.preventDefault();
		const tab = tabs[next];
		if (!tab) return;
		this.select(tab.value);
		this.root.querySelector<HTMLElement>(`[data-value="${CSS.escape(tab.value)}"]`)?.focus();
	}

	private select(value: string): void {
		if (!value || value === this.value) return;
		this.value = value;
		this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
	}
}

define("xtyle-bottom-nav", XtyleBottomNav);
