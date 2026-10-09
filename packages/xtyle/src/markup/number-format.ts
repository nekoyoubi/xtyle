import type { FullTone } from "../vocab.js";
import { NUMBER_CURRENCY_DISPLAYS, NUMBER_FORMATS, NUMBER_SIGNS, NUMBER_UNIT_DISPLAYS } from "../vocab.js";

export type NumberFormatStyle = (typeof NUMBER_FORMATS)[number];
export type NumberCurrencyDisplay = (typeof NUMBER_CURRENCY_DISPLAYS)[number];
export type NumberUnitDisplay = (typeof NUMBER_UNIT_DISPLAYS)[number];
export type NumberSign = (typeof NUMBER_SIGNS)[number];
export type NumberFormatTone = FullTone;

/** What {@link formatNumber} takes besides the number itself. Every field is optional. */
export interface NumberFormatOptions {
	/** `decimal` (the default), `percent` (Intl semantics: `0.42` reads `42%`), `currency`, `compact`, or `unit`. */
	format?: NumberFormatStyle;
	/** An ISO 4217 code, read when `format` is `currency`. Defaults to `USD`. */
	currency?: string;
	/** How the currency is named: `symbol` (the default), `narrowSymbol`, `code`, or `name`. */
	currencyDisplay?: NumberCurrencyDisplay;
	/** A unit identifier Intl sanctions (`kilobyte`, `celsius`, `kilometer-per-hour`), read when `format` is `unit`. */
	unit?: string;
	/** How the unit is written: `short` (the default), `long`, or `narrow`. */
	unitDisplay?: NumberUnitDisplay;
	/** Fixes both the minimum and the maximum fraction digits. */
	decimals?: number;
	/** The minimum fraction digits; wins over `decimals`. */
	minDecimals?: number;
	/** The maximum fraction digits; wins over `decimals`. */
	maxDecimals?: number;
	/** When the sign shows: `auto` (the default), `always`, `exceptZero`, or `never`. */
	sign?: NumberSign;
	/** Whether digit-group separators show. Defaults to `true`. */
	grouping?: boolean;
	/** A BCP 47 locale tag. Omit for the runtime's default locale. */
	locale?: string;
	/** What renders when the value is empty or not a number. Defaults to an empty string. */
	fallback?: string;
}

const formatters = new Map<string, Intl.NumberFormat>();
const warned = new Set<string>();

function intlOptions(options: NumberFormatOptions): Intl.NumberFormatOptions {
	const format = options.format ?? "decimal";
	const intl: Intl.NumberFormatOptions = {};
	if (format === "compact") {
		intl.style = "decimal";
		intl.notation = "compact";
	} else {
		intl.style = format;
	}
	if (format === "currency") {
		intl.currency = options.currency || "USD";
		intl.currencyDisplay = options.currencyDisplay ?? "symbol";
	}
	if (format === "unit") {
		if (options.unit) intl.unit = options.unit;
		intl.unitDisplay = options.unitDisplay ?? "short";
	}
	const min = options.minDecimals ?? options.decimals;
	const max = options.maxDecimals ?? options.decimals;
	if (min !== undefined) intl.minimumFractionDigits = min;
	if (max !== undefined) intl.maximumFractionDigits = max;
	if (min !== undefined && max !== undefined && min > max) intl.maximumFractionDigits = min;
	if (options.sign && options.sign !== "auto") intl.signDisplay = options.sign;
	if (options.grouping === false) intl.useGrouping = false;
	return intl;
}

function plainFormatter(locale: string | undefined): Intl.NumberFormat {
	try {
		return new Intl.NumberFormat(locale);
	} catch {
		return new Intl.NumberFormat();
	}
}

function formatterFor(locale: string | undefined, intl: Intl.NumberFormatOptions): Intl.NumberFormat {
	const key = JSON.stringify([locale ?? null, intl]);
	const cached = formatters.get(key);
	if (cached) return cached;
	let formatter: Intl.NumberFormat;
	try {
		formatter = new Intl.NumberFormat(locale, intl);
	} catch (error) {
		formatter = plainFormatter(locale);
		if (!warned.has(key) && typeof console !== "undefined") {
			warned.add(key);
			console.warn(
				`xtyle: number-format could not format with locale "${locale ?? "(default)"}" and ${JSON.stringify(intl)} (${(error as Error).message}). Falling back to plain decimal formatting.`,
			);
		}
	}
	formatters.set(key, formatter);
	return formatter;
}

/**
 * Reads a number from what an author wrote: a number passes through, a string is parsed with `Number`,
 * and anything empty or non-numeric is `null`.
 */
export function parseNumberValue(value: number | string | null | undefined): number | null {
	if (value === null || value === undefined) return null;
	if (typeof value === "number") return Number.isNaN(value) ? null : value;
	if (value.trim() === "") return null;
	const parsed = Number(value);
	return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Formats a number for display with `Intl.NumberFormat`, the same way `<xtyle-number-format>` does.
 * Formatters are cached per locale and options, so calling it per cell of a large table stays cheap.
 * An empty or non-numeric value returns `options.fallback` (an empty string by default). An invalid
 * combination (an unknown currency code or unit, a malformed locale) never throws: it warns once and
 * falls back to plain decimal formatting.
 *
 * @example formatNumber(0.42, { format: "percent" }) // "42%"
 * @example formatNumber(1234.5, { format: "currency", currency: "EUR", locale: "de-DE" }) // "1.234,50 €"
 */
export function formatNumber(value: number | string | null | undefined, options: NumberFormatOptions = {}): string {
	const number = parseNumberValue(value);
	if (number === null) return options.fallback ?? "";
	return formatterFor(options.locale || undefined, intlOptions(options)).format(number);
}

/** One piece of a formatted number, as `Intl.NumberFormat#formatToParts` names it (`currency`, `integer`, `group`, `decimal`, `fraction`, `minusSign`, `unit`, …). */
export interface NumberPart {
	type: string;
	value: string;
}

/**
 * The same output as {@link formatNumber}, split into typed pieces so each one can be styled on its own:
 * the currency symbol, the sign, the fraction digits. Concatenating the values gives the formatted string.
 * The fallback, when the value is not a number, comes back as one `literal` part (or none when empty).
 */
export function formatNumberParts(value: number | string | null | undefined, options: NumberFormatOptions = {}): NumberPart[] {
	const number = parseNumberValue(value);
	if (number === null) return options.fallback ? [{ type: "literal", value: options.fallback }] : [];
	return formatterFor(options.locale || undefined, intlOptions(options))
		.formatToParts(number)
		.map(({ type, value: text }) => ({ type, value: text }));
}

/** The host-layout rule for a number-format — the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const numberFormatHostCss = ":host { display: inline; }";
