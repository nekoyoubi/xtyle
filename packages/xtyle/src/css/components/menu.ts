export const menuCss = `
.xtyle-menu {
	display: inline-block;
}
xtyle-menu[context],
.xtyle-menu[data-context] {
	display: contents;
}
.xtyle-menu__trigger {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
	font-family: var(--font-sans);
	font-size: var(--text-sm);
	color: var(--fg-1);
	background: var(--bg-1);
	border: var(--border-thin) solid var(--line);
	border-radius: var(--radius-md);
	padding-block: var(--space-1);
	padding-inline: var(--space-3);
	cursor: pointer;
	transition:
		background-color var(--duration-fast) var(--ease-standard),
		color var(--duration-fast) var(--ease-standard);
}
.xtyle-menu__trigger[hidden] {
	display: none;
}
.xtyle-menu__trigger:hover {
	background: var(--state-hover);
	color: var(--fg-0);
}
.xtyle-menu__trigger:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-menu__trigger[aria-expanded="true"] {
	background: var(--state-selected);
	color: var(--fg-0);
}
.xtyle-menu__popup {
	position: fixed;
	margin: 0;
	min-width: 11rem;
	padding: var(--space-1);
	font-family: var(--font-sans);
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
	background: var(--surface-overlay);
	border: var(--border-thin) solid var(--surface-overlay-border);
	border-radius: var(--radius-md);
	box-shadow: var(--elevation-3);
}
.xtyle-menu__popup:not(:popover-open) {
	display: none;
}
.xtyle-menu__item {
	display: flex;
	align-items: center;
	width: 100%;
	gap: var(--space-3);
	padding-block: var(--space-1);
	padding-inline: var(--space-3);
	font: inherit;
	text-align: start;
	color: var(--fg-1);
	background: transparent;
	border: none;
	border-radius: var(--radius-sm);
	cursor: pointer;
	transition: background-color var(--duration-fast) var(--ease-standard);
}
.xtyle-menu__item-label {
	flex: 1 1 auto;
	min-width: 0;
}
.xtyle-menu__item-hint {
	flex: none;
	font-family: var(--font-mono);
	font-size: var(--text-xs);
	color: inherit;
	opacity: 0.65;
}
.xtyle-menu__group {
	display: contents;
}
.xtyle-menu__heading {
	padding-block: var(--space-1);
	padding-inline: var(--space-3);
	font-size: var(--text-xs);
	font-weight: 600;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	color: var(--fg-2);
}
.xtyle-menu__item:hover,
.xtyle-menu__item:focus-visible {
	outline: none;
	background: var(--accent-bg);
	color: var(--accent-text);
}
.xtyle-menu__item[data-intent="danger"]:not([aria-disabled="true"]) {
	color: var(--danger-text);
}
.xtyle-menu__item[data-intent="danger"]:not([aria-disabled="true"]):hover,
.xtyle-menu__item[data-intent="danger"]:not([aria-disabled="true"]):focus-visible {
	background: var(--danger-bg);
}
.xtyle-menu__item[aria-disabled="true"] {
	color: var(--fg-disabled);
	cursor: not-allowed;
	background: transparent;
}
.xtyle-menu__separator {
	height: var(--border-thin);
	margin-block: var(--space-1);
	margin-inline: var(--space-2);
	background: var(--line);
}
`.trim();
