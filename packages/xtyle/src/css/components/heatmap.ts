export const heatmapCss = `
[data-root][data-heatmap] { display: block; }
.xtyle-heatmap {
	display: block;
	margin: 0;
	font-family: var(--font-sans);
	position: relative;
}
.xtyle-heatmap__svg {
	display: block;
	width: 100%;
	height: auto;
	overflow: visible;
}
.xtyle-heatmap__cell {
	stroke: var(--bg-0);
	stroke-width: 1;
	transition: stroke var(--duration-fast) var(--ease-standard);
	cursor: default;
}
.xtyle-heatmap__cell:focus-visible {
	outline: var(--border-thick) solid var(--ring);
	outline-offset: 1px;
}
.xtyle-heatmap--selectable .xtyle-heatmap__cell { cursor: pointer; }
.xtyle-heatmap--hovering .xtyle-heatmap__cell.is-active { stroke: var(--fg-0); }
.xtyle-heatmap__cell--current {
	stroke: var(--accent);
	stroke-width: 2.5;
	paint-order: stroke;
}
.xtyle-heatmap--now-success .xtyle-heatmap__cell--current { stroke: var(--success); }
.xtyle-heatmap--now-danger .xtyle-heatmap__cell--current { stroke: var(--danger); }
.xtyle-heatmap--now-warn .xtyle-heatmap__cell--current { stroke: var(--warn); }
.xtyle-heatmap--now-info .xtyle-heatmap__cell--current { stroke: var(--info); }
.xtyle-heatmap--now-neutral .xtyle-heatmap__cell--current { stroke: var(--neutral); }
.xtyle-heatmap__cell--current.xtyle-heatmap__cell--pulse {
	animation: xtyle-heatmap-now 1.8s var(--ease-standard) infinite;
}
@media (prefers-reduced-motion: reduce) {
	.xtyle-heatmap__cell--current.xtyle-heatmap__cell--pulse { animation: none; }
}
@keyframes xtyle-heatmap-now { 50% { stroke-opacity: 0.35; } }
.xtyle-heatmap__rowlabel,
.xtyle-heatmap__collabel {
	fill: var(--fg-3);
	font-size: var(--text-xs);
}
.xtyle-heatmap__value {
	fill: var(--fg-0);
	font-size: var(--text-xs);
	pointer-events: none;
}
.xtyle-heatmap__empty {
	padding: var(--space-2);
	font-size: var(--text-sm);
	color: var(--fg-2);
	text-align: center;
}
.xtyle-heatmap__scale {
	display: inline-flex;
	align-items: center;
	gap: var(--space-2);
	margin-top: var(--space-2);
	font-size: var(--text-xs);
	color: var(--fg-3);
}
.xtyle-heatmap__scale-ramp {
	display: inline-flex;
	gap: 2px;
}
.xtyle-heatmap__scale-swatch {
	width: 0.9rem;
	height: 0.9rem;
	border-radius: 2px;
	border: var(--border-thin) solid var(--bg-0);
}
.xtyle-heatmap__legend {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: var(--space-1) var(--space-3);
	margin-top: var(--space-2);
	font-size: var(--text-xs);
	color: var(--fg-3);
}
.xtyle-heatmap__legend-item {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
}
.xtyle-heatmap__legend-swatch {
	width: 0.9rem;
	height: 0.9rem;
	border-radius: 2px;
	border: var(--border-thin) solid var(--bg-0);
}
.xtyle-heatmap__legend-label {
	color: var(--fg-2);
}
.xtyle-heatmap__tooltip {
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
.xtyle-heatmap__tooltip[hidden] { display: none; }
.xtyle-heatmap__tooltip-row[hidden] { display: none; }
.xtyle-heatmap__tooltip-name { color: var(--fg-2); }
.xtyle-heatmap__tooltip-value { font-weight: var(--weight-semibold); }
.xtyle-heatmap__a11y {
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
