import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-toolbar heading="Project Atlas" landmark>
	<svg slot="start" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
		<path fill="currentColor" d="M3 5h18v2H3V5Zm0 6h18v2H3v-2Zm0 6h18v2H3v-2Z" />
	</svg>
	<span slot="end">
		<xtyle-button variant="ghost" tone="neutral">Settings</xtyle-button>
		<xtyle-button variant="solid" tone="accent">Publish</xtyle-button>
	</span>
</xtyle-toolbar>

<xtyle-toolbar heading="Docs" href="/" size="sm" bare>
	<nav slot="center">
		<xtyle-button variant="link" tone="neutral" href="/guide">Guide</xtyle-button>
		<xtyle-button variant="link" tone="neutral" href="/api">API</xtyle-button>
	</nav>
</xtyle-toolbar>`;

const svelteExample = `<script lang="ts">
	import { Toolbar, Button } from "@xtyle/svelte";
</script>

<Toolbar heading="Project Atlas" landmark>
	{#snippet start()}
		<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
			<path fill="currentColor" d="M3 5h18v2H3V5Zm0 6h18v2H3v-2Zm0 6h18v2H3v-2Z" />
		</svg>
	{/snippet}
	{#snippet end()}
		<Button variant="ghost" tone="neutral">Settings</Button>
		<Button variant="solid" tone="accent">Publish</Button>
	{/snippet}
</Toolbar>

<Toolbar heading="Docs" href="/" size="sm" bare>
	{#snippet center()}
		<Button variant="link" tone="neutral" href="/guide">Guide</Button>
		<Button variant="link" tone="neutral" href="/api">API</Button>
	{/snippet}
</Toolbar>`;

const astroExample = `---
import { Toolbar, Button } from "@xtyle/astro";
---

<Toolbar heading="Project Atlas" landmark>
	<svg slot="start" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
		<path fill="currentColor" d="M3 5h18v2H3V5Zm0 6h18v2H3v-2Zm0 6h18v2H3v-2Z" />
	</svg>
	<Fragment slot="end">
		<Button variant="ghost" tone="neutral">Settings</Button>
		<Button variant="solid" tone="accent">Publish</Button>
	</Fragment>
</Toolbar>

<Toolbar heading="Docs" href="/" size="sm" bare>
	<nav slot="center">
		<Button variant="link" tone="neutral" href="/guide">Guide</Button>
		<Button variant="link" tone="neutral" href="/api">API</Button>
	</nav>
</Toolbar>`;

export const toolbarManifest: ComponentManifest = {
	id: "toolbar",
	name: "Toolbar",
	category: "shell",
	summary: "The header bar: a title plus structured start, center, and end regions for actions and navigation.",
	description:
		"Toolbar is the chrome bar that runs across the top of an app, a page, or a panel. It carries an optional `heading` (a plain title, or a link when given an `href`) and three layout regions (start, center, and end) that flex apart so leading controls sit left, primary content centers, and trailing actions push right. It adds layout, not semantics: by default it renders a neutral `<div>` with no landmark role, and opts into a page-banner `<header>` only when you ask for it with `landmark`, since whether a given bar is *the* page banner is the consumer's call. A `bare` mode drops the surface fill and divider for nesting inside another container, `sticky` pins it to the top of its scroll area, and the size scale tightens or loosens its padding.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "toolbar",
			description: "The bar element carrying the size, sticky, and bare classes; a `<div>` by default, a `<header>` landmark when opted in.",
			selector: ".xtyle-toolbar",
			tokens: [
				"--font-sans",
				"--fg-1",
				"--bg-1",
				"--border-thin",
				"--line",
				"--space-2",
				"--space-3",
				"--space-4",
				"--space-8",
			],
		},
		{
			name: "title",
			description: "The heading text; a `<span>`, or a focusable `<a>` when an `href` is set.",
			selector: ".xtyle-toolbar__title",
			tokens: ["--font-display", "--weight-bold", "--text-lg", "--leading-tight", "--fg-0", "--link-hover"],
		},
		{
			name: "group",
			description: "One of the three flex regions (start / center / end) that hold the bar's controls.",
			selector: ".xtyle-toolbar__group",
			tokens: ["--space-2"],
		},
		{
			name: "spacer",
			description: "A flexible gap that pushes the content on either side of it apart.",
			selector: ".xtyle-toolbar__spacer",
		},
	],
	props: [
		{
			name: "heading",
			type: "string",
			description: "The bar's title. Rendered as a link when `href` is also set.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "href",
			type: "string",
			description: "When set alongside `heading`, the title renders as a focusable `<a>` (typically the home link).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "size",
			type: "Size",
			default: "md",
			description: "Bar density: tightens or loosens padding, gap, and minimum height.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
		},
		{
			name: "landmark",
			type: "boolean",
			default: "false",
			description: "Renders the bar as a `<header>` banner landmark instead of a plain `<div>`. Opt in only when this is *the* page header.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "sticky",
			type: "boolean",
			default: "false",
			description: "Pins the bar to the top of its scroll container.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "bare",
			type: "boolean",
			default: "false",
			description: "Drops the surface fill and bottom divider, for nesting inside another surface.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{
			name: "bare",
			description: "Transparent background with no divider. Chrome for nesting, not for standing alone.",
			className: "xtyle-toolbar--bare",
		},
		{
			name: "sticky",
			description: "Pinned to the top of its scroll area at an elevated stacking layer.",
			className: "xtyle-toolbar--sticky",
			tokens: ["--elevation-3"],
		},
	],
	sizes: [
		{ name: "sm", description: "Tight, compact density.", className: "xtyle-toolbar--sm" },
		{ name: "md", description: "Default.", className: "xtyle-toolbar", isDefault: true },
		{ name: "lg", description: "Roomy, generous padding.", className: "xtyle-toolbar--lg" },
	],
	states: [
		{
			name: "title-hover",
			description: "Pointer over a linked title. The title shifts to the link-hover ink.",
			selector: "a.xtyle-toolbar__title:hover",
			tokens: ["--link-hover"],
		},
		{
			name: "title-focus-visible",
			description: "Keyboard focus on a linked title. A token ring plus a transparent outline that becomes real in forced-colors mode.",
			selector: "a.xtyle-toolbar__title:focus-visible",
			tokens: ["--border-normal", "--border-thick", "--ring", "--radius-sm"],
		},
	],
	slots: [
		{
			name: "start",
			description: "Leading region: typically a menu trigger, logo, or back button.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "center",
			description: "Centered region: typically navigation, search, or a breadcrumb.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "end",
			description: "Trailing region: typically primary actions, pushed to the far edge.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "default",
			description: "Unstructured content placed between the heading and the center region, for bars that don't need the three named regions.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--font-display",
		"--text-lg",
		"--weight-bold",
		"--leading-tight",
		"--fg-0",
		"--fg-1",
		"--bg-1",
		"--line",
		"--border-thin",
		"--border-normal",
		"--border-thick",
		"--radius-sm",
		"--ring",
		"--link-hover",
		"--elevation-3",
		"--space-1",
		"--space-2",
		"--space-3",
		"--space-4",
		"--space-5",
		"--space-7",
		"--space-8",
	],
	composition: [
		"Fill the regions with Button (ghost/link variants read best as bar actions) and Badge for status pips.",
		"Pair a `landmark` Toolbar with the app's main content region so assistive tech gets a banner/main split.",
		"Drop `bare` Toolbars inside a Panel or Card header to reuse the region layout without the standalone chrome.",
	],
	a11y: [
		"Defaults to a plain `<div>` with no landmark role; opts into a `<header>` banner only via `landmark`, so the page never ends up with competing banners.",
		"Avoids the ARIA `toolbar` role. That role implies roving-tabindex keyboard semantics this presentational bar does not manage; its controls keep their own native focus order.",
		"A linked title is a real `<a>`, so it is keyboard-focusable and shows the token focus ring plus the forced-colors outline promotion.",
		"Decorative leading graphics passed to the start region should be marked `aria-hidden`; the accessible name comes from the heading or the controls themselves.",
	],
	examples: [
		{
			id: "app-and-docs-bars",
			title: "App banner and docs bar",
			description: "A landmark app header with leading icon and trailing actions, and a bare linked-title docs bar with centered nav.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
