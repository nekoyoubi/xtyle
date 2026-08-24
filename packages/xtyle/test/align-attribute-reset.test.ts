import { describe, expect, it } from "vitest";
import { componentsCss } from "../src/css/index.js";
import { listComponents } from "../src/manifest/registry.js";

/**
 * `align` is one of HTML's legacy presentational attributes, so the UA stylesheet maps `[align]` to
 * `text-align` on any element a component happens to put it on, and that inherits through the shadow
 * boundary into every node the component's own sheet did not pin. The parts that look right are the
 * ones that were pinned; the bug lands on whatever text nobody thought to style.
 *
 * A component author cannot be expected to remember this, so the reset is written once and this holds
 * it to the manifest: declare an `align` prop on a new component and the sheet has to cover it.
 */
const declaring = listComponents()
	.filter((component) => (component.props ?? []).some((prop) => prop.name === "align"))
	.map((component) => component.id);

describe("the align presentational-attribute hazard is reset once, for everything that risks it", () => {
	it("finds the components that actually declare it", () => {
		expect(declaring.length).toBeGreaterThan(0);
	});

	it.each(declaring)("covers xtyle-%s", (id) => {
		expect(
			componentsCss.includes(`xtyle-${id}[align]`),
			`<xtyle-${id}> declares an \`align\` prop, so the UA sheet will map it to text-align and leak ` +
				`it into the component's own unpinned text. Add xtyle-${id}[align] to the reset in css/components.ts.`,
		).toBe(true);
	});

	it("resets the host from inside a shadow root too, for a consumer with no document sheet", () => {
		expect(componentsCss).toContain(":host([align])");
	});

	/** `initial` would resolve to `start` and sever a container's text-align from the component in it. */
	it("cancels the hint rather than overriding the cascade", () => {
		const rule = componentsCss.split("\n").find((line) => line.includes(":host([align])"));
		expect(rule).toBeDefined();
		expect(rule).toContain("text-align: inherit");
		expect(rule).not.toContain("text-align: initial");
	});
});
