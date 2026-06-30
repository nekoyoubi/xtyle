import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

const htmlExample = `<xoji-dock label="Navigation" nav side="left">
	<a href="/dashboard">Dashboard</a>
	<a href="/projects">Projects</a>
	<a href="/settings">Settings</a>
</xoji-dock>

<xoji-dock label="Inspector" side="right" size="sm">
	<p>Properties for the selected item appear here.</p>
	<small slot="footer">Last saved a moment ago.</small>
</xoji-dock>`;

const svelteExample = `<script lang="ts">
	import { Dock } from "@xoji/svelte";
</script>

<Dock label="Navigation" nav side="left">
	<a href="/dashboard">Dashboard</a>
	<a href="/projects">Projects</a>
	<a href="/settings">Settings</a>
</Dock>

<Dock label="Inspector" side="right" size="sm">
	<p>Properties for the selected item appear here.</p>
	{#snippet footer()}
		<small>Last saved a moment ago.</small>
	{/snippet}
</Dock>`;

const astroExample = `---
import { Dock } from "@xoji/astro";
---

<Dock label="Navigation" nav side="left">
	<a href="/dashboard">Dashboard</a>
	<a href="/projects">Projects</a>
	<a href="/settings">Settings</a>
</Dock>

<Dock label="Inspector" side="right" size="sm">
	<p>Properties for the selected item appear here.</p>
	<small slot="footer">Last saved a moment ago.</small>
</Dock>`;

