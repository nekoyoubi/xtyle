export const comboboxCss = `
.xtyle-combobox {
	/* the control's own width, measured and set on the popover host once the panel opens; the panel is
	   width:max-content, so the list is what sizes it. Declared here, not on the list itself — a local
	   declaration would shadow the inherited measurement and pin every panel to the fallback. */
	--xtyle-combobox-anchor: 12rem;
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	font-family: var(--font-sans);
}
.xtyle-combobox__label {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
	font-size: var(--text-sm);
	font-weight: var(--weight-medium);
	color: var(--fg-1);
	line-height: var(--leading-normal);
}
.xtyle-combobox__required {
	color: var(--danger);
	font-weight: var(--weight-semibold);
}
.xtyle-combobox__control {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: var(--space-1);
	padding: var(--space-1) var(--space-2);
	color: var(--fg-0);
	background: var(--field-bg);
	border: var(--border-thin) solid var(--field-border);
	border-radius: var(--radius-md);
	cursor: text;
	transition:
		border-color var(--duration-fast) var(--ease-standard),
		box-shadow var(--duration-fast) var(--ease-standard);
}
.xtyle-combobox__control:focus-within {
	border-color: var(--accent);
	box-shadow: 0 0 0 var(--border-normal) var(--ring);
}
.xtyle-combobox__chips {
	display: contents;
}
.xtyle-combobox__chip {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
	max-width: 100%;
	padding-left: var(--space-2);
	font-size: var(--text-sm);
	line-height: var(--leading-tight);
	color: var(--accent-text);
	background: var(--accent-bg);
	border-radius: var(--radius-sm);
}
.xtyle-combobox__chip-label {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.xtyle-combobox__chip-remove {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: none;
	width: 1.5em;
	height: 1.5em;
	padding: 0;
	color: inherit;
	background: transparent;
	border: none;
	border-radius: var(--radius-sm);
	cursor: pointer;
	opacity: 0.7;
	transition: opacity var(--duration-fast) var(--ease-standard);
}
.xtyle-combobox__chip-remove:hover {
	opacity: 1;
}
.xtyle-combobox__chip-remove:focus-visible {
	outline: none;
	opacity: 1;
	box-shadow: 0 0 0 var(--border-normal) var(--ring);
}
.xtyle-combobox__input {
	flex: 1 1 6rem;
	min-width: 0;
	padding: var(--space-1);
	font-family: inherit;
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
	color: var(--fg-0);
	background: transparent;
	border: none;
	border-radius: var(--radius-sm);
	box-shadow: none;
}
.xtyle-combobox__input:focus-visible {
	outline: none;
	box-shadow: none;
}
.xtyle-combobox__input::placeholder {
	color: var(--placeholder);
}
.xtyle-combobox--sm .xtyle-combobox__control { padding: 0 var(--space-1); }
.xtyle-combobox--sm .xtyle-combobox__input { font-size: var(--text-sm); padding: var(--space-1) var(--space-2); }
.xtyle-combobox--lg .xtyle-combobox__control { padding: var(--space-2) var(--space-3); }
.xtyle-combobox--lg .xtyle-combobox__input { font-size: var(--text-lg); padding: var(--space-1) var(--space-2); }
.xtyle-combobox__action {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: none;
	width: 1.75em;
	height: 1.75em;
	padding: 0;
	color: var(--fg-2);
	background: transparent;
	border: var(--border-thin) solid transparent;
	border-radius: var(--radius-sm);
	cursor: pointer;
	transition:
		color var(--duration-fast) var(--ease-standard),
		background-color var(--duration-fast) var(--ease-standard);
}
.xtyle-combobox__action:hover {
	color: var(--fg-0);
	background: var(--state-hover);
}
.xtyle-combobox__action:active {
	background: var(--state-press);
}
.xtyle-combobox__action:focus-visible {
	outline: none;
	color: var(--fg-0);
	box-shadow: 0 0 0 var(--border-normal) var(--ring);
}
.xtyle-combobox__caret {
	transition: transform var(--duration-fast) var(--ease-standard);
}
.xtyle-combobox--open .xtyle-combobox__caret {
	transform: rotate(180deg);
}
.xtyle-combobox__description {
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
	color: var(--fg-2);
}
.xtyle-combobox__error {
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
	color: var(--danger-text);
}
.xtyle-combobox--invalid .xtyle-combobox__control {
	border-color: var(--danger);
}
.xtyle-combobox--invalid .xtyle-combobox__control:focus-within {
	box-shadow: 0 0 0 var(--border-normal) var(--danger-bg);
}
.xtyle-combobox--disabled .xtyle-combobox__control {
	cursor: not-allowed;
	color: var(--fg-disabled);
	background: var(--state-disabled);
}
.xtyle-combobox--disabled .xtyle-combobox__label,
.xtyle-combobox--disabled .xtyle-combobox__input::placeholder {
	color: var(--fg-disabled);
}
.xtyle-combobox--readonly .xtyle-combobox__control {
	background: var(--bg-1);
}
.xtyle-combobox__list {
	display: flex;
	flex-direction: column;
	gap: 1px;
	width: var(--xtyle-combobox-anchor);
	max-width: 100%;
	margin: 0;
	padding: var(--space-1);
	list-style: none;
	font-family: var(--font-sans);
}
.xtyle-combobox__option {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-2);
	padding: var(--space-1) var(--space-2);
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
	color: var(--fg-1);
	border-radius: var(--radius-sm);
	cursor: pointer;
}
.xtyle-combobox__option[aria-selected="true"] {
	color: var(--fg-0);
	background: var(--state-selected);
}
.xtyle-combobox__option:hover,
.xtyle-combobox__option[data-active="true"] {
	color: var(--fg-0);
	background: var(--accent-bg);
}
.xtyle-combobox__option-label {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.xtyle-combobox__check {
	flex: none;
	color: currentColor;
}
.xtyle-combobox__empty {
	width: var(--xtyle-combobox-anchor);
	max-width: 100%;
	margin: 0;
	padding: var(--space-2) var(--space-3);
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
	color: var(--fg-2);
}
.xtyle-combobox__label[hidden],
.xtyle-combobox__description[hidden],
.xtyle-combobox__error[hidden],
.xtyle-combobox__chips[hidden],
.xtyle-combobox__check[hidden],
.xtyle-combobox__empty[hidden],
.xtyle-combobox__action[hidden] { display: none; }
`.trim();
