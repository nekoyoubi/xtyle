import { describe, expect, it } from "vitest";
import baseline from "./stats-baseline.json";
import { releasedVersions } from "./releases";

describe("releasedVersions", () => {
	it("carries the releases that introduced no component", () => {
		const versions = releasedVersions();
		expect(versions).toContain("0.5.0");
		expect(versions).toContain("0.1.1");
		expect(versions).toContain("0.7.1");
	});

	it("stops at the last release, so the cycle being built is not offered as shipped", () => {
		expect(releasedVersions()).not.toContain("0.12.0");
		expect(releasedVersions().at(-1)).toBe(baseline.version);
	});

	it("runs oldest first and folds in anything a caller already knows about", () => {
		const versions = releasedVersions(["0.5.0", "0.9.0"]);
		expect(versions[0]).toBe("0.1.0");
		expect(versions.filter((v) => v === "0.5.0")).toHaveLength(1);
		expect(versions.indexOf("0.9.0")).toBeGreaterThan(versions.indexOf("0.5.0"));
	});
});
