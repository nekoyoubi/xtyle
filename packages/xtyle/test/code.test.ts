import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { codeCss } from "../src/css/components/code.js";

const source = readFileSync(fileURLToPath(new URL("../src/elements/code.ts", import.meta.url)), "utf8");

describe("xtyle-code scroll-region focus", () => {
	it("makes the block tabbable only when it overflows horizontally", () => {
		expect(source).toContain("armScrollAffordance");
		expect(source).toMatch(/scrollWidth > pre\.clientWidth/);
	});

	it("gives that focusable scroll region a visible focus ring", () => {
		expect(codeCss).toContain(".xtyle-code:focus-visible");
		const rule = codeCss.slice(codeCss.indexOf(".xtyle-code:focus-visible"));
		expect(rule.slice(0, rule.indexOf("}"))).toContain("var(--ring)");
	});
});

describe("xtyle-code dual-mode state styling", () => {
	it.each(["xtyle-code[wrap]", "xtyle-code[highlight]", "xtyle-code[line-numbers]", "xtyle-code:hover"])(
		"carries a light-DOM selector for the %s state, not only :host()",
		(sel) => {
			expect(codeCss).toContain(sel);
		},
	);
});
