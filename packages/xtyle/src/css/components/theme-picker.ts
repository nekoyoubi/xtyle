export const themePickerCss = `
.xtyle-theme-picker__grid {
	display: grid;
	gap: var(--space-3);
	grid-template-columns: repeat(auto-fill, minmax(var(--xtyle-theme-picker-min, 13rem), 1fr));
}
.xtyle-theme-picker__item {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	min-width: 0;
}
.xtyle-theme-picker__empty {
	margin: 0;
	font-family: var(--font-sans);
	font-size: var(--text-xs);
	line-height: var(--leading-tight);
	color: var(--fg-2);
}
/* Inside a menu the panel is a few hundred pixels wide, where the gallery's roomy column floor
   collapses to a single column and a handful of themes becomes a tall scrolling strip. A tighter
   floor here fits a real grid; an explicit min-col-width still wins, being set inline. */
.xtyle-theme-picker__menu .xtyle-theme-picker__grid {
	--xtyle-theme-picker-min: 8rem;
}
.xtyle-theme-picker__panel {
	width: min(24rem, 90vw);
	max-width: 100%;
	max-height: min(28rem, 70vh);
	overflow-y: auto;
}
.xtyle-theme-picker__current {
	max-width: 12rem;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.xtyle-theme-picker__caret {
	font-size: var(--text-xs);
	color: var(--fg-2);
}
`;
