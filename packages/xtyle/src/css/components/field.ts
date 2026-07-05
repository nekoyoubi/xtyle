export const fieldCss = `
.xtyle-field {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	font-family: var(--font-sans);
}
.xtyle-field__label {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
	font-size: var(--text-sm);
	font-weight: var(--weight-medium);
	color: var(--fg-1);
	line-height: var(--leading-normal);
}
.xtyle-field__required {
	color: var(--danger);
	font-weight: var(--weight-semibold);
}
.xtyle-field__control {
	display: flex;
	align-items: stretch;
	position: relative;
	isolation: isolate;
	color: var(--fg-0);
	background: var(--field-bg);
	border: var(--border-thin) solid var(--field-border);
	border-radius: var(--radius-md);
	transition:
		border-color var(--duration-fast) var(--ease-standard),
		box-shadow var(--duration-fast) var(--ease-standard);
}
.xtyle-field__control:focus-within {
	border-color: var(--accent);
	box-shadow: 0 0 0 var(--border-normal) var(--ring);
}
.xtyle-field__input.xtyle-field__input {
	flex: 1 1 auto;
	min-width: 0;
	border: none;
	border-radius: inherit;
	background: transparent;
	box-shadow: none;
}
.xtyle-field__input:focus-visible {
	outline: var(--border-normal) solid transparent;
	border-color: transparent;
	box-shadow: none;
}
.xtyle-field__input:disabled {
	background: transparent;
}
.xtyle-field--sm .xtyle-field__input { font-size: var(--text-sm); padding: var(--space-1) var(--space-2); }
.xtyle-field--lg .xtyle-field__input { font-size: var(--text-lg); padding: var(--space-3) var(--space-4); }
.xtyle-field--mono .xtyle-field__input { font-family: var(--font-mono); }
.xtyle-field__adornment {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: none;
	padding: 0 var(--space-3);
	color: var(--fg-2);
	font-size: var(--text-sm);
	line-height: var(--leading-tight);
}
.xtyle-field__adornment:empty { display: none; }
.xtyle-field__action {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: none;
	width: 2em;
	padding: 0;
	margin-right: var(--space-1);
	color: var(--fg-2);
	background: transparent;
	border: var(--border-thin) solid transparent;
	border-radius: var(--radius-sm);
	cursor: pointer;
	position: relative;
	isolation: isolate;
	transition: color var(--duration-fast) var(--ease-standard);
}
.xtyle-field__action::after {
	content: "";
	position: absolute;
	inset: 0;
	border-radius: inherit;
	background: transparent;
	transition: background-color var(--duration-fast) var(--ease-standard);
	z-index: -1;
}
.xtyle-field__action:hover { color: var(--fg-0); }
.xtyle-field__action:hover::after { background: var(--state-hover); }
.xtyle-field__action:active::after { background: var(--state-press); }
.xtyle-field__action:focus-visible {
	outline: var(--border-normal) solid transparent;
	color: var(--fg-0);
	box-shadow: 0 0 0 var(--border-normal) var(--ring);
}
.xtyle-field__description {
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
	color: var(--fg-2);
}
.xtyle-field__error {
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
	color: var(--danger-text);
}
.xtyle-field--invalid .xtyle-field__control {
	border-color: var(--danger);
}
.xtyle-field--invalid .xtyle-field__control:focus-within {
	box-shadow: 0 0 0 var(--border-normal) var(--danger-bg);
}
.xtyle-field--disabled .xtyle-field__control {
	cursor: not-allowed;
	color: var(--fg-disabled);
	background: var(--state-disabled);
}
.xtyle-field--disabled .xtyle-field__label,
.xtyle-field--disabled .xtyle-field__input::placeholder {
	color: var(--fg-disabled);
}
.xtyle-field--readonly .xtyle-field__control {
	background: var(--bg-1);
}
.xtyle-field__description[hidden],
.xtyle-field__error[hidden],
.xtyle-field__label[hidden],
.xtyle-field__action[hidden] { display: none; }
`.trim();
