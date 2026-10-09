// INFO: the `::slotted` and `> *` rule sets touch disjoint layers — shadow DOM reaches items via
// `::slotted`, light DOM via `> *` (where `::slotted` is inert), so the two never double-apply
const items = (group: string, filter = ""): string =>
	`${group} ::slotted(*${filter}),\n${group} > *${filter}`;

const STACKED_ITEMS = 24;
const stackStart = Array.from(
	{ length: STACKED_ITEMS },
	(_, i) => `${items(".xtyle-avatar-group--stack-start", `:nth-child(${i + 1})`)} { z-index: ${STACKED_ITEMS - i}; }`,
).join("\n");

export const avatarGroupCss = `
[data-root][data-avatar-group] { display: contents; }
.xtyle-avatar-group {
	display: inline-flex;
	align-items: center;
	--_overlap: var(--space-3);
	--_gap: var(--space-2);
	--_item: var(--space-7);
}
.xtyle-avatar-group--snug { --_overlap: var(--space-4); --_gap: var(--space-1); }
.xtyle-avatar-group--loose { --_overlap: var(--space-2); --_gap: var(--space-3); }
.xtyle-avatar-group--sm { --_item: var(--space-6); }
.xtyle-avatar-group--lg { --_item: var(--space-8); }
.xtyle-avatar-group--xl { --_item: calc(var(--space-8) + var(--space-4)); }

${items(".xtyle-avatar-group--overlap")} {
	--xtyle-avatar-ring: 0 0 0 var(--border-thick) var(--bg-0);
}
.xtyle-avatar-group--overlap .xtyle-avatar-group__overflow {
	box-shadow: 0 0 0 var(--border-thick) var(--bg-0);
}
${items(".xtyle-avatar-group--overlap", ":not(:first-child)")} {
	margin-inline-start: calc(-1 * var(--_overlap));
}

.xtyle-avatar-group--row,
.xtyle-avatar-group--wrap {
	gap: var(--_gap);
}
.xtyle-avatar-group--wrap {
	flex-wrap: wrap;
}

.xtyle-avatar-group--lattice {
	align-items: flex-start;
	padding-block-end: calc(var(--_item) / 2 + var(--_gap) / 2);
}
${items(".xtyle-avatar-group--lattice", ":not(:first-child)")} {
	margin-inline-start: calc(var(--_gap) / 2 - var(--_item) / 2);
}
${items(".xtyle-avatar-group--lattice", ":nth-child(even)")} {
	translate: 0 calc(var(--_item) / 2 + var(--_gap) / 2);
}

${stackStart}

/* Raise a hovered or focused avatar above its neighbours so a covered face reads in full; flex
   items honour z-index without needing position, so this works in both render modes. */
${items(".xtyle-avatar-group", ":hover")},
${items(".xtyle-avatar-group", ":focus-within")} {
	z-index: ${STACKED_ITEMS + 1};
}

.xtyle-avatar-group__overflow {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: none;
	width: var(--space-7);
	height: var(--space-7);
	border-radius: var(--radius-full);
	background: var(--neutral-bg);
	color: var(--neutral-text);
	font-family: var(--font-sans);
	font-size: var(--text-sm);
	font-weight: var(--weight-semibold);
	line-height: var(--leading-tight);
	user-select: none;
}
.xtyle-avatar-group--sm .xtyle-avatar-group__overflow {
	width: var(--space-6);
	height: var(--space-6);
	font-size: var(--text-xs);
}
.xtyle-avatar-group--lg .xtyle-avatar-group__overflow {
	width: var(--space-8);
	height: var(--space-8);
	font-size: var(--text-body);
}
.xtyle-avatar-group--xl .xtyle-avatar-group__overflow {
	width: calc(var(--space-8) + var(--space-4));
	height: calc(var(--space-8) + var(--space-4));
	font-size: var(--text-lg);
}
`.trim();
