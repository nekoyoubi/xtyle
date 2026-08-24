import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { derivePathOf } from "./hosted.js";

const resolveOrder: string[] = [];
const ticksAtResolve: number[] = [];
let tick = 0;

vi.mock("@xtyle/core/host/bundle", () => ({
	bundledAlgorithms: () => ["a", "b", "c"],
	resolveBundledAlgorithm: async (id: string) => {
		resolveOrder.push(id);
		ticksAtResolve.push(tick);
		return { id } as never;
	},
}));

async function advance(times: number): Promise<void> {
	for (let i = 0; i < times; i++) {
		tick++;
		vi.advanceTimersByTime(5000);
		await Promise.resolve();
		await Promise.resolve();
	}
}

describe("the bench's hosted algorithms never stand between the page and its first paint", () => {
	beforeEach(() => {
		resolveOrder.length = 0;
		ticksAtResolve.length = 0;
		tick = 0;
		vi.resetModules();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("resolves nothing until the browser has been given a chance to idle", async () => {
		vi.stubGlobal("requestIdleCallback", (cb: () => void) => setTimeout(cb, 0));
		const { loadHostedAlgorithms } = await import("./hosted.js");

		const pending = loadHostedAlgorithms();
		await Promise.resolve();
		await Promise.resolve();

		expect(resolveOrder, "a runtime was built before the first idle callback").toEqual([]);

		await advance(6);
		await pending;
		expect(resolveOrder).toEqual(["a", "b", "c"]);
	});

	it("builds each runtime in its own task rather than one block spanning them all", async () => {
		vi.stubGlobal("requestIdleCallback", (cb: () => void) => setTimeout(cb, 0));
		const { loadHostedAlgorithms } = await import("./hosted.js");

		const pending = loadHostedAlgorithms();
		await advance(8);
		await pending;

		expect(new Set(ticksAtResolve).size, `all three resolved on tick(s) ${ticksAtResolve.join(", ")}`).toBe(
			ticksAtResolve.length,
		);
	});

	it("falls back to frame scheduling where requestIdleCallback is not implemented", async () => {
		vi.stubGlobal("requestIdleCallback", undefined);
		vi.stubGlobal("requestAnimationFrame", (cb: () => void) => setTimeout(cb, 0) as unknown as number);
		const { loadHostedAlgorithms } = await import("./hosted.js");

		const pending = loadHostedAlgorithms();
		await advance(12);
		await expect(pending).resolves.toBeInstanceOf(Map);
		expect(resolveOrder).toEqual(["a", "b", "c"]);
	});

	it("hands back one memoized map, so an island remount reuses the runtimes", async () => {
		vi.stubGlobal("requestIdleCallback", (cb: () => void) => setTimeout(cb, 0));
		const { loadHostedAlgorithms } = await import("./hosted.js");

		const first = loadHostedAlgorithms();
		const second = loadHostedAlgorithms();
		await advance(6);
		expect(await first).toBe(await second);
		expect(resolveOrder).toEqual(["a", "b", "c"]);
	});
});

describe("derivePathOf", () => {
	const baked = { id: "xtyle-default" } as never;
	const sandboxed = { id: "xtyle-default" } as never;
	const map = new Map([["xtyle-default", sandboxed]]);

	it("reports pending while the mods are still resolving", () => {
		expect(derivePathOf(baked, null, { loaded: false, failed: false })).toBe("pending");
	});

	it("reports hosted when the register came from the mod the map holds", () => {
		expect(derivePathOf(sandboxed, map, { loaded: true, failed: false })).toBe("hosted");
	});

	it("reports baked when the mods never resolved", () => {
		expect(derivePathOf(baked, null, { loaded: false, failed: true })).toBe("baked");
	});

	it("reports baked when a resolved mod's derive was severed and the oracle stood in", () => {
		expect(derivePathOf(baked, map, { loaded: true, failed: false })).toBe("baked");
	});

	it("reports baked for an algorithm the map never carried, like a custom one", () => {
		expect(derivePathOf({ id: "custom" } as never, map, { loaded: true, failed: false })).toBe("baked");
	});

	it("reports hosted for an algorithm that reached the sandbox off the map, like a pack's", () => {
		const fetched = { id: "example-tinted" } as never;
		expect(derivePathOf(fetched, map, { loaded: true, failed: false }, [fetched])).toBe("hosted");
	});

	it("still reports baked for a sibling that did not produce this register", () => {
		const authored = { id: "custom-code" } as never;
		const fetched = { id: "example-tinted" } as never;
		expect(derivePathOf(baked, map, { loaded: true, failed: false }, [authored, fetched])).toBe("baked");
	});

	it("ignores the empty slots a rail with nothing authored passes", () => {
		expect(derivePathOf(sandboxed, map, { loaded: true, failed: false }, [null, undefined])).toBe("hosted");
	});
});
