import { FULL_TONES } from "../../vocab.js";

const sliderToneVars = FULL_TONES.map((t) => `.xtyle-slider--${t} { --slider-accent: var(--${t}); }`).join("\n");

export const sliderCss = `
.xtyle-slider {
	--slider-accent: var(--accent);
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	font-family: var(--font-sans);
	font-size: var(--text-body);
	line-height: var(--leading-tight);
	color: var(--fg-0);
}
.xtyle-slider__rail {
	--rail-h: var(--space-2);
	--thumb: var(--space-5);
	position: relative;
	display: flex;
	align-items: center;
	height: var(--thumb);
	cursor: pointer;
	touch-action: none;
}
.xtyle-slider__groove {
	position: absolute;
	inset-inline: 0;
	height: var(--rail-h);
	border-radius: var(--radius-full);
	background: var(--neutral-bg);
	border: var(--border-thin) solid var(--line-2);
}
.xtyle-slider__fill {
	position: absolute;
	inset-inline-start: 0;
	width: 0%;
	height: var(--rail-h);
	border-radius: var(--radius-full);
	background: var(--slider-accent);
}
.xtyle-slider__thumb {
	position: absolute;
	inset-inline-start: 0%;
	transform: translateX(-50%);
	width: var(--thumb);
	height: var(--thumb);
	border-radius: var(--radius-full);
	background: var(--bg-0);
	border: var(--border-normal) solid var(--slider-accent);
	box-shadow: var(--elevation-1);
	isolation: isolate;
	transition: box-shadow var(--duration-fast) var(--ease-standard);
}
.xtyle-slider__thumb::after {
	content: "";
	position: absolute;
	inset: 0;
	border-radius: inherit;
	background: transparent;
	transition: background-color var(--duration-fast) var(--ease-standard);
}
.xtyle-slider__thumb:hover::after { background: var(--state-hover); }
.xtyle-slider__thumb:active::after { background: var(--state-press); }
.xtyle-slider__thumb:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-slider--sm .xtyle-slider__rail { --thumb: var(--space-4); --rail-h: var(--space-1); }
.xtyle-slider--lg .xtyle-slider__rail { --thumb: var(--space-6); --rail-h: var(--space-2); }
.xtyle-slider__header {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: var(--space-2);
}
.xtyle-slider__label {
	color: var(--fg-1);
	font-size: var(--text-sm);
}
.xtyle-slider__label--hidden {
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
.xtyle-slider__value {
	color: var(--fg-1);
	font-size: var(--text-sm);
	font-variant-numeric: tabular-nums;
}
.xtyle-slider--value-editable .xtyle-slider__value {
	cursor: text;
	text-decoration: underline dotted;
	text-underline-offset: 0.2em;
	text-decoration-color: var(--line-2);
}
.xtyle-slider__value-input {
	box-sizing: content-box;
	width: 4ch;
	font: inherit;
	color: var(--fg-0);
	text-align: right;
	background: var(--field-bg);
	border: var(--border-thin) solid var(--field-border);
	border-radius: var(--radius-sm);
	padding: 0 var(--space-1);
}
.xtyle-slider__value-input:focus-visible {
	outline: var(--border-normal) solid transparent;
	border-color: var(--slider-accent);
	box-shadow: 0 0 0 var(--border-normal) var(--ring);
}
.xtyle-slider--disabled {
	color: var(--fg-disabled);
}
.xtyle-slider--disabled .xtyle-slider__rail { cursor: not-allowed; }
.xtyle-slider--disabled .xtyle-slider__fill { background: var(--state-disabled); }
.xtyle-slider--disabled .xtyle-slider__thumb {
	background: var(--state-disabled);
	border-color: var(--line-2);
	box-shadow: none;
}
${sliderToneVars}
`.trim();
