import { FULL_TONES as TONES } from "../../vocab.js";

const linearToneRules = TONES.map(
	(t) => `.xtyle-progress--linear.xtyle-progress--${t} .xtyle-progress__indicator {
	background: var(--${t});
}`,
).join("\n");

const circularToneRules = TONES.map(
	(t) => `.xtyle-progress--circular.xtyle-progress--${t} .xtyle-progress__indicator {
	stroke: var(--${t});
}`,
).join("\n");

const colorizeToneRules = TONES.map(
	(t) => `.xtyle-progress--colorize-value.xtyle-progress--${t} .xtyle-progress__value {
	color: var(--${t});
}`,
).join("\n");

const trackToneRules = TONES.map(
	(t) => `.xtyle-progress--linear.xtyle-progress--track-${t} .xtyle-progress__track {
	background: var(--${t}-bg);
}
.xtyle-progress--circular.xtyle-progress--track-${t} .xtyle-progress__track-ring {
	stroke: var(--${t}-bg);
}`,
).join("\n");

export const progressCss = `
[data-root][data-progress] { display: contents; }
.xtyle-progress {
	display: inline-flex;
	align-items: center;
	font-family: var(--font-sans);
	color: var(--fg-1);
	vertical-align: middle;
}
.xtyle-progress--linear {
	display: flex;
	width: 100%;
	gap: var(--space-2);
}
.xtyle-progress__track {
	position: relative;
	overflow: hidden;
	flex: 1;
	height: var(--space-2);
	background: var(--neutral-bg);
	border-radius: var(--radius-full);
}
.xtyle-progress--sm .xtyle-progress__track {
	height: var(--space-1);
}
.xtyle-progress--lg .xtyle-progress__track {
	height: var(--space-3);
}
.xtyle-progress--linear .xtyle-progress__indicator {
	position: absolute;
	inset: 0 auto 0 0;
	width: 0%;
	background: var(--accent);
	border-radius: inherit;
	transition: width var(--duration-base) var(--ease-emphasized);
}
${linearToneRules}
.xtyle-progress__value {
	flex: none;
	font-size: var(--text-sm);
	font-variant-numeric: tabular-nums;
	color: var(--fg-2);
}
.xtyle-progress--sm .xtyle-progress__value {
	font-size: var(--text-xs);
}
.xtyle-progress--lg .xtyle-progress__value {
	font-size: var(--text-body);
}
.xtyle-progress--circular {
	display: inline-grid;
	place-items: center;
	width: var(--xtyle-progress-size, var(--space-8));
	height: var(--xtyle-progress-size, var(--space-8));
}
.xtyle-progress--circular.xtyle-progress--sm {
	width: var(--xtyle-progress-size, var(--space-6));
	height: var(--xtyle-progress-size, var(--space-6));
}
.xtyle-progress--circular.xtyle-progress--lg {
	width: var(--xtyle-progress-size, calc(var(--space-8) + var(--space-3)));
	height: var(--xtyle-progress-size, calc(var(--space-8) + var(--space-3)));
}
.xtyle-progress__svg {
	grid-area: 1 / 1;
	width: 100%;
	height: 100%;
	transform: rotate(-90deg);
}
.xtyle-progress__track-ring {
	fill: none;
	stroke: var(--neutral-bg);
}
.xtyle-progress--circular .xtyle-progress__indicator {
	fill: none;
	stroke: var(--accent);
	stroke-linecap: round;
	transition: stroke-dashoffset var(--duration-base) var(--ease-emphasized);
}
.xtyle-progress--circular .xtyle-progress__track-ring,
.xtyle-progress--circular .xtyle-progress__indicator {
	stroke-width: var(--xtyle-progress-stroke, 4);
}
.xtyle-progress--circular.xtyle-progress--sm .xtyle-progress__track-ring,
.xtyle-progress--circular.xtyle-progress--sm .xtyle-progress__indicator {
	stroke-width: var(--xtyle-progress-stroke, 3);
}
.xtyle-progress--circular.xtyle-progress--lg .xtyle-progress__track-ring,
.xtyle-progress--circular.xtyle-progress--lg .xtyle-progress__indicator {
	stroke-width: var(--xtyle-progress-stroke, 5);
}
.xtyle-progress--fixed-stroke .xtyle-progress__track-ring,
.xtyle-progress--fixed-stroke .xtyle-progress__indicator {
	vector-effect: non-scaling-stroke;
}
.xtyle-progress--no-track .xtyle-progress__track {
	background: transparent;
}
.xtyle-progress--no-track .xtyle-progress__track-ring {
	stroke: transparent;
}
${trackToneRules}
${circularToneRules}
.xtyle-progress--circular .xtyle-progress__value {
	grid-area: 1 / 1;
	font-size: 0.5625rem;
	line-height: 1;
	letter-spacing: -0.02em;
	font-variant-numeric: tabular-nums;
	color: var(--fg-1);
}
.xtyle-progress--circular.xtyle-progress--sm .xtyle-progress__value {
	font-size: 0.5rem;
}
.xtyle-progress--circular.xtyle-progress--lg .xtyle-progress__value {
	font-size: var(--text-sm);
}
${colorizeToneRules}
.xtyle-progress--linear.xtyle-progress--value-inset {
	position: relative;
}
.xtyle-progress--linear.xtyle-progress--value-inset .xtyle-progress__track {
	min-height: var(--space-6);
}
.xtyle-progress--linear.xtyle-progress--value-inset .xtyle-progress__value {
	position: absolute;
	inset: 0;
	display: grid;
	place-items: center;
	color: var(--fg-0);
	text-shadow: 0 0 2px var(--bg-0), 0 0 2px var(--bg-0), 0 0 3px var(--bg-0);
	pointer-events: none;
}
.xtyle-progress--pulse-slow .xtyle-progress__indicator {
	animation: xtyle-progress-pulse 1.8s var(--ease-standard) infinite;
}
.xtyle-progress--pulse-fast .xtyle-progress__indicator {
	animation: xtyle-progress-pulse 0.9s var(--ease-standard) infinite;
}
@media (prefers-reduced-motion: reduce) {
	.xtyle-progress--pulse-slow .xtyle-progress__indicator,
	.xtyle-progress--pulse-fast .xtyle-progress__indicator {
		animation: none;
	}
}
.xtyle-progress--linear.xtyle-progress--indeterminate .xtyle-progress__indicator {
	width: 40%;
	transition: none;
	animation: xtyle-progress-slide 2s var(--ease-standard) infinite;
}
.xtyle-progress--circular.xtyle-progress--indeterminate .xtyle-progress__svg {
	animation: xtyle-progress-spin 1s linear infinite;
}
.xtyle-progress--circular.xtyle-progress--indeterminate .xtyle-progress__indicator {
	transition: none;
}
.xtyle-progress:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
	border-radius: var(--radius-sm);
}
@keyframes xtyle-progress-slide {
	0% { left: -40%; }
	100% { left: 100%; }
}
@keyframes xtyle-progress-spin {
	from { transform: rotate(-90deg); }
	to { transform: rotate(270deg); }
}
@keyframes xtyle-progress-pulse {
	50% { opacity: 0.4; }
}
`.trim();