export const dockManifest: ComponentManifest = {
	id: "dock",
	name: "Dock",
	category: "shell",
	summary: "The side rail: a vertical panel pinned to the left or right edge of the shell.",
	description:
		"Dock is the application's side rail: a flex column pinned to an edge, sized to one of three widths, holding navigation, an inspector, a tool palette, or any other persistent panel. It renders a complementary `<aside>` by default and a `<nav>` when `nav` is set, so a navigation rail carries the right landmark role. A `label` names the landmark (applied as `aria-label` and shown as an optional uppercase header), so multiple docks on a page stay distinguishable to assistive technology. Header, body, and footer parts give the rail a stable internal rhythm; the footer pins to the bottom.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "dock",
			description: "The rail element (an `<aside>` or `<nav>`) carrying the side and size classes.",
			selector: ".xoji-dock",
			tokens: [
				"--font-sans",
				"--text-body",
				"--leading-normal",
				"--fg-1",
				"--bg-1",
				"--line",
				"--border-thin",
				"--space-2",
				"--space-3",
				"--space-4",
			],
		},
		{
			name: "header",
			description: "The optional uppercase title row, rendered from the `label` or the `header` slot.",
			selector: ".xoji-dock__header",
			tokens: ["--text-xs", "--weight-semibold", "--leading-tight", "--fg-2", "--space-0", "--space-1", "--space-2"],
		},
		{
			name: "body",
			description: "The scrolling content column that holds the rail's items.",
			selector: ".xoji-dock__body",
			tokens: ["--space-1"],
		},
		{
			name: "footer",
			description: "The bottom-pinned region, separated by a hairline rule.",
			selector: ".xoji-dock__footer",
			tokens: ["--space-1", "--space-3", "--border-thin", "--line"],
		},
	],
	props: [
		{
			name: "side",
			type: "DockSide",
			default: "left",
			description: "Which edge the rail sits against; flips the divider border to the inner edge.",
			bindings: ["html", "svelte", "astro"],
			options: ["left", "right"],
		},
		{
			name: "size",
			type: "Size",
			default: "md",
			description: "Rail width: sm (14rem), md (18rem), or lg (22rem).",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
		},
		{
			name: "tone",
			type: "FullTone",
			description:
				"Colors the rail's divider edge in the chosen tone (any semantic role, accent variant, or named hue) for an accent rail. Omit it for the plain hairline.",
			bindings: ["html", "svelte", "astro"],
			options: [...FULL_TONES],
		},
		{
			name: "reverseEdge",
			type: "boolean",
			default: "false",
			description:
				"Move the edge (the toned accent or the hairline) to the rail's outer side instead of the inner divider side: to outer-edge a rail or keep a left/right pair consistently sided.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "edgeWidth",
			type: "\"thin\" | \"thick\" | \"bold\"",
			description:
				"Edge thickness: thin (hairline), thick, or bold (a chunky accent spine). Omit to use the default, a hairline when untoned, thick when toned.",
			bindings: ["html", "svelte", "astro"],
			options: ["thin", "thick", "bold"],
		},
		{
			name: "nav",
			type: "boolean",
			default: "false",
			description: "Renders a `<nav>` landmark instead of the default complementary `<aside>`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description: "Names the landmark (applied as `aria-label`) and renders an optional uppercase header.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "ariaLabel",
			type: "string",
			description: "An explicit accessible name; overrides `label` for the landmark without rendering a header.",
			bindings: ["svelte"],
		},
		{
			name: "hideHeader",
			type: "boolean",
			default: "false",
			description: "Drops the visible `label` header while keeping `label` as the dock's accessible name, for a bare nav or toc rail.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{
			name: "left",
			description: "Pinned to the left edge with a divider on its right, the default.",
			className: "xoji-dock",
			tokens: ["--border-thin", "--line"],
		},
		{
			name: "right",
			description: "Pinned to the right edge with the divider on its left.",
			className: "xoji-dock--right",
			tokens: ["--border-thin", "--line"],
		},
		{
			name: "edge-out",
			description: "Edge moved to the rail's outer side instead of the inner divider.",
			className: "xoji-dock--edge-out",
		},
		{
			name: "edge-bold",
			description: "A chunky accent spine instead of the default thin edge.",
			className: "xoji-dock--edge-bold",
			tokens: ["--space-1"],
		},
	],
	sizes: [
		{ name: "sm", description: "Narrow rail, 14rem.", className: "xoji-dock--sm" },
		{ name: "md", description: "Default rail, 18rem.", className: "xoji-dock", isDefault: true },
		{ name: "lg", description: "Wide rail, 22rem.", className: "xoji-dock--lg" },
	],
	states: [],
	slots: [
		{
			name: "default",
			description: "The rail's content: links, controls, or any panel markup.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "header",
			description: "Custom header content, overriding the text rendered from `label`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "footer",
			description: "Bottom-pinned content, separated by a hairline rule.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--text-body",
		"--text-xs",
		"--weight-semibold",
		"--leading-normal",
		"--leading-tight",
		"--fg-1",
		"--fg-2",
		"--bg-1",
		"--line",
		"--border-thin",
		"--border-thick",
		...FULL_TONES.map((t) => `--${t}`),
		"--space-0",
		"--space-1",
		"--space-2",
		"--space-3",
		"--space-4",
	],
	composition: [
		"Drop a Button stack or a list of anchors into the body for a navigation rail; set `nav` so the landmark is correct.",
		"Use the `footer` slot for a pinned account menu, theme switch, or status line.",
		"Pair two docks (left + right) around a main content column for an editor-style three-pane shell.",
	],
	a11y: [
		"Renders a native `<nav>` (when `nav` is set) or `<aside>` complementary landmark, so the rail is reachable via landmark navigation.",
		"`label` applies an `aria-label` to the landmark; with multiple docks on a page this keeps each one distinguishable to assistive technology.",
		"The binding warns at runtime when a dock has no `label`, `aria-label`, or `aria-labelledby`.",
		"The header text is visual; the accessible name comes from the landmark's `aria-label`, not the rendered heading.",
	],
	examples: [
		{
			id: "nav-and-inspector",
			title: "Navigation rail and inspector",
			description: "A left navigation `<nav>` and a right complementary inspector, each named for assistive tech.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
