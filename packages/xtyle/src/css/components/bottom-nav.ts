export const bottomNavCss = `
.xtyle-bottom-nav {
	display: grid;
	grid-auto-flow: column;
	grid-auto-columns: 1fr;
	background: var(--bg-1);
	border-top: var(--border-thin) solid var(--line);
	padding-bottom: env(safe-area-inset-bottom, 0px);
}
.xtyle-bottom-nav__item {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: var(--space-1);
	/* A comfortable touch target: the whole cell taps, not just the glyph. */
	min-height: var(--space-8);
	padding: var(--space-2) var(--space-1);
	border: 0;
	background: transparent;
	color: var(--fg-3);
	font: inherit;
	font-size: var(--text-xs);
	font-weight: var(--weight-medium);
	cursor: pointer;
	transition: color var(--duration-fast) var(--ease-standard);
}
.xtyle-bottom-nav__item[aria-selected="true"] {
	color: var(--accent-text);
}
/* The selected tab reads by an accent bar as well as by color, so which section you are in never rests
   on hue alone (WCAG 1.4.1). */
.xtyle-bottom-nav__item[aria-selected="true"]::before {
	content: "";
	position: absolute;
	top: 0;
	left: 50%;
	transform: translateX(-50%);
	width: var(--space-6);
	height: var(--border-thick);
	border-radius: 0 0 var(--radius-sm) var(--radius-sm);
	background: var(--accent);
}
.xtyle-bottom-nav__item:focus-visible {
	outline: var(--border-thick) solid var(--ring);
	outline-offset: calc(-1 * var(--border-thick));
}
.xtyle-bottom-nav__icon {
	display: flex;
	align-items: center;
	justify-content: center;
}
.xtyle-bottom-nav__badge {
	position: absolute;
	top: var(--space-1);
	inset-inline-start: 55%;
	min-width: var(--space-4);
	padding: 0 var(--space-1);
	border-radius: var(--radius-full);
	background: var(--accent);
	color: var(--accent-fg);
	font-size: var(--text-xs);
	font-weight: var(--weight-semibold);
	line-height: var(--space-4);
	text-align: center;
}
@media (prefers-reduced-motion: reduce) {
	.xtyle-bottom-nav__item { transition: none; }
}
`.trim();
