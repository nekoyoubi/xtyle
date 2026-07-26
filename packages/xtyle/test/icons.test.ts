import { describe, expect, it } from "vitest";
import { renderIcon, ICONS, ICON_NAMES, hasIcon, getComponent, coverComponent, derive } from "../src/index.js";
import { composeIconThemed, resolveIconMark } from "../src/icon-builder.js";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";
import { xtyleDefault } from "../src/batteries.js";

const register = derive(xtyleDefault, {
	constraints: { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef", "--accent": "#6ea8fe" },
});

describe("icons", () => {
	it("registers the icon component in the media category", () => {
		const manifest = getComponent("icon");
		expect(manifest.category).toBe("media");
		expect(manifest.name).toBe("Icon");
	});

	it("covers every consumed token against xtyle-default", () => {
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
		expect(svg).toContain("xtyle-icon--lg");
		expect(svg).toContain("xtyle-icon--accent");
		expect(svg).toContain("xtyle-icon--spin");

		expect(renderIcon("check")).not.toContain("xtyle-icon--md");
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
		// INFO: the fragment tree serializes self-closing tags as `<path ... />` where `renderIcon`
		// writes `<path .../>`
		const normalizeSelfClosing = (markup: string) => markup.replace(/\s*\/>/g, "/>");
		expect(normalizeSelfClosing(chrome)).toContain(normalizeSelfClosing(ICONS.check));
		expect(chrome).toContain("xtyle-icon--lg");
	});
});

/**
 * A generated mark's own label is derived from its *name*, and a name is a spec string picked to
 * identify the mark rather than to describe it. So `label` has to outrank it — and has to reach the
 * `<title>` as well as the attribute, because a `<title>` is what the browser puts in the tooltip:
 * a mark nested in a link was hovering as its own identifier and hiding the link's title behind it.
 * It shipped silent, since the prop was accepted, type-checked, and did nothing.
 */
describe("a generated mark takes the label it was given", () => {
	const MARK = "cratesio--hex-c3--hex-p1-x-14-y10-s75-ko---ps-skittles";

	const compose = (label?: string): string => {
		const parsed = resolveIconMark(MARK);
		expect(parsed, "the fixture is no longer a valid mark spec").not.toBeNull();
		return composeIconThemed(parsed!.composition, { label });
	};

	it("names itself from the mark when nothing overrides it", () => {
		expect(compose()).toContain("<title>cratesio</title>");
	});

	it("takes an override into both the accessible name and the title", () => {
		const svg = compose("crates.io");
		expect(svg).toContain('aria-label="crates.io"');
		expect(svg).toContain("<title>crates.io</title>");
		expect(svg).not.toContain("<title>cratesio</title>");
	});

	it("escapes an override the same way it escapes its own label", () => {
		const svg = compose('a" onload="x');
		expect(svg).not.toContain('onload="x"');
		expect(svg).toContain("&quot;");
	});
});
