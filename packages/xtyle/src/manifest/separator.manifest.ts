import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-separator></xtyle-separator>

<xtyle-separator size="thin"></xtyle-separator>

<xtyle-separator variant="with-label">OR</xtyle-separator>

<div style="display: flex; height: 1.5rem; align-items: center;">
	<span>Edit</span>
	<xtyle-separator orientation="vertical"></xtyle-separator>
	<span>Share</span>
</div>`;

const svelteExample = `<script lang="ts">
	import { Separator } from "@xtyle/svelte";
</script>

<Separator />

<Separator size="thin" />

<Separator variant="with-label">OR</Separator>

<div style="display: flex; height: 1.5rem; align-items: center;">
	<span>Edit</span>
	<Separator orientation="vertical" />
	<span>Share</span>
</div>`;

const astroExample = `---
import { Separator } from "@xtyle/astro";
---

<Separator />

<Separator size="thin" />

<Separator variant="with-label">OR</Separator>

<div style="display: flex; height: 1.5rem; align-items: center;">
	<span>Edit</span>
	<Separator orientation="vertical" />
	<span>Share</span>
</div>`;

export const separatorManifest: ComponentManifest = {
	id: "separator",
	name: "Separator",
	category: "layout",
	since: "0.1.0",
	keywords: ["divider", "hr", "rule", "hairline", "vertical rule"],
	seeAlso: ["stack", "cluster"],
	summary: "A hairline divider: horizontal or vertical, optionally with a centered label, in two weights.",
	description:
		"Separator draws a thin dividing rule between content. It runs `horizontal` (a full-width rule, the default) or `vertical` (a full-height rule for inline groups like toolbars and button clusters), in two weights: `normal` uses the standard line color and `thin` uses the fainter `--line-2`. The `with-label` variant centers a label over the rule, splitting it into two segments that flank the text (the classic \"OR\" divider), and works on both axes. A bare divider is decorative and `aria-hidden`; once it carries a label it becomes a real `role=\"separator\"` so assistive tech announces the section break.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "separator",
			description: "The root element. Bare, it is the rule itself; labeled, it is a flex track whose pseudo-elements draw the rule on either side of the label.",
			selector: ".xtyle-separator",
			tokens: [
				"--line",
				"--line-2",
				"--border-thin",
				"--fg-2",
				"--font-sans",
				"--text-xs",
				"--weight-medium",
				"--leading-tight",
				"--space-2",
				"--space-3",
			],
		},
		{
			name: "label",
			description: "The centered label text shown in the with-label variant, flanked by rule segments.",
			selector: ".xtyle-separator__label",
		},
	],
	props: [
		{
			name: "orientation",
			type: "Orientation",
			default: "horizontal",
			description: "Axis of the rule. `horizontal` spans width; `vertical` spans height for inline groups.",
			bindings: ["html", "svelte", "astro"],
			options: ["horizontal", "vertical"],
		},
		{
			name: "variant",
			type: "SeparatorVariant",
			default: "default",
			description: "`default` is a plain rule; `with-label` centers a label over the rule.",
			bindings: ["html", "svelte", "astro"],
			options: ["default", "with-label"],
		},
		{
			name: "size",
			type: "SeparatorSize",
			default: "normal",
			description: "Rule weight. `normal` uses the standard line color; `thin` uses the fainter `--line-2`.",
			bindings: ["html", "svelte", "astro"],
			options: ["thin", "normal"],
		},
	],
	variants: [
		{
			name: "default",
			description: "A plain dividing rule with no label: decorative and `aria-hidden`.",
			className: "xtyle-separator",
			tokens: ["--line"],
		},
		{
			name: "with-label",
			description: "Centers a label over the rule, splitting it into two flanking segments; promoted to `role=\"separator\"`.",
			className: "xtyle-separator--with-label",
			tokens: ["--line", "--fg-2", "--space-3"],
		},
	],
	sizes: [
		{ name: "thin", description: "Faint: drawn in the lighter `--line-2`.", className: "xtyle-separator--thin" },
		{ name: "normal", description: "Default: the standard `--line` weight.", className: "xtyle-separator", isDefault: true },
	],
	states: [
		{
			name: "vertical",
			description: "Vertical orientation: the rule spans height instead of width, for inline groups.",
			selector: ".xtyle-separator--vertical",
			tokens: ["--border-thin"],
		},
	],
	slots: [
		{
			name: "default",
			description: "The label text, shown only in the with-label variant.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--text-xs",
		"--weight-medium",
		"--leading-tight",
		"--fg-2",
		"--line",
		"--line-2",
		"--border-thin",
		"--space-2",
		"--space-3",
	],
	composition: [
		"Drop a bare Separator between stacked sections (list rows, card bodies, menu groups) for a quiet structural break.",
		"Use `orientation=\"vertical\"` inside a Toolbar or a horizontal button Cluster to divide groups of controls.",
		"Reach for `variant=\"with-label\"` for the classic \"OR\" divider between two flows, e.g. a login form split from a social-auth row.",
	],
	a11y: [
		"A bare divider is purely decorative, so it is marked `aria-hidden` and the role is omitted. It adds no noise to the accessibility tree.",
		"The labeled variant carries real meaning (a named section break), so it becomes `role=\"separator\"` with the label as its accessible name.",
		"Vertical orientation sets `aria-orientation=\"vertical\"` on the labeled (separator-role) form so the axis is announced.",
		"The rule itself is drawn with backgrounds and pseudo-elements, never text, so screen readers never encounter stray glyphs.",
	],
	examples: [
		{
			id: "orientations-and-label",
			title: "Orientations, weights, and the labeled divider",
			description: "A default rule, the thin weight, the labeled \"OR\" divider, and a vertical rule inside an inline group.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
