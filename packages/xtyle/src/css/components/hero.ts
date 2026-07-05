export const heroCss = `
xtyle-hero {
	display: grid;
	gap: var(--space-5);
	justify-items: center;
	align-content: center;
	text-align: center;
	padding: var(--space-8) var(--space-6);
}
xtyle-hero[align="start"] {
	justify-items: start;
	text-align: start;
}
xtyle-hero:not([split]) > * {
	max-width: 62ch;
}
xtyle-hero[split] {
	grid-template-columns: 1fr 1fr;
	gap: var(--space-8);
	align-items: center;
	justify-items: stretch;
	text-align: start;
}
@media (max-width: 48rem) {
	xtyle-hero[split] {
		grid-template-columns: 1fr;
	}
}
`.trim();
