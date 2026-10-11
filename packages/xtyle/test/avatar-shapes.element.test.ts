// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/avatar.js";
import "../src/elements/avatar-group.js";
import { hostData, loadFill } from "../src/elements/fragment-host.js";
import * as avatarFill from "../src/elements/fragments/avatar/source.generated.js";
import * as groupFill from "../src/elements/fragments/avatar-group/source.generated.js";
import { avatarClass, avatarMarkup } from "../src/markup/avatar.js";
import { avatarCss, avatarGroupCss } from "../src/css/index.js";

beforeAll(async () => {
	await loadFill(avatarFill.manifest, avatarFill.fragmentSources);
	await loadFill(groupFill.manifest, groupFill.fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function make(tag: string, attrs: Record<string, string> = {}): HTMLElement {
	const el = document.createElement(tag);
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	document.body.appendChild(el);
	return el;
}

const chip = (el: HTMLElement): HTMLElement => (el.shadowRoot ?? el).querySelector<HTMLElement>(".xtyle-avatar") as HTMLElement;

describe("avatar shapes and frames", () => {
	it("draws a diamond, clipping the host's effect overlays and the frame but not the marks layer", () => {
		const el = make("xtyle-avatar", { "user-name": "Ada Lovelace", shape: "diamond" });
		expect(chip(el).classList.contains("xtyle-avatar--diamond")).toBe(true);
		expect(avatarCss).toContain('xtyle-avatar[shape="diamond"]::before,\nxtyle-avatar[shape="diamond"]::after { clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%); }');
		expect(avatarCss).not.toMatch(/xtyle-avatar\[shape="diamond"\] \{[^}]*clip-path/);
		expect(avatarCss).toMatch(/\.xtyle-avatar--diamond::before \{[^}]*clip-path: polygon/);
		expect(avatarCss).not.toMatch(/\.xtyle-avatar--diamond \{[^}]*clip-path/);
	});

	it("rings the content in a solid tone or a gradient between two", () => {
		const solid = make("xtyle-avatar", { "user-name": "A", frame: "solid", "frame-tone": "purple" });
		expect(chip(solid).className).toContain("xtyle-avatar--frame-solid");
		expect(chip(solid).className).toContain("xtyle-avatar--frame-tone-purple");
		const gradient = make("xtyle-avatar", { "user-name": "B", frame: "gradient", "frame-tone": "yellow", "frame-tone-2": "orange" });
		expect(chip(gradient).className).toContain("xtyle-avatar--frame-gradient");
		expect(chip(gradient).className).toContain("xtyle-avatar--frame-tone-2-orange");
		expect(avatarCss).toContain("--_frame-paint: linear-gradient(135deg, var(--_frame, var(--accent)), var(--_frame-2, var(--accent-2)));");
	});

	it("lets a custom property paint the frame with any color or gradient", () => {
		expect(avatarCss).toContain("var(--xtyle-avatar-frame, var(--_frame-paint, transparent))");
		expect(avatarCss).toContain("var(--xtyle-avatar-frame-width, var(--border-thick))");
	});

	it("bevels from the theme's own white and black, and a bevel alone implies a solid frame", () => {
		const el = make("xtyle-avatar", { "user-name": "A", bevel: "" });
		expect(chip(el).className).toContain("xtyle-avatar--bevel");
		expect(chip(el).className).toContain("xtyle-avatar--frame-solid");
		expect(avatarCss).toMatch(/--_bevel: linear-gradient\([^;]*var\(--white\)[^;]*var\(--black\)/);
	});

	it("drops a frame tone when there is no frame to paint", () => {
		const el = make("xtyle-avatar", { "user-name": "A", "frame-tone": "red" });
		expect(chip(el).className).not.toContain("frame");
	});

	it("follows a frame change without a rebuild", () => {
		const el = make("xtyle-avatar", { "user-name": "A" });
		el.setAttribute("frame", "gradient");
		expect(chip(el).className).toContain("xtyle-avatar--frame-gradient");
	});

	it("builds the same class list in the fill and in the SSR markup", () => {
		const props = { userName: "A", shape: "diamond", frame: "gradient", frameTone: "cyan", frameTone2: "blue", bevel: true } as const;
		const el = make("xtyle-avatar", { "user-name": "A", shape: "diamond", frame: "gradient", "frame-tone": "cyan", "frame-tone-2": "blue", bevel: "" });
		expect(chip(el).className).toBe(avatarClass(props));
	});
});

describe("avatar hooks for mods", () => {
	it("renders an empty marks part in both renderers", () => {
		const el = make("xtyle-avatar", { "user-name": "A" });
		expect((el.shadowRoot ?? el).querySelector('[part="marks"]')?.childNodes.length).toBe(0);
		expect(avatarMarkup({ userName: "A" })).toContain('<span class="xtyle-avatar__marks" part="marks"></span>');
	});

	it("hands the host's data attributes to the fill, leaving xtyle's own out", () => {
		const el = make("xtyle-avatar", { "user-name": "A", "data-rank": "3", "data-rank-max": "5", "data-fx": "holo", "data-xtyle-fill-error": "x" });
		expect(hostData(el)).toEqual({ rank: "3", rankMax: "5" });
	});
});

describe("avatar group layouts", () => {
	const group = (attrs: Record<string, string>) => {
		const el = make("xtyle-avatar-group", { label: "Rings", ...attrs });
		return (el.shadowRoot ?? el).querySelector<HTMLElement>(".xtyle-avatar-group") as HTMLElement;
	};

	it("defaults to an overlapping pile", () => {
		expect(group({}).className).toContain("xtyle-avatar-group--overlap");
	});

	it("names the row, wrap, and lattice layouts and the start stack", () => {
		expect(group({ layout: "row" }).className).toContain("xtyle-avatar-group--row");
		expect(group({ layout: "wrap" }).className).toContain("xtyle-avatar-group--wrap");
		expect(group({ layout: "lattice", stack: "start" }).className).toBe("xtyle-avatar-group xtyle-avatar-group--lattice xtyle-avatar-group--stack-start");
	});

	it("keeps the background ring and overlap to the pile, drawn by the chip so it follows the shape", () => {
		expect(avatarGroupCss).toMatch(/\.xtyle-avatar-group--overlap > \* \{\n\t--xtyle-avatar-ring: 0 0 0 var\(--border-thick\) var\(--bg-0\);/);
		expect(avatarGroupCss).not.toMatch(/^\.xtyle-avatar-group > \*,/m);
		expect(avatarCss).toContain("box-shadow: var(--xtyle-avatar-ring, none);");
	});

	it("nests a lattice by half an item, dropping every other one half a step", () => {
		expect(avatarGroupCss).toContain("margin-inline-start: calc(var(--_gap) / 2 - var(--_item) / 2);");
		expect(avatarGroupCss).toMatch(/--lattice > \*:nth-child\(even\) \{\n\ttranslate: 0 calc\(var\(--_item\) \/ 2/);
	});

	it("stacks the first item on top under stack=start, and hover still wins", () => {
		expect(avatarGroupCss).toContain(".xtyle-avatar-group--stack-start > *:nth-child(1) { z-index: 24; }");
		expect(avatarGroupCss).toMatch(/:focus-within \{\n\tz-index: 25;/);
	});
});
