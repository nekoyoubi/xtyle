export const tableCss = `
.xtyle-table-wrap {
	--xtyle-table-max-height: none;
	display: block;
	max-width: 100%;
	max-height: var(--xtyle-table-max-height);
	overflow: auto;
	border-radius: var(--radius-lg);
}
.xtyle-table {
	width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	font-family: var(--font-sans);
	font-size: var(--text-body);
	line-height: var(--leading-normal);
	color: var(--fg-0);
	background: var(--bg-1);
}
.xtyle-table__caption {
	caption-side: top;
	text-align: start;
	padding: var(--space-2) var(--space-4);
	font-size: var(--text-sm);
	color: var(--fg-2);
}
.xtyle-table__cell,
.xtyle-table__header-cell {
	padding: var(--space-3) var(--space-4);
	text-align: start;
	vertical-align: middle;
	border-bottom: var(--border-thin) solid var(--line);
}
.xtyle-table__header-cell {
	font-weight: var(--weight-semibold);
	color: var(--fg-1);
	background: var(--bg-2);
	white-space: nowrap;
}
.xtyle-table__head .xtyle-table__row:last-child .xtyle-table__header-cell {
	border-bottom: var(--border-normal) solid var(--line-2);
}
.xtyle-table__row:last-child .xtyle-table__cell {
	border-bottom: 0;
}
.xtyle-table--compact .xtyle-table__cell,
.xtyle-table--compact .xtyle-table__header-cell {
	padding: var(--space-1) var(--space-3);
}
.xtyle-table--compact .xtyle-table__caption {
	padding: var(--space-1) var(--space-3);
}
.xtyle-table--bordered {
	border-top: var(--border-thin) solid var(--line);
	border-left: var(--border-thin) solid var(--line);
}
.xtyle-table--bordered .xtyle-table__cell,
.xtyle-table--bordered .xtyle-table__header-cell {
	border-right: var(--border-thin) solid var(--line);
	border-bottom: var(--border-thin) solid var(--line);
}
.xtyle-table--bordered .xtyle-table__head .xtyle-table__header-cell {
	border-bottom: var(--border-normal) solid var(--line-2);
}
.xtyle-table--striped .xtyle-table__body .xtyle-table__row:nth-child(odd) {
	background: var(--bg-1);
}
.xtyle-table--striped .xtyle-table__body .xtyle-table__row:nth-child(even) {
	background: var(--bg-2);
}
.xtyle-table--hover .xtyle-table__body .xtyle-table__row {
	transition: background-color var(--duration-fast) var(--ease-standard);
}
.xtyle-table--hover .xtyle-table__body .xtyle-table__row:hover {
	background: var(--state-hover);
}
.xtyle-table--sticky .xtyle-table__head .xtyle-table__header-cell {
	position: sticky;
	top: 0;
	z-index: 1;
}
.xtyle-table__header-cell--sortable {
	cursor: pointer;
	user-select: none;
	position: relative;
	isolation: isolate;
	transition: background-color var(--duration-fast) var(--ease-standard);
}
.xtyle-table__header-cell--sortable::after {
	content: "";
	position: absolute;
	inset: 0;
	background: transparent;
	transition: background-color var(--duration-fast) var(--ease-standard);
	z-index: -1;
}
.xtyle-table__header-cell--sortable:hover::after {
	background: var(--state-hover);
}
.xtyle-table__header-cell--sortable:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: inset 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-table__header-content {
	display: inline-flex;
	align-items: center;
	gap: var(--space-2);
}
.xtyle-table__sort {
	display: inline-flex;
	width: 1em;
	height: 1em;
	flex: none;
	color: var(--fg-3);
	transition:
		color var(--duration-fast) var(--ease-standard),
		transform var(--duration-fast) var(--ease-standard);
}
.xtyle-table__sort svg {
	width: 1em;
	height: 1em;
}
.xtyle-table__header-cell[aria-sort="ascending"] .xtyle-table__sort,
.xtyle-table__header-cell[aria-sort="descending"] .xtyle-table__sort {
	color: var(--accent-text);
}
.xtyle-table__header-cell[aria-sort="descending"] .xtyle-table__sort {
	transform: rotate(180deg);
}
.xtyle-table__footer-cell {
	padding: var(--space-3) var(--space-4);
	text-align: start;
	font-weight: var(--weight-medium);
	color: var(--fg-1);
	background: var(--bg-2);
	border-top: var(--border-normal) solid var(--line-2);
}
.xtyle-table--compact .xtyle-table__footer-cell {
	padding: var(--space-1) var(--space-3);
}
`.trim();
