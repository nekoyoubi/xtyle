import { XtyleElement, define, type StyleMode } from "./base.js";
import {
	formatNumber,
	formatNumberParts,
	numberFormatHostCss,
	parseNumberValue,
	type NumberCurrencyDisplay,
	type NumberFormatOptions,
	type NumberFormatStyle,
	type NumberFormatTone,
	type NumberSign,
	type NumberUnitDisplay,
} from "../markup/number-format.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/number-format/source.generated.js";
import {
	resolveIntegerIn,
	resolveOptionalTone,
	resolveVocab,
	NUMBER_CURRENCY_DISPLAYS,
	NUMBER_FORMATS,
	NUMBER_SIGNS,
	NUMBER_UNIT_DISPLAYS,
} from "../vocab.js";

const DECIMALS_EXPECTS = "a whole number of fraction digits";

/**
 * Displays a number formatted by `Intl.NumberFormat`. The element owns the formatting, since `Intl`
 * lives on the host rather than in the fill's sandbox, and hands the finished string to the fill,
 * which places it in a `<data>` carrying the raw value.
 */
export class XtyleNumberFormat extends XtyleElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "number-format", {
		applyIntent: () => {},
	});
	private painted: string | null = null;

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return [
			"value",
			"format",
			"currency",
			"currency-display",
			"unit",
			"unit-display",
			"decimals",
			"min-decimals",
			"max-decimals",
			"sign",
			"grouping",
			"locale",
			"lang",
			"fallback",
			"tone",
			"tabular",
		];
	}

	get value(): number | null {
		return parseNumberValue(this.getAttribute("value"));
	}
	set value(value: number | string | null | undefined) {
		this.reflectString("value", value == null ? null : String(value));
	}

	get format(): NumberFormatStyle {
		return resolveVocab(this.getAttribute("format"), NUMBER_FORMATS, "decimal", "number-format format");
	}
	set format(value: NumberFormatStyle | null | undefined) {
		this.reflectString("format", value);
	}

	get currency(): string {
		return this.getAttribute("currency") || "USD";
	}
	set currency(value: string | null | undefined) {
		this.reflectString("currency", value);
	}

	get currencyDisplay(): NumberCurrencyDisplay {
		return resolveVocab(this.getAttribute("currency-display"), NUMBER_CURRENCY_DISPLAYS, "symbol", "number-format currency-display");
	}
	set currencyDisplay(value: NumberCurrencyDisplay | null | undefined) {
		this.reflectString("currency-display", value);
	}

	get unit(): string | null {
		return this.getAttribute("unit") || null;
	}
	set unit(value: string | null | undefined) {
		this.reflectString("unit", value);
	}

	get unitDisplay(): NumberUnitDisplay {
		return resolveVocab(this.getAttribute("unit-display"), NUMBER_UNIT_DISPLAYS, "short", "number-format unit-display");
	}
	set unitDisplay(value: NumberUnitDisplay | null | undefined) {
		this.reflectString("unit-display", value);
	}

	get decimals(): number | null {
		return resolveIntegerIn(this.getAttribute("decimals"), 0, 20, "number-format decimals", DECIMALS_EXPECTS);
	}
	set decimals(value: number | null | undefined) {
		this.reflectString("decimals", value == null ? null : String(value));
	}

	get minDecimals(): number | null {
		return resolveIntegerIn(this.getAttribute("min-decimals"), 0, 20, "number-format min-decimals", DECIMALS_EXPECTS);
	}
	set minDecimals(value: number | null | undefined) {
		this.reflectString("min-decimals", value == null ? null : String(value));
	}

	get maxDecimals(): number | null {
		return resolveIntegerIn(this.getAttribute("max-decimals"), 0, 20, "number-format max-decimals", DECIMALS_EXPECTS);
	}
	set maxDecimals(value: number | null | undefined) {
		this.reflectString("max-decimals", value == null ? null : String(value));
	}

	get sign(): NumberSign {
		return resolveVocab(this.getAttribute("sign"), NUMBER_SIGNS, "auto", "number-format sign");
	}
	set sign(value: NumberSign | null | undefined) {
		this.reflectString("sign", value);
	}

	get grouping(): boolean {
		return this.getAttribute("grouping") !== "false";
	}
	set grouping(value: boolean | "true" | "false" | null | undefined) {
		if (value === false || value === "false") this.setAttribute("grouping", "false");
		else this.removeAttribute("grouping");
	}

	get locale(): string | undefined {
		return this.getAttribute("locale") || undefined;
	}
	set locale(value: string | null | undefined) {
		this.reflectString("locale", value);
	}

	get fallback(): string {
		return this.getAttribute("fallback") ?? "";
	}
	set fallback(value: string | null | undefined) {
		this.reflectString("fallback", value);
	}

	get tone(): NumberFormatTone | null {
		return resolveOptionalTone<NumberFormatTone>(this.getAttribute("tone"));
	}
	set tone(value: NumberFormatTone | null | undefined) {
		this.reflectString("tone", value);
	}

	get tabular(): boolean {
		return this.getAttribute("tabular") !== "false";
	}
	set tabular(value: boolean | "true" | "false" | null | undefined) {
		if (value === false || value === "false") this.setAttribute("tabular", "false");
		else this.removeAttribute("tabular");
	}

	/** The display string as it renders right now: the formatted number, or the fallback text. */
	get formatted(): string {
		return formatNumber(this.value, this.options);
	}

	private get resolvedLocale(): string | undefined {
		return this.locale ?? (this.closest("[lang]")?.getAttribute("lang") || undefined);
	}

	private get options(): NumberFormatOptions {
		return {
			format: this.format,
			currency: this.currency,
			currencyDisplay: this.currencyDisplay,
			unit: this.unit ?? undefined,
			unitDisplay: this.unitDisplay,
			decimals: this.decimals ?? undefined,
			minDecimals: this.minDecimals ?? undefined,
			maxDecimals: this.maxDecimals ?? undefined,
			sign: this.sign,
			grouping: this.grouping,
			locale: this.resolvedLocale,
			fallback: this.fallback,
		};
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		const value = this.value;
		return {
			formatted: this.formatted,
			parts: formatNumberParts(this.value, this.options),
			value: value === null ? "" : String(value),
			tone: this.tone,
			tabular: this.tabular,
		};
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		const bindings = this.bindings;
		const signature = JSON.stringify(bindings);
		if (signature === this.painted && this.root.firstChild) return;
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(numberFormatHostCss);
		this.fragment.update(bindings);
		this.painted = signature;
	}
}

define("xtyle-number-format", XtyleNumberFormat);
