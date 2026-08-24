// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { applyOps } from "../src/elements/fragment-host.js";
import { applyOpsToHtml, fragmentOps, ssrFragments } from "../src/elements/fragment-ssr.js";

const EVERY_REGION_AWAKE = {
	hasTitle: true,
	hasActions: true,
	hasHeader: true,
	hasFooter: true,
	hasIcon: true,
	hasLabel: true,
	dismissible: true,
	clearable: true,
	editable: true,
	editing: true,
	loading: true,
	open: true,
	label: "Label",
	value: 42,
	items: [{ label: "One", value: "one" }],
};

function normalize(html: string): string {
	const host = document.createElement("div");
	host.innerHTML = html;
	return host.innerHTML.replace(/\s+/g, " ").trim();
}

function throughClient(scaffold: string, ops: Parameters<typeof applyOps>[1]): string {
	const host = document.createElement("div");
	host.innerHTML = scaffold;
	applyOps(host, ops);
	return normalize(host.innerHTML);
}

describe("the two appliers agree on the shapes no shipped fill happens to use", () => {
	const cases: { name: string; scaffold: string; ops: Parameters<typeof applyOps>[1] }[] = [
		{
			name: "a selector matching several nodes",
			scaffold: '<ul><li class="row">a</li><li class="row">b</li></ul>',
			ops: [{ op: "setAttr", selector: ".row", attr: "aria-selected", value: "false" }],
		},
		{
			name: "an attribute the scaffold wrote bare",
			scaffold: '<div part="r" hidden>body</div>',
			ops: [{ op: "setAttr", selector: '[part="r"]', attr: "hidden", value: "" }],
		},
		{
			name: "a class edited on a node that carries several",
			scaffold: '<div part="r" class="a b c">body</div>',
			ops: [
				{ op: "removeClass", selector: '[part="r"]', value: "b" },
				{ op: "addClass", selector: '[part="r"]', value: "d" },
			],
		},
		{
			name: "a region toggled and then filled",
			scaffold: '<div part="r" hidden></div>',
			ops: [
				{ op: "toggle", selector: '[part="r"]', value: true },
				{ op: "replaceChildren", selector: '[part="r"]', value: "<b>hi</b>" },
			],
		},
	];

	for (const { name, scaffold, ops } of cases) {
		it(name, () => {
			expect(normalize(applyOpsToHtml(scaffold, ops))).toBe(throughClient(scaffold, ops));
		});
	}
});

describe("the two appliers agree on what a fill's ops mean", () => {
	for (const component of ssrFragments()) {
		it(component, async () => {
			const { scaffold, ops } = await fragmentOps(component, EVERY_REGION_AWAKE);
			expect(normalize(applyOpsToHtml(scaffold, ops))).toBe(throughClient(scaffold, ops));
		});
	}
});
