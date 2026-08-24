import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-tour id="onboard" progress="dots">
	<xtyle-tour-step target="#compose" heading="Start here" placement="bottom">
		This is where a new message begins.
	</xtyle-tour-step>
	<xtyle-tour-step target="#inbox" heading="Everything lands here" placement="right">
		Your inbox. Unread threads rise to the top.
	</xtyle-tour-step>
	<xtyle-tour-step target="#settings" heading="Make it yours" placement="left" shape="circle">
		Theme, shortcuts, and accounts live in settings.
	</xtyle-tour-step>
</xtyle-tour>

<script>
	document.getElementById("onboard").start();
</script>`;

const svelteExample = `<script lang="ts">
	import { Tour, TourStep, Button } from "@xtyle/svelte";

	let touring = $state(false);
</script>

<Button onclick={() => (touring = true)}>Take the tour</Button>

<Tour bind:open={touring} progress="count" oncomplete={() => (touring = false)}>
	<TourStep target="#compose" heading="Start here">Where a new message begins.</TourStep>
	<TourStep target="#inbox" heading="Everything lands here" placement="right">Your inbox.</TourStep>
	<TourStep target="#settings" heading="Make it yours" placement="left">Theme and accounts.</TourStep>
</Tour>`;

const astroExample = `---
import { Tour, TourStep } from "@xtyle/astro";
---

<Tour id="onboard" progress="dots">
	<TourStep target="#compose" heading="Start here">Where a new message begins.</TourStep>
	<TourStep target="#inbox" heading="Everything lands here" placement="right">Your inbox.</TourStep>
	<TourStep target="#settings" heading="Make it yours" placement="left" shape="circle">Settings.</TourStep>
</Tour>

<script>
	const tour = document.getElementById("onboard") as HTMLElement & { start(): void };
	if (!localStorage.getItem("toured")) tour.start();
	tour.addEventListener("close", () => localStorage.setItem("toured", "1"));
</script>`;

const specHtmlExample = `<xtyle-tour id="first-run" spec='{
	"id": "first-run",
	"title": "Getting around",
	"steps": [
		{ "target": "#rail", "heading": "The rail", "body": "Everything hangs off this." },
		{ "target": "#canvas", "heading": "The canvas", "placement": "left" },
		{ "target": "#help", "heading": "Help", "body": "And the tours live here." }
	]
}'></xtyle-tour>`;

const specSvelteExample = `<script lang="ts">
	import { Tour } from "@xtyle/svelte";
	import type { TourSpec } from "@xtyle/core";

	// A tour is data, so it can live anywhere and be addressed by id.
	const TOURS = {
		"first-run": {
			id: "first-run",
			title: "Getting around",
			summary: "Three stops",
			steps: [
				{ target: "#rail", heading: "The rail", body: "Everything hangs off this." },
				{ target: "#canvas", heading: "The canvas", placement: "left" },
				{ target: "#help", heading: "Help", body: "And the tours live here." },
			],
		},
	} satisfies Record<string, TourSpec>;

	let taken = $state(localStorage.getItem("tour:first-run") === "done");
</script>

<Tour
	spec={TOURS["first-run"]}
	{taken}
	oncomplete={() => { taken = true; localStorage.setItem("tour:first-run", "done"); }}
	onskip={() => { taken = true; }}
/>`;

const specAstroExample = `---
import Tour from "@xtyle/astro/Tour.astro";
import type { TourSpec } from "@xtyle/core";

const firstRun: TourSpec = {
	id: "first-run",
	title: "Getting around",
	steps: [
		{ target: "#rail", heading: "The rail", body: "Everything hangs off this." },
		{ target: "#canvas", heading: "The canvas", placement: "left" },
	],
};
---

<Tour spec={firstRun} />`;

