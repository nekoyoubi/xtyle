export const stepsCss = `
.xtyle-steps {
	display: block;
	font-family: var(--font-sans);
}
.xtyle-steps__list {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
}
.xtyle-steps__step {
	flex: 1;
	min-width: 0;
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	gap: var(--space-2);
	font-size: var(--text-sm);
	color: var(--fg-1);
}
.xtyle-steps__marker {
	z-index: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.8rem;
	height: 1.8rem;
	border-radius: var(--radius-full);
	font-size: var(--text-sm);
	font-weight: var(--weight-semibold);
	background: var(--bg-1);
	color: var(--fg-2);
	border: var(--border-thick) solid var(--line);
	box-sizing: border-box;
}
.xtyle-steps__connector {
	position: absolute;
	top: 0.9rem;
	left: -50%;
	width: 100%;
	height: var(--border-thick);
	background: var(--line);
	z-index: 0;
}
.xtyle-steps__label {
	display: block;
	max-width: 100%;
}
.xtyle-steps__step--done .xtyle-steps__marker {
	background: var(--accent);
	color: var(--accent-fg);
	border-color: var(--accent);
}
.xtyle-steps__step--current .xtyle-steps__marker {
	background: var(--bg-0);
	color: var(--accent-text);
	border-color: var(--accent);
}
.xtyle-steps__step--current {
	color: var(--fg-0);
	font-weight: var(--weight-medium);
}
.xtyle-steps__step--done .xtyle-steps__connector,
.xtyle-steps__step--current .xtyle-steps__connector {
	background: var(--accent);
}
`.trim();
