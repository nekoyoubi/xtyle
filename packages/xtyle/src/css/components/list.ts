/**
 * `<xtyle-list>` — the reference skin over the collection substrate. The item row (lead / content /
 * trail / actions) plus the shared selection surface: an accent fill for the selected item, a focus
 * ring for the roving cursor (separate from selection), and the `--selection-cue: marker` check that
 * gives selection a redundant non-color channel (see docs/open-questions.md §12).
 */
export const listCss = `
.xtyle-list {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	font-family: var(--font-sans);
	font-size: var(--text-body);
	color: var(--fg-1);
}
.xtyle-list--horizontal {
	flex-direction: row;
	flex-wrap: wrap;
}
.xtyle-list--sm { font-size: var(--text-sm); }
.xtyle-list--lg { font-size: var(--text-lg); }

.xtyle-list__title {
	display: block;
	margin-block-end: var(--space-2);
	font-size: var(--text-sm);
	font-weight: var(--weight-semibold);
	color: var(--fg-2);
}

.xtyle-list__item {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	padding: var(--space-2) var(--space-3);
	border-radius: var(--radius-sm);
	color: var(--fg-1);
	cursor: pointer;
}
.xtyle-list--static .xtyle-list__item { cursor: default; }
.xtyle-list__item:hover { background: var(--state-hover); color: var(--fg-0); }
.xtyle-list__item:focus-visible {
	outline: var(--border-normal) solid var(--accent);
	outline-offset: -2px;
}
.xtyle-list__item[aria-selected="true"] {
	background: var(--accent-bg);
	color: var(--fg-0);
	font-weight: var(--weight-medium);
}
.xtyle-list__item[aria-disabled="true"] {
	color: var(--fg-disabled);
	cursor: not-allowed;
}

.xtyle-list__lead {
	display: inline-flex;
	flex: none;
	color: var(--fg-2);
}
.xtyle-list__label {
	flex: 1 1 auto;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.xtyle-list__trail {
	flex: none;
	color: var(--fg-2);
	font-size: var(--text-sm);
}

.xtyle-list__actions {
	flex: none;
	display: inline-flex;
	gap: var(--space-1);
	opacity: 0;
}
.xtyle-list__item:hover .xtyle-list__actions,
.xtyle-list__item:focus-within .xtyle-list__actions {
	opacity: 1;
}
.xtyle-list__action {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: var(--space-1);
	border: 0;
	border-radius: var(--radius-sm);
	background: transparent;
	color: var(--fg-2);
	font: inherit;
	cursor: pointer;
}
.xtyle-list__action:hover {
	background: var(--state-hover);
	color: var(--fg-0);
}
.xtyle-list__action:focus-visible {
	outline: var(--border-normal) solid var(--accent);
	outline-offset: 1px;
}
.xtyle-list__action[disabled] {
	color: var(--fg-disabled);
	cursor: not-allowed;
}

/* The redundant non-color selection cue: a check appended to the selected item, drawn only when the
   theme resolves --selection-cue to marker (high-contrast, or the cues=redundant knob). A finish by
   construction — see docs/open-questions.md §12. */
@container style(--selection-cue: marker) {
	.xtyle-list__item[aria-selected="true"]::after {
		content: "✓";
		flex: none;
		margin-inline-start: var(--space-2);
		font-size: 0.85em;
	}
}
`;
