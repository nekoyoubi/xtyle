import type { ComponentManifest } from "./types.js";

const htmlExample = `<p>
	Your recovery code is
	<xtyle-redact mode="blur" reveal="hover" label="recovery code">4XQ2-9F1K-77PL</xtyle-redact>.
	Keep it somewhere safe.
</p>`;

const svelteExample = `<script lang="ts">
	import { Redact } from "@xtyle/svelte";

	let shown = $state(false);
</script>

<p>
	SSN <Redact mode="mask" reveal="click" label="social security number" bind:revealed={shown}>
		123-45-6789
	</Redact>
</p>
<p>{shown ? "revealed" : "hidden"}</p>`;

const astroExample = `---
import { Redact } from "@xtyle/astro";
---

<p>
	API key
	<Redact mode="block" reveal="hold" label="API key">key-9f2a7c1e4b6d</Redact>
	(press and hold to read).
</p>`;

export const redactManifest: ComponentManifest = {
	id: "redact",
	name: "Redact",
	category: "content",
	since: "0.8.0",
	keywords: ["blur", "mask", "block", "obscure", "spoiler", "sensitive", "reveal", "conceal", "privacy", "hidden"],
	seeAlso: ["field", "skeleton", "code", "badge"],
	summary:
		"Obscure a piece of content until it is revealed: blur it, block it, or mask it, and bring it back on hover, on a click, while held, or with a page-wide switch.",
	description:
		"Redact wraps a piece of content you don't want on screen by default — an account number, an API key, a plot spoiler — and hides it in one of three ways: `blur` softens it, `block` lays a solid bar over it, and `mask` covers it with a dotted fill. What brings it back is a separate choice: `hover` reveals while the pointer is over it or it holds focus, `click` toggles it, `hold` shows it only while a key or the pointer is held down, and `never` leaves the reveal entirely to the page-level switch. That switch — `revealAllRedactions()` — is the toolbar toggle that shows or re-hides every redaction on the page at once, so a form full of masked fields flips open together. While a redaction is concealed its content can't be selected, so an obscured value can't be dragged out with a mouse, and it is hidden from assistive tech until revealed. The cover and its reveal hint render through a fragment, so a mod can reshape the affordance; the reveal *behavior* lives in the element, because which trigger brings the content back is logic a token can't carry.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "redact",
			description: "The inline wrapper. It flows with the surrounding text and gives the cover a box to fill.",
			selector: ".xtyle-redact",
			tokens: ["--radius-sm"],
		},
		{
			name: "content",
			description: "The protected content. Blurred under `blur`, unselectable while concealed, and hidden from assistive tech until revealed.",
			selector: ".xtyle-redact__content",
			tokens: ["--duration-base", "--ease-standard"],
		},
		{
			name: "cover",
			description:
				"The layer over the content and the reveal surface. Transparent under `blur`, a solid fill under `block`, a dotted mask under `mask`; it fades out when revealed.",
			selector: ".xtyle-redact__cover",
			tokens: ["--fg-1", "--fg-3", "--bg-2", "--ring", "--duration-base", "--ease-standard"],
		},
		{
			name: "cue",
			description: "The reveal hint on the cover — an eye by default, or the text you give it. Shown for `block` and `mask`, and whenever a cue is named.",
			selector: ".xtyle-redact__cue",
			tokens: ["--surface-overlay", "--surface-overlay-border", "--border-thin", "--elevation-1", "--radius-full", "--space-1", "--space-2", "--text-xs", "--leading-tight"],
		},
	],
	props: [
		{
			name: "mode",
			type: "RedactMode",
			default: "blur",
			description: "How the content is obscured. `blur` softens it, `block` lays a solid bar over it, `mask` covers it with a dotted fill.",
			bindings: ["html", "svelte", "astro"],
			options: ["blur", "block", "mask"],
		},
		{
			name: "reveal",
			type: "RedactReveal",
			default: "hover",
			description:
				"What brings the content back. `hover` reveals while hovered or focused, `click` toggles it, `hold` shows it only while pressed, `never` leaves the reveal to the page-level switch alone.",
			bindings: ["html", "svelte", "astro"],
			options: ["hover", "click", "hold", "never"],
		},
		{
			name: "amount",
			type: "number",
			description: "The blur radius in px, overriding the default that scales with the text size. Only used by `blur` mode.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description: "What the content is. Names the cover's reveal control (`Reveal SSN`) so it isn't an unlabelled button.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "cue",
			type: "string",
			description: "Custom hint text on the cover, in place of the default eye glyph. Shown for `block` and `mask`, or whenever set.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "revealed",
			type: "boolean",
			default: "false",
			description: "Whether the content is showing. Reading it reports the live state from any source; setting it is the explicit, sticky programmatic reveal.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [
		{
			name: "revealed",
			description: "The content is showing and the cover has faded out. Reached by the trigger, the `revealed` prop, or the page-level switch.",
			selector: ".xtyle-redact--revealed",
			tokens: ["--duration-base", "--ease-standard"],
		},
	],
	slots: [
		{ name: "default", description: "The content to protect. Any inline markup — text, a link, a code span.", bindings: ["html", "svelte", "astro"] },
	],
	consumedTokens: [
		"--bg-2",
		"--border-thin",
		"--duration-base",
		"--ease-standard",
		"--elevation-1",
		"--fg-1",
		"--fg-3",
		"--leading-tight",
		"--radius-full",
		"--radius-sm",
		"--ring",
		"--space-1",
		"--space-2",
		"--surface-overlay",
		"--surface-overlay-border",
		"--text-xs",
	],
	composition: [
		"Give every redaction a `label`. The cover is a real button, and a button that reads only \"Reveal\" tells a screen-reader user nothing about what they are about to uncover.",
		"`reveal=\"hover\"` is the friendliest and the leakiest — the content shows on a passing mouse. For anything genuinely sensitive reach for `click` or `hold`, which take intent.",
		"Pair `reveal=\"never\"` with the page-level `revealAllRedactions()` switch when a screenful of fields should flip open together and nothing should reveal one at a time.",
		"`blur` still hints at length and shape; `block` and `mask` give nothing away. Reach past blur when the shape itself is the secret.",
		"Redact protects a value on screen, not in transit or at rest. It is an interface affordance, not encryption.",
	],
	a11y: [
		"The cover is a real `<button>`, focusable and operable from the keyboard: Enter or Space reveals it for `click`, and holds it open for `hold`.",
		"`label` names that button (`Reveal recovery code`), and the name flips to `Hide …` once the content is showing.",
		"Concealed content is `aria-hidden`, so a screen reader doesn't read out the very thing the redaction is covering; revealing it — by any trigger — returns it to the accessibility tree.",
		"`reveal=\"never\"` leaves the cover inert and out of the tab order, since there is nothing for a per-item interaction to do; it reveals only through the page-level switch.",
		"The cover's fade honors `prefers-reduced-motion`.",
	],
	examples: [
		{
			id: "inline-secret",
			title: "An inline secret you hover to read",
			description: "The friendliest shape: blur a value in a sentence and let a hover or a focus bring it back.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
