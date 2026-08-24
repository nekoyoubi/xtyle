import { XtyleElement, define, type StyleMode } from "./base.js";
import { panelHostCss } from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/panel/source.generated.js";
import { PANEL_VARIANTS, resolveVocab } from "../vocab.js";
import { iconBody } from "../icon-registry.js";

type PanelVariant = (typeof PANEL_VARIANTS)[number];

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
		return ["heading", "title", "level", "variant", "open", "scroll", "fill", "label", "marker-icon"];
	}

	/** The visible heading. `title` is the HTML global attribute on every element and renders a
	 * browser tooltip, so a panel's own heading is `heading`; a `title` still migrates for
	 * compatibility and is lifted off the host so it stops painting a tooltip over the whole panel. */
	get heading(): string {
		return this.getAttribute("heading") ?? "";
	}
	set heading(value: string | null | undefined) {
		this.reflectString("heading", value);
	}

	/** @deprecated Use {@link heading}. */
	get title(): string {
		return this.heading;
	}
	set title(value: string | null | undefined) {
		this.heading = value;
	}

	private migrateTitle(): void {
		const legacy = this.getAttribute("title");
		if (legacy === null) return;
		this.removeAttribute("title");
		if (this.getAttribute("heading") === null) this.setAttribute("heading", legacy);
	}

	/** The roster glyph drawn as the collapse marker, on the `collapsible` variant. Any name the icon
	 * roster can draw, including one a mod contributed through the `xtyle.icons` slot. */
	get markerIcon(): string {
		return this.getAttribute("marker-icon") || "chevron-right";
	}
	set markerIcon(value: string) {
		this.setAttribute("marker-icon", value);
	}

	get level(): number {
		const raw = Number(this.getAttribute("level"));
		return raw >= 1 && raw <= 6 ? Math.trunc(raw) : 2;
	}
	set level(value: number) {
		this.setAttribute("level", String(value));
	}

	get variant(): PanelVariant {
		return resolveVocab(this.getAttribute("variant"), PANEL_VARIANTS, "default", "panel variant");
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

	/** Take the remaining height of a bounded parent and scroll the body, leaving header and footer at their
	 * natural height. `scroll` caps the body at a fixed height; `fill` sizes it from what the column has left. */
	get fill(): boolean {
		return this.hasAttribute("fill");
	}
	set fill(value: boolean) {
		this.reflectBoolean("fill", value);
	}

	/** Accessible name for a panel that carries no visible `title` — names the region without a heading. */
	get label(): string {
		return this.getAttribute("label") ?? "";
	}
	set label(value: string | null | undefined) {
		this.reflectString("label", value);
	}

	attributeChangedCallback(name: string): void {
		if (name === "title") this.migrateTitle();
		if (this.root.firstChild) this.render();
	}

	private get hasActions(): boolean {
		return this.fragment.hasSlotted("actions");
	}

	private get hasFooter(): boolean {
		return this.fragment.hasSlotted("footer");
	}

	private get hasHeader(): boolean {
		return this.heading !== "" || this.hasActions;
	}

	private get hasName(): boolean {
		return this.hasHeader || this.label !== "";
	}

	private get bindings(): Record<string, unknown> {
		return {
			heading: this.heading || null,
			level: this.level,
			variant: this.variant,
			open: this.open,
			scrollable: this.scrollable,
			fill: this.fill,
			hasActions: this.hasActions,
			hasFooter: this.hasFooter,
			titleId: this.titleId,
			label: this.label || null,
			markerIcon: this.markerIcon,
			markerBody: iconBody(this.markerIcon) ?? null,
		};
	}

	/** Structural state ops can't patch incrementally: the variant, heading tag (`level`),
	 * header presence, and scrollable body wiring. A change here rebuilds; an `open` toggle on
	 * a collapsible panel is a cheap patch (aria-expanded + region visibility). */
	private shapeSignature(): string {
		return `${this.variant}|${this.level}|${this.hasHeader}|${this.hasFooter}|${this.heading}|${this.scrollable}|${this.label}|${this.markerIcon}`;
	}

	private warnIfUnnamed(): void {
		if (!this.hasName) {
			console.warn(
				"xtyle-panel: no heading, actions, or label — the panel has no accessible name. Provide a `heading` (visible) or `label` (name only) so the region is announced.",
			);
		}
	}

	private applyIntent(intent: FragmentIntent, _event: Event): void {
		if (!intent.toggleOpen) return;
		this.open = !this.open;
		this.emitOwn("toggle", null, { open: this.open });
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
