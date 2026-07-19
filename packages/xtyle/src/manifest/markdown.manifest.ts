import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-markdown source="## Release notes

The **tooltip** now tracks its trigger. See [the changelog](/changelog).

- fixed placement under scroll
- \`Escape\` dismisses a hover-raised hint"></xtyle-markdown>`;

const svelteExample = `<script lang="ts">
	import { Markdown } from "@xtyle/svelte";

	const notes = \`## Release notes

The **tooltip** now tracks its trigger. See [the changelog](/changelog).\`;
</script>

<Markdown source={notes} />`;

const astroExample = `---
import Markdown from "@xtyle/astro/Markdown.astro";

const notes = \`## Release notes

The **tooltip** now tracks its trigger. See [the changelog](/changelog).\`;
---

<Markdown source={notes} />`;

const htmlInlineExample = `<!-- a label, not a document: emphasis renders, blocks stay literal -->
<xtyle-markdown inline source="Fix **tooltip** in \`AnchorTracker\`"></xtyle-markdown>`;

const svelteInlineExample = `<script lang="ts">
	import { Markdown } from "@xtyle/svelte";

	// a tab title an LLM formatted, dropped straight into a tab strip
	export let title = "Fix **tooltip** in \`AnchorTracker\`";
</script>

<Markdown inline source={title} />`;

const astroInlineExample = `---
import Markdown from "@xtyle/astro/Markdown.astro";
---

<Markdown inline source="Fix **tooltip** in \`AnchorTracker\`" />`;

const htmlEditableExample = `<xtyle-markdown editable source="# Draft

Switch to the source and edit it."></xtyle-markdown>`;

const svelteEditableExample = `<script lang="ts">
	import { Markdown } from "@xtyle/svelte";

	let draft = "# Draft\\n\\nSwitch to the source and edit it.";
</script>

<Markdown editable source={draft} on:input={(e) => (draft = e.detail.source)} />`;

const astroEditableExample = `---
import Markdown from "@xtyle/astro/Markdown.astro";
---

<Markdown editable source={"# Draft\\n\\nSwitch to the source and edit it."} />`;

const htmlGfmExample = `<xtyle-markdown source="| component | state |
| --- | --- |
| tooltip | fixed |
| swatch | fixed |

- [x] track the anchor
- [ ] name the version"></xtyle-markdown>`;

const svelteGfmExample = `<script lang="ts">
	import { Markdown } from "@xtyle/svelte";
</script>

<Markdown source={\`| component | state |
| --- | --- |
| tooltip | fixed |

- [x] track the anchor
- [ ] name the version\`} />`;

const astroGfmExample = `---
import Markdown from "@xtyle/astro/Markdown.astro";
---

<Markdown source={\`| component | state |
| --- | --- |
| tooltip | fixed |

- [x] track the anchor\`} />`;

