import { FULL_TONES as TONES } from "../../vocab.js";

const toneVars = TONES.map((t) => `.xoji-sparkline--${t} { --spark-color: var(--${t}); }`).join("\n");

export const sparklineCss = `
[data-sparkline] { display: inline-block; }
.xoji-sparkline {
	--spark-color: var(--accent);
	--spark-width: 8rem;
	--spark-height: 2rem;
	display: inline-block;
	position: relative;
	width: var(--spark-width);
	height: var(--spark-height);
	vertical-align: middle;
	line-height: 0;
}
.xoji-sparkline__svg {
	display: block;
	width: 100%;
	height: 100%;
	overflow: visible;
}
.xoji-sparkline__line {
	fill: none;
	stroke: var(--spark-color);
	stroke-width: 1.5;
	stroke-linejoin: round;
	stroke-linecap: round;
}
.xoji-sparkline__area {
	fill: var(--spark-color);
	opacity: 0.16;
	stroke: none;
}
.xoji-sparkline__bar {
	fill: var(--spark-color);
}
.xoji-sparkline__end {
	fill: var(--spark-color);
	stroke: var(--bg-0);
	stroke-width: 1;
}
.xoji-sparkline__marker[hidden] { display: none; }
.xoji-sparkline__guide {
	stroke: var(--line-2);
	stroke-width: 1;
	stroke-dasharray: 2 2;
}
.xoji-sparkline__dot {
	fill: var(--spark-color);
	stroke: var(--bg-0);
	stroke-width: 1;
}
.xoji-sparkline__tooltip {
	position: absolute;
	top: 0;
	left: 0;
	z-index: 1;
	pointer-events: none;
	transform: translate(-50%, calc(-100% - 6px));
	padding: var(--space-1) var(--space-2);
	font-family: var(--font-sans);
	font-size: var(--text-xs);
	line-height: var(--leading-normal);
	color: var(--fg-0);
	background: var(--surface-overlay);
	border: var(--border-thin) solid var(--surface-overlay-border);
	border-radius: var(--radius-md);
	box-shadow: var(--elevation-3);
	white-space: nowrap;
}
.xoji-sparkline__tooltip[hidden] { display: none; }
.xoji-sparkline__empty {
	color: var(--fg-2);
	font-size: var(--text-xs);
}
${toneVars}
`.trim();
