export const selectCss = `
.xtyle-select {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	font-family: var(--font-sans);
}
.xtyle-select__label {
	font-size: var(--text-sm);
	font-weight: var(--weight-medium);
	color: var(--fg-1);
	line-height: var(--leading-normal);
}
.xtyle-select__label[hidden] { display: none; }
.xtyle-select__control {
	display: flex;
	align-items: center;
	position: relative;
}
.xtyle-select__field {
	appearance: none;
	width: 100%;
	font-family: inherit;
	cursor: pointer;
	padding-right: var(--space-7);
}
.xtyle-select__field::-ms-expand { display: none; }
.xtyle-select__chevron {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	position: absolute;
	inset: 0 var(--space-3) 0 auto;
	width: 1em;
	color: var(--fg-2);
	pointer-events: none;
	transition: color var(--duration-fast) var(--ease-standard);
}
.xtyle-select__field:focus-visible + .xtyle-select__chevron {
	color: var(--accent);
}
.xtyle-select--sm .xtyle-select__field {
	font-size: var(--text-sm);
	padding-top: var(--space-1);
	padding-bottom: var(--space-1);
}
.xtyle-select--lg .xtyle-select__field {
	font-size: var(--text-lg);
	padding-top: var(--space-3);
	padding-bottom: var(--space-3);
}
.xtyle-select--invalid .xtyle-select__field {
	border-color: var(--danger);
}
.xtyle-select--invalid .xtyle-select__field:focus-visible {
	border-color: var(--danger);
	box-shadow: 0 0 0 var(--border-normal) var(--danger-bg);
}
.xtyle-select--invalid .xtyle-select__chevron {
	color: var(--danger);
}
.xtyle-select__field:disabled {
	cursor: not-allowed;
}
.xtyle-select__field:disabled + .xtyle-select__chevron {
	color: var(--fg-disabled);
}
.xtyle-select__error {
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
	color: var(--danger-text);
}
.xtyle-select__error[hidden] { display: none; }
`.trim();
