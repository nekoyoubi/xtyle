import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-button id="save" variant="solid" tone="accent">Save</xtyle-button>

<xtyle-spotlight
	id="coach"
	target="#save"
	heading="Save as you go"
	shape="auto"
	pulse
	arrow="bounce"
	scroll-into-view
>
	Your work is kept locally until you press this. Nothing leaves the machine before then.
</xtyle-spotlight>

<script>
	document.getElementById("coach").show();
</script>`;

const svelteExample = `<script lang="ts">
	import { Button, Spotlight } from "@xtyle/svelte";

	let coaching = $state(true);
</script>

<Button id="save" variant="solid" tone="accent">Save</Button>

<Spotlight bind:open={coaching} target="#save" heading="Save as you go" pulse>
	Your work is kept locally until you press this.
	{#snippet actions()}
		<Button variant="ghost" tone="neutral" onclick={() => (coaching = false)}>Skip</Button>
	{/snippet}
</Spotlight>`;

const astroExample = `---
import { Button, Spotlight } from "@xtyle/astro";
---

<Button id="save" variant="solid" tone="accent">Save</Button>

<Spotlight id="coach" target="#save" heading="Save as you go" placement="right" pulse>
	Your work is kept locally until you press this.
</Spotlight>

<script>
	const coach = document.getElementById("coach") as HTMLElement & { show(): void };
	if (!localStorage.getItem("coached")) coach.show();
	coach.addEventListener("dismiss", () => localStorage.setItem("coached", "1"));
</script>`;

export const spotlightManifest: ComponentManifest = {
	id: "spotlight",
	name: "Spotlight",
	category: "overlay",
	since: "0.8.0",
	keywords: ["coachmark", "onboarding", "highlight", "focus", "isolate", "walkthrough", "callout", "hint", "cutout"],
	seeAlso: ["popover", "dialog", "tooltip", "sheet"],
	summary:
		"Isolate one thing and say something about it: the page dims and blurs, a hole is cut over the target, and a callout points at it.",
	description:
		"Spotlight is the coachmark: the way to say *this one, here* about something the user is looking at. Everything but the target dims (and optionally blurs), a hole is cut over it, a ring traces it, and a callout floats beside it carrying whatever you want to say — rich markup, actions, the lot. A Tour is a Spotlight with more than one step. The isolation is a single clipped veil rather than four boxes packed around the target, and that choice is what makes the component honest: the hole can take real corner radii (it traces the target's own by default) or be a circle, and the element underneath stays **live** — the veil takes the pointer, the hole does not, so the thing you are pointing at is still the thing the user can press. A spotlight that greys out the button it is telling you to click is a screenshot with a circle drawn on it. The hole follows the target through scrolls, resizes, and layouts settling in, because a hole that drifts off its target is the single most obvious way this can look broken. The callout is a real `<xtyle-popover>`, so the placement, the edge-flipping, the arrow and the focus handling come from there rather than from a second implementation; what the element adds is the veil, the ring, the pointer, and the geometry that keeps them glued to whatever they are pointing at.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "spotlight",
			description: "The fixed layer over the page. It paints nothing itself and takes no pointer events; its children do.",
			selector: ".xtyle-spotlight",
			tokens: ["--scrim"],
		},
		{
			name: "veil",
			description:
				"The dimmed (and optionally blurred) layer, clipped by an `evenodd` `path()` that is the viewport minus the target. The only part that takes the pointer — a click on it dismisses.",
			selector: ".xtyle-spotlight__veil",
			tokens: ["--scrim", "--duration-base", "--ease-emphasized"],
		},
		{
			name: "ring",
			description: "The outline traced around the hole, so the target reads as chosen rather than merely un-dimmed.",
			selector: ".xtyle-spotlight__ring",
			tokens: ["--accent", "--border-thick", "--surface-overlay-border", "--state-hover", "--duration-base", "--ease-emphasized", "--ease-standard"],
		},
		{
			name: "callout",
			description: "The composed `<xtyle-popover>` holding what you have to say, anchored to the target and flipping at the viewport's edge.",
			selector: ".xtyle-spotlight__callout",
		},
		{
			name: "panel",
			description: "The callout's content column: the heading, the body, and the action row.",
			selector: ".xtyle-spotlight__panel",
			tokens: ["--font-sans", "--text-body", "--leading-normal", "--fg-1", "--space-2"],
		},
		{
			name: "heading",
			description: "The callout's title, wired to the panel via `aria-labelledby`.",
			selector: ".xtyle-spotlight__heading",
			tokens: ["--fg-0", "--text-lg", "--leading-tight", "--weight-semibold"],
		},
		{
			name: "close",
			description: "The built-in dismiss button (\"Got it\"). Suppress it with `noCloseButton` when the actions slot carries its own.",
			selector: ".xtyle-spotlight__close",
			tokens: ["--accent", "--accent-fg", "--radius-sm", "--space-2", "--space-3", "--border-thin", "--border-thick", "--state-hover", "--state-press", "--ring", "--duration-fast", "--ease-standard", "--weight-semibold"],
		},
		{
			name: "pointer",
			description: "The arrow at the target — the thing that says *there*. Bounces toward it by default, and stills under `prefers-reduced-motion`.",
			selector: ".xtyle-spotlight__pointer",
			tokens: ["--accent", "--ease-standard"],
		},
	],
	props: [
		{
			name: "target",
			type: "string",
			description: "A CSS selector for the element to isolate. For a node no selector can name, hand the element over through the `targetElement` property.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "open",
			type: "boolean",
			default: "false",
			description: "Whether the spotlight is showing. `show()` and `close()` are the imperative doors.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "shape",
			type: "SpotlightShape",
			default: "auto",
			description: "The hole's shape. `auto` traces the target's own corner radius; `rect` takes the `radius` you give it; `circle` cuts a circle around it.",
			bindings: ["html", "svelte", "astro"],
			options: ["auto", "rect", "circle"],
		},
		{
			name: "padding",
			type: "number",
			default: "8",
			description: "Breathing room between the target and the edge of the hole, in px.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "radius",
			type: "number",
			description: "The hole's corner radius in px, overriding the target's own. Ignored when `shape` is `circle`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "dim",
			type: "number",
			default: "0.72",
			description: "How dark the veil goes, 0–1. Rides as the `--spotlight-dim` custom property, so a theme can set it once.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "blur",
			type: "number",
			default: "0",
			description: "How far the page behind the veil blurs, in px. Nothing is blurred at 0, which is the default: blur costs a compositor layer over the whole viewport.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "placement",
			type: "PopoverPlacement",
			default: "bottom",
			description: "Preferred side of the target for the callout. It flips at the viewport's edge, the way any popover does.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "heading",
			type: "string",
			description: "The callout's title, and its accessible name.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "arrow",
			type: "SpotlightArrow",
			default: "bounce",
			description: "The pointer at the target: `bounce` animates toward it, `static` holds still, `none` draws nothing.",
			bindings: ["html", "svelte", "astro"],
			options: ["none", "static", "bounce"],
		},
		{
			name: "pulse",
			type: "SpotlightPulse",
			default: "none",
			description:
				"Pulses the ring around the hole, for a target that needs finding rather than merely naming. `slow` is the default cadence (a full 1.8s loop); `fast` is 0.9s. Both stop under `prefers-reduced-motion`, and neither is fast enough to be a flashing hazard; a bare `pulse` reads as `slow`.",
			bindings: ["html", "svelte", "astro"],
			options: ["none", "slow", "fast"],
		},
		{
			name: "scrollIntoView",
			type: "boolean",
			default: "false",
			description: "Scrolls the target to the middle of the viewport when the spotlight opens. A spotlight on something off-screen is a solid scrim.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "noDismiss",
			type: "boolean",
			default: "false",
			description: "Makes the veil and Escape inert, for a step the app insists on. Leave the actions slot a way out — a coachmark with no exit is a trap.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "closeLabel",
			type: "string",
			default: "Got it",
			description: "The dismiss button's label.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "noCloseButton",
			type: "boolean",
			default: "false",
			description: "Suppresses the built-in dismiss button, for a callout whose actions slot carries its own.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [
		{
			name: "open",
			description: "The veil is up, the hole is cut, and the callout is anchored to the target.",
			selector: ".xtyle-spotlight--open",
			tokens: ["--duration-base", "--ease-emphasized"],
		},
		{
			name: "pulse",
			description: "The ring breathes, so the eye finds the target rather than merely accepting it. `slow` and `fast` set the cadence; both stop under reduced motion.",
			selector: ".xtyle-spotlight--pulse-slow",
			tokens: ["--state-hover", "--ease-standard"],
		},
	],
	slots: [
		{ name: "default", description: "What the callout says. Rich markup: prose, a list, an image, whatever the step needs.", bindings: ["html", "svelte", "astro"] },
		{
			name: "actions",
			description: "Buttons in the callout's action row, before the built-in dismiss. Where a Tour puts Back / Next / Skip.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--layer-veil",
		"--accent",
		"--accent-fg",
		"--border-thick",
		"--border-thin",
		"--duration-base",
		"--duration-fast",
		"--ease-emphasized",
		"--ease-standard",
		"--fg-0",
		"--fg-1",
		"--font-sans",
		"--leading-normal",
		"--leading-tight",
		"--radius-sm",
		"--ring",
		"--scrim",
		"--space-2",
		"--space-3",
		"--state-hover",
		"--state-press",
		"--surface-overlay-border",
		"--text-body",
		"--text-lg",
		"--weight-semibold",
	],
	composition: [
		"Reach for Spotlight when the thing you are explaining is *on the screen already*. If it isn't, you want a Dialog; if the explanation is one line and needs no acknowledgement, you want a Tooltip.",
		"Leave the target live. The whole point is that the user can do the thing you are pointing at — so don't wrap the target in something that swallows the click, and don't set `noDismiss` on a step whose only exit is the action you're describing.",
		"`shape=\"auto\"` traces the target's own corner radius, which is almost always what you want; reach for `circle` on an avatar or an icon button, where a rounded rectangle looks like a mistake.",
		"`blur` costs a compositor layer the size of the viewport. It looks wonderful and it is not free — leave it at 0 for anything that runs on a phone mid-scroll.",
		"Chain them into a Tour rather than hand-rolling a sequence: the step-to-step focus handling is the part that goes wrong.",
	],
	a11y: [
		"The callout is a `<xtyle-popover>` in its dialog posture: focus moves into it on open, and the heading names it through `aria-labelledby`.",
		"Escape dismisses, and so does a click on the veil — unless `noDismiss` says the step is not optional, in which case the actions slot must carry the way out. A coachmark with no exit is a trap, and the component will not invent one for you.",
		"The target stays interactive: the hole is outside the veil's box, so the pointer reaches the element underneath. The spotlight explains the page; it does not take it away.",
		"The veil, the ring and the pointer are decorative and `aria-hidden` — everything a screen reader needs is in the callout, which is where focus lands.",
		"The ring's pulse and the pointer's bounce both honor `prefers-reduced-motion`, and still to a plain outline and a plain arrow.",
		"An unresolvable target yields no hole and a solid veil rather than a hole at the origin, so a broken selector reads as a scrim rather than as a spotlight on the corner of the page.",
	],
	examples: [
		{
			id: "coachmark",
			title: "A coachmark on the save button",
			description: "The canonical shape: isolate the control, say what it does, and let the user press the thing you're pointing at.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
