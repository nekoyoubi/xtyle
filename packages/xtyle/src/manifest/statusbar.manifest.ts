import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-statusbar label="Editor status">
	<span class="xtyle-statusbar__item xtyle-statusbar__item--strong" part="item">main.ts</span>
	<span class="xtyle-statusbar__item" part="item">UTF-8</span>
	<span class="xtyle-statusbar__item" part="item">Ln 42, Col 8</span>
	<span class="xtyle-statusbar__spacer" part="spacer"></span>
	<span class="xtyle-statusbar__item" part="item">Spaces: 2</span>
	<span class="xtyle-statusbar__item" part="item">TypeScript</span>
</xtyle-statusbar>

<xtyle-statusbar live label="Build status">
	<span class="xtyle-statusbar__item xtyle-statusbar__item--strong" part="item">Build passing</span>
	<span class="xtyle-statusbar__spacer" part="spacer"></span>
	<span class="xtyle-statusbar__item" part="item">12.4s</span>
</xtyle-statusbar>`;

const svelteExample = `<script lang="ts">
	import { Statusbar } from "@xtyle/svelte";
</script>

<Statusbar label="Editor status">
	<span class="xtyle-statusbar__item xtyle-statusbar__item--strong">main.ts</span>
	<span class="xtyle-statusbar__item">UTF-8</span>
	<span class="xtyle-statusbar__item">Ln 42, Col 8</span>
	<span class="xtyle-statusbar__spacer"></span>
	<span class="xtyle-statusbar__item">Spaces: 2</span>
	<span class="xtyle-statusbar__item">TypeScript</span>
</Statusbar>

<Statusbar live label="Build status">
	<span class="xtyle-statusbar__item xtyle-statusbar__item--strong">Build passing</span>
	<span class="xtyle-statusbar__spacer"></span>
	<span class="xtyle-statusbar__item">12.4s</span>
</Statusbar>`;

const astroExample = `---
import { Statusbar } from "@xtyle/astro";
---

<Statusbar label="Editor status">
	<span class="xtyle-statusbar__item xtyle-statusbar__item--strong">main.ts</span>
	<span class="xtyle-statusbar__item">UTF-8</span>
	<span class="xtyle-statusbar__item">Ln 42, Col 8</span>
	<span class="xtyle-statusbar__spacer"></span>
	<span class="xtyle-statusbar__item">Spaces: 2</span>
	<span class="xtyle-statusbar__item">TypeScript</span>
</Statusbar>

<Statusbar live label="Build status">
	<span class="xtyle-statusbar__item xtyle-statusbar__item--strong">Build passing</span>
	<span class="xtyle-statusbar__spacer"></span>
	<span class="xtyle-statusbar__item">12.4s</span>
