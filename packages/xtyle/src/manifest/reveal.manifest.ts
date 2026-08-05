import type { ComponentManifest } from "./types.js";

const htmlExample = `<!-- One direction: slide the lid aside to read what's under it -->
<xtyle-reveal>
	<article>Ada Lovelace &middot; Analytical Engine notes</article>
	<div slot="end">First published 1843</div>
</xtyle-reveal>

<!-- Two directions with different bellies, and a swipe that acts rather than opens -->
<xtyle-reveal latch-at="40%" end-behavior="commit" end-commit-at="0.7">
	<article>Weekly digest</article>
	<div slot="start">12 unread &middot; 3 flagged</div>
	<div slot="end"><button type="button">Archive</button></div>
</xtyle-reveal>

<!-- A grouped stack: sliding one closes whichever was open -->
<xtyle-reveal-group label="Products">
	<xtyle-reveal name="products">
		<article>Kettle</article>
		<div slot="bottom">£49 &middot; in stock</div>
	</xtyle-reveal>
	<xtyle-reveal name="products">
		<article>Cafetière</article>
		<div slot="bottom">£22 &middot; in stock</div>
	</xtyle-reveal>
</xtyle-reveal-group>`;

const svelteExample = `<script lang="ts">
	import { Reveal, RevealGroup } from "@xtyle/svelte";

	const products = [
		{ name: "Kettle", price: "£49" },
		{ name: "Cafetière", price: "£22" },
	];
</script>

<Reveal latchAt="40%" endBehavior="commit" endCommitAt="0.7" onreveal={(d) => console.log(d.direction)}>
	<article>Weekly digest</article>
	<div slot="start">12 unread · 3 flagged</div>
	<div slot="end"><button type="button">Archive</button></div>
</Reveal>

<!-- grouped: sliding one closes whichever was open -->
<RevealGroup label="Products">
	{#each products as product}
		<Reveal name="products">
			<article>{product.name}</article>
			<div slot="bottom">{product.price} · in stock</div>
		</Reveal>
	{/each}
</RevealGroup>`;

const astroExample = `---
import Reveal from "@xtyle/astro/Reveal.astro";
import RevealGroup from "@xtyle/astro/RevealGroup.astro";

const products = [
	{ name: "Kettle", price: "£49" },
	{ name: "Cafetière", price: "£22" },
];
---

<Reveal latchAt="40%" endBehavior="commit" endCommitAt="0.7">
	<article>Weekly digest</article>
	<div slot="start">12 unread · 3 flagged</div>
	<div slot="end"><button type="button">Archive</button></div>
</Reveal>

<!-- grouped: sliding one closes whichever was open -->
<RevealGroup label="Products">
	{products.map((product) => (
		<Reveal name="products">
			<article>{product.name}</article>
			<div slot="bottom">{product.price} · in stock</div>
		</Reveal>
	))}
</RevealGroup>`;

