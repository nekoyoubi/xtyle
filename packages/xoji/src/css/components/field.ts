export const fieldCss = `
.xoji-field {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	font-family: var(--font-sans);
}
.xoji-field__label {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
	font-size: var(--text-sm);
	font-weight: var(--weight-medium);
	color: var(--fg-1);
	line-height: var(--leading-normal);
}
.xoji-field__required {
	color: var(--danger);
	font-weight: var(--weight-semibold);
}
.xoji-field__control {
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
.xoji-field__control:focus-within {
	border-color: var(--accent);
	box-shadow: 0 0 0 var(--border-normal) var(--ring);
}
.xoji-field__input.xoji-field__input {
	flex: 1 1 auto;
	min-width: 0;
	border: none;
	border-radius: inherit;
	background: transparent;
	box-shadow: none;
}
.xoji-field__input:focus-visible {
	outline: var(--border-normal) solid transparent;
	border-color: transparent;
	box-shadow: none;
}
.xoji-field__input:disabled {
	background: transparent;
}
.xoji-field--sm .xoji-field__input { font-size: var(--text-sm); padding: var(--space-1) var(--space-2); }
.xoji-field--lg .xoji-field__input { font-size: var(--text-lg); padding: var(--space-3) var(--space-4); }
.xoji-field--mono .xoji-field__input { font-family: var(--font-mono); }
.xoji-field__adornment {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: none;
	padding: 0 var(--space-3);
	color: var(--fg-2);
	font-size: var(--text-sm);
	line-height: var(--leading-tight);
}
.xoji-field__adornment:empty { display: none; }
.xoji-field__action {
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
.xoji-field__action::after {
	content: "";
	position: absolute;
	inset: 0;
	border-radius: inherit;
	background: transparent;
	transition: background-color var(--duration-fast) var(--ease-standard);
	z-index: -1;
}
.xoji-field__action:hover { color: var(--fg-0); }
.xoji-field__action:hover::after { background: var(--state-hover); }
.xoji-field__action:active::after { background: var(--state-press); }
.xoji-field__action:focus-visible {
	outline: var(--border-normal) solid transparent;
	color: var(--fg-0);
	box-shadow: 0 0 0 var(--border-normal) var(--ring);
}
.xoji-field__description {
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
	color: var(--fg-2);
}
.xoji-field__error {
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
	color: var(--danger-text);
}
.xoji-field--invalid .xoji-field__control {
	border-color: var(--danger);
}
.xoji-field--invalid .xoji-field__control:focus-within {
	box-shadow: 0 0 0 var(--border-normal) var(--danger-bg);
}
.xoji-field--disabled .xoji-field__control {
	cursor: not-allowed;
	color: var(--fg-disabled);
	background: var(--state-disabled);
}
.xoji-field--disabled .xoji-field__label,
.xoji-field--disabled .xoji-field__input::placeholder {
	color: var(--fg-disabled);
}
.xoji-field--readonly .xoji-field__control {
	background: var(--bg-1);
}
.xoji-field__description[hidden],
.xoji-field__error[hidden],
.xoji-field__label[hidden],
.xoji-field__action[hidden] { display: none; }
`.trim();
