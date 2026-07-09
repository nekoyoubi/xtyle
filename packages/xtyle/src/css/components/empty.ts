export const emptyCss = `
.xtyle-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	gap: var(--space-3);
	padding: var(--space-8) var(--space-4);
	font-family: var(--font-sans);
}
.xtyle-empty__media,
.xtyle-empty > xtyle-icon {
	font-size: var(--text-4xl);
	line-height: 1;
	color: var(--fg-3);
}
.xtyle-empty :is(h1, h2, h3, h4, h5, h6, .xtyle-empty__title) {
	margin: 0;
	font-size: var(--text-lg);
	font-weight: var(--weight-semibold);
	color: var(--fg-0);
}
.xtyle-empty :is(p, .xtyle-empty__text) {
	margin: 0;
	max-width: 34ch;
	font-size: var(--text-sm);
	color: var(--fg-2);
}
.xtyle-empty__actions {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: var(--space-2);
	margin-top: var(--space-2);
}
`.trim();