export const tourManifest: ComponentManifest = {
	id: "tour",
	name: "Tour",
	category: "overlay",
	since: "0.8.0",
	keywords: ["walkthrough", "onboarding", "coachmark", "guide", "steps", "product tour", "spotlight", "next", "back"],
	seeAlso: ["spotlight", "popover", "steps", "dialog"],
	summary:
		"A guided sequence of Spotlights: point at one thing, say something, and move to the next with Back / Next / Skip and a progress readout.",
	description:
		"Tour is a Spotlight with more than one step. It owns the sequence — which step is showing, the Back / Next / Skip / Done buttons, and the progress readout — and drives a single composed `<xtyle-spotlight>` through it, so every step gets the same honest isolation: the page dims, a hole is cut over the target, and a callout points at it, with the target left live underneath. Each step is an `<xtyle-tour-step>` carrying a `target` and, as its content, whatever the callout should say; any spotlight knob (`heading`, `placement`, `shape`, `pulse`, `arrow`, `dim`, `blur`, `no-dismiss`) set on a step overrides the Tour's default for that step alone. The Tour resolves each step's target against the page and hands the element to the spotlight directly, so a selector still finds a node the tour's own shadow root can't see, and the step-to-step focus handling — the part that goes wrong when a sequence is hand-rolled — is the spotlight's, already proven. The only chrome the Tour invents is the nav row; it renders through `component.tour`, so a mod can reshape Back / Next / Skip and the progress dots without touching the sequencing.",
	bindings: ["html", "svelte", "astro"],
	exposedParts: ["back", "body", "nav", "next", "progress", "skip", "spotlight", "tour"],
	anatomy: [
		{
			name: "tour",
			description: "The controller. It paints nothing itself; it drives the composed spotlight and hosts the nav.",
			selector: ".xtyle-tour",
		},
		{
			name: "spotlight",
			description: "The composed `<xtyle-spotlight>` the tour re-points at each step — the veil, the ring, and the callout are all its.",
			selector: ".xtyle-tour__spotlight",
		},
		{
			name: "nav",
			description: "The step controls in the callout's action row: Back, the progress readout, Skip, and Next / Done.",
			selector: ".xtyle-tour__nav",
			tokens: ["--space-1", "--space-2"],
		},
		{
			name: "back",
			description: "Steps back a step. Hidden on the first step.",
			selector: ".xtyle-tour__back",
			tokens: ["--fg-2", "--state-hover", "--radius-sm", "--space-2", "--space-3", "--weight-semibold", "--ring"],
		},
		{
			name: "progress",
			description: "Which step you're on: `2 of 5` under `count`, a dot per step under `dots`, nothing under `none`.",
			selector: ".xtyle-tour__progress",
			tokens: ["--fg-2", "--line-2", "--accent", "--text-xs", "--radius-full", "--duration-fast", "--ease-standard"],
		},
		{
			name: "skip",
			description: "Ends the tour early. Hidden on the last step, where Done says the same thing.",
			selector: ".xtyle-tour__skip",
			tokens: ["--fg-2", "--state-hover", "--radius-sm", "--space-2", "--space-3", "--weight-semibold", "--ring"],
		},
		{
			name: "next",
			description: "Advances a step, and becomes Done on the last one.",
			selector: ".xtyle-tour__next",
			tokens: ["--accent", "--accent-fg", "--state-hover", "--state-press", "--radius-sm", "--space-2", "--space-3", "--weight-semibold", "--ring"],
		},
	],
	props: [
		{
			name: "open",
			type: "boolean",
			default: "false",
			description: "Whether the tour is running. `start()`, `next()`, `back()`, `go()`, `finish()`, `skip()`, and `close()` are the imperative doors.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "index",
			type: "number",
			default: "0",
			description: "The step to open on, and the live position while running.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "progress",
			type: "TourProgress",
			default: "count",
			description: "The progress readout. `count` prints \"2 of 5\", `dots` draws one dot per step, `none` shows nothing.",
			bindings: ["html", "svelte", "astro"],
			options: ["count", "dots", "none"],
		},
		{
			name: "backLabel",
			type: "string",
			default: "Back",
			description: "The back button's label.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "nextLabel",
			type: "string",
			default: "Next",
			description: "The advance button's label on every step but the last.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "doneLabel",
			type: "string",
			default: "Done",
			description: "The advance button's label on the last step.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "skipLabel",
			type: "string",
			default: "Skip",
			description: "The skip button's label.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "spec",
			type: "TourSpec",
			description:
				"A whole tour as data - `{ id, title, summary, steps }` - in place of authoring `TourStep` children by hand. It materializes those children rather than rendering a second way, so a spec-driven tour behaves identically to a slotted one; the same items-mode/slotted-mode split `tabs` and `accordion` carry. Declaring a tour as data is what lets it be held in a variable, addressed by id from a help menu or a command palette, listed in a picker, or contributed by a mod - none of which markup living inside one screen can be. Set it as a property from JS, or as a JSON string in markup, the way `Progress` takes a `ramp` stop list.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "beforeStep",
			type: "(index: number) => void | Promise<void>",
			description:
				"Run before a step's target is resolved, and awaited when it returns a promise. This is the seam for a step that has to *make* what it points at rather than merely find it - open a collapsed panel, select a layer, switch a tool - because a target that does not exist yet cannot be measured, and `step` fires on arrival, which is already too late. Property only; it is a function.",
			bindings: ["html", "svelte"],
			propertyOnly: true,
		},
		{
			name: "targetTimeout",
			type: "number",
			default: "2000",
			description:
				"How long to keep watching for a step's target after the callout is already up, in milliseconds. The step never waits on this - it opens immediately against whatever resolves at that moment and attaches the target the frame it appears - so this only bounds how long a late target has to show up before `target-missing` says it never did.",
			bindings: ["html", "svelte", "astro"],
			attr: "target-timeout",
		},
		{
			name: "taken",
			type: "boolean",
			default: "false",
			description:
				"Whether this tour has already been taken. The component reports `complete` and `skip` separately and keeps no memory of either: which storage holds that, under what key, whether it is per-user or per-device, and whether it resets when the tour's content changes are all the app's decisions. So this is the app telling the component, not the component guessing.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "noSkip",
			type: "boolean",
			default: "false",
			description: "Drops the skip button, for a tour the app wants finished. Pair with `noDismiss` so the veil and Escape can't leave it either.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "placement",
			type: "PopoverPlacement",
			default: "bottom",
			description: "The default callout side for every step, overridable per step.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "shape",
			type: "SpotlightShape",
			default: "auto",
			description: "The default hole shape for every step, overridable per step.",
			bindings: ["html", "svelte", "astro"],
			options: ["auto", "rect", "circle"],
		},
		{
			name: "pulse",
			type: "SpotlightPulse",
			description: "The default ring pulse for every step, overridable per step.",
			bindings: ["html", "svelte", "astro"],
			options: ["none", "slow", "fast"],
		},
		{
			name: "padding",
			type: "number",
			default: "8",
			description: "The default breathing room between a target and the edge of the hole, in px. Overridable per step.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "dim",
			type: "number",
			default: "0.72",
			description: "How dark every step's veil goes, 0–1. Overridable per step.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "blur",
			type: "number",
			default: "0",
			description:
				"How far the page behind every step's veil blurs, in px. Nothing blurs at 0, which is the default: blur costs a compositor layer over the whole viewport. Overridable per step.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "arrow",
			type: "SpotlightArrow",
			default: "bounce",
			description: "The default pointer at each target: `bounce` animates toward it, `static` holds still, `none` draws nothing. Overridable per step.",
			bindings: ["html", "svelte", "astro"],
			options: ["none", "static", "bounce"],
		},
		{
			name: "scrollIntoView",
			type: "boolean",
			default: "false",
			description:
				"Scrolls each step's target to the middle of the viewport before its callout opens. A step pointing at something off-screen is a solid scrim. Overridable per step.",
			bindings: ["html", "svelte", "astro"],
			attr: "scroll-into-view",
		},
		{
			name: "noDismiss",
			type: "boolean",
			default: "false",
			description: "Makes every step's veil and Escape inert, so the tour advances only through its nav. Overridable per step.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	events: [
		{ name: "start", detail: "{ total }", description: "The tour opened on its first step.", bindings: ["html", "svelte", "astro"] },
		{ name: "step", detail: "{ index, total }", description: "The tour advanced to a step.", bindings: ["html", "svelte", "astro"] },
		{ name: "complete", description: "The last step's Done was pressed.", bindings: ["html", "svelte", "astro"] },
		{ name: "skip", detail: "{ index, total }", description: "The user left the tour early.", bindings: ["html", "svelte", "astro"] },
		{ name: "close", description: "The tour closed, for any reason. Fires after `complete` or `skip`.", bindings: ["html", "svelte", "astro"] },
		{ name: "target-missing", detail: "{ index, target }", description: "A step's `target` selector never resolved, even after `targetTimeout`. The callout still opened, anchored to nothing - without this the step degrades in silence and reads exactly like a mistyped selector.", bindings: ["html", "svelte", "astro"], handler: "ontargetmissing" },
	],
	methods: [
		{
			name: "start",
			params: "index?: number",
			description:
				"Open the tour on a step, defaulting to the first. Fires `start`, and runs `beforeStep` before the step's target is measured.",
			bindings: ["html", "svelte"],
		},
		{
			name: "next",
			description:
				"Advance one step, finishing the tour if there is nowhere further to go.",
			bindings: ["html", "svelte"],
		},
		{
			name: "back",
			description:
				"Step back one, stopping at the first rather than wrapping.",
			bindings: ["html", "svelte"],
		},
		{
			name: "go",
			params: "index: number",
			description:
				"Jump straight to a step by index — what a picker or a resumed walkthrough needs. Out-of-range is ignored rather than clamped, so a stale index cannot silently show the wrong step.",
			bindings: ["html", "svelte"],
		},
		{
			name: "finish",
			description:
				"End the tour as completed. Fires `complete`, which is the half of the take-versus-replay distinction a `taken` store watches.",
			bindings: ["html", "svelte"],
		},
		{
			name: "skip",
			description:
				"End the tour as abandoned. Fires `skip`, so a store can tell the user who bailed from the user who finished.",
			bindings: ["html", "svelte"],
		},
		{
			name: "close",
			description:
				"Close the callout without judging it either way — neither completed nor skipped.",
			bindings: ["html", "svelte"],
		},
	],
	variants: [],
	sizes: [],
	states: [
		{
			name: "running",
			description: "A step is showing: the spotlight is open on the step's target and the nav is live.",
			selector: ".xtyle-tour:not([hidden])",
		},
	],
	slots: [
		{
			name: "default",
			description: "The steps, as `<xtyle-tour-step>` children. Each carries a `target` and holds the callout content for that step.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--accent",
		"--accent-fg",
		"--border-thin",
		"--duration-fast",
		"--ease-standard",
		"--fg-1",
		"--fg-2",
		"--line-2",
		"--radius-full",
		"--radius-sm",
		"--ring",
		"--space-1",
		"--space-2",
		"--space-3",
		"--state-hover",
		"--state-press",
		"--text-xs",
		"--weight-semibold",
	],
	composition: [
		"Give every step a `target` that resolves. A tour points at things; a step with nothing to point at has no callout to open, because the callout anchors to the target.",
		"Set the common look on the Tour and only the exceptions on a step. `placement`, `shape`, and `pulse` cascade down; a step overrides just what it needs.",
		"Reach for `dots` progress on a short tour and `count` on a long one — five dots read at a glance, fifteen don't.",
		"Emit `complete` when the last step's Done is pressed and `skip` when the user bails; both are followed by `close`. Which of the two a returning user's flag keys on is the difference between a tour they finished and one they escaped, so persist against those rather than against `close`, and hand the answer back as `taken`. Where that flag lives is your app's call — xtyle reaches outside the page for nothing.",
		"Pair `noSkip` with `noDismiss` for a tour that must be finished — but leave that for the rare step that truly can't be skipped, because a walkthrough with no exit is a trap.",
	],
	a11y: [
		"Each step is a Spotlight callout in its dialog posture: focus moves into the callout on open, and the step's `heading` names it.",
		"The nav buttons are real buttons, reachable and operable from the keyboard; Back is removed from the tab order on the first step, and Skip on the last.",
		"A veil click or Escape ends the tour as a skip — unless a step sets `noDismiss`, in which case only the nav moves it, and Back / Next / Skip must remain the way through.",
		"The progress readout is decorative and `aria-hidden`; the step's heading and content carry what a screen reader needs.",
		"The ring's pulse and the callout's motion honor `prefers-reduced-motion`, inherited from the spotlight.",
	],
	examples: [
		{
			id: "tour-as-data",
			title: "A tour declared as data",
			description:
				"`spec` takes the whole walkthrough as `{ id, title, summary, steps }` instead of `TourStep` children, and materializes the same steps — so a spec-driven tour behaves identically to a slotted one. That is what lets a tour be held in a variable, addressed by id from a help menu or a command palette, listed in a picker, or contributed by a mod. Keeping it inert data is also why there is no registry here: a table of your tours is a plain object, and it stays yours. `taken` is the other half — the component reports `complete` and `skip` and remembers neither, so where that is stored is your call.",
			source: { html: specHtmlExample, svelte: specSvelteExample, astro: specAstroExample },
		},
		{
			id: "onboarding",
			title: "A three-step onboarding tour",
			description: "Point at the compose button, the inbox, and settings in turn, with a dot per step.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
