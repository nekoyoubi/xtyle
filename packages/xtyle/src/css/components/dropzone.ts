export const dropzoneCss = `
.xtyle-dropzone {
	position: relative;
	display: block;
	font-family: var(--font-sans);
}
.xtyle-dropzone__body {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}
.xtyle-dropzone__input {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	border: 0;
	overflow: hidden;
	white-space: nowrap;
	clip-path: inset(50%);
}
.xtyle-dropzone__surface {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: var(--space-2);
	padding: var(--space-7) var(--space-4);
	text-align: center;
	cursor: pointer;
	color: var(--fg-2);
	background: var(--bg-1);
	border: var(--border-thick) dashed var(--line-2);
	border-radius: var(--radius-md);
	transition:
		border-color var(--duration-fast) var(--ease-standard),
		background var(--duration-fast) var(--ease-standard),
		color var(--duration-fast) var(--ease-standard);
}
.xtyle-dropzone__surface:hover {
	background: var(--state-hover);
	border-color: var(--accent);
}
.xtyle-dropzone__surface--dragging,
.xtyle-dropzone__surface--dragging:hover {
	border-style: solid;
	border-color: var(--accent);
	background: var(--accent-bg);
	color: var(--accent-text);
}
.xtyle-dropzone__surface--rejecting,
.xtyle-dropzone__surface--rejecting:hover {
	border-style: solid;
	border-color: var(--danger);
	background: var(--danger-bg);
	color: var(--danger-text);
	cursor: not-allowed;
}
.xtyle-dropzone__surface--disabled,
.xtyle-dropzone__surface--disabled:hover {
	cursor: not-allowed;
	color: var(--fg-disabled);
	background: var(--state-disabled);
	border-color: var(--line);
}
.xtyle-dropzone:has(.xtyle-dropzone__input:focus-visible) .xtyle-dropzone__surface,
.xtyle-dropzone__surface:focus-visible {
	outline: none;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-dropzone__icon {
	font-size: var(--text-2xl);
	line-height: 1;
	color: var(--fg-3);
}
.xtyle-dropzone__surface--dragging .xtyle-dropzone__icon {
	color: var(--accent);
}
.xtyle-dropzone__prompt {
	font-size: var(--text-body);
	font-weight: var(--weight-medium);
	color: var(--fg-0);
}
.xtyle-dropzone__surface--disabled .xtyle-dropzone__prompt {
	color: inherit;
}
.xtyle-dropzone__hint {
	font-size: var(--text-xs);
	color: var(--fg-2);
}
.xtyle-dropzone__browse {
	display: inline-flex;
	align-items: center;
	margin-top: var(--space-1);
	padding: var(--space-1) var(--space-3);
	font-size: var(--text-sm);
	color: var(--fg-1);
	background: var(--bg-0);
	border: var(--border-thin) solid var(--line);
	border-radius: var(--radius-sm);
}
.xtyle-dropzone__errors {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	margin: 0;
	padding: var(--space-2) var(--space-3);
	list-style: none;
	font-size: var(--text-sm);
	color: var(--danger-text);
	background: var(--danger-bg);
	border-radius: var(--radius-sm);
}
.xtyle-dropzone__list {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	margin: 0;
	padding: 0;
	list-style: none;
}
.xtyle-dropzone__errors[hidden],
.xtyle-dropzone__list[hidden],
.xtyle-dropzone__foot[hidden] {
	display: none;
}
.xtyle-dropzone__file {
	display: grid;
	grid-template-columns: auto minmax(0, 1fr) auto auto;
	align-items: center;
	gap: var(--space-1) var(--space-3);
	padding: var(--space-2) var(--space-3);
	background: var(--bg-1);
	border: var(--border-thin) solid var(--line);
	border-radius: var(--radius-sm);
}
.xtyle-dropzone__file--error {
	border-color: var(--danger);
}
.xtyle-dropzone__file-icon {
	display: inline-flex;
	color: var(--fg-3);
}
.xtyle-dropzone__file-name {
	min-width: 0;
	font-size: var(--text-sm);
	color: var(--fg-0);
	overflow-wrap: anywhere;
}
.xtyle-dropzone__file-meta {
	font-family: var(--font-mono);
	font-size: var(--text-xs);
	color: var(--fg-2);
	white-space: nowrap;
}
.xtyle-dropzone__remove {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: var(--space-1);
	color: var(--fg-2);
	background: none;
	border: 0;
	border-radius: var(--radius-sm);
	cursor: pointer;
}
.xtyle-dropzone__remove:hover {
	color: var(--fg-0);
	background: var(--state-hover);
}
.xtyle-dropzone__remove:focus-visible {
	outline: none;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-dropzone__track {
	grid-column: 2 / -1;
	height: var(--space-1);
	overflow: hidden;
	background: var(--neutral-bg);
	border-radius: var(--radius-full);
}
.xtyle-dropzone__fill {
	display: block;
	width: 0;
	height: 100%;
	background: var(--accent);
	border-radius: inherit;
	transition: width var(--duration-fast) var(--ease-standard);
}
.xtyle-dropzone__file--done .xtyle-dropzone__fill {
	background: var(--success);
}
.xtyle-dropzone__file--error .xtyle-dropzone__fill {
	background: var(--danger);
}
.xtyle-dropzone__file-error {
	grid-column: 2 / -1;
	font-size: var(--text-xs);
	color: var(--danger-text);
}
.xtyle-dropzone__foot {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-2);
	font-size: var(--text-xs);
	color: var(--fg-2);
}
.xtyle-dropzone__clear {
	padding: var(--space-1) var(--space-2);
	font-size: var(--text-xs);
	color: var(--fg-1);
	background: none;
	border: var(--border-thin) solid var(--line);
	border-radius: var(--radius-sm);
	cursor: pointer;
}
.xtyle-dropzone__clear:hover {
	background: var(--state-hover);
}
.xtyle-dropzone__clear:focus-visible {
	outline: none;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
`.trim();