</Statusbar>`;

export const statusbarManifest: ComponentManifest = {
	id: "statusbar",
	name: "Statusbar",
	category: "shell",
	summary: "The footer status strip: a compact, monospace row of status items separated by flexible spacers.",
	description:
		"Statusbar is the thin strip that lives along the bottom of an app shell, reporting ambient state: cursor position, encoding, branch, sync status, build result. It is a flex row of `item` parts you space apart with one or more `spacer` parts that absorb the slack, so groups push to the left and right edges. The default treatment is small monospace ink at low contrast; an `item--strong` modifier lifts a single item to full-contrast foreground for the one fact that matters most. A `live` flag turns the bar into an `aria-live` region so screen readers announce status changes as they happen; ideal for build, sync, or save indicators that update in place. Under `overflow=\"collapse\"` it measures the row with a `ResizeObserver`, ranks items by `data-priority` (a `data-required` item never drops), and folds the lowest-priority ones into a `+N` popover until the row fits; by default it clones the dropped items into a shadow popover, which is right for plain text/token cells, though a clone can't carry light-DOM styles or event handlers, so set `manual-overflow` for styled/interactive cells. Whenever the dropped set changes, collapse fires an `overflow-change` `CustomEvent` (`bubbles`, `composed`, deduped against the last emit) whose `detail` carries the actual slotted light-DOM cell elements (`{ hidden: HTMLElement[]; visible: HTMLElement[] }`) so a consumer knows exactly which of its own cells dropped and can render them itself with their original styles and handlers intact.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "statusbar",
			description: "The footer strip, a flex row carrying the monospace status items.",
			selector: ".xtyle-statusbar",
			tokens: [
				"--space-4",
				"--space-1",
				"--space-6",
				"--bg-1",
				"--border-thin",
				"--line",
				"--font-mono",
				"--text-xs",
				"--fg-2",
			],
		},
		{
			name: "item",
			description: "A single status entry: an inline group of label text and any inline graphic.",
			selector: ".xtyle-statusbar__item",
			tokens: ["--space-1"],
		},
		{
			name: "spacer",
			description: "A flexible gap that absorbs free space, pushing items to opposite edges.",
			selector: ".xtyle-statusbar__spacer",
			tokens: ["--space-2"],
		},
		{
			name: "overflow",
			description:
				"The `+N` affordance and its popover, present only under `overflow=\"collapse\"`. The trigger is a compact button; the popover escapes the bar's clip via the top layer and lists the dropped items.",
			selector: ".xtyle-statusbar__overflow",
			tokens: [
				"--space-1",
				"--space-2",
				"--space-8",
				"--bg-2",
				"--fg-0",
				"--fg-1",
				"--fg-2",
				"--font-mono",
				"--text-xs",
				"--border-thin",
				"--radius-sm",
				"--radius-md",
				"--surface-overlay",
				"--surface-overlay-border",
				"--elevation-3",
			],
		},
	],
	props: [
		{
			name: "live",
			type: "boolean",
			default: "false",
			description:
				"Marks the bar as a polite live region (`role=\"status\"`, `aria-live=\"polite\"`) so status changes are announced.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description: "An accessible name for the bar (`aria-label`), useful when the strip is a live region.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "overflow",
			type: '"clip" | "wrap" | "scroll" | "collapse"',
			default: "clip",
			description:
				"How the bar handles content wider than its width. `clip` (default) hides the overflow; `wrap` lets items flow onto multiple lines; `scroll` gives the bar a horizontal scrollbar; `collapse` ranks items and folds the lowest-priority ones into a `+N` popover until the row fits. `collapse` is JS-driven (a `ResizeObserver` measures the fit) and needs the live `html` or `svelte` element; the static `astro` binding has no element to upgrade, so it falls back to `scroll` there to keep every cell reachable.",
			bindings: ["html", "svelte", "astro"],
			options: ["clip", "wrap", "scroll", "collapse"],
		},
		{
			name: "separated",
			type: "boolean",
			default: "false",
			description:
				"Draws a thin divider between adjacent items at the bar's own spacing, so each cell stays an individual item (and `collapse` counts and drops them independently) instead of carrying its own `Separator`. The leading divider is suppressed at the start of each run (the first item and any item after a `spacer`) and stays correct as items collapse.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "data-priority",
			type: "number (per-item attribute)",
			default: "0",
			description:
				"Set on an individual item (not the bar). Under `overflow=\"collapse\"`, items drop lowest-priority-first when the row can't fit; higher values are kept longer. Ties drop right-to-left so leading items survive. Ignored by every other overflow mode.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "data-required",
			type: "boolean (per-item attribute)",
			default: "false",
			description:
				"Set on an individual item. Under `overflow=\"collapse\"`, a required item is never dropped into the `+N` popover regardless of width. Ignored by every other overflow mode.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "manual-overflow",
			type: "boolean",
			default: "false",
			description:
				"Inverts ownership of the overflow contents under `overflow=\"collapse\"`. Off (default), the element renders its own `+N` trigger and a shadow popover, cloning the dropped items into it; this is clean for plain text/token cells, but a clone drops light-DOM (framework-scoped) styles and event handlers, so styled/interactive cells degrade. On, the element still measures, ranks, and hides the lowest-priority cells (`display:none` + a `data-xtyle-collapsed` marker) but renders neither the `+N` trigger nor the shadow popover. Instead it fires `overflow-change` so the consumer renders its own light-DOM popover from its original, styled, wired cells. Either way the element fires `overflow-change`; only manual mode suppresses the built-in affordance. Bindings: live on `html`/`svelte`; the static `astro` binding has no element to drive, so the prop is accepted for parity but inert (collapse already falls back to `scroll` there).",
			bindings: ["html", "svelte"],
		},
	],
	variants: [
		{
			name: "item-strong",
			description: "Lifts a single item to full-contrast foreground and medium weight for emphasis.",
			className: "xtyle-statusbar__item--strong",
			tokens: ["--fg-0", "--weight-medium"],
		},
	],
	sizes: [],
	states: [
		{
			name: "item-focus-visible",
			description:
				"Keyboard focus on an interactive item: a token-colored ring, plus a transparent outline that becomes real in forced-colors mode.",
			selector: ".xtyle-statusbar__item:focus-visible",
			tokens: ["--border-normal", "--border-thick", "--ring", "--radius-sm"],
		},
	],
	slots: [
		{
			name: "default",
			description: "The status items and spacers, in order.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--space-1",
		"--space-2",
		"--space-4",
		"--space-6",
		"--space-8",
		"--bg-1",
		"--bg-2",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--line",
		"--font-mono",
		"--text-xs",
		"--weight-medium",
		"--border-thin",
		"--border-normal",
		"--border-thick",
		"--radius-sm",
		"--radius-md",
		"--elevation-3",
		"--surface-overlay",
		"--surface-overlay-border",
		"--ring",
	],
	composition: [
		"Sits at the bottom of AppShell as the footer strip, mirroring Toolbar at the top.",
		"Drop a Badge or inline SVG inside an `item` for sync, branch, or status glyphs.",
		"Use multiple `spacer` parts to split the bar into left / center / right groups.",
		"For styled or interactive cells, set `manual-overflow` and listen for `overflow-change`: the element ranks and hides the dropped cells, your code reads `detail.hidden` (the originals, styles and handlers intact) and renders them into your own `+N` popover.",
	],
	a11y: [
		"Renders a native `<footer>` so it is exposed as a content landmark.",
		"`live` makes the strip a polite `aria-live` region (`role=\"status\"`) so in-place status updates are announced without stealing focus.",
		"`label` supplies an `aria-label` to name the region when its purpose is not obvious from context.",
		"Focusable items receive a token ring and a transparent outline that the forced-colors base rule promotes to a real system outline.",
		"State belongs in the item text, not in color alone; the strong modifier adds weight as well as contrast.",
	],
	examples: [
		{
			id: "items-and-spacer",
			title: "Items, spacers, and a live region",
			description: "A status row split by a spacer, plus a live-updating build bar.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
