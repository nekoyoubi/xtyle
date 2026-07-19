/**
 * Markdown renders arbitrary document structure, so this styles element *types* rather than named
 * parts — every rule is scoped under `.xtyle-markdown__body`, which is the only place the renderer's
 * output lands. Nothing here escapes that box, so a consumer's own `<h2>`s are untouched.
 *
 * All of it derives: headings ride the type scale, rules and quotes ride the border and surface
 * ramps, and fenced code borrows the `--code-*` family the Code component already owns — so a fence
 * inside a document and an `<xtyle-code>` beside it agree without markdown knowing Prism exists.
 *
 * **Two rules below are load-bearing rather than stylistic, and both were found in a browser:**
 *
 * 1. **The wrappers are `<span>`s that CSS gives a `display` to.** `inline` exists to drop a label
 *    into running text, and running text is a `<p>`. A `<div>` is not allowed inside a `<p>`, so the
 *    parser *implicitly closes the paragraph* when it meets one — reparenting the scaffold out of the
 *    element and leaving it empty. The server's markup was byte-correct and the browser took it apart
 *    on the way in. Phrasing content is legal anywhere, so the boxes come from here instead.
 * 2. **Every `display` on a toggled node has a `[hidden]` counterpart.** `hidden` works through the
 *    UA's `[hidden] { display: none }`, which any class selector outranks — so a bare
 *    `.xtyle-markdown__editor { display: block }` silently wins and the node is on screen while
 *    `el.hidden` reports `true`. The editor rendered under every inline label before this existed.
 *
 * Both are guarded in `markdown.css.test.ts`, because neither is visible without layout or a parser.
 */
