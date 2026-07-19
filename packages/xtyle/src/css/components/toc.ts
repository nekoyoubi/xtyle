export const tocCss = `
.xtyle-toc {
	padding: var(--space-3) var(--space-2);
	border-left: var(--border-thin) solid var(--line);
}
.xtyle-toc--sticky {
	position: sticky;
	top: var(--space-5);
	align-self: start;
}
.xtyle-toc__label {
	display: block;
	font-family: var(--font-sans);
	font-size: var(--text-xs);
	font-weight: var(--weight-semibold);
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: var(--fg-2);
	padding: 0 var(--space-2);
	margin-bottom: var(--space-2);
}
.xtyle-toc__list {
	list-style: none;
	margin: 0;
	padding: 0;
	display: grid;
	gap: 0.1rem;
}
.xtyle-toc__list--nested {
	padding-inline-start: var(--space-4);
	margin-top: 0.1rem;
	--xtyle-toc-ink: var(--fg-3);
}
.xtyle-toc__list--nested .xtyle-toc__link {
	font-size: var(--text-xs);
}
.xtyle-toc__link {
	display: block;
	font-family: var(--font-sans);
	font-size: var(--text-sm);
	color: var(--xtyle-toc-ink, var(--fg-2));
	padding: 0.25em 0.6em;
	border-left: var(--border-thick) solid var(--xtyle-toc-rail, transparent);
	font-weight: var(--xtyle-toc-weight, inherit);
	margin-left: calc(-1 * var(--space-2) - var(--border-thin));
	text-decoration: none;
	transition:
		color var(--duration-fast) var(--ease-standard),
		border-color var(--duration-fast) var(--ease-standard);
}
.xtyle-toc__link:hover {
	--xtyle-toc-ink: var(--fg-0);
}
.xtyle-toc__link.is-active {
	--xtyle-toc-ink: var(--accent-text);
	--xtyle-toc-rail: var(--accent);
	--xtyle-toc-weight: var(--weight-medium);
	--xtyle-toc-chip: var(--accent-bg);
}
.xtyle-toc__link:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
	border-radius: var(--radius-sm);
}
@media (max-width: 40rem) {
	.xtyle-toc {
		border-left: none;
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-md);
		background: var(--bg-1);
		padding: var(--space-3);
	}
	.xtyle-toc__list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-2);
	}
	.xtyle-toc__link {
		border-left: none;
		margin-left: 0;
		border-radius: var(--radius-sm);
		padding: 0.2em 0.55em;
		background: var(--xtyle-toc-chip, transparent);
	}
	.xtyle-toc__list--nested {
		padding-inline-start: 0;
		--xtyle-toc-ink: var(--fg-3);
	}
}
`.trim();
