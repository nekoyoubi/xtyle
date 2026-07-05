export const tabsCss = `
.xtyle-tabs {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
	font-family: var(--font-sans);
	color: var(--fg-0);
}
.xtyle-tabs__tablist {
	display: flex;
	align-items: stretch;
	gap: var(--space-1);
	position: relative;
}
.xtyle-tabs__tab {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: var(--space-2);
	font-family: inherit;
	font-size: var(--text-body);
	font-weight: var(--weight-medium);
	line-height: var(--leading-tight);
	white-space: nowrap;
	color: var(--fg-2);
	background: transparent;
	border: var(--border-thin) solid transparent;
	border-radius: var(--radius-md);
	padding: var(--space-2) var(--space-4);
	cursor: pointer;
	position: relative;
	isolation: isolate;
	transition:
		color var(--duration-fast) var(--ease-standard),
		background-color var(--duration-fast) var(--ease-standard),
		border-color var(--duration-fast) var(--ease-standard),
		box-shadow var(--duration-fast) var(--ease-standard);
}
.xtyle-tabs__tab::after {
	content: "";
	position: absolute;
	inset: 0;
	border-radius: inherit;
	background: transparent;
	transition: background-color var(--duration-fast) var(--ease-standard);
	z-index: -1;
}
.xtyle-tabs__tab:hover { color: var(--fg-0); }
.xtyle-tabs__tab:hover::after { background: var(--state-hover); }
.xtyle-tabs__tab:active::after { background: var(--state-press); }
.xtyle-tabs__tab:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-tabs__tab[aria-selected="true"] { color: var(--accent-text); }
.xtyle-tabs__tab:disabled,
.xtyle-tabs__tab[aria-disabled="true"] {
	cursor: not-allowed;
	color: var(--fg-disabled);
}
.xtyle-tabs__tab:disabled::after,
.xtyle-tabs__tab[aria-disabled="true"]::after { background: transparent; }
.xtyle-tabs__icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: none;
}
.xtyle-tabs__panels {
	display: grid;
	grid-template-columns: minmax(0, 1fr);
}
.xtyle-tabs__panel {
	grid-area: 1 / 1;
	min-width: 0;
	color: var(--fg-1);
}
.xtyle-tabs__panel:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
	border-radius: var(--radius-sm);
}
.xtyle-tabs__panel[hidden] {
	display: block;
	visibility: hidden;
}
.xtyle-tabs--underline .xtyle-tabs__tablist {
	gap: var(--space-2);
	border-bottom: var(--border-thin) solid var(--line);
}
.xtyle-tabs--underline .xtyle-tabs__tab {
	border-radius: var(--radius-none);
	border-bottom: var(--border-normal) solid transparent;
	margin-bottom: calc(-1 * var(--border-thin));
	padding: var(--space-2) var(--space-2);
}
.xtyle-tabs--underline .xtyle-tabs__tab[aria-selected="true"] {
	color: var(--accent-text);
	border-bottom-color: var(--accent);
}
.xtyle-tabs--pill .xtyle-tabs__tablist {
	gap: var(--space-1);
	padding: var(--space-1);
	background: var(--bg-2);
	border-radius: var(--radius-lg);
}
.xtyle-tabs--pill .xtyle-tabs__tab {
	border-radius: var(--radius-md);
}
.xtyle-tabs--pill .xtyle-tabs__tab[aria-selected="true"] {
	color: var(--accent-fg);
	background: var(--accent);
}
.xtyle-tabs--pill .xtyle-tabs__tab[aria-selected="true"]:hover::after,
.xtyle-tabs--pill .xtyle-tabs__tab[aria-selected="true"]:active::after { background: transparent; }
.xtyle-tabs--enclosed .xtyle-tabs__tablist {
	gap: var(--space-0);
	border-bottom: var(--border-thin) solid var(--line);
}
.xtyle-tabs--enclosed .xtyle-tabs__tab {
	border-radius: var(--radius-md) var(--radius-md) var(--radius-none) var(--radius-none);
	border-color: transparent;
	margin-bottom: calc(-1 * var(--border-thin));
}
.xtyle-tabs--enclosed .xtyle-tabs__tab[aria-selected="true"] {
	color: var(--accent-text);
	background: var(--bg-1);
	border-color: var(--line);
	border-bottom-color: var(--bg-1);
}
.xtyle-tabs--enclosed .xtyle-tabs__tab[aria-selected="true"]:hover::after,
.xtyle-tabs--enclosed .xtyle-tabs__tab[aria-selected="true"]:active::after { background: transparent; }
.xtyle-tabs--sm .xtyle-tabs__tab {
	font-size: var(--text-sm);
	gap: var(--space-1);
	padding: var(--space-1) var(--space-3);
}
.xtyle-tabs--sm.xtyle-tabs--underline .xtyle-tabs__tab {
	padding: var(--space-1) var(--space-2);
}
.xtyle-tabs--sticky .xtyle-tabs__tablist {
	position: sticky;
	top: 0;
	z-index: 1;
}
.xtyle-tabs--sticky.xtyle-tabs--underline .xtyle-tabs__tablist,
.xtyle-tabs--sticky.xtyle-tabs--enclosed .xtyle-tabs__tablist {
	background: var(--bg-1);
}
@container style(--selection-cue: marker) {
	.xtyle-tabs__tab[aria-selected="true"]::before {
		content: "✓";
		flex: none;
		font-size: 0.85em;
	}
}
`.trim();
