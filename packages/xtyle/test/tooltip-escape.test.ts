import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const HERE = dirname(fileURLToPath(import.meta.url));

const CASES: { file: string; escaped: string[] }[] = [
	{ file: "bar.ts", escaped: ["escapeHtml(category)", "escapeHtml(name)", "escapeHtml(String(value))"] },
	{ file: "pie.ts", escaped: ["escapeHtml(d.label)", "escapeHtml(String(d.value))"] },
	{ file: "heatmap.ts", escaped: ["escapeHtml("] },
	{ file: "toast.ts", escaped: ["escapeHtml(opts.message)", "escapeHtml(opts.actionLabel)", "escapeAttr(opts.closeLabel"] },
];

// These elements write consumer strings into `innerHTML` for the floating readout / toast body;
// guard that each interpolation site keeps its `escapeHtml` / `escapeAttr` so a hostile string
// can't inject markup (the runtime XSS is un-unit-testable, so this pins the source).
describe("element tooltips escape consumer strings", () => {
	for (const { file, escaped } of CASES) {
		it(`${file} escapes its interpolated consumer values`, () => {
			const src = readFileSync(resolve(HERE, `../src/elements/${file}`), "utf8");
			for (const needle of escaped) expect(src, `${file} should contain ${needle}`).toContain(needle);
		});
	}
});
