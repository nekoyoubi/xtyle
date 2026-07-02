export const textareaCss = `
.xoji-textarea {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	font-family: var(--font-sans);
}
.xoji-textarea__label {
	font-size: var(--text-sm);
	font-weight: var(--weight-medium);
	color: var(--fg-1);
	line-height: var(--leading-normal);
}
.xoji-textarea__label[hidden] { display: none; }
.xoji-textarea__control {
	display: flex;
	width: 100%;
	min-height: calc(var(--space-7) * 2);
	font-family: inherit;
	resize: vertical;
	line-height: var(--leading-normal);
}
.xoji-textarea--resize-none .xoji-textarea__control { resize: none; }
.xoji-textarea--resize-horizontal .xoji-textarea__control { resize: horizontal; }
.xoji-textarea--resize-both .xoji-textarea__control { resize: both; }
.xoji-textarea--mono .xoji-textarea__control { font-family: var(--font-mono); }
.xoji-textarea--sm .xoji-textarea__control {
	font-size: var(--text-sm);
	padding: var(--space-1) var(--space-2);
	min-height: calc(var(--space-6) * 2);
}
.xoji-textarea--lg .xoji-textarea__control {
	font-size: var(--text-lg);
	padding: var(--space-3) var(--space-4);
	min-height: calc(var(--space-8) * 2);
}
.xoji-textarea--invalid .xoji-textarea__control {
	border-color: var(--danger);
}
.xoji-textarea--invalid .xoji-textarea__control:focus-visible {
	border-color: var(--danger);
	box-shadow: 0 0 0 var(--border-normal) var(--danger-bg);
}
.xoji-textarea__control:disabled {
	cursor: not-allowed;
}
.xoji-textarea--invalid .xoji-textarea__label {
	color: var(--danger-text);
}
.xoji-textarea__error {
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
	color: var(--danger-text);
}
.xoji-textarea__error[hidden] { display: none; }
`.trim();
