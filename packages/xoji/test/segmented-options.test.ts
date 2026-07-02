import { describe, expect, it } from "vitest";
import { normalizeSegments, selectedValue, type Segment } from "../src/markup/segmented.js";

describe("segmented options", () => {
	it("carries per-option disabled and badge through the structured form", () => {
		const segs = normalizeSegments([
			{ value: "report", label: "Report", badge: "128" },
			{ value: "text", label: "Text", disabled: true },
		]);
		expect(segs).toEqual([
			{ value: "report", label: "Report", badge: "128" },
			{ value: "text", label: "Text", disabled: true },
		]);
	});

	it("omits the flags a bare string option doesn't carry", () => {
		expect(normalizeSegments(["a", "b"])).toEqual([
			{ value: "a", label: "a" },
			{ value: "b", label: "b" },
		]);
	});

	it("round-trips the structured form through a JSON string (the astro attribute path)", () => {
		const json = JSON.stringify([{ value: "x", label: "X", disabled: true }]);
		expect(normalizeSegments(json)).toEqual([{ value: "x", label: "X", disabled: true }]);
	});

	it("selects an explicit enabled value", () => {
		const segs: Segment[] = [
			{ value: "a", label: "A" },
			{ value: "b", label: "B" },
		];
		expect(selectedValue(segs, "b")).toBe("b");
	});

	it("skips a disabled value and falls back to the first enabled segment", () => {
		const segs: Segment[] = [
			{ value: "report", label: "Report" },
			{ value: "text", label: "Text", disabled: true },
		];
		// An explicit-but-disabled request is refused.
		expect(selectedValue(segs, "text")).toBe("report");
		// A leading disabled segment isn't the default.
		const leadingDisabled: Segment[] = [
			{ value: "text", label: "Text", disabled: true },
			{ value: "report", label: "Report" },
		];
		expect(selectedValue(leadingDisabled, null)).toBe("report");
	});
});
