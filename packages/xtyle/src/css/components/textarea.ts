export const textareaCss = `
.xtyle-textarea {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	font-family: var(--font-sans);
}
.xtyle-textarea__label {
	font-size: var(--text-sm);
	font-weight: var(--weight-medium);
	color: var(--fg-1);
	line-height: var(--leading-normal);
}
.xtyle-textarea__label[hidden] { display: none; }
.xtyle-textarea__control {
	display: flex;
	width: 100%;
	min-height: calc(var(--space-7) * 2);
	font-family: inherit;
	resize: vertical;
	line-height: var(--leading-normal);
}
.xtyle-textarea--resize-none .xtyle-textarea__control { resize: none; }
.xtyle-textarea--resize-horizontal .xtyle-textarea__control { resize: horizontal; }
.xtyle-textarea--resize-both .xtyle-textarea__control { resize: both; }
.xtyle-textarea--mono .xtyle-textarea__control { font-family: var(--font-mono); }
.xtyle-textarea--sm .xtyle-textarea__control {
	font-size: var(--text-sm);
	padding: var(--space-1) var(--space-2);
	min-height: calc(var(--space-6) * 2);
}
.xtyle-textarea--lg .xtyle-textarea__control {
	font-size: var(--text-lg);
	padding: var(--space-3) var(--space-4);
	min-height: calc(var(--space-8) * 2);
}
.xtyle-textarea--invalid .xtyle-textarea__control {
	border-color: var(--danger);
}
.xtyle-textarea--invalid .xtyle-textarea__control:focus-visible {
	border-color: var(--danger);
	box-shadow: 0 0 0 var(--border-normal) var(--danger-bg);
}
.xtyle-textarea__control:disabled {
	cursor: not-allowed;
}
.xtyle-textarea--invalid .xtyle-textarea__label {
	color: var(--danger-text);
}
.xtyle-textarea__error {
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
	color: var(--danger-text);
}
.xtyle-textarea__error[hidden] { display: none; }
`.trim();
