import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-bbcode source="[b]Patch notes[/b]

The [i]tooltip[/i] now tracks its trigger. See [url=/changelog]the changelog[/url].

[list]
[*]fixed placement under scroll
[*][color=accent]Escape[/color] dismisses a hover-raised hint
[/list]"></xtyle-bbcode>`;

const svelteExample = `<script lang="ts">
	import { Bbcode } from "@xtyle/svelte";

	const notes = \`[b]Patch notes[/b]

The [i]tooltip[/i] now tracks its trigger. See [url=/changelog]the changelog[/url].\`;
</script>

<Bbcode source={notes} />`;

const astroExample = `---
import Bbcode from "@xtyle/astro/Bbcode.astro";

const notes = \`[b]Patch notes[/b]

The [i]tooltip[/i] now tracks its trigger.\`;
---

<Bbcode source={notes} />`;

const htmlInlineExample = `<!-- a label, not a document: emphasis renders, blocks stay out of the way -->
<xtyle-bbcode inline source="Fix [b]tooltip[/b] in [color=accent]AnchorTracker[/color]"></xtyle-bbcode>`;

const svelteInlineExample = `<script lang="ts">
	import { Bbcode } from "@xtyle/svelte";

	// a forum-authored title dropped straight into a tab strip
	export let title = "Fix [b]tooltip[/b] in [color=accent]AnchorTracker[/color]";
</script>

<Bbcode inline source={title} />`;

const astroInlineExample = `---
import Bbcode from "@xtyle/astro/Bbcode.astro";
---

<Bbcode inline source="Fix [b]tooltip[/b] in [color=accent]AnchorTracker[/color]" />`;

const htmlVocabExample = `<!-- the story body admits the app's own [choice]; the bio beside it cannot -->
<xtyle-bbcode vocabulary="story" source="You reach the fork. [choice]Go north[/choice]"></xtyle-bbcode>
<xtyle-bbcode vocabulary="bio" source="Writes fiction. [choice]nope[/choice]"></xtyle-bbcode>

<script type="module">
	import { registerBbcodeTags, defineBbcodeVocabulary } from "@xtyle/core/elements";

	registerBbcodeTags([
		{ name: "choice", block: true, render: (c) => \`<xtyle-button variant="outline" block>\${c.content}</xtyle-button>\` },
	]);
	defineBbcodeVocabulary("story", ["b", "i", "url", "quote", "choice"]);
	defineBbcodeVocabulary("bio", ["b", "i", "url"]);
</script>`;

const svelteVocabExample = `<script lang="ts">
	import { Bbcode } from "@xtyle/svelte";
	import { registerBbcodeTags, defineBbcodeVocabulary } from "@xtyle/core/elements";

	registerBbcodeTags([
		{ name: "choice", block: true, render: (c) => \`<xtyle-button variant="outline" block>\${c.content}</xtyle-button>\` },
	]);
	defineBbcodeVocabulary("story", ["b", "i", "url", "choice"]);
	defineBbcodeVocabulary("bio", ["b", "i", "url"]);
</script>

<Bbcode vocabulary="story" source="You reach the fork. [choice]Go north[/choice]" />
<Bbcode vocabulary="bio" source="Writes fiction. [choice]nope[/choice]" />`;

const astroVocabExample = `---
import Bbcode from "@xtyle/astro/Bbcode.astro";
import { defineBbcodeVocabulary } from "@xtyle/core/elements/bbcode-registry.js";

defineBbcodeVocabulary("bio", ["b", "i", "url"]);
---

<Bbcode vocabulary="bio" source="Writes fiction. [b]Three novels.[/b]" />`;

const htmlBlocksExample = `<xtyle-bbcode source="[quote=ada]The Analytical Engine weaves algebraic patterns.[/quote]

[spoiler=Ending]She was the engine all along.[/spoiler]

[code=ts]const theme = derive({ bg: '#0f1115' });[/code]"></xtyle-bbcode>`;

const svelteBlocksExample = `<script lang="ts">
	import { Bbcode } from "@xtyle/svelte";
</script>

<Bbcode source={\`[quote=ada]The Analytical Engine weaves algebraic patterns.[/quote]

[spoiler=Ending]She was the engine all along.[/spoiler]\`} />`;

const astroBlocksExample = `---
import Bbcode from "@xtyle/astro/Bbcode.astro";
---

<Bbcode source={\`[quote=ada]The Analytical Engine weaves algebraic patterns.[/quote]

[spoiler=Ending]She was the engine all along.[/spoiler]\`} />`;

