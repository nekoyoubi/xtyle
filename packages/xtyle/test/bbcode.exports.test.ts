import { describe, expect, it } from "vitest";
import * as root from "../src/index.js";
import * as markup from "../src/markup/index.js";

/** The registration half of BBCode was documented at length and reachable only by importing the module
 * file, which a consumer cannot do — the barrels re-exported the read side and stopped. Every test in
 * `bbcode.render` imports the module directly, which is exactly why none of them saw it. So this asks
 * the question a consumer asks: is the seam reachable from the package? */
const WRITE_SIDE = ["registerBbcodeTags", "defineBbcodeVocabulary", "onBbcodeRegistryChanged"] as const;

describe("bbcode's extensibility seam", () => {
	it("is reachable from the markup barrel, not only from the module file", () => {
		for (const name of WRITE_SIDE) expect(markup[name], name).toBeTypeOf("function");
	});

	it("is reachable from the package root, where the effect registries already are", () => {
		for (const name of WRITE_SIDE) expect(root[name], name).toBeTypeOf("function");
		expect(root.registerEffect, "the two registries are described in the same terms").toBeTypeOf("function");
		expect(root.renderBbcode).toBeTypeOf("function");
	});

	it("registers a tag through the public surface and renders it", () => {
		root.registerBbcodeTags([{ name: "mention", render: (ctx) => `<b>@${ctx.content}</b>` }]);
		root.defineBbcodeVocabulary("chat", ["mention"]);
		expect(root.bbcodeVocabularies()).toContain("chat");
		expect(root.renderBbcode("[mention]ada[/mention]", { vocabulary: "chat" })).toContain("<b>@ada</b>");
	});
});
