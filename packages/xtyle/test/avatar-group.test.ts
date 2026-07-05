import { describe, expect, it } from "vitest";
import { getComponent, coverComponent, derive } from "../src/index.js";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";
import { xtyleDefault } from "../src/batteries.js";

const register = derive(xtyleDefault, {
	constraints: { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef", "--accent": "#6ea8fe" },
});

describe("avatar-group", () => {
	it("is registered under the media category", () => {
		const manifest = getComponent("avatar-group");
		expect(manifest.category).toBe("media");
		expect(manifest.name).toBe("Avatar Group");
	});

	it("covers every consumed token against xtyle-default", () => {
		const result = coverComponent(getComponent("avatar-group"), register);
		expect(result.missing, `missing: ${result.missing.join(", ")}`).toEqual([]);
		expect(result.covered).toBe(true);
	});

	it("renders a role=group with a slot for the avatars", async () => {
		const html = await renderFragmentLight("avatar-group", { label: "Contributors" });
		expect(html).toContain('role="group"');
		expect(html).toContain('aria-label="Contributors"');
		expect(html).toContain("<slot></slot>");
	});

	it("renders a +N overflow chip only for a positive overflow", async () => {
		const none = await renderFragmentLight("avatar-group", { overflow: 0 });
		expect(none).not.toContain("xtyle-avatar-group__overflow");
		const some = await renderFragmentLight("avatar-group", { overflow: 16 });
		expect(some).toContain('class="xtyle-avatar-group__overflow"');
		expect(some).toContain(">+16<");
		expect(some).toContain('aria-label="16 more"');
	});

	it("ignores a zero, negative, or non-numeric overflow", async () => {
		for (const overflow of [0, -3, Number.NaN]) {
			const html = await renderFragmentLight("avatar-group", { overflow });
			expect(html, `overflow=${overflow}`).not.toContain("xtyle-avatar-group__overflow");
		}
	});

	it("reflects size and spacing as classes, defaulting to md/normal without a modifier", async () => {
		const def = await renderFragmentLight("avatar-group", {});
		expect(def).toContain('class="xtyle-avatar-group"');
		const sized = await renderFragmentLight("avatar-group", { size: "lg", spacing: "snug" });
		expect(sized).toContain("xtyle-avatar-group--lg");
		expect(sized).toContain("xtyle-avatar-group--snug");
	});

	it("escapes a hostile label and overflow-derived text", async () => {
		const html = await renderFragmentLight("avatar-group", { label: 'a" onmouseover="x' });
		expect(html).toContain("&quot;");
		expect(html).not.toContain('onmouseover="x"');
	});
});
