import { FULL_TONES } from "../../vocab.js";

const toneRules = FULL_TONES.filter((t) => t !== "accent")
	.map((t) => `.xoji-eyebrow--${t} { color: var(--${t}-vivid); }`)
	.join("\n");

export const eyebrowCss = `
[data-eyebrow] { display: contents; }
.xoji-eyebrow {
	margin: 0;
	font-family: var(--font-sans);
	font-size: var(--text-xs);
	font-weight: var(--weight-semibold);
	line-height: var(--leading-tight);
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: var(--accent-vivid);
}
.xoji-eyebrow--wide { letter-spacing: 0.12em; }
.xoji-eyebrow--muted { color: var(--fg-2); }
.xoji-eyebrow--subtle { color: var(--fg-3); }
${toneRules}
`.trim();
