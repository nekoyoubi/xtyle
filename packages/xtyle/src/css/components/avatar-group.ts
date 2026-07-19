// The overlap works in both render modes without double-applying: in shadow DOM the avatars are
// reachable only through `::slotted()` and the `+N` chip only as a `> ` child, while in light DOM
// every item is a `> ` child (and `::slotted` is inert), so each rule set touches a disjoint layer.
export const avatarGroupCss = `
[data-root][data-avatar-group] { display: contents; }
.xtyle-avatar-group {
	display: inline-flex;
	align-items: center;
	--_overlap: var(--space-3);
}
.xtyle-avatar-group--snug { --_overlap: var(--space-4); }
.xtyle-avatar-group--loose { --_overlap: var(--space-2); }

.xtyle-avatar-group ::slotted(*),
.xtyle-avatar-group > *,
.xtyle-avatar-group__overflow {
	box-shadow: 0 0 0 var(--border-thick) var(--bg-0);
}
.xtyle-avatar-group ::slotted(*:not(:first-child)),
.xtyle-avatar-group > *:not(:first-child) {
	margin-inline-start: calc(-1 * var(--_overlap));
}

/* Raise a hovered or focused avatar above its neighbours so a covered face reads in full; flex
   items honour z-index without needing position, so this works in both render modes. */
.xtyle-avatar-group ::slotted(*:hover),
.xtyle-avatar-group ::slotted(*:focus-within),
.xtyle-avatar-group > *:hover,
.xtyle-avatar-group > *:focus-within {
	z-index: 1;
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
