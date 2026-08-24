import { describe, expect, it } from "vitest";
import "../src/markup/bbcode-tags.js";
import { bbcodeTags, renderBbcode } from "../src/markup/bbcode.js";

const sample = (name: string, isVoid: boolean) => (isVoid ? `[${name}]` : `[${name}]body[/${name}]`);

describe("BBCode block seams", () => {
	it("keeps a blank line beside a block construct out of the render", () => {
		const stray: string[] = [];
		for (const tag of bbcodeTags()) {
			if (!tag.block) continue;
			const html = renderBbcode(`before\n\n${sample(tag.name, tag.void === true)}\n\nafter`);
			if (html.includes("<br>")) stray.push(tag.name);
		}
		expect(stray).toEqual([]);
	});

	it("still breaks a line the author asked for inside prose", () => {
		expect(renderBbcode("one\ntwo")).toContain("<br>");
		expect(renderBbcode("one\n\ntwo")).toContain("<br>");
	});

	it("spaces a delegated block the way it spaces one it wrote itself", async () => {
		const { bbcodeCss } = await import("../src/css/components/bbcode.js");
		const delegated = ["xtyle-code", "xtyle-accordion", "xtyle-table", "xtyle-separator", "xtyle-heading"];
		const spaced = bbcodeCss.slice(0, bbcodeCss.indexOf(".xtyle-bbcode__body > :first-child"));
		for (const el of delegated) {
			expect(spaced, `${el} carries no rhythm in a document`).toContain(`.xtyle-bbcode__body > ${el}`);
		}
	});

	it("covers the xtyle elements the roster renders, not only raw HTML", () => {
		for (const source of ["[spoiler=s]x[/spoiler]", "[hr]", "[table][tr][td]x[/td][/tr][/table]", "[h2]x[/h2]"]) {
			expect(renderBbcode(`before\n\n${source}\n\nafter`), source).not.toContain("<br>");
		}
	});
});
