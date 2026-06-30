import { FULL_TONES } from "../../vocab.js";

const EMPHASIS = [
	["muted", "--fg-2"],
	["subtle", "--fg-3"],
] as const;

const emphasisRules = EMPHASIS.map(
	([name, token]) => `.xoji-text--${name} { color: var(${token}); }`,
).join("\n");

const toneRules = FULL_TONES.map(
	(t) => `.xoji-text--${t} { color: var(--${t}-vivid); }`,
).join("\n");

export const textCss = `
[data-text] { display: contents; }
.xoji-text {
	margin: 0;
	font-family: var(--font-sans);
	font-size: var(--text-body);
	font-weight: var(--weight-normal);
	line-height: var(--leading-normal);
	color: var(--fg-0);
}
.xoji-text--xs { font-size: var(--text-xs); }
.xoji-text--sm { font-size: var(--text-sm); }
.xoji-text--body { font-size: var(--text-body); }
.xoji-text--lg { font-size: var(--text-lg); }
.xoji-text--normal { font-weight: var(--weight-normal); }
.xoji-text--medium { font-weight: var(--weight-medium); }
.xoji-text--semibold { font-weight: var(--weight-semibold); }
.xoji-text--bold { font-weight: var(--weight-bold); }
.xoji-text--tight { line-height: var(--leading-tight); }
.xoji-text--snug { line-height: var(--leading-normal); }
.xoji-text--loose { line-height: var(--leading-loose); }
${emphasisRules}
${toneRules}
.xoji-text--mono {
	font-family: var(--font-mono);
}
`.trim();
