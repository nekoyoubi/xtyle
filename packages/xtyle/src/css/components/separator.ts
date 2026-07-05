export const separatorCss = `
[data-separator] { display: contents; }
.xtyle-separator {
	display: flex;
	align-items: center;
	border: 0;
	color: var(--fg-2);
	font-family: var(--font-sans);
	font-size: var(--text-xs);
	font-weight: var(--weight-medium);
	line-height: var(--leading-tight);
}
.xtyle-separator:not(.xtyle-separator--with-label) {
	background: var(--line);
	width: 100%;
	height: var(--border-thin);
}
.xtyle-separator--thin:not(.xtyle-separator--with-label) {
	background: var(--line-2);
}
.xtyle-separator--vertical:not(.xtyle-separator--with-label) {
	width: var(--border-thin);
	height: 100%;
	min-height: 1em;
}
.xtyle-separator--with-label {
	gap: var(--space-3);
	width: 100%;
}
.xtyle-separator--with-label::before,
.xtyle-separator--with-label::after {
	content: "";
	flex: 1;
	height: var(--border-thin);
	background: var(--line);
}
.xtyle-separator--with-label.xtyle-separator--thin::before,
.xtyle-separator--with-label.xtyle-separator--thin::after {
	background: var(--line-2);
}
.xtyle-separator--with-label.xtyle-separator--vertical {
	flex-direction: column;
	gap: var(--space-2);
	width: auto;
	height: 100%;
	min-height: 1em;
}
.xtyle-separator--with-label.xtyle-separator--vertical::before,
.xtyle-separator--with-label.xtyle-separator--vertical::after {
	width: var(--border-thin);
	height: auto;
}
.xtyle-separator__label {
	display: inline-flex;
	align-items: center;
	flex: none;
	white-space: nowrap;
}
`.trim();
