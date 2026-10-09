import { FULL_TONES } from "../../vocab.js";

const toneRules = FULL_TONES.map(
	(t) => `.xtyle-number-format--${t} { color: var(--${t}-vivid); }`,
).join("\n");

export const numberFormatCss = `
[data-root][data-number-format] { display: contents; }
.xtyle-number-format {
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}
.xtyle-number-format--proportional { font-variant-numeric: normal; }
${toneRules}
`.trim();
