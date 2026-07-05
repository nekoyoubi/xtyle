export const heroCss = `
xoji-hero {
	display: grid;
	gap: var(--space-5);
	justify-items: center;
	align-content: center;
	text-align: center;
	padding: var(--space-8) var(--space-6);
}
xoji-hero[align="start"] {
	justify-items: start;
	text-align: start;
}
xoji-hero:not([split]) > * {
	max-width: 62ch;
}
xoji-hero[split] {
	grid-template-columns: 1fr 1fr;
	gap: var(--space-8);
	align-items: center;
	justify-items: stretch;
	text-align: start;
}
@media (max-width: 48rem) {
	xoji-hero[split] {
		grid-template-columns: 1fr;
	}
}
`.trim();
