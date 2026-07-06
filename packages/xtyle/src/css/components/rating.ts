export const ratingCss = `
.xtyle-rating {
	display: inline-flex;
	position: relative;
	font-size: var(--text-lg);
	line-height: 1;
	color: var(--bg-3);
}
.xtyle-rating__row {
	display: inline-flex;
	gap: 0.1em;
}
.xtyle-rating__row--filled {
	position: absolute;
	inset: 0 auto 0 0;
	overflow: hidden;
	white-space: nowrap;
	color: var(--accent);
}
.xtyle-rating--sm {
	font-size: var(--text-sm);
}
.xtyle-rating--lg {
	font-size: var(--text-2xl);
}
`.trim();