export const revealManifest: ComponentManifest = {
	id: "reveal",
	name: "Reveal",
	since: "0.11.0",
	category: "layout",
	keywords: ["swipe", "slide", "belly", "backdrop", "disclosure", "swipe actions", "drawer", "peek"],
	seeAlso: ["accordion", "sheet", "dock-zone", "splitter"],
	summary: "A lid that slides aside to expose a belly of detail or actions underneath.",
	description:
		"Reveal layers a **lid** over as many as four **bellies**, one per direction, and slides the lid to expose whichever the gesture asks for. Which directions are live is inferred from the bellies you fill: a `[slot=\"end\"]` makes the end direction live and nothing else does, so there is no second list of directions to keep in sync. Travel is locked to one axis per gesture, so a component offering `start` and `bottom` still only ever moves one way at a time. Every knob is a host attribute, so the same markup configures identically from HTML, Svelte, and Astro; `behavior` sets the default and `endBehavior` and friends override one direction. Each direction decides what its own slide means: `latch` opens and stays, `commit` fires an action and springs back, and `both` gives the short pull a latch and the full pull the action. Give several reveals a shared `name` and they behave like radios, where opening one closes the last; leave the name off and they behave like checkboxes, each independent. A concealed belly is `inert`, so its buttons never sit in the tab order waiting to be tabbed into by accident.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "lid",
			description: "The lid: the sliding surface holding the default slot's content. Focusable, and the target of the drag.",
			selector: ".xtyle-reveal__lid",
		},
		{
			name: "belly",
			description: "What sits under the lid in one direction, revealed as the lid slides off it.",
			selector: ".xtyle-reveal__belly",
		},
		{
			name: "grip",
			description: "The edge affordance for a direction, giving a pointer-free way to open that belly.",
			selector: ".xtyle-reveal__grip",
		},
	],
	props: [
		{
			name: "name",
			type: "string",
			description:
				"Groups this reveal with others sharing the name, so opening one closes the last, the way radios share a choice. Omit it and the reveal is independent. The name is scoped to the nearest `<xtyle-reveal-group>`, falling back to the document, so two unrelated lists can reuse a name without cross-talk.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "open",
			type: "\"start\" | \"end\" | \"top\" | \"bottom\"",
			description: "Which direction's belly is currently exposed. Set it to open one outright; absent means closed.",
			bindings: ["html", "svelte", "astro"],
			options: ["start", "end", "top", "bottom"],
		},
		{
			name: "behavior",
			type: "\"latch\" | \"commit\" | \"both\"",
			default: "latch",
			description:
				"What letting go of a slide means, for every direction unless one overrides it. `latch` opens and stays open, `commit` fires the belly's action and springs back, and `both` gives a short pull the latch and a full pull the action.",
			bindings: ["html", "svelte", "astro"],
			options: ["latch", "commit", "both"],
		},
		{
			name: "shape",
			type: "string",
			description:
				"A silhouette to build the box from. Takes a registered name (`parallelogram`, `chevron`, `ticket`, `heart`) or any `clip-path` value outright, so a caller can hand over a shape the library has never heard of: `shape=\"polygon(0 0, 100% 20%, 100% 100%, 0 80%)\"`. Register more names with `registerRevealShapes()`, last-wins on the name, the way the effect library takes verbs. Percentages scale with the box; absolute units do not. Set `contained` to hold the sliding lid inside the box's bounds instead of letting it travel clear.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "bleed",
			type: "boolean",
			default: "false",
			description:
				"Lets the lid's content reach the lid's edges instead of stepping aside for the grips, so a grip glyph floats over the content rather than pushing it inward. For a lid carrying artwork (an illustration, an inline `<svg>`, a photo) the picture should run to the edge; for a lid carrying text it should not, which is why the inset is the default. It drops the inset and nothing else: sizing the artwork stays the author's, since forcing a height onto content with its own aspect ratio blows the box open.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "contained",
			type: "boolean",
			default: "false",
			description:
				"Holds a shaped box's lid inside the box's bounds as it slides, cutting it off at the edge rather than letting it travel clear. Off by default, so a shaped box behaves like a sliding-top box: belly and lid are the same silhouette and the lid moves as one whole shape. Only meaningful alongside `shape`; an unshaped box always contains its lid.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "tone",
			type: "FullTone",
			description:
				"Paints every belly from one tone's token family (its fill from `--{tone}-bg`, its text from `--{tone}-text`, and a frame from `--{tone}`), so a belly reads as accept or decline at a glance. Any tone in the roster works: the semantic roles, the accent-ramp variants, and the named hues.",
			bindings: ["html", "svelte", "astro"],
			options: ["accent", "neutral", "danger", "success", "warn", "info"],
		},
		{
			name: "flickVelocity",
			type: "number",
			default: "0.4",
			description:
				"Pixels per millisecond above which a short fast flick latches regardless of how far it travelled, so a quick decisive swipe counts as intent the way a slow deliberate drag does.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "travel",
			type: "number | string",
			default: "0.7",
			description:
				"How far the lid slides when it opens, as a fraction of the box along that axis. The default leaves the lid holding onto the box rather than sliding off it entirely; `1` lets it come clear, and a smaller value suits a row that only needs to show an action. Overridable per direction.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "gripStyle",
			type: "\"glyph\" | \"bar\" | \"dots\" | \"none\"",
			default: "glyph",
			description:
				"What each grip draws. `glyph` is the roster icon, which says what the edge does; `bar` and `dots` are quiet marks for a lid carrying artwork, where an icon reads as clutter; `none` draws no grip at all, leaving the drag and the arrow keys as the way in. Overridable per direction.",
			bindings: ["html", "svelte", "astro"],
			options: ["glyph", "bar", "dots", "none"],
		},
		{
			name: "gripSize",
			type: "string",
			default: "var(--space-5)",
			description: "The size of the glyph in each grip. A bare bar can be tiny; an icon you must read before answering a call cannot.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "gripPad",
			type: "string",
			default: "var(--space-3)",
			description: "The breathing room around each grip glyph, which together with `gripSize` sets the grip's hit area.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "latchAt",
			type: "number | string",
			default: "0.4",
			description:
				"How far the lid must travel, as a fraction of the belly's own measured size, before letting go latches it open. Accepts a fraction (`0.4`) or a percentage (`40%`). A belly can override it for its own direction.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "commitAt",
			type: "number | string",
			default: "0.85",
			description:
				"How far the lid must travel before letting go fires the belly's action instead of latching. Only consulted for a `commit` or `both` belly. Same fraction-or-percentage shape as `latchAt`, and overridable per belly.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "lockThreshold",
			type: "number",
			default: "8",
			description:
				"Pixels of travel before the gesture commits to an axis. Until then nothing moves, so a near-vertical drag on a horizontal reveal scrolls the page instead of fighting it.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Locks the lid in place and hides the bellies.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description: "Accessible name for the lid, which is announced as a group carrying its expanded state.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "startTone",
			type: "FullTone",
			description: "Overrides `tone` for the start belly alone, which is how one box declines in red and accepts in green.",
			bindings: ["html", "svelte", "astro"],
			options: ["accent", "neutral", "danger", "success", "warn", "info"],
		},
		{
			name: "startGrip",
			type: "string",
			description: "The roster glyph drawn in the start grip, so each edge says what it does. Any name the icon roster can draw, including one a mod contributed through the `xtyle.icons` slot.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "endTone",
			type: "FullTone",
			description: "Overrides `tone` for the end belly alone, which is how one box declines in red and accepts in green.",
			bindings: ["html", "svelte", "astro"],
			options: ["accent", "neutral", "danger", "success", "warn", "info"],
		},
		{
			name: "endGrip",
			type: "string",
			description: "The roster glyph drawn in the end grip, so each edge says what it does. Any name the icon roster can draw, including one a mod contributed through the `xtyle.icons` slot.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "topTone",
			type: "FullTone",
			description: "Overrides `tone` for the top belly alone, which is how one box declines in red and accepts in green.",
			bindings: ["html", "svelte", "astro"],
			options: ["accent", "neutral", "danger", "success", "warn", "info"],
		},
		{
			name: "topGrip",
			type: "string",
			description: "The roster glyph drawn in the top grip, so each edge says what it does. Any name the icon roster can draw, including one a mod contributed through the `xtyle.icons` slot.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "bottomTone",
			type: "FullTone",
			description: "Overrides `tone` for the bottom belly alone, which is how one box declines in red and accepts in green.",
			bindings: ["html", "svelte", "astro"],
			options: ["accent", "neutral", "danger", "success", "warn", "info"],
		},
		{
			name: "bottomGrip",
			type: "string",
			description: "The roster glyph drawn in the bottom grip, so each edge says what it does. Any name the icon roster can draw, including one a mod contributed through the `xtyle.icons` slot.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "startTravel",
			type: "number | string",
			description: "Overrides `travel` for the start direction alone.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "endTravel",
			type: "number | string",
			description: "Overrides `travel` for the end direction alone.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "topTravel",
			type: "number | string",
			description: "Overrides `travel` for the top direction alone.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "bottomTravel",
			type: "number | string",
			description: "Overrides `travel` for the bottom direction alone.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "startGripStyle",
			type: "\"glyph\" | \"bar\" | \"dots\" | \"none\"",
			description: "Overrides `gripStyle` for the start direction alone.",
			bindings: ["html", "svelte", "astro"],
			options: ["glyph", "bar", "dots", "none"],
		},
		{
			name: "endGripStyle",
			type: "\"glyph\" | \"bar\" | \"dots\" | \"none\"",
			description: "Overrides `gripStyle` for the end direction alone.",
			bindings: ["html", "svelte", "astro"],
			options: ["glyph", "bar", "dots", "none"],
		},
		{
			name: "topGripStyle",
			type: "\"glyph\" | \"bar\" | \"dots\" | \"none\"",
			description: "Overrides `gripStyle` for the top direction alone.",
			bindings: ["html", "svelte", "astro"],
			options: ["glyph", "bar", "dots", "none"],
		},
		{
			name: "bottomGripStyle",
			type: "\"glyph\" | \"bar\" | \"dots\" | \"none\"",
			description: "Overrides `gripStyle` for the bottom direction alone.",
			bindings: ["html", "svelte", "astro"],
			options: ["glyph", "bar", "dots", "none"],
		},
		{
			name: "startBehavior",
			type: "\"latch\" | \"commit\" | \"both\"",
			description: "Overrides `behavior` for the start direction alone.",
			bindings: ["html", "svelte", "astro"],
			options: ["latch", "commit", "both"],
		},
		{
			name: "startLatchAt",
			type: "number | string",
			description: "Overrides `latchAt` for the start direction alone.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "startCommitAt",
			type: "number | string",
			description: "Overrides `commitAt` for the start direction alone.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "endBehavior",
			type: "\"latch\" | \"commit\" | \"both\"",
			description: "Overrides `behavior` for the end direction alone.",
			bindings: ["html", "svelte", "astro"],
			options: ["latch", "commit", "both"],
		},
		{
			name: "endLatchAt",
			type: "number | string",
			description: "Overrides `latchAt` for the end direction alone.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "endCommitAt",
			type: "number | string",
			description: "Overrides `commitAt` for the end direction alone.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "topBehavior",
			type: "\"latch\" | \"commit\" | \"both\"",
			description: "Overrides `behavior` for the top direction alone.",
			bindings: ["html", "svelte", "astro"],
			options: ["latch", "commit", "both"],
		},
		{
			name: "topLatchAt",
			type: "number | string",
			description: "Overrides `latchAt` for the top direction alone.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "topCommitAt",
			type: "number | string",
			description: "Overrides `commitAt` for the top direction alone.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "bottomBehavior",
			type: "\"latch\" | \"commit\" | \"both\"",
			description: "Overrides `behavior` for the bottom direction alone.",
			bindings: ["html", "svelte", "astro"],
			options: ["latch", "commit", "both"],
		},
		{
			name: "bottomLatchAt",
			type: "number | string",
			description: "Overrides `latchAt` for the bottom direction alone.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "bottomCommitAt",
			type: "number | string",
			description: "Overrides `commitAt` for the bottom direction alone.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [
		{
			name: "open",
			description: "A belly is exposed; the modifier names which direction.",
			selector: ".xtyle-reveal--open",
		},
		{
			name: "grouped",
			description: "The reveal carries a `name`, so opening it closes its peers.",
			selector: ".xtyle-reveal--grouped",
		},
		{
			name: "disabled",
			description: "The lid is locked and the bellies are hidden.",
			selector: ".xtyle-reveal--disabled",
		},
	],
	slots: [
		{
			name: "default",
			description: "The lid: whatever sits on top and slides.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "start",
			description:
				"The belly on the inline-start edge, filling the whole box and uncovered as the lid slides toward the end. Mirrors under RTL. Configure it with the host's `startBehavior` / `startLatchAt` / `startCommitAt`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "end",
			description: "The belly on the inline-end edge, exposed by dragging toward the start. Configure it with the host's `endBehavior` / `endLatchAt` / `endCommitAt`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "top",
			description: "The belly on the block-start edge, exposed by dragging the lid down. Configure it with the host's `topBehavior` / `topLatchAt` / `topCommitAt`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "bottom",
			description: "The belly on the block-end edge, exposed by dragging the lid up. Configure it with the host's `bottomBehavior` / `bottomLatchAt` / `bottomCommitAt`.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--accent",
		"--accent-2",
		"--accent-2-bg",
		"--accent-2-text",
		"--accent-3",
		"--accent-3-bg",
		"--accent-3-text",
		"--accent-4",
		"--accent-4-bg",
		"--accent-4-text",
		"--accent-bg",
		"--accent-text",
		"--bg-1",
		"--bg-2",
		"--black",
		"--black-bg",
		"--black-text",
		"--blue",
		"--blue-bg",
		"--blue-text",
		"--border-normal",
		"--border-thick",
		"--brown",
		"--brown-bg",
		"--brown-text",
		"--cyan",
		"--cyan-bg",
		"--cyan-text",
		"--danger",
		"--danger-bg",
		"--danger-text",
		"--duration-base",
		"--ease-standard",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--gray",
		"--gray-bg",
		"--gray-text",
		"--green",
		"--green-bg",
		"--green-text",
		"--info",
		"--info-bg",
		"--info-text",
		"--neutral",
		"--neutral-bg",
		"--neutral-text",
		"--orange",
		"--orange-bg",
		"--orange-text",
		"--pink",
		"--pink-bg",
		"--pink-text",
		"--purple",
		"--purple-bg",
		"--purple-text",
		"--radius-full",
		"--radius-md",
		"--red",
		"--red-bg",
		"--red-text",
		"--ring",
		"--space-1",
		"--space-2",
		"--space-3",
		"--space-5",
		"--success",
		"--success-bg",
		"--success-text",
		"--warn",
		"--warn-bg",
		"--warn-text",
		"--white",
		"--white-bg",
		"--white-text",
		"--yellow",
		"--yellow-bg",
		"--yellow-text",
	],
	composition: [
		"Give a list row an `end` belly of actions and a `start` belly of detail, so one row answers both \"what is this\" and \"what can I do with it\".",
		"Reach for `behavior=\"both\"` when a belly's first action is the obvious one: the short pull shows the choices, the full pull takes the first without waiting.",
		"Group a stack with a shared `name` when only one detail panel should be open at a time, and leave the name off when they are independent.",
		"Wrap a group in `<xtyle-reveal-group>` to scope its names and give the set an accessible label; two lists on one page can then both use `name=\"items\"`.",
		"Override the `component.reveal` fill to reshape the grips or the belly containers without touching the content either side of them.",
	],
	a11y: [
		"The lid is focusable and announced as a group carrying `aria-expanded`, so the disclosure is legible without a pointer.",
		"Arrow keys open the belly on the matching edge and Escape closes whichever is open, so every direction has a keyboard route.",
		"A concealed belly is `inert`, keeping its controls out of the tab order until it is actually on screen.",
		"When a grouped reveal is closed by a sibling opening, focus lands on its own lid rather than being dropped to the document.",
		"Travel locks to one axis after `lockThreshold` pixels, so a vertical scroll gesture on a horizontal reveal still scrolls the page.",
		"The slide honors `prefers-reduced-motion`, landing in the same place with the travel skipped.",
	],
	examples: [
		{
			id: "directions-behaviors-grouping",
			title: "Directions, behaviors, and grouping",
			description:
				"A single-direction reveal, a two-direction one pairing detail with a committing action, and a grouped stack where opening one closes the last.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
