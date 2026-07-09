import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

const htmlExample = `<xtyle-spinner aria-label="Loading"></xtyle-spinner>

<xtyle-spinner size="sm" tone="neutral" aria-label="Loading"></xtyle-spinner>

<xtyle-spinner size="lg" tone="success" aria-label="Saving changes"></xtyle-spinner>`;

const svelteExample = `<script lang="ts">
	import { Spinner } from "@xtyle/svelte";
</script>

<Spinner ariaLabel="Loading" />

<Spinner size="sm" tone="neutral" ariaLabel="Loading" />

<Spinner size="lg" tone="success" ariaLabel="Saving changes" />`;

const astroExample = `---
import { Spinner } from "@xtyle/astro";
---

<Spinner aria-label="Loading" />

<Spinner size="sm" tone="neutral" aria-label="Loading" />

<Spinner size="lg" tone="success" aria-label="Saving changes" />`;

export const spinnerManifest: ComponentManifest = {
	id: "spinner",
	name: "Spinner",
	category: "feedback",
	keywords: ["loader", "loading", "busy", "progress ring", "activity indicator"],
	seeAlso: ["skeleton", "progress"],
	summary: "An indeterminate loading indicator: a spinning ring in any of the six semantic tones, in three sizes.",
	description:
		"Spinner signals that work is in progress without a known endpoint. It draws a rotating ring with a single transparent gap, sized in `em` so it scales with the surrounding type, and carries `role=\"status\"` so assistive tech announces the busy state. `tone` colors the ring across the six semantic roles (accent, neutral, danger, success, warn, info), and `size` picks sm, md, or lg. The spin runs on `--duration-slow`; the reduced-motion base rule freezes it for users who ask for less motion. It is presentational and standalone; Button carries its own inline spinner for the loading state.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "spinner",
			description: "The rotating ring: a bordered circle with one transparent side, animated on the slow duration.",
			selector: ".xtyle-spinner",
			tokens: ["--accent", "--border-thick", "--radius-full", "--duration-slow"],
		},
	],
	props: [
		{
			name: "tone",
			type: "FullTone",
			default: "accent",
			description: "Semantic color role driving the ring color.",
			bindings: ["html", "svelte", "astro"],
			options: [...FULL_TONES],
		},
		{
			name: "size",
			type: "Size",
			default: "md",
			description: "Ring size. Scales with `em`, so it also tracks the surrounding font size.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg"],
		},
		{
			name: "ariaLabel",
			type: "string",
			default: "Loading",
			description: "Accessible name announced for the busy region. Maps to `aria-label`.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{
			name: "accent",
			description: "Accent-toned ring, the default.",
			className: "xtyle-spinner--accent",
			tokens: ["--accent"],
		},
		{
			name: "neutral",
			description: "Neutral-toned ring.",
			className: "xtyle-spinner--neutral",
			tokens: ["--neutral"],
		},
		{
			name: "danger",
			description: "Danger-toned ring.",
			className: "xtyle-spinner--danger",
			tokens: ["--danger"],
		},
		{
			name: "success",
			description: "Success-toned ring.",
			className: "xtyle-spinner--success",
			tokens: ["--success"],
		},
		{
			name: "warn",
			description: "Warn-toned ring.",
			className: "xtyle-spinner--warn",
			tokens: ["--warn"],
		},
		{
			name: "info",
			description: "Info-toned ring.",
			className: "xtyle-spinner--info",
			tokens: ["--info"],
		},
	],
	sizes: [
		{ name: "sm", description: "Compact: thinner ring.", className: "xtyle-spinner--sm" },
		{ name: "md", description: "Default.", className: "xtyle-spinner", isDefault: true },
		{ name: "lg", description: "Large.", className: "xtyle-spinner--lg" },
	],
	states: [],
	slots: [],
	consumedTokens: [
		"--border-normal",
		"--border-thick",
		"--radius-full",
		"--duration-slow",
		...FULL_TONES.map((t) => `--${t}`),
	],
	composition: [
		"Drop inside any container to signal loading; pair with an `aria-live` region when you also surface text.",
		"Use Button's own `loading` state for in-button spinners. This standalone Spinner is for page, panel, and inline loading.",
		"Size in `em` means setting `font-size` on the spinner (or its parent) scales the ring without a size class.",
	],
	a11y: [
		"Carries `role=\"status\"` so the busy state is announced to assistive technology.",
		"Has no visible text, so it requires an accessible name; `ariaLabel` defaults to \"Loading\" and the binding warns at runtime if it is cleared.",
		"The ring is decorative; the loading meaning lives in the role and label, not the visual.",
		"Motion routes through `--duration-slow`; the forced-reduced-motion base rule freezes the animation automatically.",
	],
	examples: [
		{
			id: "tones-and-sizes",
			title: "Tones and sizes",
			description: "The six tones across the three sizes: color and scale are independent.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
