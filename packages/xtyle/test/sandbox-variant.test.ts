import { describe, expect, it } from "vitest";
import {
	resetSandboxVariant,
	sandboxInitOptions,
	setSandboxVariant,
	type SandboxVariant,
} from "../src/sandbox.js";
import { loadAuthoredAlgorithm } from "../src/host/index.js";

const SENTINEL = "xtyle-test: the sandbox reached this variant";

function throwingVariant(): SandboxVariant {
	const refuse = () => {
		throw new Error(SENTINEL);
	};
	return { type: "sync", importFFI: refuse, importModuleLoader: refuse } as unknown as SandboxVariant;
}

const SOURCE = `defineXtyleAlgorithm({ id: "probe", label: "Probe" })`;

describe("the sandbox variant", () => {
	it("defaults to the build the runtime picks", () => {
		resetSandboxVariant();
		expect(sandboxInitOptions()).toEqual({});
		resetSandboxVariant();
	});

	it("carries a configured variant into every runtime this package builds", () => {
		resetSandboxVariant();
		const variant = throwingVariant();
		setSandboxVariant(variant);
		expect(sandboxInitOptions()).toEqual({ variant });
		resetSandboxVariant();
	});

	it("refuses a variant once the sandbox has started", () => {
		resetSandboxVariant();
		sandboxInitOptions();
		expect(() => setSandboxVariant(throwingVariant())).toThrow(/after the sandbox started/);
		resetSandboxVariant();
	});

	it("runs on the variant it was handed, not the default", async () => {
		resetSandboxVariant();
		setSandboxVariant(throwingVariant());
		await expect(loadAuthoredAlgorithm(SOURCE)).rejects.toThrow(SENTINEL);
	});
});
