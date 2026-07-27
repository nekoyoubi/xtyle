/**
 * What is left after the roster hands its work to the components that already do it.
 *
 * Most BBCode tags render an xtyle component rather than markup with a private stylesheet: `[code]`
 * is a Code, `[spoiler]` an Accordion, `[url]` a Link, `[img]` an Image, `[hr]` a Separator,
 * `[h1]`–`[h6]` a Heading, `[table]` a Table around the author's own `<table>`, and the fill's edit
 * chrome is a Textarea and a Button. Each of those owns its own fragment, so a mod reshapes them
 * through the surface it already knows, and a theme reaches them the same way it reaches every other
 * control on the page — none of it is restated here.
 *
 * What remains is the part no component covers: the host and body boxes, the inline transliterations
 * (`[b]` → `<strong>` and friends, which invent nothing), the quote, the prose list, and alignment.
 *
 * **The two load-bearing rules the markdown sheet carries apply here, for the same reasons:**
 *
 * 1. **The wrappers are `<span>`s that CSS gives a `display` to.** `inline` drops a label into running
 *    text, and a `<div>` inside a `<p>` makes the parser implicitly close the paragraph and reparent
 *    the scaffold out of the element. Phrasing content is legal anywhere, so the boxes come from here.
 * 2. **Every `display` on a toggled node has a `[hidden]` counterpart**, because `hidden` works through
 *    the UA's `[hidden] { display: none }` and any class selector outranks it.
 */
export const bbcodeCss = `
.xtyle-bbcode {
	display: block;
	color: var(--fg-0);
	font-family: var(--font-sans);
	font-size: var(--text-body);
	line-height: var(--leading-normal);
}
.xtyle-bbcode__body {
	display: block;
}
/* The label render flows with its surrounding text and inherits its type, so a chip or a tab title
   gets emphasis without the component imposing a size, a weight, or a box on it. */
.xtyle-bbcode--inline,
.xtyle-bbcode--inline .xtyle-bbcode__body {
	display: inline;
	color: inherit;
	font: inherit;
	line-height: inherit;
}

/* Every display above on a toggled node needs this counterpart; see the note on the module. */
.xtyle-bbcode__body[hidden],
.xtyle-bbcode__editor[hidden] {
	display: none;
}

.xtyle-bbcode__body > :first-child { margin-top: 0; }
.xtyle-bbcode__body > :last-child { margin-bottom: 0; }

/* ── transliterations: a tag that maps onto an element one-for-one and invents nothing ────────── */

.xtyle-bbcode__b { font-weight: var(--weight-bold); }
.xtyle-bbcode__i { font-style: italic; }
.xtyle-bbcode__u { text-underline-offset: 0.2em; }
.xtyle-bbcode__s { text-decoration-color: var(--fg-2); }
.xtyle-bbcode__sub,
.xtyle-bbcode__sup { font-size: var(--text-xs); }
/* The same pair the Markdown body gives a mark element, so a highlight reads identically whichever
   language wrote it. */
.xtyle-bbcode__mark {
	padding: 0.1em 0.3em;
	border-radius: var(--radius-sm);
	background-color: var(--warn-bg);
	color: var(--warn-text);
}

/* ── the blocks with no component of their own ───────────────────────────────────────────────── */

.xtyle-bbcode__quote {
	margin: var(--space-4) 0;
	padding: var(--space-2) var(--space-4);
	border-left: var(--space-1) solid var(--accent);
	background: var(--bg-1);
	border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
	color: var(--fg-1);
}
.xtyle-bbcode__cite {
	display: block;
	margin-bottom: var(--space-1);
	color: var(--fg-2);
	font-size: var(--text-sm);
	font-style: normal;
	font-weight: var(--weight-semibold);
}

/* A prose list, deliberately *not* the List component: that one is the reference skin over the
   collection substrate, with a roving tab stop and a selection model, and a run of bullets in a
   paragraph is none of those things. */
.xtyle-bbcode__list {
	margin: var(--space-3) 0;
	padding-left: var(--space-6);
}
.xtyle-bbcode__li { margin: var(--space-1) 0; }

.xtyle-bbcode__align { margin: var(--space-3) 0; }
.xtyle-bbcode__align--left { text-align: left; }
.xtyle-bbcode__align--center { text-align: center; }
.xtyle-bbcode__align--right { text-align: right; }
.xtyle-bbcode__align--justify { text-align: justify; }

/* ── the edit chrome ─────────────────────────────────────────────────────────────────────────── */

/* The Textarea and Button own their own appearance; all that is left is where they sit. */
.xtyle-bbcode__editor { display: block; }
.xtyle-bbcode__controls {
	display: flex;
	justify-content: flex-end;
	margin-top: var(--space-2);
}
`;
