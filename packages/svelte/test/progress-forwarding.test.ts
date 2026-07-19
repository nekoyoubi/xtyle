import { afterEach, describe, expect, it } from "vitest";
import Progress from "../src/Progress.svelte";
import { render, type Rendered } from "./harness.js";

// `ramp`, `rampMode` and `reverse` shipped declared, defaulted and documented on this wrapper while
// reaching the element nowhere. Static analysis catches that exact shape (destructured, never
// referenced), but not a prop forwarded under the wrong name, casing, or coercion. These render and
// read the resulting attribute, which is the only check that covers both.
describe("Progress prop forwarding", () => {
	let rendered: Rendered | undefined;
	afterEach(() => {
		rendered?.destroy();
		rendered = undefined;
	});

	const mount = (props: Record<string, unknown>): Element => {
		rendered = render(Progress, props);
		expect(rendered.element, "wrapper rendered no <xtyle-*> element").not.toBeNull();
		return rendered.element!;
	};

	it("forwards ramp to the element", () => {
		expect(mount({ ramp: "thermal", variant: "circular", value: 70 }).getAttribute("ramp")).toBe("thermal");
	});

	it("forwards rampMode as ramp-mode when a ramp is set", () => {
		expect(mount({ ramp: "thermal", rampMode: "gradient", value: 70 }).getAttribute("ramp-mode")).toBe("gradient");
	});

	it("forwards reverse as a present attribute", () => {
		expect(mount({ ramp: "thermal", reverse: true, value: 70 }).hasAttribute("reverse")).toBe(true);
	});

	it("serializes an array ramp as JSON", () => {
		expect(mount({ ramp: ["#00f", "#f00"], value: 50 }).getAttribute("ramp")).toBe('["#00f","#f00"]');
	});

	it("forwards the non-default enum and numeric props", () => {
		const el = mount({ variant: "circular", tone: "success", size: "sm", value: 42, min: 10, max: 200 });
		expect(el.getAttribute("variant")).toBe("circular");
		expect(el.getAttribute("tone")).toBe("success");
		expect(el.getAttribute("size")).toBe("sm");
		expect(el.getAttribute("value")).toBe("42");
		expect(el.getAttribute("min")).toBe("10");
		expect(el.getAttribute("max")).toBe("200");
	});

	it("maps camelCase props onto kebab-case attributes", () => {
		const el = mount({ showValue: true, valueFormat: "value-max", valuePosition: "inset", colorizeValue: true, unit: " GB" });
		expect(el.hasAttribute("show-value")).toBe(true);
		expect(el.getAttribute("value-format")).toBe("value-max");
		expect(el.getAttribute("value-position")).toBe("inset");
		expect(el.hasAttribute("colorize-value")).toBe(true);
		expect(el.getAttribute("unit")).toBe(" GB");
	});

	it("renders ariaLabel as aria-label", () => {
		expect(mount({ value: 10, ariaLabel: "Upload progress" }).getAttribute("aria-label")).toBe("Upload progress");
	});

	// `track` is a deliberate three-way transform, not a straight pass-through: the default `true`
	// omits the attribute, `false` becomes `"none"`, and a tone rides through as itself.
	it("collapses track through its documented transform", () => {
		expect(mount({ track: true }).hasAttribute("track")).toBe(false);
		rendered!.destroy();
		expect(mount({ track: false }).getAttribute("track")).toBe("none");
		rendered!.destroy();
		expect(mount({ track: "info" }).getAttribute("track")).toBe("info");
	});

	it("drops value when indeterminate", () => {
		const el = mount({ indeterminate: true, value: 40 });
		expect(el.hasAttribute("indeterminate")).toBe(true);
		expect(el.hasAttribute("value")).toBe(false);
	});

	it("passes unknown attributes through the rest spread", () => {
		expect(mount({ value: 5, id: "up", "data-test": "x" }).getAttribute("data-test")).toBe("x");
	});
});
