export const splitterCss = `
[data-splitter] { display: contents; }
.xoji-splitter {
	display: flex;
	align-items: center;
	justify-content: center;
	flex: none;
	background: transparent;
	user-select: none;
	touch-action: none;
}
.xoji-splitter--vertical {
	width: var(--space-3);
	height: 100%;
	cursor: col-resize;
}
.xoji-splitter--horizontal {
	width: 100%;
	height: var(--space-3);
	cursor: row-resize;
}
.xoji-splitter--vertical.xoji-splitter--sm { width: var(--space-2); }
.xoji-splitter--vertical.xoji-splitter--lg { width: var(--space-5); }
.xoji-splitter--horizontal.xoji-splitter--sm { height: var(--space-2); }
.xoji-splitter--horizontal.xoji-splitter--lg { height: var(--space-5); }
.xoji-splitter__grip {
	display: block;
	background: var(--line);
	border-radius: var(--radius-sm);
	transition: background var(--duration-fast) var(--ease-standard);
}
.xoji-splitter--vertical .xoji-splitter__grip {
	width: var(--border-thick);
	height: var(--space-6);
}
.xoji-splitter--horizontal .xoji-splitter__grip {
	height: var(--border-thick);
	width: var(--space-6);
}
.xoji-splitter--vertical.xoji-splitter--sm .xoji-splitter__grip { height: var(--space-5); }
.xoji-splitter--vertical.xoji-splitter--lg .xoji-splitter__grip { height: var(--space-8); }
.xoji-splitter--horizontal.xoji-splitter--sm .xoji-splitter__grip { width: var(--space-5); }
.xoji-splitter--horizontal.xoji-splitter--lg .xoji-splitter__grip { width: var(--space-8); }
.xoji-splitter--line.xoji-splitter--vertical {
	width: var(--border-thin);
	position: relative;
}
.xoji-splitter--line.xoji-splitter--horizontal {
	height: var(--border-thin);
	position: relative;
}
.xoji-splitter--line.xoji-splitter--vertical::before {
	content: "";
	position: absolute;
	inset-block: 0;
	inset-inline: calc(-1 * var(--space-2));
}
.xoji-splitter--line.xoji-splitter--horizontal::before {
	content: "";
	position: absolute;
	inset-inline: 0;
	inset-block: calc(-1 * var(--space-2));
}
.xoji-splitter--line.xoji-splitter--vertical .xoji-splitter__grip {
	height: 100%;
	width: var(--border-thin);
	border-radius: 0;
}
.xoji-splitter--line.xoji-splitter--horizontal .xoji-splitter__grip {
	width: 100%;
	height: var(--border-thin);
	border-radius: 0;
}
.xoji-splitter:hover .xoji-splitter__grip,
.xoji-splitter[data-focus-ring] .xoji-splitter__grip {
	background: var(--accent);
}
.xoji-splitter[data-focus-ring] {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
	border-radius: var(--radius-sm);
}
.xoji-splitter--disabled {
	cursor: default;
}
.xoji-splitter--disabled .xoji-splitter__grip {
	opacity: 0.4;
}
`.trim();
