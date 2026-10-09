import { describe, expect, it, vi } from "vitest";

vi.mock("../src/host/registry.js", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../src/host/registry.js")>();
	return {
		...actual,
		availableAlgorithms: () => [],
		algorithmManifest: () => null,
		resolveInstalledAlgorithm: () => Promise.reject(new Error("no algorithms/ directory")),
	};
});

const { catalogAlgorithms, catalogManifest, resolveCatalogAlgorithm } = await import("../src/host/catalog.js");
const { bundledAlgorithms } = await import("../src/host/bundle.js");

describe("the tools' algorithm catalog, as a published install sees it", () => {
	it("lists the embedded blessed set when nothing is installed on disk", () => {
		const ids = catalogAlgorithms();
		expect(ids[0]).toBe("xtyle-default");
		expect([...ids].sort()).toEqual([...bundledAlgorithms()].sort());
	});

	it("reads a blessed algorithm's knobs off the embedded manifest", () => {
		expect(catalogManifest("xtyle-hc")?.knobs).toContain("scheme");
	});

	it("derives a blessed id from the embedded bundle", async () => {
		const algorithm = await resolveCatalogAlgorithm("xtyle-loud");
		expect(algorithm.id).toBe("xtyle-loud");
	});

	it("names what is available when asked for an algorithm that is nowhere", async () => {
		await expect(resolveCatalogAlgorithm("nope")).rejects.toThrow(/no algorithm "nope" \(available: xtyle-default/);
	});
});
