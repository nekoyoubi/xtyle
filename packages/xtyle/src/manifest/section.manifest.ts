import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

const htmlExample = `<xtyle-section tone="accent" bordered>
	<h2>A page band</h2>
	<p>A full-width strip with its own surface and hairline rules.</p>
</xtyle-section>

<xtyle-section variant="stage" label="live · @xtyle/astro">
	<xtyle-button>A framed demo ground</xtyle-button>
</xtyle-section>`;

const svelteExample = `<script lang="ts">
	import { Section, Button } from "@xtyle/svelte";
</script>

<Section tone="accent" bordered>
	<h2>A page band</h2>
	<p>A full-width strip with its own surface and hairline rules.</p>
</Section>

<Section variant="stage" label="live · @xtyle/svelte">
	<Button>A framed demo ground</Button>
</Section>`;

const astroExample = `---
import { Section, Button } from "@xtyle/astro";
---

<Section tone="accent" bordered>
	<h2>A page band</h2>
	<p>A full-width strip with its own surface and hairline rules.</p>
</Section>

<Section variant="stage" label="live · @xtyle/astro">
	<Button>A framed demo ground</Button>
</Section>`;

export const sectionManifest: ComponentManifest = {
	id: "section",
	name: "Section",
	category: "layout",
	summary: "A page band or a framed stage: the full-width strips and demo grounds a page is built from.",
	description:
		"Section is the structural strip between the page primitives and the page itself: a padded surface band you lay content across, or a framed `stage` for showing something off. As a **band** it carries a `tone` (transparent (`plain`), a neutral raise (`quiet`), or a tint from the full tone roster: any semantic role, accent variant, or named hue) and optional `bordered` hairlines top and bottom, with a `padding` rhythm that eases off on narrow screens. As a **stage** (`variant=\"stage\"`) it becomes an elevated, accent-tinted frame with an optional corner `label`: the demo ground this very site sits its live examples in. It owns surface and spacing only; arrange what goes inside with `Stack`, `Cluster`, or `Grid`.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "section",
			description: "The band or stage root carrying the variant, tone, border, and padding classes.",
			selector: ".xtyle-section",
			tokens: ["--space-8", "--space-6", "--space-5", "--space-4", "--bg-1", "--accent-bg", "--border-thin", "--line", "--accent"],
		},
		{
			name: "stage",
			description: "The framed-demo treatment: an accent-tinted, elevated, rounded ground.",
			selector: ".xtyle-section--stage",
			tokens: ["--accent-bg", "--bg-2", "--border-thin", "--accent", "--radius-lg", "--elevation-3", "--ring-bg", "--space-6"],
		},
		{
			name: "label",
			description: "The optional monospace corner tag on a stage, pinned top-right.",
			selector: ".xtyle-section__label",
			tokens: ["--space-2", "--space-3", "--font-mono", "--text-xs", "--accent-text"],
		},
	],
	props: [
		{
			name: "as",
			type: "SectionTag",
			default: "section",
			description: "The element to render. A landmark band is usually `section`; a stage is often a `div`.",
			bindings: ["html", "svelte", "astro"],
			options: ["section", "div", "header", "footer"],
		},
		{
			name: "variant",
			type: "SectionVariant",
			default: "band",
			description: "A full-width surface `band`, or a framed, elevated `stage`.",
			bindings: ["html", "svelte", "astro"],
			options: ["band", "stage"],
		},
		{
			name: "tone",
			type: "SectionTone",
			default: "plain",
			description: "The band surface: transparent (`plain`), a neutral raise (`quiet`), or a tint from the full tone roster, any semantic role, accent variant, or named hue (`accent`, `success`, `pink`, …). Ignored by the stage.",
			bindings: ["html", "svelte", "astro"],
			options: ["plain", "quiet", ...FULL_TONES],
		},
		{
			name: "bordered",
			type: "boolean",
			default: "false",
			description: "Adds hairline rules along the top and bottom of a band, in the tone's edge color.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "padding",
			type: "SectionPadding",
			default: "lg",
			description: "Vertical rhythm of the band, eased off under 40rem. (`lg` is the base; the stage sets its own.)",
			bindings: ["html", "svelte", "astro"],
			options: ["none", "sm", "md", "lg"],
		},
		{
			name: "label",
			type: "string",
			description: "A corner tag for a stage (e.g. a `live · @xtyle/astro` provenance line).",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{
			name: "band",
			description: "A full-width surface strip, toned and optionally ruled; the default variant.",
			className: "xtyle-section",
			tokens: ["--bg-1", "--accent-bg", "--line", "--accent", "--border-thin"],
		},
		{
			name: "stage",
			description: "A framed, elevated, accent-tinted demo ground with an optional corner label.",
			className: "xtyle-section--stage",
			tokens: ["--accent-bg", "--bg-2", "--radius-lg", "--elevation-3", "--ring-bg", "--border-thin", "--accent"],
		},
	],
	sizes: [
		{ name: "sm", description: "Tighter band padding.", className: "xtyle-section--sm" },
		{ name: "md", description: "Medium band padding.", className: "xtyle-section--md" },
		{ name: "lg", description: "Generous band padding (default).", className: "xtyle-section", isDefault: true },
	],
	states: [],
	slots: [
		{
			name: "default",
			description: "The band or stage contents.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		...FULL_TONES.flatMap((t) => [`--${t}`, `--${t}-bg`]),
		"--accent-text",
		"--bg-1",
		"--bg-2",
		"--border-thin",
		"--elevation-3",
		"--font-mono",
		"--line",
		"--radius-lg",
		"--ring-bg",
		"--space-2",
		"--space-3",
		"--space-4",
		"--space-5",
		"--space-6",
		"--space-8",
		"--text-xs",
	],
	composition: [
		"Stack page bands down a route (a `plain` hero, a `quiet` stats band, an `accent` call-to-action) for rhythm without bespoke section CSS.",
		"Use `variant=\"stage\"` to frame a live demo or a hero preview, and pass `label` for a provenance tag.",
		"Section owns surface and padding only; compose the contents with `Stack`, `Cluster`, or `Grid`.",
	],
	a11y: [
		"Choose `as` for the landmark you mean: `section` (optionally with an `aria-label`), `header`, or `footer`. A plain `div` stage carries no landmark role, which is usually right for a demo frame.",
		"Surface tones are decorative; the band's meaning comes from its content and heading, never the background color.",
		"The stage corner `label` is plain text in the flow; keep it short, since it reads before the framed content.",
	],
	examples: [
		{
			id: "bands-and-stages",
			title: "Bands and stages",
			description: "The three band tones with and without rules, the padding rhythm, and the framed stage with a corner label.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
