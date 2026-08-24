import { describe, expect, it } from "vitest";
import { applyView, defaultScene, MAIN_TABS, readView, SCENES } from "./view";

describe("readView", () => {
	it("falls back to the first main tab and its first scene", () => {
		expect(readView("")).toEqual({ view: "mockups", scene: "email" });
	});

	it("takes a view and scene it recognizes", () => {
		expect(readView("?view=report&scene=coverage")).toEqual({ view: "report", scene: "coverage" });
	});

	it("ignores a scene that belongs to a different view", () => {
		expect(readView("?view=report&scene=crm")).toEqual({ view: "report", scene: "contrast" });
	});

	it("drops the scene along with a view it cannot resolve", () => {
		expect(readView("?view=nonsense&scene=coverage")).toEqual({ view: "mockups", scene: "email" });
	});

	it("addresses a scene without being told which view holds it", () => {
		expect(readView("?scene=dashboard")).toEqual({ view: "mockups", scene: "dashboard" });
	});
});

describe("applyView", () => {
	it("leaves the default view unaddressed", () => {
		expect(applyView("", { view: "mockups", scene: "email" })).toBe("");
	});

	it("names the view even when only the scene moved", () => {
		expect(applyView("", { view: "mockups", scene: "crm" })).toBe("?view=mockups&scene=crm");
	});

	it("keeps parameters it does not own", () => {
		expect(applyView("?algorithm=xtyle-hc", { view: "report", scene: "gamut" })).toBe(
			"?algorithm=xtyle-hc&view=report&scene=gamut",
		);
	});

	it("clears an address that returns to the default", () => {
		expect(applyView("?view=report&scene=gamut", { view: "mockups", scene: "email" })).toBe("");
	});
});

describe("every bench scene is addressable", () => {
	for (const { value: view } of MAIN_TABS) {
		for (const { value: scene } of SCENES[view] ?? []) {
			it(`${view}/${scene}`, () => {
				expect(readView(applyView("", { view, scene }))).toEqual({ view, scene });
			});
		}
	}

	it("covers every main tab", () => {
		for (const { value } of MAIN_TABS) expect(defaultScene(value)).not.toBe("");
	});
});
