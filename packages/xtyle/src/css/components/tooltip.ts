import { FULL_TONES } from "../../vocab.js";

const toneVars = FULL_TONES.map(
	(t) =>
		`.xtyle-tooltip--${t} { --tt-tone: var(--${t}); --tt-tone-bg: var(--${t}-bg); --tt-tone-fg: var(--${t}-fg); --tt-tone-text: var(--${t}-text); --tt-edge-w: var(--space-1); }`,
).join("\n");

export const tooltipCss = `
.xtyle-tooltip {
	display: inline-flex;
	position: relative;
	--tt-edge-w: 0px;
}
.xtyle-tooltip__content {
	--xtyle-tt-shift: 0px;
	--xtyle-tt-arrow: 0px;
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
.xtyle-tooltip__content[data-open="true"] {
	display: block;
	opacity: 1;
}
@starting-style {
	.xtyle-tooltip__content[data-open="true"] {
		opacity: 0;
	}
}
.xtyle-tooltip__content::before {
	content: "";
	position: absolute;
	inset-block: 0;
	inset-inline-start: 0;
	width: var(--tt-edge-w);
	background: var(--tt-tone);
	border-start-start-radius: inherit;
	border-end-start-radius: inherit;
}
.xtyle-tooltip__arrow {
	position: absolute;
	width: var(--space-2);
	height: var(--space-2);
	background: var(--surface-overlay);
	border: var(--border-thin) solid var(--surface-overlay-border);
}
.xtyle-tooltip--md .xtyle-tooltip__content {
	--tt-pad-y: var(--space-2);
	--tt-pad-x: var(--space-3);
}
.xtyle-tooltip--rich .xtyle-tooltip__content {
	max-width: min(24rem, calc(100vw - var(--space-8)));
	text-align: start;
	white-space: normal;
	line-height: var(--leading-normal);
}
${toneVars}
.xtyle-tooltip--soft,
.xtyle-tooltip--solid {
	--tt-edge-w: 0px;
}
.xtyle-tooltip--soft .xtyle-tooltip__content {
	background: var(--tt-tone-bg);
	border-color: var(--tt-tone);
	color: var(--tt-tone-text);
}
.xtyle-tooltip--soft .xtyle-tooltip__arrow {
	background: var(--tt-tone-bg);
	border-color: var(--tt-tone);
}
.xtyle-tooltip--solid .xtyle-tooltip__content {
	background: var(--tt-tone);
	border-color: var(--tt-tone);
	color: var(--tt-tone-fg);
}
.xtyle-tooltip--solid .xtyle-tooltip__arrow {
	background: var(--tt-tone);
	border-color: var(--tt-tone);
}
.xtyle-tooltip--top .xtyle-tooltip__content {
	bottom: 100%;
	left: 50%;
	transform: translateX(calc(-50% + var(--xtyle-tt-shift)));
	margin-bottom: var(--space-2);
}
.xtyle-tooltip--top .xtyle-tooltip__arrow {
	bottom: calc(var(--space-2) * -1 / 2);
	left: 50%;
	margin-left: calc(var(--space-1) * -1);
	transform: translateX(var(--xtyle-tt-arrow)) rotate(45deg);
	border-top: none;
	border-left: none;
}
.xtyle-tooltip--bottom .xtyle-tooltip__content {
	top: 100%;
	left: 50%;
	transform: translateX(calc(-50% + var(--xtyle-tt-shift)));
	margin-top: var(--space-2);
}
.xtyle-tooltip--bottom .xtyle-tooltip__arrow {
	top: calc(var(--space-2) * -1 / 2);
	left: 50%;
	margin-left: calc(var(--space-1) * -1);
	transform: translateX(var(--xtyle-tt-arrow)) rotate(45deg);
	border-bottom: none;
	border-right: none;
}
.xtyle-tooltip--left .xtyle-tooltip__content {
	right: 100%;
	top: 50%;
	transform: translateY(calc(-50% + var(--xtyle-tt-shift)));
	margin-right: var(--space-2);
}
.xtyle-tooltip--left .xtyle-tooltip__arrow {
	right: calc(var(--space-2) * -1 / 2);
	top: 50%;
	margin-top: calc(var(--space-1) * -1);
	transform: translateY(var(--xtyle-tt-arrow)) rotate(45deg);
	border-bottom: none;
	border-left: none;
}
.xtyle-tooltip--right .xtyle-tooltip__content {
	left: 100%;
	top: 50%;
	transform: translateY(calc(-50% + var(--xtyle-tt-shift)));
	margin-left: var(--space-2);
}
.xtyle-tooltip--right .xtyle-tooltip__arrow {
	left: calc(var(--space-2) * -1 / 2);
	top: 50%;
	margin-top: calc(var(--space-1) * -1);
	transform: translateY(var(--xtyle-tt-arrow)) rotate(45deg);
	border-top: none;
	border-right: none;
}
`.trim();
