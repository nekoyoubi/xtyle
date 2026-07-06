import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-steps current="1">
	<ol>
		<li>Cart</li>
		<li>Shipping</li>
		<li>Payment</li>
		<li>Review</li>
	</ol>
</xtyle-steps>`;

const svelteExample = `<script lang="ts">
	import { Steps } from "@xtyle/svelte";

	let current = $state(1);
	const labels = ["Cart", "Shipping", "Payment", "Review"];
</script>

<Steps {current}>
	<ol>
		{#each labels as label (label)}<li>{label}</li>{/each}
	</ol>
</Steps>`;

const astroExample = `---
import Steps from "@xtyle/astro/Steps.astro";
---

<Steps current={1}>
	<ol>
		<li>Cart</li>
		<li>Shipping</li>
		<li>Payment</li>
		<li>Review</li>
	</ol>
</Steps>`;

export const stepsManifest: ComponentManifest = {
	id: "steps",
	name: "Steps",
	since: "0.6.0",
	category: "navigation",
	summary: "A horizontal step indicator for a linear flow: done, current, and upcoming at a glance.",
	description:
		"Steps shows where a user is in a linear process: a checkout, an onboarding wizard, a multi-part form. It decorates a semantic ordered list of `<li>` steps and splits them by the `current` index: everything before it is done (a filled marker with a check), the one at it is current (an outlined marker, flagged with `aria-current`), and everything after is upcoming (a muted, numbered marker). A connector track fills in behind the markers up to the current step. It renders no markup of its own beyond the classes and the `aria-current` it sets, so the ordered list stays the source of truth and screen readers hear the steps in order. Standalone like `Table` and `Timeline`, it needs no runtime, only the derived register the markers and track draw from.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "list",
			description: "The decorated ordered list, laid out as an even horizontal row of steps.",
			selector: ".xtyle-steps__list",
			tokens: [],
		},
		{
			name: "step",
			description: "One step: a numbered marker over its label, joined to the previous step by the connector track.",
			selector: ".xtyle-steps__step",
			tokens: ["--space-2", "--text-sm", "--fg-1", "--bg-1", "--fg-2", "--line", "--border-thick", "--radius-full", "--weight-semibold"],
		},
		{
			name: "marker",
			description: "The circular step marker: a number when upcoming, a check when done, an accent outline when current.",
			selector: ".xtyle-steps__step::before",
			tokens: ["--accent", "--accent-fg", "--accent-text", "--bg-0", "--fg-0", "--weight-medium"],
		},
	],
	props: [
		{
			name: "current",
			type: "number",
			default: "0",
			description:
				"The zero-based index of the current step. Steps before it render as done (checked), the step at it as current (`aria-current=\"step\"`), and steps after it as upcoming.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [
		{
			name: "done",
			description: "A completed step: an accent-filled marker with a check, and a filled connector into it.",
			selector: ".xtyle-steps__step--done",
			tokens: ["--accent", "--accent-fg"],
		},
		{
			name: "current",
			description: "The active step: an accent-outlined marker and an emphasized label, carrying `aria-current`.",
			selector: ".xtyle-steps__step--current",
			tokens: ["--accent", "--accent-text", "--bg-0", "--fg-0", "--weight-medium"],
		},
		{
			name: "upcoming",
			description: "A step not yet reached: a muted, numbered marker on the unfilled track.",
			selector: ".xtyle-steps__step--upcoming",
			tokens: ["--bg-1", "--fg-2", "--line"],
		},
	],
	slots: [
		{
			name: "default",
			description: "The ordered list. Provide an `<ol>` (or `<ul>`) whose `<li>` children are the steps, in order.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--space-2",
		"--accent",
		"--accent-fg",
		"--accent-text",
		"--bg-0",
		"--bg-1",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--line",
		"--border-thick",
		"--radius-full",
		"--text-sm",
		"--weight-semibold",
		"--weight-medium",
	],
	composition: [
		"Drive `current` from the same state that gates a wizard's Next button, so the marker moves as the user advances.",
		"Keep labels to a word or two; the row divides the width evenly, so long labels wrap under their marker.",
		"For a form, pair it with a heading per step and swap the panel below as `current` changes.",
	],
	a11y: [
		"It renders a semantic ordered list, so assistive tech announces the steps in order; the current step carries `aria-current=\"step\"` so it is announced as the active one.",
		"State is not conveyed by color alone: a done step shows a check glyph and the current step is outlined and emphasized, so a color-deficient user still reads progress.",
		"The markers and connector track are decorative (drawn as pseudo-elements) and carry no content of their own.",
	],
	examples: [
		{
			id: "checkout",
			title: "Checkout flow",
			description: "Four steps with the second active; the first is done and the rest are upcoming.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
