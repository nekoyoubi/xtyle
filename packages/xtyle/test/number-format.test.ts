import { afterEach, describe, expect, it, vi } from "vitest";
import { formatNumber, formatNumberParts, parseNumberValue } from "../src/markup/number-format.js";

const en = { locale: "en-US" } as const;
const normalize = (text: string) => text.replace(/[  ]/g, " ");

afterEach(() => {
	vi.restoreAllMocks();
});

describe("formatNumber", () => {
	it("formats each style", () => {
		expect(formatNumber(1234567.891, en)).toBe("1,234,567.891");
		expect(formatNumber(1299.5, { ...en, format: "currency" })).toBe("$1,299.50");
		expect(normalize(formatNumber(1299.5, { ...en, format: "currency", currency: "EUR", currencyDisplay: "code" }))).toBe(
			normalize(new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", currencyDisplay: "code" }).format(1299.5)),
		);
		expect(formatNumber(0.42, { ...en, format: "percent" })).toBe("42%");
		expect(formatNumber(2450000, { ...en, format: "compact" })).toBe("2.5M");
		expect(formatNumber(512, { ...en, format: "unit", unit: "kilobyte", unitDisplay: "long" })).toBe("512 kilobytes");
	});

	it("lets explicit min and max decimals win over decimals", () => {
		expect(formatNumber(3.14159, { ...en, decimals: 2 })).toBe("3.14");
		expect(formatNumber(3, { ...en, decimals: 2 })).toBe("3.00");
		expect(formatNumber(3.14159, { ...en, decimals: 2, maxDecimals: 4 })).toBe("3.1416");
		expect(formatNumber(3, { ...en, decimals: 0, minDecimals: 1 })).toBe("3.0");
		expect(formatNumber(0.4237, { ...en, format: "percent", decimals: 1 })).toBe("42.4%");
	});

	it("controls the sign", () => {
		expect(formatNumber(5, { ...en, sign: "always" })).toBe("+5");
		expect(formatNumber(0, { ...en, sign: "exceptZero" })).toBe("0");
		expect(formatNumber(0.042, { ...en, format: "percent", decimals: 1, sign: "exceptZero" })).toBe("+4.2%");
		expect(formatNumber(-5, { ...en, sign: "never" })).toBe("5");
		expect(formatNumber(-5, en)).toBe("-5");
	});

	it("turns grouping off", () => {
		expect(formatNumber(2026, { ...en, grouping: false })).toBe("2026");
		expect(formatNumber(2026, en)).toBe("2,026");
	});

	it("follows the locale", () => {
		expect(normalize(formatNumber(1234.5, { locale: "de-DE", format: "currency", currency: "EUR" }))).toBe("1.234,50 €");
		expect(formatNumber(1234.5, { locale: "de-DE" })).toBe("1.234,5");
	});

	it("renders the fallback for an empty or non-numeric value", () => {
		expect(formatNumber("", en)).toBe("");
		expect(formatNumber(null, { ...en, fallback: "n/a" })).toBe("n/a");
		expect(formatNumber("abc", { ...en, fallback: "none" })).toBe("none");
		expect(formatNumber(Number.NaN, { ...en, fallback: "?" })).toBe("?");
		expect(formatNumber("42.5", en)).toBe("42.5");
	});

	it("falls back to plain decimal formatting on a bad currency, unit, or locale, warning once", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(formatNumber(1234.5, { ...en, format: "currency", currency: "DOLLARS" })).toBe("1,234.5");
		expect(formatNumber(1234.5, { ...en, format: "currency", currency: "DOLLARS" })).toBe("1,234.5");
		expect(warn).toHaveBeenCalledTimes(1);
		expect(formatNumber(10, { ...en, format: "unit", unit: "furlong-per-fortnight" })).toBe("10");
		expect(formatNumber(10, { ...en, format: "unit" })).toBe("10");
		expect(() => formatNumber(1234.5, { locale: "not a locale!" })).not.toThrow();
		expect(warn).toHaveBeenCalledTimes(4);
	});
});

describe("parseNumberValue", () => {
	it("reads numbers and numeric strings, and nothing else", () => {
		expect(parseNumberValue(4)).toBe(4);
		expect(parseNumberValue(" 4.5 ")).toBe(4.5);
		expect(parseNumberValue("")).toBeNull();
		expect(parseNumberValue("  ")).toBeNull();
		expect(parseNumberValue("4px")).toBeNull();
		expect(parseNumberValue(undefined)).toBeNull();
	});
});

describe("formatNumberParts", () => {
	it("splits the formatted string into typed pieces that join back to it", () => {
		const options = { ...en, format: "currency", currency: "EUR" } as const;
		const parts = formatNumberParts(-1234.5, options);
		expect(parts.map((part) => part.value).join("")).toBe(formatNumber(-1234.5, options));
		expect(parts.map((part) => part.type)).toEqual(expect.arrayContaining(["minusSign", "currency", "integer", "group", "decimal", "fraction"]));
	});

	it("returns the fallback as one literal, or nothing when there is none", () => {
		expect(formatNumberParts(null, { fallback: "n/a" })).toEqual([{ type: "literal", value: "n/a" }]);
		expect(formatNumberParts("nope")).toEqual([]);
	});
});
