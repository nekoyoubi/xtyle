import { FULL_TONES as TONES } from "../../vocab.js";

const toneRules = TONES.map(
	(t) => `.xtyle-spinner--${t} {
	color: var(--${t});
}`,
).join("\n");

export const spinnerCss = `
[data-spinner] { display: contents; }
.xtyle-spinner {
	display: inline-flex;
	width: 1.5em;
	height: 1.5em;
	flex: none;
	box-sizing: border-box;
	color: var(--accent);
	border: var(--border-thick) solid currentColor;
	border-top-color: transparent;
	border-radius: var(--radius-full);
	animation: xtyle-spinner-spin var(--duration-slow) linear infinite;
}
.xtyle-spinner--sm {
	width: 1em;
	height: 1em;
	border-width: var(--border-normal);
}
.xtyle-spinner--lg {
	width: 2.25em;
	height: 2.25em;
}
${toneRules}
@keyframes xtyle-spinner-spin {
	to { transform: rotate(360deg); }
}
`.trim();
