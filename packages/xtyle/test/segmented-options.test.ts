import { describe, expect, it } from "vitest";
import { normalizeSegments, selectedValue, type Segment } from "../src/markup/segmented.js";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";

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

	it("carries a per-option title through the structured form", () => {
		expect(normalizeSegments([{ value: "claude", label: "Claude", title: "Co-author provider" }])).toEqual([
			{ value: "claude", label: "Claude", title: "Co-author provider" },
		]);
	});

	it("renders a text option's title as a hover hint without adding an aria-label", async () => {
		const html = await renderFragmentLight("segmented", {
			segments: normalizeSegments([{ value: "claude", label: "Claude", title: "Co-author provider" }]),
			value: "claude",
			label: "Source",
			elementId: "seg-t",
		});
		expect(html).toContain('title="Co-author provider"');
		expect(html).toContain(">Claude</button>");
		// the visible label is the accessible name; a text segment adds no redundant aria-label
		expect(html).not.toContain("aria-label=");
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

describe("segmented rich (slotted) segments", () => {
	const slotted: Segment[] = [
		{ value: "info", label: "Info", slot: "segment-0" },
		{ value: "warn", label: "Warnings", slot: "segment-1" },
		{ value: "error", label: "Errors", slot: "segment-2" },
	];

	it("resolves selection from slotted segments exactly as from text options", () => {
		expect(selectedValue(slotted, "warn")).toBe("warn");
		expect(selectedValue(slotted, null)).toBe("info");
	});

	it("projects each segment's content through its named slot and names the radio from `label`", async () => {
		const html = await renderFragmentLight("segmented", {
			segments: slotted,
			value: "warn",
			label: "Severity",
			elementId: "seg-x",
		});
		// each option's body is the live slot, not baked text
		expect(html).toContain('<slot name="segment-0"></slot>');
		expect(html).toContain('<slot name="segment-1"></slot>');
		expect(html).toContain('<slot name="segment-2"></slot>');
		// the icon carries no text, so the radio owns the option's name and tooltip from `label`
		expect(html).toContain('aria-label="Info" title="Info"');
		expect(html).toContain('aria-label="Warnings" title="Warnings"');
		// selection, roving tabindex, and the radiogroup machinery are unchanged
		expect(html).toContain('data-value="warn"');
		expect(html).toMatch(/data-value="warn"[^>]*aria-label="Warnings"/);
		expect(html).toContain('role="radiogroup"');
	});

	it("names the group from `aria-label` with no visible label span", async () => {
		const html = await renderFragmentLight("segmented", {
			segments: slotted,
			value: "info",
			ariaLabel: "Severity",
			elementId: "seg-z",
		});
		expect(html).toMatch(/role="radiogroup"[^>]*aria-label="Severity"/);
		expect(html).not.toContain("xtyle-segmented__label");
		expect(html).not.toContain("aria-labelledby");
	});

	it("prefers a visible label over `aria-label` when both are given", async () => {
		const html = await renderFragmentLight("segmented", {
			segments: normalizeSegments("Day,Week"),
			label: "View",
			ariaLabel: "ignored",
			elementId: "seg-w",
		});
		expect(html).toContain('class="xtyle-segmented__label"');
		expect(html).toContain("aria-labelledby");
		expect(html).not.toContain('aria-label="ignored"');
	});

	it("bakes text labels and adds no aria-label for the plain options path", async () => {
		const html = await renderFragmentLight("segmented", {
			segments: normalizeSegments("Day,Week,Month"),
			value: "Week",
			label: "View",
			elementId: "seg-y",
		});
		expect(html).not.toContain("<slot");
		expect(html).not.toContain("aria-label=");
		expect(html).toContain(">Week</button>");
	});
});
