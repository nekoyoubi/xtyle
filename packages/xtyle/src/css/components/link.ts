export const linkCss = `
[data-root][data-link] { display: contents; }
.xtyle-link {
	display: inline;
	font-family: var(--font-sans);
	color: var(--link);
	text-decoration: underline;
	text-decoration-thickness: var(--border-thin);
	text-underline-offset: var(--space-1);
	border-radius: var(--radius-sm);
	transition:
		color var(--duration-fast) var(--ease-standard),
		text-decoration-color var(--duration-fast) var(--ease-standard);
}
.xtyle-link:hover {
	color: var(--link-hover);
}
.xtyle-link:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-normal) var(--ring);
}
.xtyle-link--muted {
	color: var(--fg-2);
	text-decoration-color: transparent;
}
.xtyle-link--muted:hover {
	color: var(--link);
	text-decoration-color: currentColor;
}
.xtyle-link--quiet {
	color: var(--fg-3);
	text-decoration: none;
}
.xtyle-link--quiet:hover {
	color: var(--fg-2);
	text-decoration: underline;
	text-decoration-thickness: var(--border-thin);
	text-underline-offset: var(--space-1);
}
.xtyle-link__external-icon {
	display: inline-block;
	width: 0.85em;
	height: 0.85em;
	margin-inline-start: var(--space-1);
	vertical-align: baseline;
	flex: none;
}
.xtyle-link__sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	margin: -1px;
	padding: 0;
	overflow: hidden;
	clip: rect(0 0 0 0);
	clip-path: inset(50%);
	white-space: nowrap;
	border: 0;
}
`.trim();
