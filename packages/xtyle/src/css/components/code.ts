export const codeCss = `
.xtyle-code {
	margin: 0;
	padding: var(--space-4);
	overflow: auto;
	color: var(--code-fg);
	background: var(--code-bg);
	border-radius: var(--radius-md);
	font-family: var(--font-mono);
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
	tab-size: 2;
}
/* A block wide enough to scroll horizontally is made tabbable (see the element); an outline sits
   outside the border box, so the scrolled code can't cover it. */
.xtyle-code:focus-visible {
	outline: var(--border-thick) solid var(--ring);
	outline-offset: 2px;
}
/* Unlike the rest of the set (which keys state off .xtyle-x--variant classes), code drives state off
   host attributes, so each state needs both a shadow (:host) and a light-DOM (xtyle-code) selector:
   :host only matches a shadow host, and the element renders light DOM over Astro SSR. */
:host([wrap]) .xtyle-code,
xtyle-code[wrap] .xtyle-code {
	white-space: pre-wrap;
	overflow-wrap: anywhere;
}
.xtyle-code code {
	font-family: inherit;
	color: inherit;
	background: none;
}
.xtyle-code-line { display: block; }
:host([highlight]) .xtyle-code code,
xtyle-code[highlight] .xtyle-code code { display: block; width: max-content; min-width: 100%; }
:host([highlight][wrap]) .xtyle-code code,
xtyle-code[highlight][wrap] .xtyle-code code { width: auto; }
.xtyle-code-line[data-line-highlight] { background: var(--code-line-highlight); }
:host([line-numbers]),
xtyle-code[line-numbers] { --xtyle-code-gutter: 2.5ch; }
:host([line-numbers]) .xtyle-code,
xtyle-code[line-numbers] .xtyle-code { padding-left: 0; }
:host([line-numbers]) .xtyle-code code,
xtyle-code[line-numbers] .xtyle-code code { display: block; }
:host([line-numbers]) .xtyle-code-line,
xtyle-code[line-numbers] .xtyle-code-line {
	display: flex;
}
.xtyle-code-line__number {
	position: sticky;
	left: 0;
	flex: 0 0 auto;
	width: var(--xtyle-code-gutter);
	margin-right: var(--space-4);
	padding-right: var(--space-2);
	border-right: var(--border-thin) solid var(--field-border);
	background: var(--code-bg);
	color: var(--code-comment);
	text-align: right;
	user-select: none;
	-webkit-user-select: none;
}
:host([line-numbers]) .xtyle-code-line__text,
xtyle-code[line-numbers] .xtyle-code-line__text {
	flex: 1 1 auto;
	min-width: 0;
}
.xtyle-code-caption {
	display: flex;
	align-items: center;
	padding: var(--space-2) var(--space-4);
	padding-right: 4rem;
	color: var(--neutral-text);
	background: var(--neutral-bg);
	border-bottom: var(--border-thin) solid var(--field-border);
	border-radius: var(--radius-md) var(--radius-md) 0 0;
	font-family: var(--font-mono);
	font-size: var(--text-xs);
	line-height: 1.4;
}
.xtyle-code-caption:empty { display: none; }
.xtyle-code-caption:not(:empty) + .xtyle-code {
	border-top-left-radius: 0;
	border-top-right-radius: 0;
}
.xtyle-code-copy {
	position: absolute;
	top: var(--space-2);
	right: var(--space-2);
	display: inline-flex;
	align-items: center;
	padding: var(--space-1) var(--space-2);
	color: var(--neutral-text);
	background: var(--neutral-bg);
	border: var(--border-thin) solid var(--field-border);
	border-radius: var(--radius-sm);
	font-family: var(--font-sans);
	font-size: var(--text-xs);
	line-height: 1;
	cursor: pointer;
	opacity: 0;
	transition:
		opacity var(--duration-fast) var(--ease-standard),
		color var(--duration-fast) var(--ease-standard),
		background var(--duration-fast) var(--ease-standard),
		border-color var(--duration-fast) var(--ease-standard);
}
:host(:hover) .xtyle-code-copy,
xtyle-code:hover .xtyle-code-copy,
.xtyle-code-copy:focus-visible { opacity: 1; }
.xtyle-code-copy:hover { color: var(--neutral-fg); background: var(--neutral); }
.xtyle-code-copy[data-copied] {
	opacity: 1;
	color: var(--success-vivid);
	border-color: var(--success);
}
@media (hover: none) {
	.xtyle-code-copy { opacity: 1; }
}
.xtyle-code ::selection { background: var(--code-selection); }
.xtyle-code .token.comment,
.xtyle-code .token.prolog,
.xtyle-code .token.doctype,
.xtyle-code .token.cdata { color: var(--code-comment); }
.xtyle-code .token.punctuation { color: var(--code-punctuation); }
.xtyle-code .token.tag,
.xtyle-code .token.property,
.xtyle-code .token.symbol,
.xtyle-code .token.deleted { color: var(--code-tag); }
.xtyle-code .token.number,
.xtyle-code .token.boolean,
.xtyle-code .token.constant { color: var(--code-number); }
.xtyle-code .token.string,
.xtyle-code .token.char,
.xtyle-code .token.selector,
.xtyle-code .token.inserted { color: var(--code-string); }
.xtyle-code .token.attr-name { color: var(--code-attr); }
.xtyle-code .token.operator,
.xtyle-code .token.entity,
.xtyle-code .token.url { color: var(--code-operator); }
.xtyle-code .token.keyword,
.xtyle-code .token.atrule,
.xtyle-code .token.attr-value { color: var(--code-keyword); }
.xtyle-code .token.function { color: var(--code-function); }
.xtyle-code .token.class-name,
.xtyle-code .token.builtin { color: var(--code-type); }
.xtyle-code .token.regex,
.xtyle-code .token.important { color: var(--code-regexp); }
.xtyle-code .token.variable { color: var(--code-variable); }
`.trim();
