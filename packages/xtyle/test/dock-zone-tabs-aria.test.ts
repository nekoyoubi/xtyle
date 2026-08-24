import { describe, expect, it } from "vitest";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";

const twoTabZone = {
	uid: "dz",
	tree: {
		kind: "leaf",
		id: "zone-0",
		active: 1,
		panels: [
			{ id: "files", title: "Files", index: 0 },
			{ id: "outline", title: "Outline", index: 1 },
		],
	},
	floats: [],
	restFilms: 0,
	hasMenu: false,
};

describe("dock-zone tab strip ARIA", () => {
	it("puts its tabs inside a tablist", async () => {
		const html = await renderFragmentLight("dock-zone", twoTabZone);
		expect(html).toContain('class="xtyle-dock-zone__tabs" part="tabs" role="tablist"');
		expect((html.match(/role="tab"/g) ?? []).length).toBe(2);
	});

	it("points every tab at a panel that exists, and names the panel after its tab", async () => {
		const html = await renderFragmentLight("dock-zone", twoTabZone);
		const controls = [...html.matchAll(/aria-controls="([^"]+)"/g)].map((m) => m[1]);
		expect(controls).toEqual(["dz-body-zone-0", "dz-body-zone-0"]);
		expect(html).toContain('role="tabpanel" id="dz-body-zone-0"');
		expect(html).toContain('aria-labelledby="dz-tab-outline"');
		expect(html).toContain('id="dz-tab-files"');
		expect(html).toContain('id="dz-tab-outline"');
	});

	it("keeps one tab stop across the strip", async () => {
		const html = await renderFragmentLight("dock-zone", twoTabZone);
		expect((html.match(/tabindex="0"/g) ?? []).length).toBe(1);
		expect((html.match(/tabindex="-1"/g) ?? []).length).toBe(1);
	});

	it("scopes its ids to the element, so two zones on a page cannot collide", async () => {
		const a = await renderFragmentLight("dock-zone", twoTabZone);
		const b = await renderFragmentLight("dock-zone", { ...twoTabZone, uid: "dz2" });
		expect(a).toContain('id="dz-tab-files"');
		expect(b).toContain('id="dz2-tab-files"');
		expect(b).not.toContain('id="dz-tab-files"');
	});
});
