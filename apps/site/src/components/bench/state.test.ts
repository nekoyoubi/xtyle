import { describe, expect, it } from "vitest";
import { toInvocation, type BenchKnobs, type BenchState } from "./state";

const stateWith = (knobs: BenchKnobs): BenchState => ({
	algorithm: "xtyle-default",
	anchors: {},
	knobs,
	overrides: {},
});

describe("toInvocation knob serialization", () => {
	it("emits a signed scalar knob whichever way it moved", () => {
		expect(toInvocation(stateWith({ surfaceRamp: -0.05 }))).toContain("surfaceRamp: -0.05");
		expect(toInvocation(stateWith({ surfaceRamp: 0.06 }))).toContain("surfaceRamp: 0.06");
	});

	it("folds the font stacks into a fonts group with bare keys", () => {
		const out = toInvocation(stateWith({ fontSans: "Inter", fontDisplay: "REM" }));
		expect(out).toContain('fonts: { sans: "Inter", display: "REM" }');
		expect(out).not.toContain("fontSans");
	});

	it("carries a novel knob a custom algorithm declares beyond BenchKnobs", () => {
		const out = toInvocation(stateWith({ wibble: 3 } as BenchKnobs));
		expect(out).toContain("wibble: 3");
	});

	it("keeps the blessed string and scalar knobs", () => {
		const out = toInvocation(stateWith({ scheme: "dark", accentSplit: 12 }));
		expect(out).toContain('scheme: "dark"');
		expect(out).toContain("accentSplit: 12");
	});

	it("omits the knobs block entirely when nothing is set", () => {
		expect(toInvocation(stateWith({}))).not.toContain("knobs:");
	});

	it("drops unset and blank knob values", () => {
		const out = toInvocation(stateWith({ surfaceRamp: undefined, fontSans: "" }));
		expect(out).not.toContain("surfaceRamp");
		expect(out).not.toContain("fonts");
	});
});
