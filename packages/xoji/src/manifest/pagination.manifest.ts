import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

const htmlExample = `<!-- link mode: each page is a real anchor, zero JS needed -->
<xoji-pagination page="3" total="20" href="/blog?page={page}"></xoji-pagination>

<!-- button mode: listen for page-change -->
<xoji-pagination page="3" total="20" tone="neutral"></xoji-pagination>

<script>
	document.querySelector("xoji-pagination:not([href])")
		.addEventListener("page-change", (e) => console.log(e.detail.page));
</script>`;

const svelteExample = `<script lang="ts">
	import { Pagination } from "@xoji/svelte";
	let page = $state(3);
</script>

<Pagination {page} total={20} onpagechange={(e) => (page = e.detail.page)} />`;

const astroExample = `---
import Pagination from "@xoji/astro/Pagination.astro";
const page = Number(Astro.url.searchParams.get("page") ?? 1);
---

<Pagination page={page} total={20} href="/blog?page={page}" />`;

export const paginationManifest: ComponentManifest = {
	id: "pagination",
	name: "Pagination",
	category: "navigation",
	summary: "A page navigator: previous/next controls around a windowed list of page numbers with ellipses.",
	description:
		'Pagination walks a reader through a paged collection. It is a `<nav>` landmark wrapping previous and next controls and an ordered list of page numbers; the current page is marked `aria-current="page"`, and a sibling window around it keeps the control compact, collapsing the gaps to an ellipsis when there are more pages than fit. The visible range is computed from `page` and `total` plus two knobs: `siblings` (links on each side of the current page) and `boundaries` (links pinned at each end). Give it an `href` template containing `{page}` and every page renders as a real link, so the control navigates with zero JavaScript and works on the static Astro path; omit the template and the pages render as buttons that emit a `page-change` event carrying the chosen page. A `tone` colors the current-page pill and three `size`s scale the type.',
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "pagination",
			description: "The `<nav>` landmark laying the controls and page list out in a wrapping row.",
			selector: ".xoji-pagination",
			tokens: ["--font-sans", "--text-sm", "--leading-normal", "--fg-2", "--space-1"],
		},
		{
			name: "page",
			description: "A page number, a link (href mode) or button, with a hover wash and a focus ring.",
			selector: ".xoji-pagination__page",
			tokens: ["--fg-1", "--bg-2", "--radius-sm", "--space-0", "--space-1"],
		},
		{
			name: "current",
			description: "The current page: a filled pill in the tone color, carrying `aria-current`. When the theme's `--selection-cue` resolves to `marker` (a high-contrast or redundant-cues algorithm), a non-color underline bar is added so the current page never rests on color alone.",
			selector: ".xoji-pagination__page--current",
			tokens: ["--accent", "--accent-fg", "--selection-cue", "--weight-medium"],
		},
		{
			name: "control",
			description: "The previous / next arrows; dimmed and inert at the ends of the range.",
			selector: ".xoji-pagination__control",
			tokens: ["--fg-1", "--fg-3", "--bg-2"],
		},
		{
			name: "ellipsis",
			description: "The collapsed-gap marker between distant pages, hidden from assistive tech.",
			selector: ".xoji-pagination__ellipsis",
			tokens: ["--fg-3"],
		},
	],
	props: [
		{
			name: "page",
			type: "number",
			default: "1",
			description: "The current page, 1-based. Clamped into `[1, total]`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "total",
			type: "number",
			default: "1",
			description: "The total number of pages.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "siblings",
			type: "number",
			default: "1",
			description: "How many page links to show on each side of the current page.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "boundaries",
			type: "number",
			default: "1",
			description: "How many page links to pin at each end of the range.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "href",
			type: "string",
			description:
				"A URL template with a `{page}` placeholder. When set, every page is a real link (zero-JS navigation); when omitted, pages are buttons that emit `page-change`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "tone",
			type: "FullTone",
			default: "accent",
			description:
				"Color of the current-page pill, any of the 21 tones: the six semantic roles, `accent-2/3/4`, or the twelve named hues.",
			bindings: ["html", "svelte", "astro"],
			options: [...FULL_TONES],
		},
		{
			name: "size",
			type: "Size",
			default: "md",
			description: "Type scale of the control.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
		},
		{
			name: "label",
			type: "string",
			default: "Pagination",
			description: "The accessible name of the `<nav>` landmark.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{
			name: "accent",
			description: "Current-page pill in the accent tone (the default).",
			className: "xoji-pagination--accent",
			tokens: ["--accent", "--accent-fg"],
		},
		{
			name: "neutral",
			description: "Current-page pill in neutral ink for a quieter control.",
			className: "xoji-pagination--neutral",
			tokens: ["--neutral", "--neutral-fg"],
		},
	],
	sizes: [
		{ name: "sm", description: "Compact.", className: "xoji-pagination--sm" },
		{ name: "md", description: "Default.", className: "xoji-pagination", isDefault: true },
		{ name: "lg", description: "Large.", className: "xoji-pagination--lg" },
	],
	states: [
		{
			name: "hover",
			description: "Pointer over a page or control; a soft wash fills behind it.",
			selector: ".xoji-pagination__page:hover",
			tokens: ["--bg-2"],
		},
		{
			name: "focus-visible",
			description: "Keyboard focus: a token-colored ring, plus a transparent outline promoted to a real one in forced-colors mode.",
			selector: ".xoji-pagination__page:focus-visible",
			tokens: ["--border-normal", "--border-thick", "--ring"],
		},
		{
			name: "current",
			description: "The active page: a filled tone pill, no hover, `aria-current`.",
			selector: ".xoji-pagination__page--current",
			tokens: ["--accent", "--accent-fg"],
		},
		{
			name: "disabled",
			description: "A previous/next control at the end of the range: dimmed and non-interactive.",
			selector: '.xoji-pagination__control[aria-disabled="true"]',
			tokens: ["--fg-3"],
		},
	],
	slots: [],
	consumedTokens: [
		"--bg-2",
		"--border-normal",
		"--border-thick",
		"--border-thin",
		"--duration-fast",
		"--ease-standard",
		"--fg-1",
		"--fg-2",
		"--fg-3",
		"--font-sans",
		"--leading-normal",
		"--radius-sm",
		"--ring",
		"--selection-cue",
		"--space-0",
		"--space-1",
		"--text-body",
		"--text-sm",
		"--text-xs",
		"--weight-medium",
		...FULL_TONES.flatMap((t) => [`--${t}`, `--${t}-fg`]),
	],
	composition: [
		"Pair below a Table or a card grid to page through a long collection.",
		"Use `href` for content routes (blog, search results) so the pages are crawlable links; use button mode with `page-change` for in-app state.",
		"Drop `siblings`/`boundaries` to `0`/`1` for the most compact control, or raise `siblings` when there's room for a wider window.",
	],
	a11y: [
		'Renders a `<nav>` landmark with an accessible name (`aria-label`, default "Pagination") so screen readers can find and announce the pager.',
		'The current page carries `aria-current="page"` and is not actionable; it is the destination, not a target.',
		"Each page and control has an explicit accessible name (`Go to page N`, `Previous page`, `Next page`), so the digit or arrow glyph is never read bare.",
		'Previous/next at the ends of the range are marked `aria-disabled="true"` and made non-interactive rather than removed, so their position stays stable.',
		"The ellipsis is decorative and `aria-hidden`, never announced between pages.",
		"In button mode the pages are real `<button>`s, keyboard-operable and focusable for free; the chosen page rides a `page-change` event.",
	],
	examples: [
		{
			id: "link-and-button",
			title: "Link and button modes",
			description:
				"An `href` template makes each page a zero-JS link; without it the pages are buttons that emit `page-change`.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
