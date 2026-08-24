import { describe, expect, it } from "vitest";
import { ssrFragments, unmatchedOpSelectors } from "../src/elements/fragment-ssr.js";

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

describe("every selector a fill writes reaches a node it can actually paint", () => {
	for (const component of ssrFragments()) {
		it(component, async () => {
			expect(await unmatchedOpSelectors(component, EVERY_REGION_AWAKE)).toEqual([]);
		});
	}
});
