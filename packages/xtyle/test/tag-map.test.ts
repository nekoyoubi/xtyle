import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, expectTypeOf, it } from "vitest";
import type { XtyleSegmented } from "../src/elements/segmented.js";
import type { XtyleSwitch } from "../src/elements/switch.js";
import "../src/elements/tag-map.generated.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("HTMLElementTagNameMap", () => {
	it("is regenerated from every define() call", async () => {
		const { collectTags, renderTagMap } = await import(join(ROOT, "scripts", "build-tag-map.mjs"));
		const committed = readFileSync(join(ROOT, "packages", "xtyle", "src", "elements", "tag-map.generated.ts"), "utf8");
		expect(committed, "run `node scripts/build-tag-map.mjs`").toBe(renderTagMap(collectTags()));
	});

	it("types a created element as its class", () => {
		expectTypeOf<HTMLElementTagNameMap["xtyle-segmented"]>().toEqualTypeOf<XtyleSegmented>();
		expectTypeOf<HTMLElementTagNameMap["xtyle-switch"]>().toEqualTypeOf<XtyleSwitch>();
		expectTypeOf<ReturnType<typeof document.createElement<"xtyle-switch">>>().toEqualTypeOf<XtyleSwitch>();
	});
});
