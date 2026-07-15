export const tourCss = `
.xtyle-tour[hidden] {
	display: none;
}

/* One step's body shows at a time; the tour toggles the rest hidden. A step takes no box of its
   own — its content flows straight into the spotlight's callout. */
xtyle-tour-step {
	display: contents;
}
xtyle-tour-step[hidden] {
	display: none;
}

.xtyle-tour__nav {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	width: 100%;
	margin-top: var(--space-1);
}
/* Back sits at the left; the progress readout takes the slack so Skip and Next land at the right. */
.xtyle-tour__progress {
	margin-inline-start: auto;
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
	color: var(--fg-2);
	font-size: var(--text-xs);
	font-variant-numeric: tabular-nums;
}
.xtyle-tour__progress[hidden] {
	display: none;
}
.xtyle-tour__dot {
	width: 0.4rem;
	height: 0.4rem;
	border-radius: var(--radius-full);
	background: var(--line-2);
	transition: background var(--duration-fast) var(--ease-standard);
}
.xtyle-tour__dot--on {
	background: var(--accent);
}

.xtyle-tour__back,
.xtyle-tour__skip,
.xtyle-tour__next {
	padding: var(--space-2) var(--space-3);
	border-radius: var(--radius-sm);
	border: var(--border-thin) solid transparent;
	font: inherit;
	font-weight: var(--weight-semibold);
	cursor: pointer;
	transition: background var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard);
}
.xtyle-tour__back[hidden],
.xtyle-tour__skip[hidden] {
	display: none;
}
.xtyle-tour__back,
.xtyle-tour__skip {
	background: transparent;
	color: var(--fg-2);
}
.xtyle-tour__back:hover,
.xtyle-tour__skip:hover {
	background: var(--state-hover);
	color: var(--fg-1);
}
.xtyle-tour__next {
	background: var(--accent);
	color: var(--accent-fg);
}
.xtyle-tour__next:hover {
	box-shadow: inset 0 0 0 999px var(--state-hover);
}
.xtyle-tour__next:active {
	box-shadow: inset 0 0 0 999px var(--state-press);
}
.xtyle-tour__back:focus-visible,
.xtyle-tour__skip:focus-visible,
.xtyle-tour__next:focus-visible {
	outline: none;
	box-shadow: var(--ring);
}

@media (prefers-reduced-motion: reduce) {
	.xtyle-tour__dot,
	.xtyle-tour__back,
	.xtyle-tour__skip,
	.xtyle-tour__next {
		transition: none;
	}
}
`;
