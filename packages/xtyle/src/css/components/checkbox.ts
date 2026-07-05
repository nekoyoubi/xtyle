import { FULL_TONES as TONES } from "../../vocab.js";

const checkedRules = TONES.map(
	(t) => `.xtyle-checkbox--${t} .xtyle-checkbox__control:checked,
.xtyle-checkbox--${t}.xtyle-checkbox--indeterminate .xtyle-checkbox__control {
	background: var(--${t});
	border-color: var(--${t});
}
.xtyle-checkbox--${t} .xtyle-checkbox__indicator {
	color: var(--${t}-fg);
}`,
).join("\n");

export const checkboxCss = `
.xtyle-checkbox {
	--box: var(--space-5);
	display: inline-flex;
	align-items: flex-start;
	gap: var(--space-2);
	font-family: var(--font-sans);
	font-size: var(--text-body);
	line-height: var(--leading-normal);
	color: var(--fg-0);
	cursor: pointer;
}
.xtyle-checkbox--sm {
	--box: var(--space-4);
	font-size: var(--text-sm);
	gap: var(--space-1);
}
.xtyle-checkbox__box {
	position: relative;
	flex: none;
	width: var(--box);
	height: var(--box);
}
.xtyle-checkbox__control {
	appearance: none;
	display: block;
	width: 100%;
	height: 100%;
	margin: 0;
	background: var(--field-bg);
	border: var(--border-thin) solid var(--field-border);
	border-radius: var(--radius-sm);
	cursor: inherit;
	transition:
		background-color var(--duration-fast) var(--ease-standard),
		border-color var(--duration-fast) var(--ease-standard),
		box-shadow var(--duration-fast) var(--ease-standard);
}
.xtyle-checkbox__indicator {
	position: absolute;
	inset: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: var(--accent-fg);
	pointer-events: none;
}
.xtyle-checkbox__indicator svg {
	width: 100%;
	height: 100%;
}
.xtyle-checkbox__check,
.xtyle-checkbox__dash {
	opacity: 0;
	transition: opacity var(--duration-fast) var(--ease-standard);
}
.xtyle-checkbox__control:checked,
.xtyle-checkbox--indeterminate .xtyle-checkbox__control {
	background: var(--accent);
	border-color: var(--accent);
}
${checkedRules}
.xtyle-checkbox:not(.xtyle-checkbox--indeterminate) .xtyle-checkbox__control:checked ~ .xtyle-checkbox__indicator .xtyle-checkbox__check {
	opacity: 1;
}
.xtyle-checkbox--indeterminate .xtyle-checkbox__dash {
	opacity: 1;
}
.xtyle-checkbox__control:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-normal) var(--ring);
}
.xtyle-checkbox__label {
	display: inline-flex;
	min-height: var(--box);
	align-items: center;
}
.xtyle-checkbox__control:disabled,
.xtyle-checkbox__control[aria-disabled="true"] {
	cursor: not-allowed;
	background: var(--state-disabled);
	border-color: var(--field-border);
}
.xtyle-checkbox__control:disabled:checked,
.xtyle-checkbox__control[aria-disabled="true"]:checked,
.xtyle-checkbox--indeterminate .xtyle-checkbox__control:disabled {
	background: var(--state-disabled);
	border-color: var(--field-border);
}
.xtyle-checkbox__control:disabled ~ .xtyle-checkbox__indicator {
	color: var(--fg-disabled);
}
.xtyle-checkbox:has(.xtyle-checkbox__control:disabled),
.xtyle-checkbox--disabled {
	cursor: not-allowed;
	color: var(--fg-disabled);
}
.xtyle-checkbox-group {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}
.xtyle-checkbox-group__heading .xtyle-checkbox__label {
	font-weight: var(--weight-semibold);
}
.xtyle-checkbox-group__items {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	padding-left: var(--space-6);
}
`.trim();
