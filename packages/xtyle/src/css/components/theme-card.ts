export const themeCardCss = `
.xtyle-theme-card {
	display: flex;
	flex-direction: column;
	border: var(--border-thin) solid var(--line);
	border-radius: var(--radius-md);
	background: var(--bg-1);
	color: var(--fg-0);
	font-family: var(--font-sans);
	text-align: start;
	width: 100%;
	overflow: hidden;
	padding: 0;
}
.xtyle-theme-card__preview {
	display: block;
	aspect-ratio: 40 / 21;
	line-height: 0;
}
.xtyle-theme-card__preview svg {
	display: block;
	width: 100%;
	height: 100%;
}
.xtyle-theme-card__body {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	padding: var(--space-2);
	border-top: var(--border-thin) solid var(--line);
}
.xtyle-theme-card__name {
	font-size: var(--text-sm);
	font-weight: var(--weight-medium);
	line-height: var(--leading-tight);
}
.xtyle-theme-card__meta {
	font-size: var(--text-xs);
	color: var(--fg-2);
	line-height: var(--leading-tight);
}
.xtyle-theme-card__error {
	font-size: var(--text-xs);
	color: var(--danger);
	line-height: var(--leading-tight);
}
.xtyle-theme-card--interactive {
	appearance: none;
	cursor: pointer;
	transition:
		border-color var(--duration-fast) var(--ease-standard),
		background var(--duration-fast) var(--ease-standard);
}
.xtyle-theme-card--interactive:hover { border-color: var(--line-2); }
.xtyle-theme-card--interactive:focus-visible {
	outline: none;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-theme-card--selected { border-color: var(--accent); }
`;
