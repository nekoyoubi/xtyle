import type { ComponentManifest } from "./types.js";

const htmlExample = `<xoji-code lang="ts">const greet = (name: string) =&gt; \`hi \${name}\`;</xoji-code>

<xoji-code lang="rust" preload>fn main() { println!("hello"); }</xoji-code>`;

const svelteExample = `<script lang="ts">
	import { Code } from "@xoji/svelte";
</script>

<Code lang="ts">{\`const greet = (name: string) => \\\`hi \${name}\\\`;\`}</Code>`;

const astroExample = `---
import Code from "@xoji/astro/Code.astro";
---

<Code lang="ts" code={\`const greet = (name: string) => \\\`hi \${name}\\\`;\`} />`;

const htmlWrapExample = `<xoji-code lang="ts" wrap>const message = "a long line that soft-wraps in a narrow column instead of scrolling sideways";</xoji-code>`;

const svelteWrapExample = `<script lang="ts">
	import { Code } from "@xoji/svelte";
</script>

<Code lang="ts" wrap>{\`const message = "a long line that soft-wraps instead of scrolling";\`}</Code>`;

const astroWrapExample = `---
import Code from "@xoji/astro/Code.astro";
---

<Code lang="ts" wrap code={\`const message = "a long line that soft-wraps instead of scrolling";\`} />`;

const htmlLineNumbersExample = `<xoji-code lang="ts" line-numbers>function add(a: number, b: number) {
	return a + b;
}

const sum = add(2, 3);</xoji-code>`;

const svelteLineNumbersExample = `<script lang="ts">
	import { Code } from "@xoji/svelte";
</script>

<Code lang="ts" lineNumbers>{\`function add(a, b) {
	return a + b;
}\`}</Code>`;

const astroLineNumbersExample = `---
import Code from "@xoji/astro/Code.astro";
---

<Code lang="ts" lineNumbers code={\`function add(a, b) {
	return a + b;
}\`} />`;

const htmlHighlightExample = `<xoji-code lang="ts" line-numbers highlight="2,4">function total(items) {
	let sum = 0;
	for (const n of items) sum += n;
	return sum;
}</xoji-code>`;

const svelteHighlightExample = `<script lang="ts">
	import { Code } from "@xoji/svelte";
</script>

<Code lang="ts" lineNumbers highlight="2,4">{\`function total(items) {
	let sum = 0;
	for (const n of items) sum += n;
	return sum;
}\`}</Code>`;

const astroHighlightExample = `---
import Code from "@xoji/astro/Code.astro";
---

<Code lang="ts" lineNumbers highlight="2,4" code={\`function total(items) {
	let sum = 0;
	for (const n of items) sum += n;
	return sum;
}\`} />`;

const htmlCaptionExample = `<xoji-code lang="ts" caption="theme.ts">export const accent = "#5b8cff";</xoji-code>`;

const svelteCaptionExample = `<script lang="ts">
	import { Code } from "@xoji/svelte";
</script>

<Code lang="ts" caption="theme.ts">{\`export const accent = "#5b8cff";\`}</Code>`;

const astroCaptionExample = `---
import Code from "@xoji/astro/Code.astro";
---

<Code lang="ts" caption="theme.ts" code={\`export const accent = "#5b8cff";\`} />`;

