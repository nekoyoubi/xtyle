import { describe, expect, it } from "vitest";
import { diagnoseAuthoring } from "../src/manifest/diagnose.js";
import { listComponents } from "../src/manifest/registry.js";

/**
 * The four mistakes below all built green, rendered no error, and produced markup that looked
 * deliberate. Each one is a regression test for a specific silent failure, not a generic smoke test.
 */
describe("the reported silent failures", () => {
	it("catches `title` on Toolbar, which lands as a tooltip instead of a masthead name", () => {
		const [problem, ...rest] = diagnoseAuthoring("toolbar", { title: "Acme Docs" });
		expect(rest).toHaveLength(0);
		expect(problem).toContain("`heading`");
		expect(problem).toContain("`title`");
	});

	it("stays quiet when `title` accompanies a real `heading`", () => {
		expect(diagnoseAuthoring("toolbar", { heading: "Acme Docs", title: "Home" })).toEqual([]);
	});

	it("catches `title` on Alert, where the title is a slot", () => {
		const [problem] = diagnoseAuthoring("alert", { title: "Heads up" });
		expect(problem).toContain("is a slot, not a prop");
		expect(problem).toContain('slot="title"');
	});

	it("catches an out-of-vocabulary tone and names the near miss", () => {
		const [problem] = diagnoseAuthoring("alert", { tone: "warning" });
		expect(problem).toContain('"warning" is not a valid `tone`');
		expect(problem).toContain('did you mean "warn"?');
	});

	it("catches `value` on Stat, where the value is the default slot", () => {
		const [problem] = diagnoseAuthoring("stat", { value: 42 });
		expect(problem).toContain("`value`");
		expect(problem).toContain("`default` slot");
	});
});

describe("diagnoseAuthoring", () => {
	it("passes valid props through silently", () => {
		expect(diagnoseAuthoring("alert", { tone: "warn", variant: "solid", dismissible: true })).toEqual([]);
		expect(diagnoseAuthoring("button", { tone: "accent", variant: "outline", size: "lg" })).toEqual([]);
	});

	it("ignores HTML globals, data-, aria-, and framework directives", () => {
		expect(
			diagnoseAuthoring("button", {
				id: "save",
				class: "wide",
				style: "margin:0",
				"data-testid": "save",
				"aria-label": "Save",
				onclick: () => {},
				"client:load": true,
			}),
		).toEqual([]);
	});

	it("ignores keys explicitly set to undefined, since a wrapper's own defaults read that way", () => {
		expect(diagnoseAuthoring("alert", { nonsense: undefined })).toEqual([]);
	});

	it("reports an unknown prop and suggests the nearest real one", () => {
		const [problem] = diagnoseAuthoring("button", { varient: "outline" });
		expect(problem).toContain("`varient` is not a prop");
		expect(problem).toContain("did you mean `variant`?");
	});

	it("reports an unknown prop with no suggestion when nothing is close", () => {
		const [problem] = diagnoseAuthoring("button", { zzzzzzzz: 1 });
		expect(problem).toContain("is not a prop");
		expect(problem).not.toContain("did you mean");
	});

	it("treats options on an open-typed prop as suggestions, not a closed set", () => {
		expect(diagnoseAuthoring("icon", { name: "check" })).toEqual([]);
		expect(diagnoseAuthoring("icon", { name: "crest--shield-c1--star-s45-cf" })).toEqual([]);
	});

	it("still enforces options on a genuinely closed set", () => {
		expect(diagnoseAuthoring("button", { variant: "outline" })).toEqual([]);
		expect(diagnoseAuthoring("button", { variant: "outlined" })).toHaveLength(1);
	});

	it("returns nothing for an unknown component rather than throwing", () => {
		expect(diagnoseAuthoring("not-a-component", { anything: 1 })).toEqual([]);
	});

	it("never fires on a component's own documented examples", () => {
		for (const manifest of listComponents()) {
			for (const prop of manifest.props) {
				if (!prop.options) continue;
				for (const option of prop.options) {
					expect(diagnoseAuthoring(manifest.id, { [prop.name]: option })).toEqual([]);
				}
			}
		}
	});
});
