import { FULL_TONES } from "../../vocab.js";

const EMPHASIS = [
	["muted", "--fg-2"],
	["subtle", "--fg-3"],
] as const;

const emphasisRules = EMPHASIS.map(
	([name, token]) => `.xtyle-text--${name} { color: var(${token}); }`,
).join("\n");

const toneRules = FULL_TONES.map(
	(t) => `.xtyle-text--${t} { color: var(--${t}-vivid); }`,
).join("\n");

export const textCss = `
[data-root][data-text] { display: contents; }
.xtyle-text {
	margin: 0;
	font-family: var(--font-sans);
	font-size: var(--text-body);
	font-weight: var(--weight-normal);
	line-height: var(--leading-normal);
	color: var(--fg-0);
}
.xtyle-text--xs { font-size: var(--text-xs); }
.xtyle-text--sm { font-size: var(--text-sm); }
.xtyle-text--body { font-size: var(--text-body); }
.xtyle-text--lg { font-size: var(--text-lg); }
.xtyle-text--normal { font-weight: var(--weight-normal); }
.xtyle-text--medium { font-weight: var(--weight-medium); }
.xtyle-text--semibold { font-weight: var(--weight-semibold); }
.xtyle-text--bold { font-weight: var(--weight-bold); }
.xtyle-text--tight { line-height: var(--leading-tight); }
.xtyle-text--snug { line-height: var(--leading-normal); }
.xtyle-text--loose { line-height: var(--leading-loose); }
${emphasisRules}
${toneRules}
.xtyle-text--mono {
	font-family: var(--font-mono);
}
`.trim();
