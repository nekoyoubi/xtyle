import { XtyleElement, define, type StyleMode } from "./base.js";
import { iconHostCss } from "../markup/index.js";
import type { IconName, IconSize } from "../icons.js";
import type { FullTone } from "../vocab.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/icon/source.generated.js";
import { resolveIconMark, composeIconThemed, iconClass } from "../icon-builder.js";
import { readLiveRegister } from "./live-register.js";
import { ICON_NAMES } from "../icons.js";
import { SERIES_TOKENS, type SeriesScheme } from "../series.js";

const FUNCTIONAL_GLYPHS = new Set<string>(ICON_NAMES);

export class XtyleIcon extends XtyleElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "icon", {
		applyIntent: () => {},
		afterApply: () => this.paintComposition(),
	});

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	protected override get resolvesThemeAtRuntime(): boolean {
		return true;
	}

	static get observedAttributes(): string[] {
		return ["name", "size", "tone", "colors", "label", "spin"];
	}

	get name(): IconName | "" {
		return (this.getAttribute("name") as IconName) ?? "";
	}
	set name(value: IconName) {
		this.setAttribute("name", value);
	}

	get size(): IconSize {
		return (this.getAttribute("size") as IconSize) ?? "md";
	}
	set size(value: IconSize) {
		this.setAttribute("size", value);
	}

	get tone(): FullTone | null {
		return this.getAttribute("tone") as FullTone | null;
	}
	set tone(value: FullTone | null) {
		if (value) this.setAttribute("tone", value);
		else this.removeAttribute("tone");
	}

	/** The series scheme a generated mark's `c3+` color slots draw from. */
	get colors(): SeriesScheme {
		return (this.getAttribute("colors") as SeriesScheme) ?? "accents";
	}
	set colors(value: SeriesScheme) {
		this.setAttribute("colors", value);
	}

	get label(): string | null {
		return this.getAttribute("label");
	}
	set label(value: string | null) {
		if (value) this.setAttribute("label", value);
		else this.removeAttribute("label");
	}

	get spin(): boolean {
		return this.hasAttribute("spin");
	}
	set spin(value: boolean) {
		this.toggleAttribute("spin", value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return { name: this.name, size: this.size, tone: this.tone, label: this.label, spin: this.spin };
	}

	/** Reads the series anchor tokens off the live cascade, so a generated mark's colors track the theme.
	 * Re-resolves once if a scoped theme lands after mount, matching the chart elements' behavior. */
	private seriesRegister(): Record<string, string> {
		return readLiveRegister(this, SERIES_TOKENS, () => {
			if (this.root.firstChild) this.render();
		});
	}

	/** A functional glyph wins the name (the fragment already rendered it); any other name is offered
	 * to the registered mark generators, so the composed SVG replaces the fragment's placeholder. */
	private paintComposition(): void {
		const name = this.name;
		if (!name || FUNCTIONAL_GLYPHS.has(name)) return;
		const parsed = resolveIconMark(name);
		const region = this.root.querySelector("[data-icon]");
		if (!parsed || !region) return;
		region.innerHTML = composeIconThemed(parsed.composition, { register: this.seriesRegister(), scheme: this.colors });
		const svg = region.querySelector("svg");
		if (!svg) return;
		svg.setAttribute("class", iconClass({ size: this.size, tone: this.tone, spin: this.spin }));
		svg.setAttribute("part", "icon");
		if (this.label) {
			svg.setAttribute("role", "img");
			svg.setAttribute("aria-label", this.label);
		}
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(iconHostCss);
		this.fragment.update(this.bindings);
	}
}

define("xtyle-icon", XtyleIcon);