const htmlMarkdownExample = `<!-- both languages in one body: the quote is BBCode, the emphasis is markdown -->
<xtyle-markdown process-bbcode source="## Release notes

[quote=ada]It **weaves** algebraic patterns.[/quote]

Written in \\\`markdown\\\` with [color=accent]BBCode[/color] alongside."></xtyle-markdown>`;

const svelteMarkdownExample = `<script lang="ts">
	import { Markdown } from "@xtyle/svelte";

	// forum-shaped input in a markdown document, one vocabulary for both
	const body = "## Notes\\n\\n[quote=ada]It **weaves** patterns.[/quote]";
</script>

<Markdown processBbcode source={body} />`;

const astroMarkdownExample = `---
import Markdown from "@xtyle/astro/Markdown.astro";
---

<!-- a string names a vocabulary; \`true\` uses the whole registry -->
<Markdown processBbcode="story" source={"## Notes\\n\\n[quote=ada]It **weaves** patterns.[/quote]"} />`;

const htmlEditableExample = `<xtyle-bbcode editable source="[b]Draft[/b]

Switch to the source and edit it."></xtyle-bbcode>`;

const svelteEditableExample = `<script lang="ts">
	import { Bbcode } from "@xtyle/svelte";

	let draft = "[b]Draft[/b]\\n\\nSwitch to the source and edit it.";
</script>

<Bbcode editable source={draft} on:input={(e) => (draft = e.detail.source)} />`;

const astroEditableExample = `---
import Bbcode from "@xtyle/astro/Bbcode.astro";
---

<Bbcode editable source={"[b]Draft[/b]\\n\\nSwitch to the source and edit it."} />`;

