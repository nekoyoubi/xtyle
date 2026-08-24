import { describe, expect, it } from "vitest";
import { renderFragmentLight, ssrFragments } from "../src/elements/fragment-ssr.js";

const modules = import.meta.glob("../src/elements/fragments/*/source.generated.ts", { eager: true }) as Record<
	string,
	{ manifest: unknown; fragmentSources: Record<string, string> }
>;

describe("fragment scaffold edges", () => {
	it("renders no scaffold whose markup starts or ends with whitespace", async () => {
		const ragged: string[] = [];
		for (const id of ssrFragments()) {
			const html = await renderFragmentLight(id, {});
			if (html !== html.trim()) ragged.push(id);
		}
		expect(ragged).toEqual([]);
	});

	it("trims the authored file's own trailing newline rather than depending on it being absent", () => {
		const authored = Object.entries(modules).flatMap(([path, mod]) =>
			Object.entries(mod.fragmentSources)
				.filter(([name]) => name.endsWith(".html"))
				.map(([name, source]) => ({ id: `${path}#${name}`, source })),
		);
		expect(authored.length).toBeGreaterThan(0);
		expect(authored.some(({ source }) => source !== source.trim())).toBe(true);
	});

	it("leaves an inline host's render flush against the text after it", async () => {
		const html = await renderFragmentLight("link", { href: "/docs" });
		expect(`${html}.`).toMatch(/<\/span>\.$/);
	});
});