export const markdownManifest: ComponentManifest = {
	id: "markdown",
	name: "Markdown",
	category: "content",
	since: "0.9.0",
	keywords: ["md", "gfm", "rich text", "prose", "render", "commonmark", "editor"],
	seeAlso: ["code", "text", "heading"],
	summary: "Renders markdown as themed HTML, as a document or as an inline label, with an optional source view.",
	description:
		"Markdown renders GitHub-Flavored Markdown into HTML that themes entirely from the token register: headings ride the type scale, rules and quotes ride the border and surface ramps, and fenced code borrows the same `--code-*` family the Code component owns, so a fence inside a document and an `<xtyle-code>` beside it agree in any theme. GFM is on — tables, task lists, strikethrough, and autolinks all render. `inline` switches to a label render: emphasis, code, links and strikethrough, but no blocks and no paragraph wrapper, so it drops into a tab title or a chip and inherits its type — a generated label that opens with `# ` stays text instead of erupting a heading into a tab strip. `editable` adds a source view the reader can switch to, emitting `input` as it is typed. **It ships no sanitizer, by design.** Raw HTML in the source is escaped to text rather than rendered, and link and image URLs are written from a scheme allowlist, so everything that reaches the DOM is markup the renderer generated itself from a closed token set. There is no `allow-html` escape hatch: it would reintroduce the arbitrary-HTML problem the design exists to avoid.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "body",
			description:
				"Where the rendered markdown lands. Every rule is scoped inside it and styles element types rather than named parts, since the content's structure is the author's, not ours — so nothing here reaches a consumer's own headings.",
			selector: ".xtyle-markdown__body",
			tokens: ["--fg-0", "--font-sans", "--text-body", "--leading-normal", "--space-4"],
		},
		{
			name: "heading",
			description: "Document headings, on the type scale; `h1` and `h2` carry a rule beneath them.",
			selector: ".xtyle-markdown__body h1, .xtyle-markdown__body h2",
			tokens: ["--text-2xl", "--text-xl", "--weight-semibold", "--leading-tight", "--field-border"],
		},
		{
			name: "code",
			description:
				"Inline code and fenced blocks, borrowing the Code component's `--code-fg` / `--code-bg` rather than deriving a second opinion about what code looks like.",
			selector: ".xtyle-markdown__body code, .xtyle-markdown__body pre",
			tokens: ["--code-fg", "--code-bg", "--font-mono", "--radius-md", "--field-border"],
		},
		{
			name: "table",
			description: "A GFM table: striped rows, a filled header, and its own horizontal scroll so a wide table never pushes the document sideways.",
			selector: ".xtyle-markdown__body table",
			tokens: ["--bg-1", "--bg-2", "--field-border", "--text-sm", "--weight-semibold"],
		},
		{
			name: "quote",
			description: "A blockquote, marked by a leading edge and dimmed a step off the body text.",
			selector: ".xtyle-markdown__body blockquote",
			tokens: ["--fg-1", "--field-border", "--space-4"],
		},
		{
			name: "editor",
			description: "The source textarea shown while editing, in the mono face on the field surface.",
			selector: ".xtyle-markdown__editor",
			tokens: ["--field-bg", "--field-border", "--font-mono", "--text-sm", "--radius-md", "--accent"],
		},
		{
			name: "toggle",
			description:
				"The edit/view switch. Chrome the component invents, so it is a real node in the fragment fill: a mod can reword it, make it an icon, or move it, and the element keeps working.",
			selector: ".xtyle-markdown__toggle",
			tokens: ["--neutral-bg", "--neutral-text", "--field-border", "--radius-sm", "--text-xs", "--accent-text"],
		},
	],
	props: [
		{
			name: "source",
			type: "string",
			description: "The markdown to render. Optional for html/svelte, where the element's text content is used instead.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "inline",
			type: "boolean",
			default: "false",
			description:
				"Render as a label rather than a document: emphasis, code, links and strikethrough, with no blocks and no paragraph wrapper. It flows with the surrounding text and inherits its type, so it fits a tab title, a chip, or a table cell. Block syntax stays literal instead of erupting.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "editable",
			type: "boolean",
			default: "false",
			description: "Offer a source view the reader can switch to, via a toggle the fragment fill draws.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "editing",
			type: "boolean",
			default: "false",
			description: "Whether the source view is showing. Only meaningful alongside `editable`; setting it alone would strand the reader in a box with no way out, so it is ignored.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [
		{
			name: "editing",
			description: "The source view is showing: the body is swapped for the textarea and the toggle reads as pressed.",
			selector: ".xtyle-markdown__toggle[aria-pressed='true']",
			tokens: ["--accent-text", "--accent"],
		},
		{
			name: "inert-link",
			description:
				"A link whose URL the renderer refused — a `javascript:` href, say. It keeps its text but loses its `href`, and reads dimmed and unclickable rather than lying about being a link.",
			selector: ".xtyle-markdown__body a:not([href])",
			tokens: ["--fg-2"],
		},
	],
	slots: [
		{
			name: "default",
			description: "The markdown as text content (html/svelte). For Astro, pass it via the `source` prop instead.",
			bindings: ["html", "svelte"],
		},
	],
	consumedTokens: [
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--bg-1",
		"--bg-2",
		"--accent",
		"--accent-text",
		"--code-fg",
		"--code-bg",
		"--neutral-bg",
		"--neutral-text",
		"--field-bg",
		"--field-border",
		"--border-thin",
		"--border-normal",
		"--radius-sm",
		"--radius-md",
		"--font-sans",
		"--font-mono",
		"--text-xs",
		"--text-sm",
		"--text-body",
		"--text-lg",
		"--text-xl",
		"--text-2xl",
		"--weight-semibold",
		"--weight-bold",
		"--leading-normal",
		"--leading-tight",
		"--space-1",
		"--space-2",
		"--space-3",
		"--space-4",
		"--space-5",
		"--space-6",
		"--duration-fast",
		"--ease-standard",
	],
	composition: [
		"Reach for `inline` whenever the markdown is a label rather than a document — a tab title, a chip, a table cell, a menu item. It inherits the type around it instead of imposing its own.",
		"Untrusted markdown needs no extra handling: raw HTML is escaped and URLs are allowlisted, so an LLM-authored or user-authored string is safe to pass straight in.",
		"Pair `editable` with the `input` event to keep your own state in sync; the event's `detail.source` carries the markdown as it's typed.",
		"A fenced block inside a document borrows the same `--code-*` tokens as `<xtyle-code>`, so the two agree without any configuration.",
	],
	a11y: [
		"Renders semantic document structure — real `<h1>`–`<h6>`, `<ul>`/`<ol>`, `<table>` with `<th>`, `<blockquote>` — so assistive tech announces the content's shape rather than a wall of text.",
		"`inline` emits no headings or landmarks, which is what makes it safe to drop into a tab title or a chip: a label never injects document structure into a strip of them.",
		"The edit/view toggle is a real `<button>` carrying `aria-pressed`, so its state is announced; the source textarea has an accessible name.",
		"A link whose URL was refused loses its `href`, so it is skipped by link navigation rather than being announced as a link that does nothing.",
		"A wide table scrolls inside its own box rather than the page, so the document never scrolls horizontally (WCAG 1.4.10).",
	],
	examples: [
		{
			id: "document",
			title: "A document",
			description: "The block render: headings, emphasis, links and lists, themed from the register.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "inline-label",
			title: "An inline label",
			description:
				"`inline` renders emphasis without blocks and without a paragraph wrapper, so a generated tab title or chip inherits its surroundings. Block syntax stays literal — a leading `#` is text, not a heading.",
			source: { html: htmlInlineExample, svelte: svelteInlineExample, astro: astroInlineExample },
		},
		{
			id: "gfm",
			title: "Tables and task lists",
			description: "GFM is on: tables, task lists, strikethrough and autolinks all render. A wide table scrolls inside its own box.",
			source: { html: htmlGfmExample, svelte: svelteGfmExample, astro: astroGfmExample },
		},
		{
			id: "editable",
			title: "An editable source view",
			description: "`editable` adds a toggle between the render and its markdown source, emitting `input` with the source as it's typed.",
			source: { html: htmlEditableExample, svelte: svelteEditableExample, astro: astroEditableExample },
		},
	],
};
