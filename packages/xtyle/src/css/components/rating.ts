export const ratingCss = `
.xtyle-rating {
	--rating-track: var(--fg-disabled);
	--rating-fill: var(--accent);
	display: inline-flex;
	width: max-content;
	position: relative;
	font-size: var(--text-lg);
	line-height: 1;
	color: var(--rating-track);
}
.xtyle-rating__row {
	display: inline-flex;
	gap: 0.1em;
}
.xtyle-rating__row > svg {
	flex: none;
}
.xtyle-rating__row--filled {
	position: absolute;
	inset: 0 auto 0 0;
	overflow: hidden;
	white-space: nowrap;
	color: var(--rating-fill);
}
.xtyle-rating--sm {
	font-size: var(--text-sm);
}
.xtyle-rating--lg {
	font-size: var(--text-2xl);
}
.xtyle-rating--interactive {
	cursor: pointer;
	touch-action: none;
}
.xtyle-rating--interactive:focus-visible {
	outline: none;
	border-radius: var(--radius-sm);
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
`.trim();
