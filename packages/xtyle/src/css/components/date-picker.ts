export const datePickerCss = `
.xtyle-datepicker {
	display: inline-flex;
	flex-direction: column;
	gap: var(--space-2);
	font-family: var(--font-sans);
	color: var(--fg-0);
}
.xtyle-datepicker__label {
	color: var(--fg-1);
	font-size: var(--text-sm);
}
.xtyle-datepicker__required {
	color: var(--danger);
	margin-inline-start: var(--space-1);
}
.xtyle-datepicker__control {
	display: inline-flex;
	align-items: stretch;
	border: var(--border-thin) solid var(--line-2);
	border-radius: var(--radius-md);
	background: var(--bg-0);
	overflow: hidden;
	transition:
		box-shadow var(--duration-fast) var(--ease-standard),
		border-color var(--duration-fast) var(--ease-standard);
}
.xtyle-datepicker__control:focus-within {
	border-color: var(--accent);
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-datepicker__input {
	flex: 1;
	min-width: 0;
	appearance: none;
	border: none;
	background: transparent;
	color: var(--fg-0);
	font: inherit;
	font-size: var(--text-body);
	padding: var(--space-2) var(--space-3);
	outline: none;
}
/* wide enough for the longest rendering each field can hold (MM/DD/YYYY, 12:30:15 AM) plus the
   horizontal padding, which sits inside the box and would otherwise clip the text next to it */
.xtyle-datepicker__input--date {
	width: 14ch;
}
.xtyle-datepicker__input--time {
	width: 13ch;
}
.xtyle-datepicker--datetime .xtyle-datepicker__input--time {
	border-inline-start: var(--border-thin) solid var(--line-2);
}
.xtyle-datepicker__input::placeholder {
	color: var(--fg-2);
}
.xtyle-datepicker__clear,
.xtyle-datepicker__trigger {
	flex: none;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: var(--space-6);
	border: none;
	background: transparent;
	color: var(--fg-1);
	cursor: pointer;
	transition: background-color var(--duration-fast) var(--ease-standard);
}
.xtyle-datepicker__trigger {
	background: var(--neutral-bg);
}
.xtyle-datepicker__clear:hover,
.xtyle-datepicker__trigger:hover {
	background: var(--state-hover);
	color: var(--fg-0);
}
.xtyle-datepicker__clear:active,
.xtyle-datepicker__trigger:active {
	background: var(--state-press);
}
.xtyle-datepicker__clear:focus-visible,
.xtyle-datepicker__trigger:focus-visible {
	outline: var(--border-thick) solid var(--ring);
	outline-offset: calc(-1 * var(--border-thick));
}
.xtyle-datepicker__clear:disabled,
.xtyle-datepicker__trigger:disabled {
	cursor: not-allowed;
	color: var(--fg-disabled);
	background: var(--state-disabled);
}
.xtyle-datepicker__clear[hidden],
.xtyle-datepicker__label[hidden] {
	display: none;
}
.xtyle-datepicker__glyph {
	width: var(--space-4);
	height: var(--space-4);
}
.xtyle-datepicker--sm .xtyle-datepicker__input {
	padding: var(--space-1) var(--space-2);
	font-size: var(--text-sm);
}
.xtyle-datepicker--sm .xtyle-datepicker__clear,
.xtyle-datepicker--sm .xtyle-datepicker__trigger {
	width: var(--space-5);
}
.xtyle-datepicker--lg .xtyle-datepicker__input {
	padding: var(--space-3) var(--space-4);
}
.xtyle-datepicker--lg .xtyle-datepicker__clear,
.xtyle-datepicker--lg .xtyle-datepicker__trigger {
	width: var(--space-7);
}
.xtyle-datepicker--invalid .xtyle-datepicker__control {
	border-color: var(--danger);
}
.xtyle-datepicker--disabled,
.xtyle-datepicker--disabled .xtyle-datepicker__input {
	color: var(--fg-disabled);
}
.xtyle-datepicker--disabled .xtyle-datepicker__control {
	background: var(--state-disabled);
	border-color: transparent;
}
.xtyle-datepicker--readonly .xtyle-datepicker__control {
	background: var(--bg-1);
}

/* the panel body is the popover's slotted content; before the popover element upgrades it would
   otherwise render inline in the page, so it stays hidden until the definition lands */
.xtyle-datepicker xtyle-popover:not(:defined) {
	display: none;
}
.xtyle-datepicker__panel {
	display: flex;
	align-items: stretch;
	gap: var(--space-3);
	padding: var(--space-3);
	max-width: 100%;
}
.xtyle-datepicker__times {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	overflow-y: auto;
	max-height: 15rem;
	min-width: 7rem;
	padding-inline-end: var(--space-1);
	scrollbar-width: thin;
}
.xtyle-datepicker--datetime .xtyle-datepicker__times {
	border-inline-start: var(--border-thin) solid var(--line-2);
	padding-inline-start: var(--space-3);
}
.xtyle-datepicker__time-option {
	flex: none;
	border: none;
	border-radius: var(--radius-sm);
	background: transparent;
	color: var(--fg-1);
	font: inherit;
	font-size: var(--text-sm);
	text-align: start;
	padding: var(--space-1) var(--space-2);
	cursor: pointer;
	white-space: nowrap;
	transition: background-color var(--duration-fast) var(--ease-standard);
}
.xtyle-datepicker__time-option:hover {
	background: var(--state-hover);
	color: var(--fg-0);
}
.xtyle-datepicker__time-option:focus-visible {
	outline: var(--border-thick) solid var(--ring);
	outline-offset: calc(-1 * var(--border-thick));
}
.xtyle-datepicker__time-option[aria-selected="true"] {
	background: var(--accent);
	color: var(--accent-fg);
}
.xtyle-datepicker__time-option:disabled {
	cursor: not-allowed;
	color: var(--fg-disabled);
}
.xtyle-datepicker__announcer {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0 0 0 0);
	clip-path: inset(50%);
	white-space: nowrap;
	border: 0;
}
`.trim();
