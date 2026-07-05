import { FULL_TONES } from "../../vocab.js";

const switchToneVars = FULL_TONES.map(
	(t) => `.xtyle-switch--${t} { --switch-fill: var(--${t}); --switch-ink: var(--${t}-fg); }`,
).join("\n");

export const switchCss = `
.xtyle-switch {
	--switch-fill: var(--accent);
	--switch-ink: var(--accent-fg);
	display: inline-flex;
	align-items: center;
	gap: var(--space-2);
	font-family: var(--font-sans);
	font-size: var(--text-body);
	line-height: var(--leading-tight);
	color: var(--fg-0);
}
.xtyle-switch__track {
	--track-h: var(--space-5);
	--track-w: var(--space-7);
	--thumb: calc(var(--track-h) - var(--space-2));
	appearance: none;
	flex: none;
	width: var(--track-w);
	height: var(--track-h);
	padding: 0;
	border: var(--border-thin) solid var(--line-2);
	border-radius: var(--radius-full);
	background: var(--neutral-bg);
	cursor: pointer;
	position: relative;
	isolation: isolate;
	transition:
		background-color var(--duration-base) var(--ease-emphasized),
		border-color var(--duration-base) var(--ease-emphasized),
		box-shadow var(--duration-fast) var(--ease-standard);
}
.xtyle-switch__track::after {
	content: "";
	position: absolute;
	inset: 0;
	border-radius: inherit;
	background: transparent;
	transition: background-color var(--duration-fast) var(--ease-standard);
	z-index: -1;
}
.xtyle-switch__thumb {
	position: absolute;
	top: 50%;
	left: var(--space-1);
	transform: translateY(-50%);
	width: var(--thumb);
	height: var(--thumb);
	border-radius: var(--radius-full);
	background: var(--switch-ink);
	background: oklch(from var(--switch-fill) calc(l - 0.28) c h);
	box-shadow: var(--elevation-1);
	transition:
		left var(--duration-base) var(--ease-emphasized),
		top var(--duration-base) var(--ease-emphasized),
		background-color var(--duration-base) var(--ease-emphasized);
}
.xtyle-switch--sm .xtyle-switch__track {
	--track-h: var(--space-4);
	--track-w: var(--space-6);
}
.xtyle-switch__track[aria-checked="true"] {
	background: var(--switch-fill);
	border-color: var(--switch-fill);
}
.xtyle-switch__track[aria-checked="true"] .xtyle-switch__thumb {
	left: calc(100% - var(--thumb) - var(--space-1));
}
.xtyle-switch__track:hover::after { background: var(--state-hover); }
.xtyle-switch__track:active::after { background: var(--state-press); }
.xtyle-switch__track:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-switch__label {
	display: inline-flex;
	align-items: center;
	cursor: pointer;
}
.xtyle-switch__state {
	color: var(--fg-2);
	font-size: var(--text-sm);
}
.xtyle-switch--disabled {
	color: var(--fg-disabled);
}
.xtyle-switch__track:disabled,
.xtyle-switch__track[aria-disabled="true"] {
	cursor: not-allowed;
	background: var(--state-disabled);
	border-color: transparent;
}
.xtyle-switch__track:disabled .xtyle-switch__thumb,
.xtyle-switch__track[aria-disabled="true"] .xtyle-switch__thumb {
	background: var(--fg-disabled);
	box-shadow: none;
}
.xtyle-switch__track:disabled::after,
.xtyle-switch__track[aria-disabled="true"]::after { background: transparent; }
.xtyle-switch--disabled .xtyle-switch__label,
.xtyle-switch--disabled .xtyle-switch__state {
	cursor: not-allowed;
}
.xtyle-switch--label-end {
	flex-direction: row-reverse;
}
.xtyle-switch--square .xtyle-switch__track,
.xtyle-switch--square .xtyle-switch__thumb {
	border-radius: var(--radius-sm);
}
/* Reverse the on/off direction (polarity); the label is unaffected. Horizontal only —
 * vertical reverse is handled in the vertical block below. */
.xtyle-switch--reverse:not(.xtyle-switch--vertical) .xtyle-switch__thumb {
	left: calc(100% - var(--thumb) - var(--space-1));
}
.xtyle-switch--reverse:not(.xtyle-switch--vertical) .xtyle-switch__track[aria-checked="true"] .xtyle-switch__thumb {
	left: var(--space-1);
}
.xtyle-switch--vertical .xtyle-switch__track {
	width: var(--track-h);
	height: var(--track-w);
}
/* Vertical default follows a wall switch: down = off, up = on. */
.xtyle-switch--vertical .xtyle-switch__thumb {
	top: calc(100% - var(--thumb) - var(--space-1));
	left: 50%;
	transform: translateX(-50%);
}
.xtyle-switch--vertical .xtyle-switch__track[aria-checked="true"] .xtyle-switch__thumb {
	top: var(--space-1);
	left: 50%;
}
/* Vertical reversed: up = off, down = on. */
.xtyle-switch--vertical.xtyle-switch--reverse .xtyle-switch__thumb {
	top: var(--space-1);
}
.xtyle-switch--vertical.xtyle-switch--reverse .xtyle-switch__track[aria-checked="true"] .xtyle-switch__thumb {
	top: calc(100% - var(--thumb) - var(--space-1));
}
${switchToneVars}
`.trim();