export const markdownCss = `
.xtyle-markdown {
	display: block;
	color: var(--fg-0);
	font-family: var(--font-sans);
	font-size: var(--text-body);
	line-height: var(--leading-normal);
}
.xtyle-markdown__body {
	display: block;
}
/* The label render flows with its surrounding text and inherits its type, so a tab title or a chip
   gets emphasis without the component imposing a size, a weight, or a box on it. */
.xtyle-markdown--inline,
.xtyle-markdown--inline .xtyle-markdown__body {
	display: inline;
	color: inherit;
	font: inherit;
	line-height: inherit;
}

/* Every display above on a toggled node needs this counterpart; see the note on the module. */
.xtyle-markdown__body[hidden],
.xtyle-markdown__editor[hidden] {
	display: none;
}

/* the vertical rhythm: every block shares one gap, and the first and last never push the box open */
.xtyle-markdown__body > * {
	margin-block: 0 var(--space-4);
}
.xtyle-markdown__body > *:last-child {
	margin-block-end: 0;
}
.xtyle-markdown__body > *:first-child {
	margin-block-start: 0;
}

.xtyle-markdown__body h1,
.xtyle-markdown__body h2,
.xtyle-markdown__body h3,
.xtyle-markdown__body h4,
.xtyle-markdown__body h5,
.xtyle-markdown__body h6 {
	margin-block: var(--space-6) var(--space-3);
	font-weight: var(--weight-semibold);
	line-height: var(--leading-tight);
	color: var(--fg-0);
}
.xtyle-markdown__body h1 { font-size: var(--text-2xl); }
.xtyle-markdown__body h2 { font-size: var(--text-xl); }
.xtyle-markdown__body h3 { font-size: var(--text-lg); }
.xtyle-markdown__body h4 { font-size: var(--text-body); }
.xtyle-markdown__body h5 { font-size: var(--text-sm); }
.xtyle-markdown__body h6 {
	font-size: var(--text-sm);
	color: var(--fg-2);
}
.xtyle-markdown__body h1,
.xtyle-markdown__body h2 {
	padding-block-end: var(--space-2);
	border-block-end: var(--border-thin) solid var(--field-border);
}

.xtyle-markdown__body p {
	margin-block: 0 var(--space-4);
}
.xtyle-markdown__body a {
	color: var(--accent-text);
	text-decoration: underline;
	text-underline-offset: 0.15em;
}
.xtyle-markdown__body a:hover {
	text-decoration-thickness: 2px;
}
/* a link the renderer refused a URL is inert: say so rather than leaving a lie that looks clickable */
.xtyle-markdown__body a:not([href]) {
	color: var(--fg-2);
	text-decoration: none;
	cursor: default;
}
.xtyle-markdown__body strong { font-weight: var(--weight-bold); }
.xtyle-markdown__body em { font-style: italic; }
.xtyle-markdown__body del { color: var(--fg-2); }
.xtyle-markdown__body small { font-size: var(--text-sm); }

.xtyle-markdown__body ul,
.xtyle-markdown__body ol {
	margin-block: 0 var(--space-4);
	padding-inline-start: var(--space-6);
}
.xtyle-markdown__body li { margin-block: var(--space-1); }
.xtyle-markdown__body li > ul,
.xtyle-markdown__body li > ol {
	margin-block: var(--space-1) 0;
}
/* a GFM task list carries its own bullet in the checkbox */
.xtyle-markdown__body li:has(> input[type="checkbox"]) {
	list-style: none;
	margin-inline-start: calc(var(--space-5) * -1);
}
.xtyle-markdown__body li > input[type="checkbox"] {
	margin-inline-end: var(--space-2);
	accent-color: var(--accent);
}

.xtyle-markdown__body blockquote {
	margin-block: 0 var(--space-4);
	margin-inline: 0;
	padding: var(--space-2) var(--space-4);
	border-inline-start: var(--space-1) solid var(--field-border);
	color: var(--fg-1);
}
.xtyle-markdown__body blockquote > *:last-child { margin-block-end: 0; }

.xtyle-markdown__body hr {
	margin-block: var(--space-6);
	border: 0;
	border-block-start: var(--border-thin) solid var(--field-border);
}

/* fences and inline code borrow the Code component's family, so the two agree in any theme */
.xtyle-markdown__body code {
	font-family: var(--font-mono);
	font-size: 0.9em;
	color: var(--code-fg);
	background: var(--code-bg);
	padding: 0.1em 0.3em;
	border-radius: var(--radius-sm);
}
.xtyle-markdown__body pre {
	margin-block: 0 var(--space-4);
	padding: var(--space-3);
	overflow-x: auto;
	color: var(--code-fg);
	background: var(--code-bg);
	border: var(--border-thin) solid var(--field-border);
	border-radius: var(--radius-md);
}
.xtyle-markdown__body pre code {
	padding: 0;
	background: none;
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
}

/* wide content scrolls inside its own box rather than pushing the document sideways */
.xtyle-markdown__body table {
	display: block;
	max-width: 100%;
	overflow-x: auto;
	margin-block: 0 var(--space-4);
	border-collapse: collapse;
	font-size: var(--text-sm);
}
.xtyle-markdown__body th,
.xtyle-markdown__body td {
	padding: var(--space-2) var(--space-3);
	border: var(--border-thin) solid var(--field-border);
	text-align: start;
}
.xtyle-markdown__body th {
	font-weight: var(--weight-semibold);
	background: var(--bg-2);
}
.xtyle-markdown__body tbody tr:nth-child(even) {
	background: var(--bg-1);
}

.xtyle-markdown__body img {
	max-width: 100%;
	height: auto;
	border-radius: var(--radius-sm);
}

.xtyle-markdown__editor {
	display: block;
	width: 100%;
	min-height: 12rem;
	padding: var(--space-3);
	color: var(--fg-0);
	background: var(--field-bg);
	border: var(--border-thin) solid var(--field-border);
	border-radius: var(--radius-md);
	font-family: var(--font-mono);
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
	resize: vertical;
}
.xtyle-markdown__editor:focus-visible {
	outline: var(--border-normal) solid var(--accent);
	outline-offset: 2px;
}

.xtyle-markdown__controls {
	display: flex;
	justify-content: flex-end;
	margin-block-start: var(--space-2);
}
.xtyle-markdown__toggle {
	padding: var(--space-1) var(--space-3);
	color: var(--neutral-text);
	background: var(--neutral-bg);
	border: var(--border-thin) solid var(--field-border);
	border-radius: var(--radius-sm);
	font-family: var(--font-sans);
	font-size: var(--text-xs);
	cursor: pointer;
	transition: color var(--duration-fast) var(--ease-standard), background var(--duration-fast) var(--ease-standard);
}
.xtyle-markdown__toggle:hover {
	color: var(--fg-0);
	background: var(--bg-2);
}
.xtyle-markdown__toggle:focus-visible {
	outline: var(--border-normal) solid var(--accent);
	outline-offset: 2px;
}
.xtyle-markdown__toggle[aria-pressed="true"] {
	color: var(--accent-text);
	border-color: var(--accent);
}
`.trim();
