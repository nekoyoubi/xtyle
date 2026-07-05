/**
 * The entry `scripts/build-mods.mjs` bundles into the authoring prelude — a self-contained IIFE
 * that exposes the whole mod-side authoring surface on the sandbox global scope. Prepended to an
 * author's import-free source, it lets a Tier-2 algorithm run through `loadAlgorithm` without an
 * in-browser bundler: the heavy engine code rides the pre-built prelude, and the author writes only
 * the `defineAlgorithm({ … })` body.
 *
 * The full surface (not just `defineAlgorithm` / `defineXtyleAlgorithm`) is exposed so a from-scratch
 * author can reach the engine's color math (`oklch`, `formatCss`, `contrast`, …) and the pass
 * helpers (`settlePass`, `runPipeline`, …) a custom `passes` pipeline needs — every export is a pure
 * function, so widening the surface adds no authority the zero-authority sandbox doesn't already
 * grant. The `cuti` binding the derivation reads is injected by the host at runtime, not bundled
 * here.
 */
import * as authoring from "../authoring.js";

Object.assign(globalThis as unknown as Record<string, unknown>, authoring);
