export const pieCss = `
[data-pie] { display: block; }
.xtyle-pie {
	--pie-size: 200px;
	display: block;
	margin: 0;
	font-family: var(--font-sans);
	position: relative;
}
.xtyle-pie__svg {
	display: block;
	width: var(--pie-size);
	height: var(--pie-size);
	max-width: 100%;
	margin: 0 auto;
	overflow: visible;
}
.xtyle-pie__slice {
	stroke: var(--bg-1);
	stroke-width: 1.5;
	transition: opacity var(--duration-fast) var(--ease-standard);
	cursor: default;
}
.xtyle-pie__slice:focus-visible {
	outline: var(--border-thick) solid var(--ring);
	outline-offset: 2px;
}
.xtyle-pie--hovering .xtyle-pie__slice:not(.is-active) {
	opacity: 0.4;
}
.xtyle-pie__value {
	fill: var(--fg-0);
	font-size: var(--text-xs);
	font-weight: var(--weight-semibold);
	paint-order: stroke;
	stroke: var(--bg-0);
	stroke-width: 3px;
	stroke-linejoin: round;
}
.xtyle-pie__center {
	fill: var(--fg-0);
	font-size: var(--text-lg);
	font-weight: var(--weight-bold);
}
.xtyle-pie__empty {
	fill: var(--fg-2);
	font-size: var(--text-sm);
}
.xtyle-pie__legend {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: var(--space-1) var(--space-3);
	margin-top: var(--space-2);
	font-size: var(--text-sm);
	color: var(--fg-1);
}
.xtyle-pie__legend-item {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
}
.xtyle-pie__legend-dot {
	width: 0.75em;
	height: 0.75em;
	border-radius: var(--radius-sm);
	flex: none;
}
.xtyle-pie__tooltip {
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
.xtyle-pie__tooltip[hidden] { display: none; }
.xtyle-pie__a11y {
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
