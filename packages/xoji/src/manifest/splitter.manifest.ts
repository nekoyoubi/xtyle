import type { ComponentManifest } from "./types.js";

const htmlExample = `<div class="layout" style="display:grid;grid-template-columns:var(--rail,16rem) auto minmax(0,1fr);height:20rem">
	<aside class="panel">Rail</aside>
	<xoji-splitter var="--rail" value="256" min="160" max="480" step="8" label="Resize rail"></xoji-splitter>
	<main class="panel">Content</main>
</div>

<script>
	document.querySelector("xoji-splitter")
		.addEventListener("resize", (e) => console.log(e.detail.value));
</script>`;

const svelteExample = `<script lang="ts">
	import { Splitter } from "@xoji/svelte";
	let rail = $state(256);
</script>

<div style={\`display:grid;grid-template-columns:\${rail}px auto minmax(0,1fr);height:20rem\`}>
	<aside>Rail</aside>
	<Splitter value={rail} min={160} max={480} step={8}
		onresize={(e) => (rail = e.detail.value)} label="Resize rail" />
	<main>Content</main>
</div>`;

const astroExample = `---
import Splitter from "@xoji/astro/Splitter.astro";
---

<div style="display:grid;grid-template-columns:var(--rail,16rem) auto minmax(0,1fr);height:20rem">
	<aside>Rail</aside>
	<Splitter var="--rail" value={256} min={160} max={480} step={8} label="Resize rail" />
	<main>Content</main>
</div>`;

export const splitterManifest: ComponentManifest = {
	id: "splitter",
	name: "Splitter",
	category: "shell",
	summary: "A draggable divider that resizes an adjacent pane, with configurable bounds and steps.",
	description:
		"Splitter is the handle between two panes: drag it (or arrow it with the keyboard) and the neighboring pane grows or shrinks. It is a `role=\"separator\"` control, so it announces its current, minimum, and maximum size and takes the full keyboard. The size it manages is _data_ the consumer owns: the splitter clamps a `value` (in px) to `min`/`max`, snaps it to an integral `step`, writes it into a CSS custom property (`var`) on a target so a grid or flex track resizes declaratively, and fires `resize` (live, during the drag) and `resize-end` (on release) so the consumer can react or persist. `orientation` picks the axis (`vertical` resizes width, `horizontal` resizes height), and `reversed` flips the direction for a trailing-edge pane like a right rail. Its own chrome is derived: the grip and its focus ring read from the same tokens the rest of the UI does.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "splitter",
			description: "The separator handle: a fixed-size cell in the layout track that captures the drag.",
			selector: ".xoji-splitter",
			tokens: ["--space-3"],
		},
		{
			name: "grip",
			description: "The visible grab affordance, accent-tinted on hover and focus.",
			selector: ".xoji-splitter__grip",
			tokens: ["--line", "--accent", "--radius-sm", "--border-thick", "--space-6", "--duration-fast", "--ease-standard"],
		},
	],
	props: [
		{
			name: "value",
			type: "number",
			description: "The current size of the managed pane in px. Controlled: the consumer owns it and updates on `resize`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "orientation",
			type: "SplitterOrientation",
			default: "vertical",
			description: "The separator axis: `vertical` resizes width (a side rail), `horizontal` resizes height (a stacked pane).",
			bindings: ["html", "svelte", "astro"],
			options: ["vertical", "horizontal"],
		},
		{
			name: "size",
			type: "SplitterSize",
			default: "md",
			description: "The handle's own thickness and grip: `sm`, `md`, or `lg`. This is the divider's footprint, independent of the pane size it controls.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
		},
		{
			name: "line",
			type: "boolean",
			default: "false",
			description: "Paint a full-length divider line down the handle, so the splitter reads as a visible separator on its own instead of relying on the contrast between the panes it sits between.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "min",
			type: "number",
			default: "0",
			description: "The smallest the managed pane may shrink to, in px.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "max",
			type: "number",
			description: "The largest the managed pane may grow to, in px. Unbounded when omitted.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "step",
			type: "number",
			default: "1",
			description: "The integral increment the size snaps to; drag and arrow keys both quantize to it.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "default",
			type: "number",
			description: "The size a reset restores, by double-clicking the handle or the keyboard reset. Omit it and a reset still works, restoring the size the splitter first rendered with, matching Slider.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "reversed",
			type: "boolean",
			default: "false",
			description: "Flip the drag direction, for a pane on the trailing edge (a right or bottom rail) where dragging toward the center grows it.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "var",
			type: "string",
			default: "--xoji-splitter-size",
			description: "The CSS custom property the splitter writes the size into, so a grid or flex track can read it. Set on the target.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "for",
			type: "string",
			description: "The id of the element the `var` is set on. Defaults to the splitter's parent, so a splitter inside the layout container just works.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Lock the size. The handle stops responding to drag and keys and dims.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [
		{ name: "sm", description: "A slim divider for dense layouts.", className: "xoji-splitter--sm" },
		{ name: "md", description: "The default divider footprint.", className: "xoji-splitter", isDefault: true },
		{ name: "lg", description: "A wide divider that's easy to grab.", className: "xoji-splitter--lg" },
	],
	states: [
		{
			name: "keyboard-focus",
			description:
				"The handle focused by keyboard: a ring picks it out and the grip tints to accent. The ring is armed only on genuine keyboard entry (Tab or a key press), so the scripted focus a drag takes never rings.",
			selector: ".xoji-splitter[data-focus-ring]",
			tokens: ["--border-normal", "--border-thick", "--ring", "--accent"],
		},
		{
			name: "disabled",
			description: "A locked splitter: the grip dims and the resize cursor drops.",
			selector: ".xoji-splitter--disabled",
		},
	],
	slots: [],
	consumedTokens: [
		"--space-2",
		"--space-3",
		"--space-5",
		"--space-6",
		"--space-8",
		"--line",
		"--radius-sm",
		"--border-thin",
		"--border-thick",
		"--duration-fast",
		"--ease-standard",
		"--accent",
		"--border-normal",
		"--ring",
	],
	composition: [
		"Place a splitter as a track between two panes in a `grid` or `flex` layout, sized by the `var` it writes.",
		"Give `AppShell` a `resizable` rail and it drops a splitter between the rail and main for you.",
		"Listen for `resize-end` to persist a chosen size; `resize` for a live preview.",
	],
	a11y: [
		"The handle is a `role=\"separator\"` with `aria-valuenow`/`aria-valuemin`/`aria-valuemax`, so assistive tech announces the size and its bounds.",
		"It is fully keyboard-operable: arrow keys step by `step`, PageUp/PageDown jump ten steps, Home and End go to the bounds.",
		"Double-clicking the handle resets the size to `default` (or the first-rendered size when `default` is omitted), the same gesture and fallback as Slider.",
		"Give it a `label` (or `labelledby`) so the separator is announced by what it resizes, not as an unnamed divider.",
	],
	examples: [
		{
			id: "resizable-rail",
			title: "A resizable rail",
			description: "A splitter between a side rail and the content, writing the rail width into a CSS variable the grid reads.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
