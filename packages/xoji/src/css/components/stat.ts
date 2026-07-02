const SENTIMENTS = [
	["positive", "--success-vivid"],
	["negative", "--danger-vivid"],
	["neutral", "--neutral-vivid"],
] as const;

const sentimentRules = SENTIMENTS.map(
	([name, token]) => `.xoji-stat__delta--${name} { color: var(${token}); }`,
).join("\n");

export const statCss = `
[data-stat] { display: contents; }
.xoji-stat {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	font-family: var(--font-sans);
	align-items: flex-start;
	text-align: start;
}
.xoji-stat--center {
	align-items: center;
	text-align: center;
}
.xoji-stat--inline {
	flex-direction: row;
	align-items: center;
	gap: var(--space-2);
}
.xoji-stat--inline .xoji-stat__value {
	font-family: var(--font-sans);
	font-size: var(--text-sm);
}
.xoji-stat--inline .xoji-stat__delta {
	font-size: var(--text-xs);
	gap: 0;
	margin-inline-start: calc(-1 * var(--space-2));
}
.xoji-stat--inline .xoji-stat__delta svg {
	width: 1.44em;
	height: 1.44em;
}
.xoji-stat__label {
	order: -1;
	font-size: var(--text-xs);
	font-weight: var(--weight-semibold);
	line-height: var(--leading-normal);
	letter-spacing: 0.06em;
	text-transform: uppercase;
	color: var(--fg-2);
}
.xoji-stat__value {
	font-family: var(--font-display);
	font-size: var(--text-2xl);
	font-weight: var(--weight-bold);
	line-height: var(--leading-tight);
	color: var(--fg-0);
	font-variant-numeric: tabular-nums;
}
.xoji-stat--sm .xoji-stat__value { font-size: var(--text-xl); }
.xoji-stat--lg .xoji-stat__value { font-size: var(--text-3xl); }
.xoji-stat__delta {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
	font-size: var(--text-sm);
	font-weight: var(--weight-semibold);
	font-variant-numeric: tabular-nums;
	color: var(--neutral-text);
}
.xoji-stat__delta svg {
	width: 0.85em;
	height: 0.85em;
}
${sentimentRules}
.xoji-stat__caption {
	font-size: var(--text-xs);
	line-height: var(--leading-normal);
	color: var(--fg-3);
}
`.trim();
