import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("prismjs", () => ({ default: undefined }));

const saved = (globalThis as { Prism?: unknown }).Prism;

beforeAll(async () => {
	const real = (await vi.importActual<{ default: unknown }>("prismjs")).default;
	(globalThis as { Prism?: unknown }).Prism = real;
});

afterAll(() => {
	(globalThis as { Prism?: unknown }).Prism = saved;
});

describe("highlighting when prismjs arrives as an empty namespace", () => {
	it("finds the highlighter on the global its entry file assigns, and highlights", async () => {
		const { highlight } = await import("../src/elements/code-highlight.js");
		const result = await highlight("const a = 1;", "javascript");
		expect(result.language).toBe("javascript");
		expect(result.html).toContain('class="token keyword"');
	});
});
