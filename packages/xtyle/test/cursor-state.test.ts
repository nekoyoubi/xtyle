// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/button.js";
import "../src/elements/switch.js";
import "../src/elements/segmented.js";
import "../src/elements/select.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";
import { manifest as buttonManifest, fragmentSources as buttonSources } from "../src/elements/fragments/button/source.generated.js";
import { manifest as switchManifest, fragmentSources as switchSources } from "../src/elements/fragments/switch/source.generated.js";
import { manifest as segmentedManifest, fragmentSources as segmentedSources } from "../src/elements/fragments/segmented/source.generated.js";
import { manifest as selectManifest, fragmentSources as selectSources } from "../src/elements/fragments/select/source.generated.js";
import { buttonCss } from "../src/css/components/button.js";
import { switchCss } from "../src/css/components/switch.js";
import { segmentedCss } from "../src/css/components/segmented.js";
import { selectCss } from "../src/css/components/select.js";
import { baseCss } from "../src/css/components/base.js";

type CursorEl = HTMLElement & { cursor: boolean };

interface Subject {
	tag: string;
	control: string;
	attrs: Record<string, string>;
	ssr: Record<string, unknown>;
	rings: Array<{ css: string; focus: string }>;
}

const segments = [
	{ value: "easy", label: "Easy" },
	{ value: "normal", label: "Normal" },
];

const subjects: Subject[] = [
	{
		tag: "xtyle-button",
		control: '[part="button"]',
		attrs: {},
		ssr: {},
		rings: [{ css: buttonCss, focus: ".xtyle-button:focus-visible" }],
	},
	{
		tag: "xtyle-switch",
		control: '[role="switch"]',
		attrs: { label: "Subtitles" },
		ssr: { label: "Subtitles" },
		rings: [{ css: switchCss, focus: ".xtyle-switch__track:focus-visible" }],
	},
	{
		tag: "xtyle-segmented",
		control: '[role="radio"][aria-checked="true"]',
		attrs: { label: "Difficulty", options: "Easy:easy,Normal:normal", value: "normal" },
		ssr: { label: "Difficulty", segments, value: "normal" },
		rings: [{ css: segmentedCss, focus: ".xtyle-segmented__option:focus-visible" }],
	},
	{
		tag: "xtyle-select",
		control: "select",
		attrs: { label: "Language" },
		ssr: { label: "Language", fieldId: "lang", errorId: "lang-error", optionsHtml: "" },
		rings: [
			{ css: baseCss, focus: ".xtyle-control:focus-visible" },
			{ css: selectCss, focus: ".xtyle-select__field:focus-visible + .xtyle-select__chevron" },
			{ css: selectCss, focus: ".xtyle-select--invalid .xtyle-select__field:focus-visible" },
		],
	},
];

