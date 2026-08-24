import type { Algorithm } from "@xtyle/core";
import { resolveBundledAlgorithm, bundledAlgorithms } from "@xtyle/core/host/bundle";

let loadPromise: Promise<Map<string, Algorithm>> | undefined;

type IdleScheduler = (callback: () => void, options?: { timeout: number }) => void;

const IDLE_BUDGET_MS = 3000;

function whenIdle(): Promise<void> {
	return new Promise((resolve) => {
		const idle = (globalThis as { requestIdleCallback?: IdleScheduler }).requestIdleCallback;
		if (typeof idle === "function") {
			idle(() => resolve(), { timeout: IDLE_BUDGET_MS });
			return;
		}
		if (typeof requestAnimationFrame !== "function") {
			setTimeout(resolve, 0);
			return;
		}
		requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 0)));
	});
}

/**
 * Loads every bench algorithm as a hosted xript mod in the browser through the portable core resolver
 * (`@xtyle/core/host/bundle`), which embeds each blessed mod so no bundler-specific import is needed. The
 * QuickJS WASM runtime is fetched once; each algorithm gets its own runtime. Resolves to a map keyed by
 * algorithm id. Memoized so island remounts reuse the single in-browser runtime set.
 *
 * Runs off the critical path: the first paint is owed nothing by this, because every consumer falls back
 * to the byte-identical baked algorithm until the map arrives. Each runtime is built one at a time with a
 * yield between, so the work reaches the browser as separate tasks rather than one block that spans them
 * all.
 */
/** Which derivation path produced a register: the sandboxed mod, the baked oracle, or still resolving. */
export type DerivePath = "hosted" | "baked" | "pending";

/**
 * Which path actually produced a register: the zero-authority sandbox, or the baked oracle.
 *
 * Keyed on the identity of the algorithm that derived it, not on whether the hosted map holds an
 * entry for the id — those answer different questions, and the case that matters is the one where
 * they disagree. A hosted mod can resolve and then have its *derive* severed by the host's wall-clock
 * rail, at which point the Bench falls back to the last good register while the map still carries the
 * entry. Asking the map would report the sandbox on precisely the load where it did not run.
 *
 * `sandboxed` carries the algorithms that reached the sandbox by some route other than the blessed
 * map — an authored source, an algorithm fetched from a published pack. Without it they answer
 * "baked", which is wrong twice over: they never touched the baked path, and unlike a blessed id
 * they have no baked twin the register could be identical to.
 */
export function derivePathOf(
	produced: Algorithm,
	hosted: Map<string, Algorithm> | null,
	state: { loaded: boolean; failed: boolean },
	sandboxed: readonly (Algorithm | null | undefined)[] = [],
): DerivePath {
	if (hosted) {
		for (const algorithm of hosted.values()) if (algorithm === produced) return "hosted";
	}
	if (sandboxed.some((algorithm) => algorithm === produced)) return "hosted";
	return state.loaded || state.failed ? "baked" : "pending";
}

export function loadHostedAlgorithms(): Promise<Map<string, Algorithm>> {
	if (!loadPromise) {
		loadPromise = (async () => {
			const resolved = new Map<string, Algorithm>();
			for (const id of bundledAlgorithms()) {
				await whenIdle();
				resolved.set(id, await resolveBundledAlgorithm(id));
			}
			return resolved;
		})();
	}
	return loadPromise;
}
