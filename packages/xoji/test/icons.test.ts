import { describe, expect, it } from "vitest";
import { renderIcon, ICONS, ICON_NAMES, hasIcon, getComponent, coverComponent, derive } from "../src/index.js";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";
import { xojiDefault } from "../src/batteries.js";

const register = derive(xojiDefault, {
	constraints: { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef", "--accent": "#6ea8fe" },
});

describe("icons", () => {
	it("registers the icon component in the media category", () => {
		const manifest = getComponent("icon");
		expect(manifest.category).toBe("media");
		expect(manifest.name).toBe("Icon");
	});

	it("covers every consumed token against xoji-default", () => {
		const result = coverComponent(getComponent("icon"), register);
		expect(result.missing, `missing: ${result.missing.join(", ")}`).toEqual([]);
		expect(result.covered).toBe(true);
	});

	it("renders a valid svg on a 24x24 grid in currentColor", () => {
		const svg = renderIcon("check");
		expect(svg.startsWith("<svg")).toBe(true);
		expect(svg).toContain('viewBox="0 0 24 24"');
		expect(svg).toContain("stroke=\"currentColor\"");
		expect(svg).toContain(ICONS.check);
	});

	it("is decorative by default and named when labelled", () => {
		expect(renderIcon("search")).toContain('aria-hidden="true"');

		const labelled = renderIcon("search", { label: "Search" });
		expect(labelled).toContain('role="img"');
		expect(labelled).toContain('aria-label="Search"');
		expect(labelled).toContain("<title>Search</title>");
		expect(labelled).not.toContain('aria-hidden="true"');
	});

	it("escapes a hostile label so it can't break out of the attribute", () => {
		const svg = renderIcon("close", { label: 'a" onload="x' });
		expect(svg).not.toContain('onload="x"');
		expect(svg).toContain("&quot;");
	});

	it("reflects size, tone, and spin as classes", () => {
		const svg = renderIcon("loader", { size: "lg", tone: "accent", spin: true });
		expect(svg).toContain("xoji-icon--lg");
		expect(svg).toContain("xoji-icon--accent");
		expect(svg).toContain("xoji-icon--spin");

		expect(renderIcon("check")).not.toContain("xoji-icon--md");
	});

	it("renders a visible placeholder for an unknown name instead of nothing", () => {
		const svg = renderIcon("no-such-glyph");
		expect(svg.startsWith("<svg")).toBe(true);
		expect(svg).toContain("<path");
		expect(hasIcon("no-such-glyph")).toBe(false);
		expect(hasIcon("check")).toBe(true);
	});

	it("draws a non-empty body for every glyph in the set", () => {
		for (const name of ICON_NAMES) {
			expect(ICONS[name].length, name).toBeGreaterThan(0);
			expect(renderIcon(name), name).toContain("<");
		}
	});

	it("ships the media-transport family, drawn as filled shapes in currentColor", () => {
		for (const name of ["play", "pause", "stop", "skip-forward", "skip-back"]) {
			expect(hasIcon(name), name).toBe(true);
			expect(ICONS[name as keyof typeof ICONS], name).toContain('fill="currentColor"');
			expect(ICONS[name as keyof typeof ICONS], name).not.toContain("stroke=");
		}
	});

	it("renders the same markup through the SSR fragment as through renderIcon", async () => {
		const chrome = await renderFragmentLight("icon", { name: "check", size: "lg" });
		expect(chrome).toContain('part="icon"');
		expect(chrome).toContain(ICONS.check);
		expect(chrome).toContain("xoji-icon--lg");
	});
});
