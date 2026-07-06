export const meterCss = `
.xtyle-meter {
	display: block;
	font-family: var(--font-sans);
}
.xtyle-meter__label {
	display: flex;
	justify-content: space-between;
	gap: var(--space-2);
	margin-bottom: var(--space-1);
	font-size: var(--text-sm);
	color: var(--fg-1);
}
.xtyle-meter__value {
	color: var(--fg-2);
	font-variant-numeric: tabular-nums;
}
.xtyle-meter__track {
	height: 0.55rem;
	background: var(--bg-2);
	border-radius: var(--radius-full);
	overflow: hidden;
}
.xtyle-meter__fill {
	height: 100%;
	min-width: 0.55rem;
	border-radius: var(--radius-full);
	background: var(--accent);
}
.xtyle-meter--good .xtyle-meter__fill {
	background: var(--success);
}
.xtyle-meter--okay .xtyle-meter__fill {
	background: var(--warn);
}
.xtyle-meter--bad .xtyle-meter__fill {
	background: var(--danger);
}
`.trim();
