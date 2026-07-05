export const formGroupCss = `
.xtyle-form-group {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	font-family: var(--font-sans);
}
.xtyle-form-group__label {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
	font-size: var(--text-sm);
	font-weight: var(--weight-medium);
	color: var(--fg-1);
	line-height: var(--leading-normal);
}
.xtyle-form-group__required {
	color: var(--danger);
	font-weight: var(--weight-semibold);
}
.xtyle-form-group__description {
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
	color: var(--fg-2);
}
.xtyle-form-group__control {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
}
.xtyle-form-group__error {
	display: flex;
	align-items: center;
	gap: var(--space-1);
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
	color: var(--danger-text);
}
.xtyle-form-group--sm {
	gap: var(--space-0);
}
.xtyle-form-group--sm .xtyle-form-group__label,
.xtyle-form-group--sm .xtyle-form-group__description,
.xtyle-form-group--sm .xtyle-form-group__error {
	font-size: var(--text-xs);
}
.xtyle-form-group--lg {
	gap: var(--space-2);
}
.xtyle-form-group--lg .xtyle-form-group__label {
	font-size: var(--text-body);
}
.xtyle-form-group--lg .xtyle-form-group__description,
.xtyle-form-group--lg .xtyle-form-group__error {
	font-size: var(--text-body);
}
.xtyle-form-group--invalid .xtyle-form-group__label {
	color: var(--danger-text);
}
.xtyle-form-group__label[hidden],
.xtyle-form-group__description[hidden],
.xtyle-form-group__error[hidden] {
	display: none;
}
`.trim();
