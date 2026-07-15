import { XtyleElement, define, type StyleMode } from "./base.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/steps/source.generated.js";

function attributesOf(el: Element): Record<string, string> {
	const out: Record<string, string> = {};
	for (const attr of Array.from(el.attributes)) out[attr.name] = attr.value;
	return out;
}

/**
 * A horizontal step indicator for a linear process (checkout, onboarding, a wizard). The element
 * owns the state: it splits the authored `<li>` steps into done / current / upcoming by index
 * against `current`, flags the current one with `aria-current`, and re-reads the list whenever its
 * children change. The marker and the connector track are the component's own furniture, so the
 * fill renders them as real nodes around each step's authored content — a mod can put an icon in
 * the marker, number the steps in roman, or draw the connector as a dashed arrow.
 */
export class XtyleSteps extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "scoped";
	}

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "steps", {
		applyIntent: () => {},
		afterApply: () => this.placeContent(),
	});

	private observer: MutationObserver | null = null;
	private list: Element | null = null;
	private authored = new WeakMap<Element, Node[]>();
	private ready = false;
	private awaitingParse = false;

	static get observedAttributes(): string[] {
		return ["current"];
	}

	get current(): number {
		const parsed = Number.parseInt(this.getAttribute("current") ?? "0", 10);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	set current(value: number) {
		this.setAttribute("current", String(value));
	}

	override connectedCallback(): void {
		if (this.deferUntilParsed()) return;
		super.connectedCallback();
		this.watch();
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.observer?.disconnect();
	}

	attributeChangedCallback(): void {
		if (this.ready) this.render();
	}

	/**
	 * An element upgrades as its own start tag is parsed, so its list may not exist yet. Painting the
	 * fill then would leave the parser appending the authored list *after* the rendered steps, so the
	 * first render waits for the parse to finish. A client-created element (a framework, `createElement`)
	 * already has its children by `connectedCallback` and renders immediately.
	 */
	private deferUntilParsed(): boolean {
		if (typeof document === "undefined" || document.readyState !== "loading") return false;
		if (!this.awaitingParse) {
			this.awaitingParse = true;
			document.addEventListener(
				"DOMContentLoaded",
				() => {
					this.awaitingParse = false;
					if (this.isConnected) this.connectedCallback();
				},
				{ once: true },
			);
		}
		return true;
	}

	/**
	 * Adopt the authored list. It is detached from the element (the fill owns the rendered structure)
	 * but kept alive and referenced, so a framework re-rendering its own `<ol>` still mutates a node
	 * the observer is watching — which is what re-splits the steps.
	 */
	private syncList(): void {
		const found = Array.from(this.children).find(
			(child) => (child.tagName === "OL" || child.tagName === "UL") && !child.hasAttribute("data-root"),
		);
		if (!found || found === this.list) return;
		this.list = found;
		found.remove();
		this.fragment.remount();
	}

	/** Each authored step and the nodes it contributes. Once relocated into the fill's label region a
	 * step's `<li>` is empty, so the nodes are read from the held map rather than re-read as nothing. */
	private items(): { li: Element; nodes: Node[] }[] {
		if (!this.list) return [];
		return Array.from(this.list.children)
			.filter((child) => child.tagName === "LI")
			.map((li) => {
				const live = Array.from(li.childNodes);
				if (live.length > 0) this.authored.set(li, live);
				return { li, nodes: this.authored.get(li) ?? [] };
			});
	}

	private get bindings(): Record<string, unknown> {
		const current = this.current;
		return {
			steps: this.items().map(({ li }, index) => ({
				index,
				state: index < current ? "done" : index === current ? "current" : "upcoming",
				attrs: attributesOf(li),
			})),
		};
	}

	/** A changed step count is a structural change the patch ops can't express (a step's marker,
	 * connector, and label region are three nodes), so it rebuilds rather than patches. */
	private shapeSignature(): string {
		return String(this.items().length);
	}

	/** Move each step's authored content into the fill's label region. Nodes are relocated, never
	 * serialized, so framework-owned content stays mounted and reactive. */
	private placeContent(): void {
		this.observer?.disconnect();
		this.items().forEach(({ nodes }, index) => {
			if (nodes.length === 0) return;
			const region = this.querySelector(`[data-slot="step-${index}"]`);
			if (!region) return;
			if (region.firstChild === nodes[0] && region.lastChild === nodes[nodes.length - 1]) return;
			region.replaceChildren(...nodes);
		});
		this.watch();
	}

	/** Watch the element for a swapped-in list, and the list itself for added, removed, or rebuilt
	 * steps. Every write this element makes happens with the observer detached, so its own relocation
	 * can never re-trigger it. */
	private watch(): void {
		if (typeof MutationObserver === "undefined" || !this.isConnected) return;
		if (!this.observer) {
			this.observer = new MutationObserver(() => {
				if (this.isConnected) this.render();
			});
		}
		this.observer.observe(this, { childList: true });
		if (this.list) this.observer.observe(this.list, { childList: true, subtree: true });
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.observer?.disconnect();
		this.ready = true;
		this.classList.add("xtyle-steps");
		this.syncList();
		this.adoptComponentSheet();
		this.fragment.ensureScaffold("");
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		this.watch();
	}
}

define("xtyle-steps", XtyleSteps);