export const codeManifest: ComponentManifest = {
	id: "code",
	name: "Code",
	category: "content",
	summary: "A read-only, syntax-highlighted code block themed entirely from the code-token family.",
	description:
		"Code is a turnkey, read-only code block with the tokenizer built in; it's the first component to read the `--code-*` family. It tokenizes with Prism, whose output is class-based, so the block re-themes live the moment the theme changes: the colors are just cascading CSS variables, never baked inline. The `lang` prop names the language with aliases resolved (`ts` → `typescript`), and the source is the element's text content (or, for Astro, a `code` prop). Grammar loading is fully lazy and per-language. A page with no code block loads nothing; a page with a few languages loads Prism core once plus only those grammar chunks, walking each grammar's dependencies first. At runtime the block paints immediately as plain-but-themed text and recolors in place once the grammar resolves, so there is no flash and no layout shift; the Astro binding tokenizes at build and ships pre-colored with zero browser JS. `preload` warms a block's grammar eagerly to kill even the minor recolor flash, sharing one warm path with the page-level `XojiCode.warm()` static. An unknown language falls back to plain-but-themed text rather than erroring.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "pre",
			description: "The block surface: the scroll container that carries the code background and padding.",
			selector: ".xoji-code",
			tokens: ["--code-bg", "--code-fg", "--radius-md", "--font-mono", "--text-sm", "--space-4"],
		},
		{
			name: "code",
			description: "The tokenized source: `.token.*` spans colored by the per-scope code tokens.",
			selector: ".xoji-code code",
			tokens: ["--code-keyword", "--code-string", "--code-comment", "--code-function"],
		},
		{
			name: "caption",
			description:
				"An optional header strip above the block, set via `caption` (a filename, say); reads in the mono face on a neutral surface and rounds the block's top corners into it.",
			selector: ".xoji-code-caption",
			tokens: ["--neutral-bg", "--neutral-text", "--field-border", "--radius-md", "--font-mono", "--text-xs"],
		},
		{
			name: "copy",
			description:
				"The copy-to-clipboard button, anchored top-right; fades in on hover or focus and flashes a vivid `Copied` state on success.",
			selector: ".xoji-code-copy",
			tokens: ["--neutral-bg", "--field-border", "--radius-sm", "--success-vivid"],
		},
		{
			name: "line-number",
			description:
				"The per-line counter gutter, shown when `line-numbers` is set; it sticks to the left edge as the code scrolls sideways and reads dimmed, like a comment.",
			selector: ".xoji-code-line::before",
			tokens: ["--code-comment", "--field-border", "--code-bg", "--space-4", "--space-2"],
		},
		{
			name: "line-highlight",
			description:
				"A line called out by `highlight`; the whole row is tinted with `--code-line-highlight`, the low-alpha accent the algorithm derives for exactly this.",
			selector: ".xoji-code-line[data-line-highlight]",
			tokens: ["--code-line-highlight"],
		},
	],
	props: [
		{
			name: "lang",
			type: "string",
			description: "The language id, with aliases resolved (`ts` → `typescript`). An unknown id falls back to plain-but-themed text.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "code",
			type: "string",
			description: "The source to highlight. Optional for html/svelte (the text content is used); the canonical input for Astro's build-time tokenization.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "preload",
			type: "boolean",
			default: "false",
			description: "Warm this block's grammar eagerly and emit a `modulepreload` hint, killing the minor recolor flash on known code-heavy pages.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "copy",
			type: "boolean",
			default: "true",
			description:
				"The copy-to-clipboard button. On by default; set `copy=\"false\"` to drop it. It only paints where it can work: hidden in an insecure context (no Clipboard API) and on the zero-JS Astro path.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "wrap",
			type: "boolean",
			default: "false",
			description:
				"Soft-wrap long lines instead of scrolling them horizontally. Purely declarative; the host attribute drives a CSS rule, so it needs no JavaScript and works on the zero-JS Astro path.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "line-numbers",
			type: "boolean",
			default: "false",
			description:
				"Number each line in a gutter that stays put while the code scrolls sideways. Tag-aware, so a token spanning lines (a block comment, a multi-line string) still numbers cleanly, and it co-operates with `wrap` (a wrapped line keeps a single number at its top). The gutter is pure derived chrome; it borrows `--code-comment` and `--field-border`, adding no tokens, and renders on the zero-JS Astro path too.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "highlight",
			type: "string",
			description:
				"Tint chosen lines with `--code-line-highlight` to call out the ones that matter: a 1-based spec like `2`, `2,4`, or `4-6`, mixable as `1,3-5,8`. Pairs with `line-numbers`, works under `wrap`, and renders on the zero-JS Astro path; it reuses a token the algorithm already derives, so it adds none.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "caption",
			type: "string",
			description:
				"A caption header above the block, typically a filename. Left empty, no header renders. It rounds the block's top corners into the strip and reads in the mono face; it reuses chrome tokens, so it adds none, and renders on the zero-JS Astro path.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [],
	slots: [
		{
			name: "default",
			description: "The source code as text content (html/svelte). For Astro, pass the source via the `code` prop instead.",
			bindings: ["html", "svelte"],
		},
	],
	consumedTokens: [
		"--code-bg",
		"--code-fg",
		"--code-selection",
		"--code-line-highlight",
		"--code-comment",
		"--code-punctuation",
		"--code-tag",
		"--code-number",
		"--code-string",
		"--code-attr",
		"--code-operator",
		"--code-keyword",
		"--code-function",
		"--code-type",
		"--code-regexp",
		"--code-variable",
		"--space-4",
		"--radius-md",
		"--font-mono",
		"--text-sm",
		"--leading-normal",
		"--space-1",
		"--space-2",
		"--neutral",
		"--neutral-bg",
		"--neutral-fg",
		"--neutral-text",
		"--field-border",
		"--border-thin",
		"--radius-sm",
		"--font-sans",
		"--text-xs",
		"--duration-fast",
		"--ease-standard",
		"--success",
		"--success-vivid",
	],
	composition: [
		"Set `lang` to the source's language; use an alias (`ts`, `html`, `js`) and it resolves to the canonical grammar.",
		"On a code-heavy page, call `XojiCode.warm([\"ts\", \"rust\"])` once at startup, or mark individual blocks `preload`, to load grammars before first paint.",
		"For a language Prism does not ship, register it with `XojiCode.registerLanguage(name, grammar)` and use that name as `lang`.",
		"Reach for the Astro binding when the code is known at build time; it ships pre-colored with zero grammar bytes in the browser.",
	],
	a11y: [
		"Renders semantic `<pre><code>`, so assistive tech announces the block as preformatted code.",
		"Coloring is presentational only: the token spans add no meaning, so the code reads identically with styles off.",
		"The copy control is a real `<button>` with an accessible name, keyboard-operable, and reachable on touch where there is no hover; on a successful copy its name updates to `Copied` so the action is announced.",
	],
	examples: [
		{
			id: "languages-and-preload",
			title: "Languages and preload",
			description: "A TypeScript block and a preloaded Rust block, both colored from the code-token family.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "soft-wrap",
			title: "Soft-wrap long lines",
			description:
				"`wrap` folds long lines into the column instead of scrolling them sideways. It's a declarative host attribute, so it needs no JavaScript and works on the static Astro path.",
			source: { html: htmlWrapExample, svelte: svelteWrapExample, astro: astroWrapExample },
		},
		{
			id: "line-numbers",
			title: "Line numbers",
			description:
				"`line-numbers` adds a counter gutter that sticks to the left edge as the code scrolls and keeps a single number per logical line even under `wrap`.",
			source: { html: htmlLineNumbersExample, svelte: svelteLineNumbersExample, astro: astroLineNumbersExample },
		},
		{
			id: "highlight-lines",
			title: "Highlighting lines",
			description:
				"`highlight` tints the lines that matter, via a 1-based spec like `2,4` or `4-6`, drawn from the `--code-line-highlight` token the algorithm already derives; it pairs with `line-numbers`.",
			source: { html: htmlHighlightExample, svelte: svelteHighlightExample, astro: astroHighlightExample },
		},
		{
			id: "caption",
			title: "A caption header",
			description:
				"`caption` adds a header strip above the block for a filename or label, rounding the top corners into it. It reuses chrome tokens and renders on the static Astro path.",
			source: { html: htmlCaptionExample, svelte: svelteCaptionExample, astro: astroCaptionExample },
		},
	],
};
