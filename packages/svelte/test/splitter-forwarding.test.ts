import { afterEach, describe, expect, it } from "vitest";
import Splitter from "../src/Splitter.svelte";
import { render, type Rendered } from "./harness.js";

/**
 * The element settles as `resize-end`. Svelte's `on*` attribute shorthand lowercases to a listener
 * name with no hyphen, so binding it as `onresizeend={…}` on the custom element listens for a
 * `resizeend` that is never dispatched — the callback is silently dead, and with it the `value`
 * write-back on every keyboard route, which emits only the settle event and never `resize`.
 */
describe("Splitter resize-end forwarding", () => {
	let rendered: Rendered | undefined;
	afterEach(() => {
		rendered?.destroy();
		rendered = undefined;
	});

	const mount = (props: Record<string, unknown>): Element => {
		rendered = render(Splitter, { value: 200, label: "rail", ...props });
		expect(rendered.element).not.toBeNull();
		return rendered.element!;
	};

	const settleEvent = (value: number): CustomEvent =>
		new CustomEvent("resize-end", { detail: { value, orientation: "vertical" }, bubbles: true });

	it("calls onresizeend when the element settles", () => {
		const seen: Array<{ value: number }> = [];
		const el = mount({ onresizeend: (e: CustomEvent) => seen.push(e.detail) });

		el.dispatchEvent(settleEvent(240));

		expect(seen, "the wrapper must listen for the name the element dispatches").toHaveLength(1);
		expect(seen[0]?.value).toBe(240);
	});

	it("still forwards onresize, which was never broken", () => {
		const seen: number[] = [];
		const el = mount({ onresize: (e: CustomEvent) => seen.push(e.detail.value) });

		el.dispatchEvent(new CustomEvent("resize", { detail: { value: 210, orientation: "vertical" }, bubbles: true }));

		expect(seen).toEqual([210]);
	});

	it("does not bind a listener for the unhyphenated name", () => {
		const seen: unknown[] = [];
		const el = mount({ onresizeend: (e: CustomEvent) => seen.push(e.detail) });

		el.dispatchEvent(new CustomEvent("resizeend", { detail: { value: 999 }, bubbles: true }));

		expect(seen, "nothing should answer a name the element never dispatches").toHaveLength(0);
	});

	it("mounts without an onresizeend at all", () => {
		const el = mount({});
		expect(() => el.dispatchEvent(settleEvent(180))).not.toThrow();
	});
});
