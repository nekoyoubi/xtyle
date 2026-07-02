import { FULL_TONES } from "../../vocab.js";

const toneVars = FULL_TONES.map(
	(t) =>
		`.xoji-tooltip--${t} { --tt-tone: var(--${t}); --tt-tone-bg: var(--${t}-bg); --tt-tone-fg: var(--${t}-fg); --tt-tone-text: var(--${t}-text); --tt-edge-w: var(--space-1); }`,
).join("\n");

export const tooltipCss = `
.xoji-tooltip {
	display: inline-flex;
	position: relative;
	--tt-edge-w: 0px;
}
.xoji-tooltip__content {
	--xoji-tt-shift: 0px;
	--xoji-tt-arrow: 0px;
	--tt-pad-y: var(--space-1);
	--tt-pad-x: var(--space-2);
	position: absolute;
	z-index: 1;
	width: max-content;
	max-width: min(18rem, calc(100vw - var(--space-8)));
	margin: 0;
	padding: var(--tt-pad-y) var(--tt-pad-x) var(--tt-pad-y) calc(var(--tt-pad-x) + var(--tt-edge-w));
	font-family: var(--font-sans);
	font-size: var(--text-sm);
	font-weight: var(--weight-normal);
	line-height: var(--leading-tight);
	color: var(--fg-0);
	background: var(--surface-overlay);
	border: var(--border-thin) solid var(--surface-overlay-border);
	border-radius: var(--radius-sm);
	box-shadow: var(--elevation-2);
	display: none;
	opacity: 0;
	transition:
		opacity var(--duration-fast) var(--ease-standard),
		display var(--duration-fast) var(--ease-standard) allow-discrete;
}
.xoji-tooltip__content[data-open="true"] {
	display: block;
	opacity: 1;
}
@starting-style {
	.xoji-tooltip__content[data-open="true"] {
		opacity: 0;
	}
}
.xoji-tooltip__content::before {
	content: "";
	position: absolute;
	inset-block: 0;
	inset-inline-start: 0;
	width: var(--tt-edge-w);
	background: var(--tt-tone);
	border-start-start-radius: inherit;
	border-end-start-radius: inherit;
}
.xoji-tooltip__arrow {
	position: absolute;
	width: var(--space-2);
	height: var(--space-2);
	background: var(--surface-overlay);
	border: var(--border-thin) solid var(--surface-overlay-border);
}
.xoji-tooltip--md .xoji-tooltip__content {
	--tt-pad-y: var(--space-2);
	--tt-pad-x: var(--space-3);
}
.xoji-tooltip--rich .xoji-tooltip__content {
	max-width: min(24rem, calc(100vw - var(--space-8)));
	text-align: start;
	white-space: normal;
	line-height: var(--leading-normal);
}
${toneVars}
.xoji-tooltip--soft,
.xoji-tooltip--solid {
	--tt-edge-w: 0px;
}
.xoji-tooltip--soft .xoji-tooltip__content {
	background: var(--tt-tone-bg);
	border-color: var(--tt-tone);
	color: var(--tt-tone-text);
}
.xoji-tooltip--soft .xoji-tooltip__arrow {
	background: var(--tt-tone-bg);
	border-color: var(--tt-tone);
}
.xoji-tooltip--solid .xoji-tooltip__content {
	background: var(--tt-tone);
	border-color: var(--tt-tone);
	color: var(--tt-tone-fg);
}
.xoji-tooltip--solid .xoji-tooltip__arrow {
	background: var(--tt-tone);
	border-color: var(--tt-tone);
}
.xoji-tooltip--top .xoji-tooltip__content {
	bottom: 100%;
	left: 50%;
	transform: translateX(calc(-50% + var(--xoji-tt-shift)));
	margin-bottom: var(--space-2);
}
.xoji-tooltip--top .xoji-tooltip__arrow {
	bottom: calc(var(--space-2) * -1 / 2);
	left: 50%;
	margin-left: calc(var(--space-1) * -1);
	transform: translateX(var(--xoji-tt-arrow)) rotate(45deg);
	border-top: none;
	border-left: none;
}
.xoji-tooltip--bottom .xoji-tooltip__content {
	top: 100%;
	left: 50%;
	transform: translateX(calc(-50% + var(--xoji-tt-shift)));
	margin-top: var(--space-2);
}
.xoji-tooltip--bottom .xoji-tooltip__arrow {
	top: calc(var(--space-2) * -1 / 2);
	left: 50%;
	margin-left: calc(var(--space-1) * -1);
	transform: translateX(var(--xoji-tt-arrow)) rotate(45deg);
	border-bottom: none;
	border-right: none;
}
.xoji-tooltip--left .xoji-tooltip__content {
	right: 100%;
	top: 50%;
	transform: translateY(calc(-50% + var(--xoji-tt-shift)));
	margin-right: var(--space-2);
}
.xoji-tooltip--left .xoji-tooltip__arrow {
	right: calc(var(--space-2) * -1 / 2);
	top: 50%;
	margin-top: calc(var(--space-1) * -1);
	transform: translateY(var(--xoji-tt-arrow)) rotate(45deg);
	border-bottom: none;
	border-left: none;
}
.xoji-tooltip--right .xoji-tooltip__content {
	left: 100%;
	top: 50%;
	transform: translateY(calc(-50% + var(--xoji-tt-shift)));
	margin-left: var(--space-2);
}
.xoji-tooltip--right .xoji-tooltip__arrow {
	left: calc(var(--space-2) * -1 / 2);
	top: 50%;
	margin-top: calc(var(--space-1) * -1);
	transform: translateY(var(--xoji-tt-arrow)) rotate(45deg);
	border-top: none;
	border-right: none;
}
`.trim();
