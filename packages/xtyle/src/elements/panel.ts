import { XtyleElement, define, type StyleMode } from "./base.js";
import { panelHostCss } from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/panel/source.generated.js";

type PanelVariant = "default" | "collapsible";

let panelTitleSeq = 0;

export class XtylePanel extends XtyleElement {
	private titleId = `xtyle-panel-title-${panelTitleSeq++}`;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "panel", {
		applyIntent: (intent, event) => this.applyIntent(intent, event),
	});

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["title", "level", "variant", "open", "scroll", "label"];
	}

	get title(): string {
		return this.getAttribute("title") ?? "";
	}
	set title(value: string | null | undefined) {
		this.reflectString("title", value);
	}

	get level(): number {
		const raw = Number(this.getAttribute("level"));
		return raw >= 1 && raw <= 6 ? Math.trunc(raw) : 2;
	}
	set level(value: number) {
		this.setAttribute("level", String(value));
	}

	get variant(): PanelVariant {
		return (this.getAttribute("variant") as PanelVariant) ?? "default";
	}
	set variant(value: PanelVariant) {
		this.setAttribute("variant", value);
	}

	get open(): boolean {
		return this.hasAttribute("open");
	}
	set open(value: boolean) {
		this.reflectBoolean("open", value);
	}

	get scrollable(): boolean {
		return this.hasAttribute("scroll");
	}
	set scrollable(value: boolean) {
		this.reflectBoolean("scroll", value);
	}

	/** Accessible name for a panel that carries no visible `title` — names the region without a heading. */
	get label(): string {
		return this.getAttribute("label") ?? "";
	}
	set label(value: string | null | undefined) {
		this.reflectString("label", value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get hasActions(): boolean {
		return this.fragment.hasSlotted("actions");
	}

	private get hasHeader(): boolean {
		return this.title !== "" || this.hasActions;
	}

	private get hasName(): boolean {
		return this.hasHeader || this.label !== "";
	}

	private get bindings(): Record<string, unknown> {
		return {
			title: this.title || null,
			level: this.level,
			variant: this.variant,
			open: this.open,
			scrollable: this.scrollable,
			hasActions: this.hasActions,
			titleId: this.titleId,
			label: this.label || null,
		};
	}

	/** Structural state ops can't patch incrementally: the variant, heading tag (`level`),
	 * header presence, and scrollable body wiring. A change here rebuilds; an `open` toggle on
	 * a collapsible panel is a cheap patch (aria-expanded + region visibility). */
	private shapeSignature(): string {
		return `${this.variant}|${this.level}|${this.hasHeader}|${this.title}|${this.scrollable}|${this.label}`;
	}

	private warnIfUnnamed(): void {
		if (!this.hasName) {
			console.warn(
				"xtyle-panel: no title, actions, or label — the panel has no accessible name. Provide a `title` (visible heading) or `label` (name only) so the region is announced.",
			);
		}
	}

	private applyIntent(intent: FragmentIntent, _event: Event): void {
		if (!intent.toggleOpen) return;
		this.open = !this.open;
		this.dispatchEvent(new Event("toggle", { bubbles: true, composed: true }));
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(panelHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		this.warnIfUnnamed();
	}
}

define("xtyle-panel", XtylePanel);
