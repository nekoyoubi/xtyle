export const heatmapCss = `
[data-heatmap] { display: block; }
.xoji-heatmap {
	display: block;
	margin: 0;
	font-family: var(--font-sans);
	position: relative;
}
.xoji-heatmap__svg {
	display: block;
	width: 100%;
	height: auto;
	overflow: visible;
}
.xoji-heatmap__cell {
	stroke: var(--bg-0);
	stroke-width: 1;
	transition: stroke var(--duration-fast) var(--ease-standard);
	cursor: default;
}
.xoji-heatmap__cell:focus-visible {
	outline: var(--border-thick) solid var(--ring);
	outline-offset: 1px;
}
.xoji-heatmap--selectable .xoji-heatmap__cell { cursor: pointer; }
.xoji-heatmap--hovering .xoji-heatmap__cell.is-active { stroke: var(--fg-0); }
.xoji-heatmap__cell--current {
	stroke: var(--accent);
	stroke-width: 2.5;
	paint-order: stroke;
}
.xoji-heatmap--now-success .xoji-heatmap__cell--current { stroke: var(--success); }
.xoji-heatmap--now-danger .xoji-heatmap__cell--current { stroke: var(--danger); }
.xoji-heatmap--now-warn .xoji-heatmap__cell--current { stroke: var(--warn); }
.xoji-heatmap--now-info .xoji-heatmap__cell--current { stroke: var(--info); }
.xoji-heatmap--now-neutral .xoji-heatmap__cell--current { stroke: var(--neutral); }
.xoji-heatmap__cell--current.xoji-heatmap__cell--pulse {
	animation: xoji-heatmap-now 1.8s var(--ease-standard) infinite;
}
@media (prefers-reduced-motion: reduce) {
	.xoji-heatmap__cell--current.xoji-heatmap__cell--pulse { animation: none; }
}
@keyframes xoji-heatmap-now { 50% { stroke-opacity: 0.35; } }
.xoji-heatmap__rowlabel,
.xoji-heatmap__collabel {
	fill: var(--fg-3);
	font-size: var(--text-xs);
}
.xoji-heatmap__value {
	fill: var(--fg-0);
	font-size: var(--text-xs);
	pointer-events: none;
}
.xoji-heatmap__empty {
	padding: var(--space-2);
	font-size: var(--text-sm);
	color: var(--fg-2);
	text-align: center;
}
.xoji-heatmap__scale {
	display: inline-flex;
	align-items: center;
	gap: var(--space-2);
	margin-top: var(--space-2);
	font-size: var(--text-xs);
	color: var(--fg-3);
}
.xoji-heatmap__scale-ramp {
	display: inline-flex;
	gap: 2px;
}
.xoji-heatmap__scale-swatch {
	width: 0.9rem;
	height: 0.9rem;
	border-radius: 2px;
	border: var(--border-thin) solid var(--bg-0);
}
.xoji-heatmap__tooltip {
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
.xoji-heatmap__tooltip[hidden] { display: none; }
.xoji-heatmap__tooltip-name { color: var(--fg-2); }
.xoji-heatmap__tooltip-value { font-weight: var(--weight-semibold); }
.xoji-heatmap__a11y {
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
