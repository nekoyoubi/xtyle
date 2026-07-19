export const commandPaletteCss = `
.xtyle-command-palette {
	display: contents;
}
.xtyle-command-palette__dialog {
	width: min(36rem, calc(100vw - var(--space-6)));
	max-width: calc(100vw - var(--space-6));
	max-height: min(30rem, calc(100vh - var(--space-8)));
	margin: 12vh auto auto;
	padding: 0;
	font-family: var(--font-sans);
	font-size: var(--text-body);
	line-height: var(--leading-normal);
	color: var(--fg-0);
	background: var(--surface-overlay);
	border: var(--border-thin) solid var(--surface-overlay-border);
	border-radius: var(--radius-lg);
	box-shadow: var(--elevation-5);
	overflow: hidden;
}
.xtyle-command-palette__dialog[open] {
	display: flex;
	flex-direction: column;
}
.xtyle-command-palette__dialog::backdrop {
	background: var(--scrim);
}
.xtyle-command-palette__search {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	flex: none;
	padding-block: var(--space-3);
	padding-inline: var(--space-4);
	border-bottom: var(--border-thin) solid var(--line);
}
.xtyle-command-palette__glyph {
	display: inline-flex;
	flex: none;
	color: var(--fg-2);
}
.xtyle-command-palette__glyph svg {
	width: 1.1em;
	height: 1.1em;
}
.xtyle-command-palette__input {
	flex: 1 1 auto;
	min-width: 0;
	padding: 0;
	margin: 0;
	font: inherit;
	color: var(--fg-0);
	background: transparent;
	border: none;
}
.xtyle-command-palette__input:focus {
	outline: none;
}
.xtyle-command-palette__input::placeholder {
	color: var(--fg-3);
}
.xtyle-command-palette__results {
	flex: 1 1 auto;
	overflow-y: auto;
	padding: var(--space-2);
}
.xtyle-command-palette__list {
	display: block;
}
.xtyle-command-palette__group + .xtyle-command-palette__group {
	margin-top: var(--space-2);
}
.xtyle-command-palette__heading {
	padding-block: var(--space-1);
	padding-inline: var(--space-3);
	font-size: var(--text-xs);
	font-weight: var(--weight-semibold);
	letter-spacing: 0.04em;
	text-transform: uppercase;
	color: var(--fg-2);
}
.xtyle-command-palette__option {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	box-sizing: border-box;
	padding-block: var(--space-2);
	padding-inline: var(--space-3);
	color: var(--fg-1);
	border-radius: var(--radius-sm);
	cursor: pointer;
	scroll-margin-block: var(--space-6);
	transition: background-color var(--duration-fast) var(--ease-standard);
}
.xtyle-command-palette__option[data-active="true"] {
	background: var(--accent-bg);
	color: var(--fg-0);
}
.xtyle-command-palette__option[aria-disabled="true"] {
	color: var(--fg-disabled);
	background: transparent;
	cursor: not-allowed;
}
.xtyle-command-palette__label {
	flex: 1 1 auto;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: var(--text-sm);
}
.xtyle-command-palette__match {
	background: transparent;
	color: var(--accent);
	font-weight: var(--weight-semibold);
}
.xtyle-command-palette__option[data-active="true"] .xtyle-command-palette__match {
	color: inherit;
	text-decoration: underline;
}
.xtyle-command-palette__option[aria-disabled="true"] .xtyle-command-palette__match {
	color: inherit;
}
.xtyle-command-palette__hint {
	flex: none;
	font-size: var(--text-xs);
	color: inherit;
	opacity: 0.7;
}
.xtyle-command-palette__keys {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
	flex: none;
}
.xtyle-command-palette__empty {
	margin: 0;
	padding-block: var(--space-6);
	padding-inline: var(--space-4);
	text-align: center;
	font-size: var(--text-sm);
	color: var(--fg-2);
}
.xtyle-command-palette__empty[hidden] {
	display: none;
}
.xtyle-command-palette__footer {
	display: flex;
	align-items: center;
	gap: var(--space-4);
	flex: none;
	padding-block: var(--space-2);
	padding-inline: var(--space-4);
	font-size: var(--text-xs);
	color: var(--fg-2);
	border-top: var(--border-thin) solid var(--line);
}
.xtyle-command-palette__footer[hidden] {
	display: none;
}
.xtyle-command-palette__legend {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
}
`.trim();
