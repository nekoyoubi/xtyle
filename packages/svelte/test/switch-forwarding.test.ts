import { afterEach, describe, expect, it } from "vitest";
import Switch from "../src/Switch.svelte";
import { render, type Rendered } from "./harness.js";

// INFO: Svelte routes any attribute whose name begins with `on` to `addEventListener` (set_attributes
// keys off the first two chars), so `on-label={onLabel}` binds a `-label` listener instead of the attr
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

	it("leaves on-label available as the accessible name", () => {
		expect(mount({ onLabel: "Enabled", offLabel: "Disabled" }).getAttribute("on-label")).toBe("Enabled");
	});
});
