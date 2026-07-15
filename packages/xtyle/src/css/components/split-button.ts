export const splitButtonCss = `
.xtyle-split-button {
	display: inline-flex;
	align-items: stretch;
	position: relative;
}
.xtyle-split-button--block {
	display: flex;
	width: 100%;
}
.xtyle-split-button--block .xtyle-split-button__primary {
	flex: 1;
}

/* The two halves are one shape: the seam between them is square, the outer corners are the button's own. */
.xtyle-split-button__primary {
	border-start-end-radius: 0;
	border-end-end-radius: 0;
}
.xtyle-split-button__toggle {
	border-start-start-radius: 0;
	border-end-start-radius: 0;
	padding-inline: var(--space-1);
	gap: 0;
}

/* Drawn in currentColor from inside the toggle's own box, so it reads on a solid fill and on a ghost
   alike without a second token per variant. */
.xtyle-split-button__divider {
	align-self: stretch;
	inline-size: var(--border-thin);
	margin-inline-end: var(--space-1);
	background: currentColor;
	opacity: 0.3;
	border-radius: var(--radius-full);
}
.xtyle-split-button--disabled .xtyle-split-button__divider {
	opacity: 0.15;
}

/* An outline/subtle pair would otherwise paint two borders down the seam. */
.xtyle-split-button__toggle {
	border-inline-start-width: 0;
}

/* An outlined pair already has a seam: the primary's own trailing border. The divider on top of it reads as
   a double rule, so the variant that draws its own edge doesn't get a second one. */
.xtyle-button--outline .xtyle-split-button__divider {
	display: none;
}

.xtyle-split-button__caret {
	transition: transform var(--duration-fast) var(--ease-standard);
}
.xtyle-split-button--open .xtyle-split-button__caret {
	transform: rotate(180deg);
}

/* The menu is a positioned popover; the element hosting it must take no space in the group. */
.xtyle-split-button__menu {
	display: contents;
}

@media (prefers-reduced-motion: reduce) {
	.xtyle-split-button__caret {
		transition: none;
	}
}
`;
