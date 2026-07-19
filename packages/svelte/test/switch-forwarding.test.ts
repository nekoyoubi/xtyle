import { afterEach, describe, expect, it } from "vitest";
import Switch from "../src/Switch.svelte";
import { render, type Rendered } from "./harness.js";

// Svelte routes every attribute whose name begins with `on` to `addEventListener` — in the template
// and through a spread alike (`set_attributes` keys off the first two characters) — so the template
// form `on-label={onLabel}` registered a listener for a `-label` event and the attribute never
// reached the element. `off-label` sat one line below it and worked, which is what made the bug so
// quiet. Nothing in the type system or the static-analysis pass can see this: `onLabel` is declared,
// typed, and genuinely referenced in the markup. Only a render can tell.
describe("Switch on-label forwarding", () => {
	let rendered: Rendered | undefined;
	afterEach(() => {
		rendered?.destroy();
		rendered = undefined;
	});

	const mount = (props: Record<string, unknown>): Element => {
		rendered = render(Switch, props);
		expect(rendered.element).not.toBeNull();
		return rendered.element!;
	};

	it("forwards onLabel to the on-label attribute", () => {
		expect(mount({ onLabel: "ON" }).getAttribute("on-label")).toBe("ON");
	});

	it("forwards offLabel alongside it", () => {
		const el = mount({ onLabel: "ON", offLabel: "OFF" });
		expect(el.getAttribute("on-label")).toBe("ON");
		expect(el.getAttribute("off-label")).toBe("OFF");
	});

	it("omits on-label entirely when unset", () => {
		expect(mount({ label: "Wifi" }).hasAttribute("on-label")).toBe(false);
	});

	// The element falls back to `on-label` for its accessible name, so a dropped attribute cost the
	// toggle its name as well as its state text.
	it("leaves on-label available as the accessible name", () => {
		expect(mount({ onLabel: "Enabled", offLabel: "Disabled" }).getAttribute("on-label")).toBe("Enabled");
	});
});
