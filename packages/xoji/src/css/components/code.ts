export const codeCss = `
.xoji-code {
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
:host([wrap]) .xoji-code {
	white-space: pre-wrap;
	overflow-wrap: anywhere;
}
.xoji-code code {
	font-family: inherit;
	color: inherit;
	background: none;
}
.xoji-code-line { display: block; }
:host([highlight]) .xoji-code code { display: block; width: max-content; min-width: 100%; }
:host([highlight][wrap]) .xoji-code code { width: auto; }
.xoji-code-line[data-line-highlight] { background: var(--code-line-highlight); }
:host([line-numbers]) { --xoji-code-gutter: 2.5ch; }
:host([line-numbers]) .xoji-code { padding-left: 0; }
:host([line-numbers]) .xoji-code code { display: block; counter-reset: xoji-code-line; }
:host([line-numbers]) .xoji-code-line {
	display: flex;
	counter-increment: xoji-code-line;
}
:host([line-numbers]) .xoji-code-line::before {
	content: counter(xoji-code-line);
	position: sticky;
	left: 0;
	flex: 0 0 auto;
	width: var(--xoji-code-gutter);
	margin-right: var(--space-4);
	padding-right: var(--space-2);
	border-right: var(--border-thin) solid var(--field-border);
	background: var(--code-bg);
	color: var(--code-comment);
	text-align: right;
	user-select: none;
	-webkit-user-select: none;
}
:host([line-numbers]) .xoji-code-line__text {
	flex: 1 1 auto;
	min-width: 0;
}
.xoji-code-caption {
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
.xoji-code-caption:empty { display: none; }
:host(:has(.xoji-code-caption:not(:empty))) .xoji-code {
	border-top-left-radius: 0;
	border-top-right-radius: 0;
}
.xoji-code-copy {
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
:host(:hover) .xoji-code-copy,
.xoji-code-copy:focus-visible { opacity: 1; }
.xoji-code-copy:hover { color: var(--neutral-fg); background: var(--neutral); }
.xoji-code-copy[data-copied] {
	opacity: 1;
	color: var(--success-vivid);
	border-color: var(--success);
}
@media (hover: none) {
	.xoji-code-copy { opacity: 1; }
}
.xoji-code ::selection { background: var(--code-selection); }
.xoji-code .token.comment,
.xoji-code .token.prolog,
.xoji-code .token.doctype,
.xoji-code .token.cdata { color: var(--code-comment); }
.xoji-code .token.punctuation { color: var(--code-punctuation); }
.xoji-code .token.tag,
.xoji-code .token.property,
.xoji-code .token.symbol,
.xoji-code .token.deleted { color: var(--code-tag); }
.xoji-code .token.number,
.xoji-code .token.boolean,
.xoji-code .token.constant { color: var(--code-number); }
.xoji-code .token.string,
.xoji-code .token.char,
.xoji-code .token.selector,
.xoji-code .token.inserted { color: var(--code-string); }
.xoji-code .token.attr-name { color: var(--code-attr); }
.xoji-code .token.operator,
.xoji-code .token.entity,
.xoji-code .token.url { color: var(--code-operator); }
.xoji-code .token.keyword,
.xoji-code .token.atrule,
.xoji-code .token.attr-value { color: var(--code-keyword); }
.xoji-code .token.function { color: var(--code-function); }
.xoji-code .token.class-name,
.xoji-code .token.builtin { color: var(--code-type); }
.xoji-code .token.regex,
.xoji-code .token.important { color: var(--code-regexp); }
.xoji-code .token.variable { color: var(--code-variable); }
`.trim();
