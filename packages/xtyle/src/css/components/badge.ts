import { FULL_TONES as TONES } from "../../vocab.js";

const toneSolid = TONES.map(
	(t) => `.xtyle-badge--solid.xtyle-badge--${t} {
	background: var(--${t});
	color: var(--${t}-fg);
	border-color: transparent;
}`,
).join("\n");

const toneSoft = TONES.map(
	(t) => `.xtyle-badge--soft.xtyle-badge--${t} {
	background: var(--${t}-bg);
	color: var(--${t}-text);
	border-color: transparent;
}`,
).join("\n");

const toneOutline = TONES.map(
	(t) => `.xtyle-badge--outline.xtyle-badge--${t} {
	background: transparent;
	color: var(--${t}-text);
	border-color: var(--${t});
}`,
).join("\n");

export const badgeCss = `
[data-root][data-badge] { display: contents; }
.xtyle-badge {
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
.xtyle-badge--sm {
	font-size: var(--text-xs);
	gap: var(--space-1);
	padding: var(--space-0) var(--space-1);
}
.xtyle-badge--lg {
	font-size: var(--text-sm);
	gap: var(--space-2);
	padding: var(--space-1) var(--space-3);
}
${toneSolid}
${toneSoft}
${toneOutline}
/* The dot itself is the shared .xtyle-dot primitive (shape, size ramp, pulse, reduced-motion — all of
   it). The badge only retints it to its own ink; it does not own a second implementation of a circle. */
.xtyle-badge__dot {
	--dot-color: currentColor;
}
.xtyle-badge__count {
	font-variant-numeric: tabular-nums;
	font-weight: var(--weight-semibold);
}
.xtyle-badge__label {
	display: inline-flex;
	align-items: center;
}
.xtyle-badge__sr-only {
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
.xtyle-badge__remove {
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
.xtyle-badge__remove::after {
	content: "";
	position: absolute;
	inset: 0;
	border-radius: inherit;
	background: transparent;
	transition: background-color var(--duration-fast) var(--ease-standard);
	z-index: -1;
}
.xtyle-badge__remove:hover::after { background: var(--state-hover); }
.xtyle-badge__remove:active::after { background: var(--state-press); }
.xtyle-badge__remove:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-badge__remove svg {
	width: 0.75em;
	height: 0.75em;
}
`.trim();
