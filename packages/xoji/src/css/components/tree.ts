export const treeCss = `
.xoji-tree,
.xoji-tree__group {
	list-style: none;
	margin: 0;
	padding: 0;
}
.xoji-tree {
	font-family: var(--font-sans);
	font-size: var(--text-sm);
	color: var(--fg-1);
}
.xoji-tree__group[hidden] { display: none; }
.xoji-tree__row {
	--tree-level: 1;
	display: flex;
	align-items: center;
	gap: var(--space-1);
	padding-block: var(--space-1);
	padding-inline-end: var(--space-2);
	padding-inline-start: calc((var(--tree-level) - 1) * var(--space-4) + var(--space-2));
	border-radius: var(--radius-sm);
	color: var(--fg-2);
	text-decoration: none;
	cursor: pointer;
	transition:
		color var(--duration-fast) var(--ease-standard),
		background-color var(--duration-fast) var(--ease-standard);
}
.xoji-tree__row:hover {
	background: var(--state-hover);
	color: var(--fg-0);
}
.xoji-tree__item:focus { outline: none; }
.xoji-tree__item:focus-visible > .xoji-tree__row {
	outline: var(--border-normal) solid transparent;
	box-shadow: inset 0 0 0 var(--border-thick) var(--ring);
}
.xoji-tree__item[aria-selected="true"] > .xoji-tree__row {
	background: var(--accent-bg);
	color: var(--accent-text);
	font-weight: var(--weight-medium);
}
.xoji-tree__item[aria-disabled="true"] > .xoji-tree__row {
	color: var(--fg-disabled);
	cursor: not-allowed;
}
.xoji-tree__twisty {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1em;
	height: 1em;
	flex: none;
	color: var(--fg-3);
	transition: transform var(--duration-fast) var(--ease-standard);
}
.xoji-tree__twisty svg {
	width: 0.7em;
	height: 0.7em;
}
.xoji-tree__item[aria-expanded="true"] > .xoji-tree__row > .xoji-tree__twisty {
	transform: rotate(90deg);
}
.xoji-tree__twisty--leaf { visibility: hidden; }
.xoji-tree__label {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.xoji-tree__trailing {
	margin-inline-start: auto;
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
	flex: none;
	padding-inline-start: var(--space-2);
}
.xoji-tree__badge {
	font-size: var(--text-xs);
	color: var(--fg-3);
	font-variant-numeric: tabular-nums;
}
.xoji-tree__actions {
	display: inline-flex;
	align-items: center;
	gap: var(--space-0);
	opacity: 0;
	transition: opacity var(--duration-fast) var(--ease-standard);
}
.xoji-tree__row:hover .xoji-tree__actions,
.xoji-tree__item:focus-visible > .xoji-tree__row .xoji-tree__actions,
.xoji-tree__actions:focus-within {
	opacity: 1;
}
.xoji-tree__action {
	appearance: none;
	border: none;
	background: transparent;
	color: var(--fg-2);
	font: inherit;
	font-size: var(--text-xs);
	line-height: 1;
	display: grid;
	place-items: center;
	width: var(--space-4);
	height: var(--space-4);
	border-radius: var(--radius-sm);
	cursor: pointer;
}
.xoji-tree__action:hover { color: var(--fg-0); background: var(--state-hover); }
.xoji-tree__action:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: inset 0 0 0 var(--border-normal) var(--ring);
	opacity: 1;
}
.xoji-tree--lg { font-size: var(--text-body); }
.xoji-tree--lg .xoji-tree__row { padding-block: var(--space-2); }
@container style(--selection-cue: marker) {
	.xoji-tree__item[aria-selected="true"] > .xoji-tree__row::after {
		content: "✓";
		margin-inline-start: auto;
		padding-inline-start: var(--space-2);
		flex: none;
	}
}
`.trim();
