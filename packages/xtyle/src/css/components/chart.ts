export const chartCss = `
[data-chart] { display: block; }
.xtyle-chart {
	--chart-height: 320px;
	display: block;
	margin: 0;
	font-family: var(--font-sans);
}
.xtyle-chart__plot {
	position: relative;
	display: block;
	border-radius: var(--radius-sm);
}
.xtyle-chart__plot:focus-visible {
	outline: var(--border-thick) solid var(--ring);
	outline-offset: 2px;
}
.xtyle-chart__svg {
	display: block;
	width: 100%;
	height: var(--chart-height, 320px);
	overflow: visible;
}
.xtyle-chart__grid {
	stroke: var(--line-2);
	stroke-width: 1;
}
.xtyle-chart__grid--x {
	stroke-dasharray: 2 4;
}
.xtyle-chart__axis {
	stroke: var(--line);
	stroke-width: 1;
}
.xtyle-chart__zero {
	stroke: var(--fg-3);
	stroke-width: 1;
}
.xtyle-chart__xtick,
.xtyle-chart__ytick {
	fill: var(--fg-3);
	font-size: var(--text-xs);
}
.xtyle-chart__axis-title {
	fill: var(--fg-2);
	font-size: var(--text-xs);
	font-weight: var(--weight-semibold);
}
.xtyle-chart__empty {
	fill: var(--fg-2);
	font-size: var(--text-sm);
}
.xtyle-chart__line {
	stroke-width: var(--border-thick);
	stroke-linecap: round;
	stroke-linejoin: round;
}
.xtyle-chart__area {
	opacity: 0.16;
}
.xtyle-chart__point {
	opacity: 0;
	transition: opacity var(--duration-fast) var(--ease-standard);
}
.xtyle-chart--markers .xtyle-chart__point { opacity: 1; }
.xtyle-chart__point.is-active {
	opacity: 1;
	r: 4.5;
	stroke: var(--bg-0);
	stroke-width: var(--border-thin);
}
.xtyle-chart--selectable .xtyle-chart__plot { cursor: crosshair; }
.xtyle-chart__guide {
	stroke: var(--fg-3);
	stroke-width: 1;
	stroke-dasharray: 3 3;
	pointer-events: none;
}
.xtyle-chart__guide[hidden] { display: none; }
.xtyle-chart__legend {
	display: flex;
	flex-wrap: wrap;
	gap: var(--space-1) var(--space-3);
	margin-top: var(--space-2);
	font-size: var(--text-sm);
	color: var(--fg-1);
}
.xtyle-chart__legend-item {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
}
.xtyle-chart__legend-swatch {
	width: 0.75em;
	height: 0.75em;
	border-radius: var(--radius-sm);
	flex: none;
}
.xtyle-chart__tooltip {
	position: absolute;
	top: 0;
	left: 0;
	z-index: 1;
	pointer-events: none;
	transform: translate(-50%, calc(-100% - 10px));
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
.xtyle-chart__tooltip[hidden] { display: none; }
.xtyle-chart__tooltip-x {
	display: block;
	color: var(--fg-2);
	font-size: var(--text-xs);
}
.xtyle-chart__tooltip-rows {
	list-style: none;
	margin: 0;
	padding: 0;
}
.xtyle-chart__tooltip-row {
	display: flex;
	align-items: center;
	gap: var(--space-1);
}
.xtyle-chart__tooltip-row[hidden] { display: none; }
.xtyle-chart__tooltip-swatch {
	width: 0.6em;
	height: 0.6em;
	border-radius: var(--radius-sm);
	flex: none;
}
.xtyle-chart__tooltip-name { color: var(--fg-2); }
.xtyle-chart__tooltip-value {
	margin-inline-start: auto;
	padding-inline-start: var(--space-2);
	font-weight: var(--weight-semibold);
}
.xtyle-chart__a11y {
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
