/** The BEM part-class names the light-DOM `<xtyle-table>` decorator applies to a plain `<table>`.
 * Exported as typed constants so a consumer that hand-authors the classes — a framework rendering
 * its own rows at author time, skipping the runtime `MutationObserver` decorate — classes them from
 * one source instead of stringly-typed literals that would drift silently on a part rename. The
 * decorator itself writes these same constants, so the two can never disagree. */
export const tableParts = {
	wrap: "xtyle-table-wrap",
	table: "xtyle-table",
	head: "xtyle-table__head",
	body: "xtyle-table__body",
	row: "xtyle-table__row",
	cell: "xtyle-table__cell",
	headerCell: "xtyle-table__header-cell",
	sortableHeaderCell: "xtyle-table__header-cell--sortable",
	headerContent: "xtyle-table__header-content",
	caption: "xtyle-table__caption",
	footerCell: "xtyle-table__footer-cell",
	sort: "xtyle-table__sort",
} as const;

/** A named table part; the key set of {@link tableParts}. */
export type TablePart = keyof typeof tableParts;