export const bbcodeManifest: ComponentManifest = {
	id: "bbcode",
	name: "BBCode",
	category: "content",
	since: "0.10.0",
	keywords: ["forum", "phpbb", "vbulletin", "rich text", "markup", "render", "tags", "vocabulary"],
	seeAlso: ["markdown", "code", "text"],
	summary: "Renders BBCode as themed HTML over a named, extensible tag vocabulary — as a document or an inline label.",
	description:
		"BBCode renders forum-style markup into HTML that themes entirely from the token register: quotes and rules ride the border and surface ramps, sizes ride the type scale, and `[code]` renders a real `<xtyle-code>` so a code block inside a post and an `<xtyle-code>` beside it agree in any theme. The roster is **phpBB's core set** — `[b]`, `[i]`, `[u]`, `[url]`, `[img]`, `[email]`, `[quote]`, `[code]`, `[list]`/`[*]`, `[color]`, `[size]` — plus declared extensions where the major dialects agree: `[s]`, `[sub]`/`[sup]`, `[mark]`, `[font]`, `[bg]`, `[spoiler]`, `[noparse]`, `[hr]`, `[br]`, `[h1]`–`[h6]`, `[table]`/`[tr]`/`[td]`/`[th]`, and the four alignments. `inline` switches to a label render for a chip or a tab title. **It ships no sanitizer, and unlike Markdown there is no `allowHtml` either** — BBCode has no raw-HTML passthrough to lift, so everything that is not a registered tag is escaped to text and every tag emits markup the renderer wrote itself, from a bounded set. The two places an author's value still reaches an attribute are handled by name: URLs go through the same scheme allowlist Markdown uses, and style values (`[color]`, `[size]`, `[font]`, `[bg]`) are matched against narrow patterns rather than escaped, because `red;background:url(…)` survives escaping intact and is still a second declaration. **`vocabulary` is the interesting attribute.** One registry backs every instance and a vocabulary is a named subset of it, so a story body can admit `[choice]` while an author bio beside it cannot — refusal by construction rather than by filtering afterward. `registerBbcodeTags` adds tags, `defineBbcodeVocabulary` composes them into a named set, and an instance picks one by name; a tag outside the set renders as its literal text. The same seam is reachable from Markdown through `processBbcode`, which composes both languages in one body.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "body",
			description:
				"Where the rendered BBCode lands. Unlike the Markdown body, every rule here is keyed to the renderer's own class names rather than to element types — which is what makes a single tag reskinnable without touching the rest. Carries `data-vocabulary` naming the vocabulary the body rendered under, so the choice is visible where the markup landed.",
			selector: ".xtyle-bbcode__body",
			tokens: ["--fg-0", "--font-sans", "--text-body", "--leading-normal"],
		},
		{
			name: "quote",
			description: "A `[quote]`, marked by a leading accent edge on a raised surface, with its attribution above it.",
			selector: ".xtyle-bbcode__quote",
			tokens: ["--fg-1", "--fg-2", "--bg-1", "--accent", "--space-4", "--radius-sm"],
		},
		{
			name: "spoiler",
			description:
				"A `[spoiler]`, rendered as a one-section Accordion — so it reveals with no JavaScript, and a mod reshapes it through the Accordion's own fill rather than through a shape this tag invented.",
			selector: "xtyle-accordion",
			tokens: [],
		},
		{
			name: "list",
			description: "A `[list]`, ordered or not. Items are split on `[*]` rather than closed individually, as BBCode writes them.",
			selector: ".xtyle-bbcode__list",
			tokens: ["--space-1", "--space-3", "--space-6"],
		},
		{
			name: "table",
			description: "A `[table]` with a filled header row and ruled cells.",
			selector: "xtyle-table",
			tokens: [],
		},
		{
			name: "link",
			description: "A `[url]` or `[email]`, on the accent, warming to the body color on hover.",
			selector: "xtyle-link",
			tokens: [],
		},
		{
			name: "editor",
			description: "The source textarea shown while editing, in the mono face on the field surface.",
			selector: ".xtyle-bbcode__editor",
			tokens: [],
		},
		{
			name: "toggle",
			description:
				"The edit/view switch. Chrome the component invents, so it is a real node in the fragment fill: a mod can reword it, make it an icon, or move it, and the element keeps working.",
			selector: ".xtyle-bbcode__toggle",
			tokens: [],
		},
	],
	props: [
		{
			name: "source",
			type: "string",
			description: "The BBCode to render. Optional for html/svelte, where the element's text content is used instead.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "inline",
			type: "boolean",
			default: "false",
			description:
				"Render as a label rather than a document. It flows with the surrounding text and inherits its type, so it fits a tab title, a chip, or a table cell.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "vocabulary",
			type: "string",
			description:
				"Which named tag vocabulary this instance may reach. Absent, the whole registry is in play. A tag outside the set is inert and renders as its literal text, so one surface can accept a tag another refuses without running a second renderer or filtering afterward. A name nobody declared falls back to the whole registry rather than rendering nothing — a vocabulary that refuses everything looks exactly like a bug, so a typo degrades to permissive-and-visible instead of silently blanking a body.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "markdown",
			type: "boolean",
			default: "false",
			description:
				"Also run markdown's inline renderer over the prose between tags, so a body can carry `**bold**` and `[color=accent]` at once. For the composed *block* render, use the Markdown component's `processBbcode` instead — this is the label-shaped half of the same seam.",
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
			description:
				"Whether the source view is showing. Only meaningful alongside `editable`; setting it alone would strand the reader in a box with no way out, so it is ignored.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [
		{
			name: "editing",
			description: "The source view is showing: the body is swapped for the textarea and the toggle reads as pressed.",
			selector: ".xtyle-bbcode__toggle[aria-pressed='true']",
			tokens: ["--accent", "--accent-text"],
		},
		{
			name: "revealed",
			description: "An open `[spoiler]`, its body shown beneath the summary.",
			selector: "xtyle-accordion [data-open]",
			tokens: [],
		},
	],
	slots: [
		{
			name: "default",
			description: "The BBCode as text content (html/svelte). For Astro, pass it via the `source` prop instead.",
			bindings: ["html", "svelte"],
		},
	],
	consumedTokens: [
		"--accent",
		"--bg-1",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--font-sans",
		"--leading-normal",
		"--radius-sm",
		"--space-1",
		"--space-2",
		"--space-3",
		"--space-4",
		"--space-6",
		"--text-body",
		"--text-sm",
		"--text-xs",
		"--warn-bg",
		"--warn-text",
		"--weight-bold",
		"--weight-semibold",
	],
	composition: [
		"Reach for BBCode wherever the *authors* are untrusted and the markup should be bounded: forum posts, comments, user bios, in-game text. The format has no HTML passthrough at all, so there is no equivalent of `allowHtml` to get wrong.",
		"`vocabulary` is the feature to design around, not an afterthought. Declare one vocabulary per surface — a story body, an author bio, a comment — and an instance can only ever render what that surface admits. It is cheaper and far more legible than filtering rendered output, and it fails closed by construction.",
		"Import `registerBbcodeTags` / `defineBbcodeVocabulary` from `@xtyle/core/elements` — not from `@xtyle/core/markup`. The registry is module state, and the elements entry is the one that shares an instance with the components reading it. Where the same declaration has to run at build time too (an Astro frontmatter beside its client script), import the leaf `@xtyle/core/elements/bbcode-registry.js`, which pulls in the registry without evaluating any custom element and so works in Node as well as the browser. Registering after an element has already painted is fine either way: live components repaint when the roster changes, so script order is not a race you have to win.",
		"Adding a tag is `registerBbcodeTags([{ name, render }])`. The handler returns markup, and whatever it returns still passes the fragment format declared in `component-host.json` — so a third-party tag cannot emit `<script>` however it is written. That floor is what makes an open tag registry safe rather than reckless. It also cuts the other way: the format's vocabulary admits **xtyle's own components**, so a handler should return an `<xtyle-button>` or an `<xtyle-alert>` rather than a bare element, and inherit the real hover, focus ring, and disabled treatment instead of re-deriving them.",
		"Registering a tag does not expose it. It is reachable only where a vocabulary lists it, so installing a pack of tags is not the same as turning them on everywhere.",
		"Use the Markdown component's `processBbcode` when a body should carry both languages. The two renderers never read each other's output: BBCode constructs are lifted out before markdown parses and dropped back in afterward, and prose inside a construct still gets markdown's inline render.",
		"Most of the roster renders xtyle's own components rather than markup with a private stylesheet: `[code]` is a Code, `[spoiler]` an Accordion, `[url]` a Link, `[img]` an Image, `[hr]` a Separator, `[h1]`–`[h6]` a Heading, and `[table]` a Table around the author's own `<table>`. Each of those owns its own fragment, so none of it is furniture this component invented, and a mod reshapes it through a surface it already knows. `[list]` is the deliberate exception: the List component is the reference skin over the collection substrate, with a roving tab stop and a selection model, and a run of bullets in a paragraph is none of those.",
		"An image or link that renders blank is usually a scheme rather than a bug: xtyle allows `http`, `https`, `mailto`, `tel` and `data`, and nothing else until an app says so. `allowUriSchemes()` from `@xtyle/core/elements` widens the renderer and the fragment format together.",
		"Pair `editable` with the `input` event to keep your own state in sync; the event's `detail.source` carries the BBCode as it's typed.",
	],
	a11y: [
		"Renders semantic structure — real `<blockquote>` with `<cite>`, `<ul>`/`<ol>`, `<table>` with `<th>`, `<h1>`–`<h6>` — so assistive tech announces the content's shape rather than a wall of text.",
		"`[spoiler]` renders an Accordion, which is `<details>`-backed — focusable, operable from the keyboard, and announced as a disclosure, without this component implementing any of it.",
		"`inline` emits no headings or landmarks, which is what makes it safe to drop into a tab title or a chip.",
		"The edit/view toggle is a real `<button>` carrying `aria-pressed`, so its state is announced; the source textarea has an accessible name.",
		"A `[url]` whose scheme was refused renders as plain text rather than a link that does nothing, so it is skipped by link navigation.",
		"`[color]`, `[bg]` and `[size]` are author-controlled, so a body can be authored into poor contrast. Where authors are untrusted and contrast matters, leave those three out of the vocabulary — which is exactly the kind of decision the vocabulary layer exists to make once, structurally.",
	],
	examples: [
		{
			id: "document",
			title: "A document",
			description: "The block render: emphasis, links, lists and color, themed from the register.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "inline-label",
			title: "An inline label",
			description: "The label render, flowing with the text around it and inheriting its type.",
			source: { html: htmlInlineExample, svelte: svelteInlineExample, astro: astroInlineExample },
		},
		{
			id: "blocks",
			title: "Quotes, spoilers, and code",
			description:
				"`[quote]` attributes, `[spoiler]` is a native disclosure, and `[code]` hands off to the Code component.",
			source: { html: htmlBlocksExample, svelte: svelteBlocksExample, astro: astroBlocksExample },
		},
		{
			id: "vocabulary",
			title: "Two vocabularies, one registry",
			description:
				"The same custom `[choice]` tag is reachable in the story body and inert in the bio, because the bio's vocabulary doesn't list it.",
			source: { html: htmlVocabExample, svelte: svelteVocabExample, astro: astroVocabExample },
		},
		{
			id: "with-markdown",
			title: "Both languages at once",
			description:
				"The Markdown component's `processBbcode` composes the two: the quote comes from BBCode, the emphasis inside it from markdown.",
			source: { html: htmlMarkdownExample, svelte: svelteMarkdownExample, astro: astroMarkdownExample },
		},
		{
			id: "editable",
			title: "With a source view",
			description: "`editable` adds the toggle the fill draws, emitting `input` as the source is typed.",
			source: { html: htmlEditableExample, svelte: svelteEditableExample, astro: astroEditableExample },
		},
	],
};
