import { describe, expect, it, vi, afterEach } from "vitest";
import { FULL_TONES, isFullTone, resolveOptionalTone, resolveTone } from "../src/vocab.js";

afterEach(() => {
	vi.restoreAllMocks();
});

describe("isFullTone", () => {
	it("accepts every tone in the roster", () => {
		for (const tone of FULL_TONES) expect(isFullTone(tone)).toBe(true);
	});

	it("rejects near-misses and non-strings", () => {
		for (const value of ["warning", "error", "grey", "", null, undefined, 3, {}]) {
			expect(isFullTone(value)).toBe(false);
		}
	});
});

describe("resolveTone", () => {
	it("passes a valid tone through untouched", () => {
		expect(resolveTone("warn", "accent")).toBe("warn");
		expect(resolveTone("accent-3", "accent")).toBe("accent-3");
		expect(resolveTone("cyan", "accent")).toBe("cyan");
	});

	it("falls back to the default when unset", () => {
		expect(resolveTone(null, "neutral")).toBe("neutral");
		expect(resolveTone(undefined, "neutral")).toBe("neutral");
		expect(resolveTone("", "neutral")).toBe("neutral");
	});

	it("falls back rather than emitting an unmatchable class for a near-miss", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(resolveTone("warning", "accent")).toBe("accent");
		expect(warn).toHaveBeenCalledOnce();
		expect(warn.mock.calls[0][0]).toContain('"warning" is not a tone');
	});

	it("honors a component's extra emphasis words", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(resolveTone("muted", "default", ["default", "muted", "subtle"])).toBe("muted");
		expect(warn).not.toHaveBeenCalled();
	});

	it("does not warn on a tone the roster already covers", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		for (const tone of FULL_TONES) resolveTone(tone, "accent");
		expect(warn).not.toHaveBeenCalled();
	});
});

describe("resolveOptionalTone", () => {
	it("keeps an unset tone unset so the component's own default drives", () => {
		expect(resolveOptionalTone(null)).toBeNull();
		expect(resolveOptionalTone(undefined)).toBeNull();
		expect(resolveOptionalTone("")).toBeNull();
	});

	it("passes a valid tone through", () => {
		expect(resolveOptionalTone("danger")).toBe("danger");
	});

	it("drops an unrecognized tone instead of inventing one", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(resolveOptionalTone("warning")).toBeNull();
		expect(warn).toHaveBeenCalledOnce();
	});
});
