import { FULL_TONES } from "../../vocab.js";

export const treeCss = `
.xtyle-tree,
.xtyle-tree__group {
	list-style: none;
	margin: 0;
	padding: 0;
}
.xtyle-tree {
	font-family: var(--font-sans);
	font-size: var(--text-sm);
	color: var(--fg-1);
}
.xtyle-tree__group[hidden] { display: none; }
.xtyle-tree__row {
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
.xtyle-tree__row:hover {
	background: var(--state-hover);
	color: var(--fg-0);
}
.xtyle-tree__row--static {
	cursor: default;
}
.xtyle-tree__row--static:hover {
	background: transparent;
	color: var(--fg-2);
}
.xtyle-tree__item:focus { outline: none; }
.xtyle-tree__item:focus-visible > .xtyle-tree__row {
	outline: var(--border-normal) solid transparent;
	box-shadow: inset 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-tree__item[aria-selected="true"] > .xtyle-tree__row {
	background: var(--accent-bg);
	color: var(--accent-text);
	font-weight: var(--weight-medium);
}
.xtyle-tree__item[aria-disabled="true"] > .xtyle-tree__row {
	color: var(--fg-disabled);
	cursor: not-allowed;
}
.xtyle-tree__twisty {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1em;
	height: 1em;
	flex: none;
	color: var(--fg-3);
	transition: transform var(--duration-fast) var(--ease-standard);
}
.xtyle-tree__twisty svg {
	width: 0.7em;
	height: 0.7em;
}
.xtyle-tree__item[aria-expanded="true"] > .xtyle-tree__row > .xtyle-tree__twisty {
	transform: rotate(90deg);
}
.xtyle-tree__twisty--leaf { visibility: hidden; }
.xtyle-tree__label {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.xtyle-tree__trailing {
	margin-inline-start: auto;
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
	flex: none;
	padding-inline-start: var(--space-2);
}
.xtyle-tree__badge {
	font-size: var(--text-xs);
	color: var(--fg-3);
	font-variant-numeric: tabular-nums;
}
${FULL_TONES.map((t) => `.xtyle-tree__badge--${t} { color: var(--${t}-text); }`).join("\n")}
.xtyle-tree__actions {
	display: inline-flex;
	align-items: center;
	gap: var(--space-0);
	opacity: 0;
	transition: opacity var(--duration-fast) var(--ease-standard);
}
.xtyle-tree__row:hover .xtyle-tree__actions,
.xtyle-tree__item:focus-visible > .xtyle-tree__row .xtyle-tree__actions,
.xtyle-tree__actions:focus-within {
	opacity: 1;
}
.xtyle-tree__action {
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
.xtyle-tree__action:hover:not(:disabled) { color: var(--fg-0); background: var(--state-hover); }
.xtyle-tree__action:disabled { color: var(--fg-disabled); cursor: default; pointer-events: none; }
.xtyle-tree__action:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: inset 0 0 0 var(--border-normal) var(--ring);
	opacity: 1;
}
.xtyle-tree--lg { font-size: var(--text-body); }
.xtyle-tree--lg .xtyle-tree__row { padding-block: var(--space-2); }
@container style(--selection-cue: marker) {
	.xtyle-tree__item[aria-selected="true"] > .xtyle-tree__row::after {
		content: "✓";
		margin-inline-start: auto;
		padding-inline-start: var(--space-2);
		flex: none;
	}
}
`.trim();
