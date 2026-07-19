export const splitterCss = `
[data-root][data-splitter] { display: contents; }
.xtyle-splitter {
	display: flex;
	align-items: center;
	justify-content: center;
	flex: none;
	background: transparent;
	user-select: none;
	touch-action: none;
}
.xtyle-splitter--vertical {
	width: var(--space-3);
	height: 100%;
	cursor: col-resize;
}
.xtyle-splitter--horizontal {
	width: 100%;
	height: var(--space-3);
	cursor: row-resize;
}
.xtyle-splitter--vertical.xtyle-splitter--sm { width: var(--space-2); }
.xtyle-splitter--vertical.xtyle-splitter--lg { width: var(--space-5); }
.xtyle-splitter--horizontal.xtyle-splitter--sm { height: var(--space-2); }
.xtyle-splitter--horizontal.xtyle-splitter--lg { height: var(--space-5); }
.xtyle-splitter__grip {
	display: block;
	background: var(--line);
	border-radius: var(--radius-sm);
	transition: background var(--duration-fast) var(--ease-standard);
}
.xtyle-splitter--vertical .xtyle-splitter__grip {
	width: var(--border-thick);
	height: var(--space-6);
}
.xtyle-splitter--horizontal .xtyle-splitter__grip {
	height: var(--border-thick);
	width: var(--space-6);
}
.xtyle-splitter--vertical.xtyle-splitter--sm .xtyle-splitter__grip { height: var(--space-5); }
.xtyle-splitter--vertical.xtyle-splitter--lg .xtyle-splitter__grip { height: var(--space-8); }
.xtyle-splitter--horizontal.xtyle-splitter--sm .xtyle-splitter__grip { width: var(--space-5); }
.xtyle-splitter--horizontal.xtyle-splitter--lg .xtyle-splitter__grip { width: var(--space-8); }
.xtyle-splitter--line.xtyle-splitter--vertical {
	width: var(--border-thin);
	position: relative;
}
.xtyle-splitter--line.xtyle-splitter--horizontal {
	height: var(--border-thin);
	position: relative;
}
.xtyle-splitter--line.xtyle-splitter--vertical::before {
	content: "";
	position: absolute;
	inset-block: 0;
	inset-inline: calc(-1 * var(--space-2));
}
.xtyle-splitter--line.xtyle-splitter--horizontal::before {
	content: "";
	position: absolute;
	inset-inline: 0;
	inset-block: calc(-1 * var(--space-2));
}
.xtyle-splitter--line.xtyle-splitter--vertical .xtyle-splitter__grip {
	height: 100%;
	width: var(--border-thin);
	border-radius: 0;
}
.xtyle-splitter--line.xtyle-splitter--horizontal .xtyle-splitter__grip {
	width: 100%;
	height: var(--border-thin);
	border-radius: 0;
}
.xtyle-splitter:hover .xtyle-splitter__grip,
.xtyle-splitter[data-focus-ring] .xtyle-splitter__grip {
	background: var(--accent);
}
.xtyle-splitter[data-focus-ring] {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
	border-radius: var(--radius-sm);
}
.xtyle-splitter--disabled {
	cursor: default;
}
.xtyle-splitter--disabled .xtyle-splitter__grip {
	opacity: 0.4;
}
`.trim();
