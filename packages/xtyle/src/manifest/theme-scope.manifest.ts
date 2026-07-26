import type { ComponentManifest } from "./types.js";

const htmlExample = `<!-- Scoped to its own subtree: everything inside renders on the derived theme -->
<xtyle-theme-scope algorithm="xtyle-quiet" constraints='{"--accent":"#7c5cff"}'>
	<xtyle-card>
		<xtyle-heading level="3">Quiet</xtyle-heading>
		<xtyle-text>Only this card is themed.</xtyle-text>
	</xtyle-card>
</xtyle-theme-scope>

<!-- Two invocations side by side, each owning its own scheme -->
<xtyle-theme-scope algorithm="xtyle-default" scheme="light">
	<xtyle-card>Light</xtyle-card>
</xtyle-theme-scope>

<!-- The page-level scope: drives :root, with a toggle that re-derives through it -->
<xtyle-theme-scope target="root" algorithm="xtyle-default">
	<xtyle-scheme-toggle></xtyle-scheme-toggle>
</xtyle-theme-scope>`;

const svelteExample = `<script lang="ts">
	import { ThemeScope, SchemeToggle, Card } from "@xtyle/svelte";
</script>

<ThemeScope algorithm="xtyle-quiet" constraints={{ "--accent": "#7c5cff" }}>
	<Card>Only this subtree is themed.</Card>
</ThemeScope>

<!-- the page-level scope, with a toggle that drives it -->
<ThemeScope target="root" scheme="light">
	<SchemeToggle />
</ThemeScope>`;

const astroExample = `---
import ThemeScope from "@xtyle/astro/ThemeScope.astro";
import SchemeToggle from "@xtyle/astro/SchemeToggle.astro";
import Card from "@xtyle/astro/Card.astro";
---

<ThemeScope algorithm="xtyle-quiet" constraints={{ "--accent": "#7c5cff" }}>
	<Card>Only this subtree is themed.</Card>
</ThemeScope>

<!-- the page-level scope, with a toggle that drives it -->
<ThemeScope target="root" scheme="light">
	<SchemeToggle />
</ThemeScope>`;

export const themeScopeManifest: ComponentManifest = {
	id: "theme-scope",
	name: "Theme Scope",
	since: "0.10.0",
	category: "layout",
	keywords: ["theme", "scope", "provider", "algorithm", "invocation", "derive", "scheme", "tokens"],
	seeAlso: ["scheme-toggle"],
	summary: "A provider that derives an invocation and themes everything inside it.",
	description:
		"Theme Scope materializes an *invocation* — a named algorithm plus its `knobs` and token `constraints` — and applies the derived register to a target, so everything beneath it renders on that theme. It draws nothing of its own: the children you write are the content, untouched. `target` decides what the tokens land on, and it defaults to `self`, scoping the theme to this element's subtree — that is what makes a themed card, a mockup frame, or two algorithms side by side possible without either one leaking onto the page. `target=\"root\"` drives `:root` instead, for the single scope that themes a whole document. The scope also *owns the scheme*: it derives the algorithm natively, and when the requested `scheme` is not the one that derivation produced, it re-derives with `invert`, so one set of inputs yields both modes through the engine rather than a hand-mirrored guess. An `<xtyle-scheme-toggle>` nested anywhere inside drives the scope rather than the document. Each settled derivation fires `xtyle:theme-scope` carrying the scheme and the applied register, and a bad invocation reports the error on that same event instead of applying a half-derived theme.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "scope",
			description:
				"The element itself. Under the default `target=\"self\"` the derived custom properties are set on it, so the cascade carries the theme to its children.",
			selector: "xtyle-theme-scope",
		},
	],
	props: [
		{
			name: "algorithm",
			type: "string",
			default: "xtyle-default",
			description: "The id of the algorithm to invoke (`xtyle-default`, `xtyle-hc`, `xtyle-quiet`, `xtyle-loud`, `nxi-nite`, or any registered algorithm).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "target",
			type: "\"self\" | \"root\"",
			default: "self",
			description: "Where the derived tokens land: this element's subtree, or the document root.",
			bindings: ["html", "svelte", "astro"],
			options: ["self", "root"],
		},
		{
			name: "scheme",
			type: "\"light\" | \"dark\"",
			description: "Pins the rendered scheme, re-deriving inverted when the algorithm's native mode is the other one. Omit to take whatever the algorithm derives natively.",
			bindings: ["html", "svelte", "astro"],
			options: ["light", "dark"],
		},
		{
			name: "knobs",
			type: "Knobs",
			description: "The algorithm's own dials, as an object in the framework bindings and JSON in the HTML attribute.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "constraints",
			type: "Constraints",
			description: "Direct token overrides applied over the derivation, the universal escape hatch.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [
		{
			name: "effective scheme",
			description: "The scheme the last derivation actually produced, published for anything that must reflect what is on screen rather than what was asked for.",
			selector: "xtyle-theme-scope[data-effective-scheme]",
		},
	],
	slots: [
		{
			name: "default",
			description: "Everything the scope themes. Rendered exactly as authored; the scope adds no markup of its own.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [],
	composition: [
		"Wrap a card, a preview frame, or a mockup to theme just that subtree, and put two next to each other to compare algorithms on one page.",
		"Use one `target=\"root\"` scope for the app-level theme, and nest `target=\"self\"` scopes inside it wherever a region needs its own.",
		"Nest an `<xtyle-scheme-toggle>` inside and it drives the scope through the engine's inversion instead of flipping `:root[data-scheme]`.",
		"Listen for `xtyle:theme-scope` to mirror the applied register elsewhere, or to surface a bad invocation's error.",
	],
	a11y: [
		"Renders no markup and takes no focus, so it adds nothing to the tab order or the accessibility tree.",
		"Applying a register sets `color-scheme` on the target, so native form controls, scrollbars, and the caret follow the derived theme.",
		"Because the scheme is derived rather than mirrored, contrast lands where the algorithm places it for the mode in effect, keeping a themed subtree as legible as the page around it.",
	],
	examples: [
		{
			id: "scoped-and-root",
			title: "Scoped subtrees, pinned schemes, and the page-level scope",
			description: "A scope theming just its own subtree, two invocations side by side owning their own schemes, and the root-targeting scope a toggle drives.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