beforeAll(async () => {
	await loadFill(buttonManifest, buttonSources);
	await loadFill(switchManifest, switchSources);
	await loadFill(segmentedManifest, segmentedSources);
	await loadFill(selectManifest, selectSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function make(tag: string, attrs: Record<string, string>): CursorEl {
	const el = document.createElement(tag) as CursorEl;
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	document.body.append(el);
	return el;
}

function scope(el: HTMLElement): ParentNode {
	return el.shadowRoot ?? el;
}

function control(el: HTMLElement, selector: string): Element {
	return scope(el).querySelector(selector) as Element;
}

function marked(el: HTMLElement): Element[] {
	return Array.from(scope(el).querySelectorAll("[data-cursor]"));
}

function ariaOf(node: Element): Record<string, string> {
	const entries = Array.from(node.attributes)
		.filter((a) => a.name.startsWith("aria-") || a.name === "role" || a.name === "tabindex")
		.map((a) => [a.name, a.value] as const);
	return Object.fromEntries(entries);
}

function declarationsFor(css: string, selector: string): string | null {
	for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
		const selectors = (match[1] ?? "").split(",").map((s) => s.trim());
		if (selectors.includes(selector)) return (match[2] ?? "").trim();
	}
	return null;
}

function forcedColorsBlock(css: string): string {
	const start = css.indexOf("@media (forced-colors: active)");
	return start < 0 ? "" : css.slice(start);
}

describe("cursor marks an app-owned keyboard cursor", () => {
	for (const subject of subjects) {
		describe(subject.tag, () => {
			it("puts data-cursor on the ring element alone while set and drops it when cleared", () => {
				const el = make(subject.tag, { ...subject.attrs, focusable: "false", cursor: "" });
				expect(marked(el)).toEqual([control(el, subject.control)]);
				el.cursor = false;
				expect(el.hasAttribute("cursor")).toBe(false);
				expect(marked(el)).toEqual([]);
				el.cursor = true;
				expect(el.getAttribute("cursor")).toBe("");
				expect(marked(el)).toEqual([control(el, subject.control)]);
			});

			it("marks an element the forced-colors base rule reaches", () => {
				const el = make(subject.tag, { ...subject.attrs, cursor: "" });
				expect(control(el, subject.control).getAttribute("class") ?? "").toMatch(/(^| )xtyle-/);
			});

			it("changes no ARIA and moves no focus", () => {
				const el = make(subject.tag, { ...subject.attrs, focusable: "false" });
				const before = ariaOf(control(el, subject.control));
				el.cursor = true;
				expect(control(el, subject.control).hasAttribute("data-cursor")).toBe(true);
				expect(ariaOf(control(el, subject.control))).toEqual(before);
				expect(control(el, subject.control).hasAttribute("aria-current")).toBe(false);
				expect(document.activeElement).toBe(document.body);
			});

			it("renders the cursor in server-rendered light markup", async () => {
				const id = subject.tag.replace("xtyle-", "");
				const html = await renderFragmentLight(id, { ...subject.ssr, cursor: true });
				expect(html.match(/data-cursor="true"/g)).toHaveLength(1);
				const off = await renderFragmentLight(id, { ...subject.ssr, cursor: false });
				expect(off).not.toContain("data-cursor");
			});

			for (const ring of subject.rings) {
				it(`draws ${ring.focus} from the same rule`, () => {
					const focus = declarationsFor(ring.css, ring.focus);
					expect(focus, "no focus-visible rule found to compare against").not.toBeNull();
					expect(declarationsFor(ring.css, ring.focus.replace(":focus-visible", "[data-cursor]"))).toBe(focus);
				});
			}
		});
	}

	it("follows the selected segment as the value moves", () => {
		const el = make("xtyle-segmented", { label: "Difficulty", options: "Easy:easy,Normal:normal,Hard:hard", value: "easy", cursor: "" });
		expect(marked(el).map((n) => n.getAttribute("data-value"))).toEqual(["easy"]);
		el.setAttribute("value", "hard");
		expect(marked(el).map((n) => n.getAttribute("data-value"))).toEqual(["hard"]);
	});

	it("lets a select leave and rejoin the tab order after it has rendered", () => {
		const el = make("xtyle-select", { label: "Language" });
		el.setAttribute("focusable", "false");
		expect(control(el, "select").getAttribute("tabindex")).toBe("-1");
		el.removeAttribute("focusable");
		expect(control(el, "select").hasAttribute("tabindex")).toBe(false);
	});

	it("is promoted to a real outline under forced colors, as focus is", () => {
		const block = forcedColorsBlock(baseCss);
		const focus = declarationsFor(block, '[class^="xtyle-"]:focus-visible');
		expect(focus).toContain("Highlight");
		expect(declarationsFor(block, '[class^="xtyle-"][data-cursor]')).toBe(focus);
		expect(declarationsFor(block, '[class*=" xtyle-"][data-cursor]')).toBe(focus);
	});

	it("keeps the forced-colors outline in Highlight against a component ring rule that sets it transparent", () => {
		const block = forcedColorsBlock(baseCss);
		const pinned = Array.from(block.matchAll(/([^{}]+)\{([^{}]*)\}/g)).filter((m) =>
			(m[1] ?? "").split(",").map((s) => s.trim()).includes('[class^="xtyle-"][data-cursor]'),
		);
		expect(pinned.some((m) => /outline-color:\s*Highlight\s*!important/.test(m[2] ?? ""))).toBe(true);
	});
});
