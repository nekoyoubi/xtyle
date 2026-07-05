import { FULL_TONES } from "../../vocab.js";

const LARGE_SIZES = ["lg", "xl", "2xl", "3xl", "4xl", "5xl"] as const;
const EMPHASIS = [
	["muted", "--fg-2"],
	["subtle", "--fg-3"],
] as const;

const sizeRules = LARGE_SIZES.map(
	(s) => `.xtyle-heading--${s} { font-size: var(--text-${s}); }`,
).join("\n");

const emphasisRules = EMPHASIS.map(
	([name, token]) => `.xtyle-heading--${name} { color: var(${token}); }`,
).join("\n");

const toneRules = FULL_TONES.map(
	(t) => `.xtyle-heading--${t} { color: var(--${t}-vivid); }`,
).join("\n");

export const headingCss = `
[data-heading] { display: contents; }
.xtyle-heading {
	margin: 0;
	font-family: var(--font-display);
	font-size: var(--text-body);
	font-weight: var(--weight-bold);
	line-height: var(--leading-tight);
	color: var(--fg-0);
	text-wrap: balance;
}
.xtyle-heading--xs {
	font-size: var(--text-xs);
	font-weight: var(--weight-semibold);
	line-height: var(--leading-normal);
}
.xtyle-heading--sm {
	font-size: var(--text-sm);
	font-weight: var(--weight-semibold);
}
.xtyle-heading--md {
	font-size: var(--text-body);
}
${sizeRules}
${emphasisRules}
${toneRules}
`.trim();
