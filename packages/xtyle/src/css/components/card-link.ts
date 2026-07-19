export const cardLinkCss = `
[data-root][data-card-link] { display: contents; }
.xtyle-card-link {
	text-decoration: none;
}
.xtyle-card-link:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
`.trim();
