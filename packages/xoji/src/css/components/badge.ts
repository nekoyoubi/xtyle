import { FULL_TONES as TONES } from "../../vocab.js";

const toneSolid = TONES.map(
	(t) => `.xoji-badge--solid.xoji-badge--${t} {
	background: var(--${t});
	color: var(--${t}-fg);
	border-color: transparent;
}`,
).join("\n");

const toneSoft = TONES.map(
	(t) => `.xoji-badge--soft.xoji-badge--${t} {
	background: var(--${t}-bg);
	color: var(--${t}-text);
	border-color: transparent;
}`,
).join("\n");

const toneOutline = TONES.map(
	(t) => `.xoji-badge--outline.xoji-badge--${t} {
	background: transparent;
	color: var(--${t}-text);
	border-color: var(--${t});
}`,
).join("\n");

export const badgeCss = `
[data-badge] { display: contents; }
.xoji-badge {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
	font-family: var(--font-sans);
	font-size: var(--text-xs);
	font-weight: var(--weight-medium);
	line-height: var(--leading-tight);
	white-space: nowrap;
	background: var(--neutral-bg);
	color: var(--neutral-text);
	border: var(--border-thin) solid transparent;
	border-radius: var(--radius-full);
	padding: var(--space-0) var(--space-2);
}
.xoji-badge--sm {
	font-size: var(--text-xs);
	gap: var(--space-1);
	padding: var(--space-0) var(--space-1);
}
.xoji-badge--lg {
	font-size: var(--text-sm);
	gap: var(--space-2);
	padding: var(--space-1) var(--space-3);
}
${toneSolid}
${toneSoft}
${toneOutline}
.xoji-badge__dot {
	display: inline-block;
	width: var(--space-2);
	height: var(--space-2);
	flex: none;
	border-radius: var(--radius-full);
	background: currentColor;
}
.xoji-badge--lg .xoji-badge__dot {
	width: var(--space-3);
	height: var(--space-3);
}
.xoji-badge--pulse-slow .xoji-badge__dot {
	animation: xoji-badge-pulse 1.8s var(--ease-standard) infinite;
}
.xoji-badge--pulse-fast .xoji-badge__dot {
	animation: xoji-badge-pulse 0.9s var(--ease-standard) infinite;
}
@media (prefers-reduced-motion: reduce) {
	.xoji-badge--pulse-slow .xoji-badge__dot,
	.xoji-badge--pulse-fast .xoji-badge__dot {
		animation: none;
	}
}
@keyframes xoji-badge-pulse {
	50% { opacity: 0.4; }
}
.xoji-badge__count {
	font-variant-numeric: tabular-nums;
	font-weight: var(--weight-semibold);
}
.xoji-badge__label {
	display: inline-flex;
	align-items: center;
}
.xoji-badge__sr-only {
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
.xoji-badge__remove {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1em;
	height: 1em;
	flex: none;
	margin-inline-start: var(--space-1);
	padding: 0;
	color: currentColor;
	background: transparent;
	border: none;
	border-radius: var(--radius-full);
	cursor: pointer;
	position: relative;
	isolation: isolate;
	transition: box-shadow var(--duration-fast) var(--ease-standard);
}
.xoji-badge__remove::after {
	content: "";
	position: absolute;
	inset: 0;
	border-radius: inherit;
	background: transparent;
	transition: background-color var(--duration-fast) var(--ease-standard);
	z-index: -1;
}
.xoji-badge__remove:hover::after { background: var(--state-hover); }
.xoji-badge__remove:active::after { background: var(--state-press); }
.xoji-badge__remove:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xoji-badge__remove svg {
	width: 0.75em;
	height: 0.75em;
}
.xoji-dot {
	display: inline-block;
	width: var(--space-2);
	height: var(--space-2);
	flex: none;
	border-radius: var(--radius-full);
	background: var(--neutral);
}
.xoji-dot--sm {
	width: var(--space-1);
	height: var(--space-1);
}
.xoji-dot--lg {
	width: var(--space-3);
	height: var(--space-3);
}
${TONES.map((t) => `.xoji-dot--${t} { background: var(--${t}); }`).join("\n")}
.xoji-dot--pulse-slow {
	animation: xoji-badge-pulse 1.8s var(--ease-standard) infinite;
}
.xoji-dot--pulse-fast {
	animation: xoji-badge-pulse 0.9s var(--ease-standard) infinite;
}
@media (prefers-reduced-motion: reduce) {
	.xoji-dot--pulse-slow,
	.xoji-dot--pulse-fast {
		animation: none;
	}
}
`.trim();
