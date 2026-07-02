export const barCss = `
[data-bar] { display: block; }
.xoji-bar {
	--bar-height: 320px;
	display: block;
	margin: 0;
	font-family: var(--font-sans);
	position: relative;
}
.xoji-bar__svg {
	display: block;
	width: 100%;
	height: var(--bar-height, 320px);
	overflow: visible;
}
.xoji-bar__grid {
	stroke: var(--line-2);
	stroke-width: 1;
}
.xoji-bar__axis {
	stroke: var(--line);
	stroke-width: 1;
}
.xoji-bar__ytick,
.xoji-bar__xtick {
	fill: var(--fg-3);
	font-size: var(--text-xs);
}
.xoji-bar__value {
	fill: var(--fg-2);
	font-size: var(--text-xs);
}
.xoji-bar__bar {
	rx: 2;
	transition: opacity var(--duration-fast) var(--ease-standard);
	cursor: default;
}
.xoji-bar__bar:focus-visible {
	outline: var(--border-thick) solid var(--ring);
	outline-offset: 1px;
}
.xoji-bar--hovering .xoji-bar__bar:not(.is-active) {
	opacity: 0.35;
}
.xoji-bar__legend {
	display: flex;
	flex-wrap: wrap;
	gap: var(--space-1) var(--space-3);
	margin-top: var(--space-2);
	font-size: var(--text-sm);
	color: var(--fg-1);
}
.xoji-bar__legend-item {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
}
.xoji-bar__legend-dot {
	width: 0.75em;
	height: 0.75em;
	border-radius: var(--radius-sm);
	flex: none;
}
.xoji-bar__tooltip {
	position: absolute;
	top: 0;
	left: 0;
	z-index: 1;
	pointer-events: none;
	transform: translate(-50%, calc(-100% - 8px));
	padding: var(--space-1) var(--space-2);
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
	color: var(--fg-0);
	background: var(--surface-overlay);
	border: var(--border-thin) solid var(--surface-overlay-border);
	border-radius: var(--radius-md);
	box-shadow: var(--elevation-3);
	white-space: nowrap;
}
.xoji-bar__tooltip[hidden] { display: none; }
.xoji-bar__tooltip-name { color: var(--fg-2); }
.xoji-bar__tooltip-value { font-weight: var(--weight-semibold); }
.xoji-bar__a11y {
	position: absolute;
	width: 1px;
	height: 1px;
	margin: -1px;
	padding: 0;
	overflow: hidden;
	clip: rect(0 0 0 0);
	clip-path: inset(50%);
	white-space: nowrap;
	border: 0;
}
`.trim();
