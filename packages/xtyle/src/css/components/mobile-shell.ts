export const mobileShellCss = `
.xtyle-mshell {
	display: flex;
	flex-direction: column;
	height: 100dvh;
	overflow: hidden;
	background: var(--body-bg);
	color: var(--fg-0);
	font-family: var(--font-sans);
	font-size: var(--text-body);
	line-height: var(--leading-normal);
}
/* The bar and the nav absorb the safe-area insets (the notch above, the home indicator below), so the
   content column between them is never the thing sliding under hardware. */
.xtyle-mshell__bar {
	flex: 0 0 auto;
	display: flex;
	align-items: center;
	gap: var(--space-3);
	padding: calc(env(safe-area-inset-top, 0px) + var(--space-3)) var(--space-4) var(--space-3);
	background: var(--bg-1);
	border-bottom: var(--border-thin) solid var(--line);
}
.xtyle-mshell__lead {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	margin-inline-end: auto;
	min-width: 0;
}
.xtyle-mshell__title {
	color: var(--fg-0);
	font-size: var(--text-lg);
	font-weight: var(--weight-semibold);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.xtyle-mshell__actions {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	flex: 0 0 auto;
}
.xtyle-mshell__content {
	flex: 1 1 auto;
	/* Without this a flex child refuses to shrink below its content, so the page scrolls instead of the
	   column, carrying the bar and the nav off screen with it. */
	min-height: 0;
	overflow-y: auto;
	overscroll-behavior: contain;
	padding: var(--space-4);
	padding-bottom: var(--space-6);
}
.xtyle-mshell__content:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: inset 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-mshell__nav {
	flex: 0 0 auto;
}
`.trim();
