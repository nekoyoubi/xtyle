import { FULL_TONES as TONES } from "../../vocab.js";

const checkedRules = TONES.map(
	(t) => `.xtyle-radio--${t} .xtyle-radio__control:checked ~ .xtyle-radio__indicator {
	border-color: var(--${t});
	background: var(--${t});
}
.xtyle-radio--${t} .xtyle-radio__control:checked ~ .xtyle-radio__indicator::after {
	background: var(--${t}-fg);
}`,
).join("\n");

export const radioCss = `
.xtyle-radio {
	display: inline-flex;
	align-items: center;
	gap: var(--space-2);
	font-family: var(--font-sans);
	font-size: var(--text-body);
	line-height: var(--leading-normal);
	color: var(--fg-0);
	cursor: pointer;
	position: relative;
	isolation: isolate;
}
.xtyle-radio__control {
	position: absolute;
	width: 1em;
	height: 1em;
	margin: 0;
	inset: 0;
	opacity: 0;
	cursor: inherit;
}
.xtyle-radio__indicator {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: none;
	width: 1.15em;
	height: 1.15em;
	border: var(--border-normal) solid var(--field-border);
	border-radius: var(--radius-full);
	background: var(--field-bg);
	transition:
		background-color var(--duration-fast) var(--ease-standard),
		border-color var(--duration-fast) var(--ease-standard),
		box-shadow var(--duration-fast) var(--ease-standard);
}
.xtyle-radio__indicator::after {
	content: "";
	width: 0.5em;
	height: 0.5em;
	border-radius: var(--radius-full);
	background: transparent;
	transform: scale(0);
	transition:
		transform var(--duration-fast) var(--ease-emphasized),
		background-color var(--duration-fast) var(--ease-standard);
}
.xtyle-radio__label {
	display: inline-flex;
	align-items: center;
}
.xtyle-radio--sm {
	font-size: var(--text-sm);
	gap: var(--space-1);
}
.xtyle-radio--lg {
	font-size: var(--text-lg);
	gap: var(--space-3);
}
${checkedRules}
.xtyle-radio__control:checked ~ .xtyle-radio__indicator::after {
	transform: scale(1);
}
.xtyle-radio:hover .xtyle-radio__indicator {
	border-color: var(--line-2);
	background: var(--state-hover);
}
.xtyle-radio__control:checked ~ .xtyle-radio__indicator {
	background: var(--accent);
	border-color: var(--accent);
}
.xtyle-radio__control:checked ~ .xtyle-radio__indicator::after {
	background: var(--accent-fg);
}
.xtyle-radio__control:focus-visible ~ .xtyle-radio__indicator {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-radio--invalid .xtyle-radio__indicator {
	border-color: var(--danger);
}
.xtyle-radio__control:disabled ~ .xtyle-radio__indicator {
	background: var(--state-disabled);
	border-color: var(--line);
}
.xtyle-radio:has(.xtyle-radio__control:disabled),
.xtyle-radio[aria-disabled="true"] {
	cursor: not-allowed;
	color: var(--fg-disabled);
}
.xtyle-radio__control:disabled:checked ~ .xtyle-radio__indicator {
	background: var(--state-disabled);
	border-color: var(--line);
}
.xtyle-radio__control:disabled:checked ~ .xtyle-radio__indicator::after {
	background: var(--fg-disabled);
}
.xtyle-radio-group {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	font-family: var(--font-sans);
	border: 0;
	margin: 0;
	padding: 0;
	min-width: 0;
}
.xtyle-radio-group--horizontal {
	flex-direction: row;
	flex-wrap: wrap;
	gap: var(--space-4);
	align-items: center;
}
.xtyle-radio-group__label {
	font-size: var(--text-sm);
	font-weight: var(--weight-medium);
	color: var(--fg-1);
	line-height: var(--leading-normal);
	padding: 0;
}
.xtyle-radio-group--horizontal .xtyle-radio-group__label {
	flex: none;
}
`.trim();
