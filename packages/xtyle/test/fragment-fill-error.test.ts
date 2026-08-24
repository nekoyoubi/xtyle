import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** A minimal stand-in for the host element the fragment host marks on a fill-load failure. */
function fakeHost(tag: string): Element & { attrs: Record<string, string> } {
	const attrs: Record<string, string> = {};
	return {
		attrs,
		tagName: tag.toUpperCase(),
		setAttribute(name: string, value: string) {
			attrs[name] = value;
		},
	} as unknown as Element & { attrs: Record<string, string> };
}

/** A fresh module instance per test, so the once-per-page warning latch starts unset. */
async function freshMarkFillFailure() {
	vi.resetModules();
	return (await import("../src/elements/fragment-host.js")).markFillFailure;
}

async function freshMarkEmptyMount() {
	vi.resetModules();
	return (await import("../src/elements/fragment-host.js")).markEmptyMount;
}

describe("markFillFailure", () => {
	beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
	afterEach(() => vi.restoreAllMocks());

	it("marks the host inspectable and logs one attributed diagnostic", async () => {
		const markFillFailure = await freshMarkFillFailure();
		const host = fakeHost("xtyle-button");

		markFillFailure(host, new Error("wasm blocked"));

		expect(host.attrs["data-xtyle-fill-error"]).toBe("");
		const spy = vi.mocked(console.error);
		expect(spy).toHaveBeenCalledTimes(1);
		const [message, error] = spy.mock.calls[0];
		expect(message).toContain("<xtyle-button>");
		expect(message).toContain("WebAssembly");
		expect(error).toBeInstanceOf(Error);
	});

	it("marks every failed host but only warns once per page", async () => {
		const markFillFailure = await freshMarkFillFailure();
		const first = fakeHost("xtyle-badge");
		const second = fakeHost("xtyle-panel");

		markFillFailure(first, new Error("x"));
		markFillFailure(second, new Error("y"));

		expect(first.attrs["data-xtyle-fill-error"]).toBe("");
		expect(second.attrs["data-xtyle-fill-error"]).toBe("");
		expect(vi.mocked(console.error)).toHaveBeenCalledTimes(1);
	});
});

describe("markEmptyMount", () => {
	beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
	afterEach(() => vi.restoreAllMocks());

	it("names the fill and shares the marker a load failure sets", async () => {
		const markEmptyMount = await freshMarkEmptyMount();
		const host = fakeHost("xtyle-card");

		markEmptyMount(host, "component.card");

		expect(host.attrs["data-xtyle-fill-error"]).toBe("");
		const [message] = vi.mocked(console.error).mock.calls[0];
		expect(message).toContain("component.card");
		expect(message).toContain("<xtyle-card>");
		expect(message).toContain("setSandboxVariant");
	});

	it("warns once per page however many hosts mount empty", async () => {
		const markEmptyMount = await freshMarkEmptyMount();
		const first = fakeHost("xtyle-card");
		const second = fakeHost("xtyle-panel");

		markEmptyMount(first, "component.card");
		markEmptyMount(second, "component.panel");

		expect(second.attrs["data-xtyle-fill-error"]).toBe("");
		expect(vi.mocked(console.error)).toHaveBeenCalledTimes(1);
	});
});
