export const colorPickerCss = `
.xtyle-color-picker {
	display: inline-flex;
	flex-direction: column;
	gap: var(--space-2);
	width: 16rem;
	font-family: var(--font-sans);
	color: var(--fg-0);
}
.xtyle-color-picker__label {
	color: var(--fg-1);
	font-size: var(--text-sm);
}
.xtyle-color-picker__area {
	position: relative;
	width: 100%;
	aspect-ratio: 4 / 3;
	border-radius: var(--radius-md);
	border: var(--border-thin) solid var(--line-2);
	cursor: crosshair;
	touch-action: none;
	background-image:
		linear-gradient(to top, #000, transparent),
		linear-gradient(to right, #fff, transparent);
}
.xtyle-color-picker__sv-handle {
	position: absolute;
	inset-inline-start: 0%;
	inset-block-start: 0%;
	width: var(--space-4);
	height: var(--space-4);
	transform: translate(-50%, -50%);
	border-radius: var(--radius-full);
	border: var(--border-thick) solid var(--bg-0);
	box-shadow: var(--elevation-1);
	cursor: grab;
}
.xtyle-color-picker__sv-handle:focus-visible,
.xtyle-color-picker__hue-handle:focus-visible,
.xtyle-color-picker__alpha-handle:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-color-picker__plane-field {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
}
.xtyle-color-picker__plane-wrap {
	position: relative;
	width: 100%;
	aspect-ratio: 4 / 3;
}
.xtyle-color-picker__plane-readout {
	font-family: var(--font-mono);
	font-size: var(--text-xs);
	color: var(--fg-1);
	text-align: center;
}
.xtyle-color-picker__plane {
	display: block;
	width: 100%;
	height: 100%;
	border-radius: var(--radius-md);
	border: var(--border-thin) solid var(--line-2);
	cursor: crosshair;
	touch-action: none;
}
.xtyle-color-picker__plane-handle {
	position: absolute;
	inset-inline-start: 0%;
	inset-block-start: 0%;
	width: var(--space-4);
	height: var(--space-4);
	transform: translate(-50%, -50%);
	border-radius: var(--radius-full);
	border: var(--border-thick) solid var(--bg-0);
	box-shadow: var(--elevation-1);
	cursor: grab;
	pointer-events: none;
}
.xtyle-color-picker__plane-handle:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-color-picker__controls {
	display: flex;
	align-items: center;
	gap: var(--space-2);
}
.xtyle-color-picker__swatch,
.xtyle-color-picker__trigger {
	--cp-color: #5b8cff;
	width: var(--space-6);
	height: var(--space-6);
	border-radius: var(--radius-sm);
	border: var(--border-thin) solid var(--line-2);
	background-color: #fff;
	background-image:
		linear-gradient(var(--cp-color), var(--cp-color)),
		linear-gradient(45deg, #ccc 25%, transparent 25%),
		linear-gradient(-45deg, #ccc 25%, transparent 25%),
		linear-gradient(45deg, transparent 75%, #ccc 75%),
		linear-gradient(-45deg, transparent 75%, #ccc 75%);
	background-size: auto, 8px 8px, 8px 8px, 8px 8px, 8px 8px;
	background-position: 0 0, 0 0, 0 4px, 4px -4px, -4px 0;
}
.xtyle-color-picker__swatch {
	flex: none;
}
.xtyle-color-picker__sliders {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	flex: 1;
	min-width: 0;
}
.xtyle-color-picker__hue {
	position: relative;
	height: var(--space-2);
	border-radius: var(--radius-full);
	border: var(--border-thin) solid var(--line-2);
	cursor: pointer;
	touch-action: none;
	background-image: linear-gradient(
		to right,
		#f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%
	);
}
.xtyle-color-picker__hue-handle {
	position: absolute;
	inset-inline-start: 0%;
	top: 50%;
	width: var(--space-4);
	height: var(--space-4);
	transform: translate(-50%, -50%);
	border-radius: var(--radius-full);
	border: var(--border-thick) solid var(--bg-0);
	box-shadow: var(--elevation-1);
	cursor: grab;
}
.xtyle-color-picker__alpha {
	--cp-color: #5b8cff;
	position: relative;
	height: var(--space-2);
	border-radius: var(--radius-full);
	border: var(--border-thin) solid var(--line-2);
	cursor: pointer;
	touch-action: none;
	background-color: #fff;
	background-image:
		linear-gradient(to right, transparent, var(--cp-color)),
		linear-gradient(45deg, #ccc 25%, transparent 25%),
		linear-gradient(-45deg, #ccc 25%, transparent 25%),
		linear-gradient(45deg, transparent 75%, #ccc 75%),
		linear-gradient(-45deg, transparent 75%, #ccc 75%);
	background-size: auto, 8px 8px, 8px 8px, 8px 8px, 8px 8px;
	background-position: 0 0, 0 0, 0 4px, 4px -4px, -4px 0;
}
.xtyle-color-picker__alpha-handle {
	position: absolute;
	inset-inline-start: 100%;
	top: 50%;
	width: var(--space-4);
	height: var(--space-4);
	transform: translate(-50%, -50%);
	border-radius: var(--radius-full);
	border: var(--border-thick) solid var(--bg-0);
	box-shadow: var(--elevation-1);
	cursor: grab;
}
.xtyle-color-picker__field {
	display: flex;
	align-items: stretch;
	gap: var(--space-1);
}
.xtyle-color-picker__format {
	flex: none;
	font-family: var(--font-mono);
	font-size: var(--text-xs);
	font-weight: var(--weight-medium);
	letter-spacing: 0.04em;
	color: var(--fg-1);
	background: var(--bg-2);
	border: var(--border-thin) solid var(--line-2);
	border-radius: var(--radius-sm);
	padding: var(--space-1) var(--space-2);
	cursor: pointer;
	transition:
		color var(--duration-fast) var(--ease-standard),
		background-color var(--duration-fast) var(--ease-standard);
}
.xtyle-color-picker__format:hover {
	color: var(--fg-0);
	background: var(--state-hover);
}
.xtyle-color-picker__format:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-color-picker__value {
	flex: 1;
	min-width: 0;
	box-sizing: border-box;
	font-family: var(--font-mono);
	font-size: var(--text-sm);
	color: var(--fg-0);
	background: var(--bg-0);
	border: var(--border-thin) solid var(--line-2);
	border-radius: var(--radius-sm);
	padding: var(--space-1) var(--space-2);
}
.xtyle-color-picker__value:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-color-picker__eyedropper {
	flex: none;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: var(--space-6);
	color: var(--fg-1);
	background: var(--bg-2);
	border: var(--border-thin) solid var(--line-2);
	border-radius: var(--radius-sm);
	cursor: pointer;
	transition:
		color var(--duration-fast) var(--ease-standard),
		background-color var(--duration-fast) var(--ease-standard);
}
.xtyle-color-picker__eyedropper:hover {
	color: var(--fg-0);
	background: var(--state-hover);
}
.xtyle-color-picker__eyedropper:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-color-picker__eyedropper svg {
	width: 1em;
	height: 1em;
}
.xtyle-color-picker__channels {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
}
.xtyle-color-picker__channel {
	display: grid;
	grid-template-columns: 1.5em 1fr 3.5em;
	align-items: center;
	gap: var(--space-2);
}
.xtyle-color-picker__channel-label {
	font-family: var(--font-mono);
	font-size: var(--text-xs);
	color: var(--fg-1);
}
.xtyle-color-picker__channel-value {
	font-family: var(--font-mono);
	font-size: var(--text-xs);
	color: var(--fg-1);
	text-align: end;
}
.xtyle-color-picker__channel-input {
	width: 100%;
	min-width: 0;
	accent-color: var(--accent);
	cursor: pointer;
}
.xtyle-color-picker__channel-input:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-color-picker__snaps {
	display: flex;
	flex-wrap: wrap;
	gap: var(--space-1);
}
.xtyle-color-picker__snap {
	font-family: var(--font-mono);
	font-size: var(--text-xs);
	font-weight: var(--weight-medium);
	color: var(--fg-1);
	background: var(--bg-2);
	border: var(--border-thin) solid var(--line-2);
	border-radius: var(--radius-sm);
	padding: var(--space-1) var(--space-2);
	cursor: pointer;
	transition:
		color var(--duration-fast) var(--ease-standard),
		background-color var(--duration-fast) var(--ease-standard);
}
.xtyle-color-picker__snap:hover {
	color: var(--fg-0);
	background: var(--state-hover);
}
.xtyle-color-picker__snap:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-color-picker__presets {
	display: flex;
	flex-wrap: wrap;
	gap: var(--space-1);
}
.xtyle-color-picker__preset {
	--cp-chip: #000;
	flex: none;
	width: var(--space-4);
	height: var(--space-4);
	padding: 0;
	border: var(--border-thin) solid var(--line-2);
	border-radius: var(--radius-sm);
	cursor: pointer;
	background-color: #fff;
	background-image:
		linear-gradient(var(--cp-chip), var(--cp-chip)),
		linear-gradient(45deg, #ccc 25%, transparent 25%),
		linear-gradient(-45deg, #ccc 25%, transparent 25%),
		linear-gradient(45deg, transparent 75%, #ccc 75%),
		linear-gradient(-45deg, transparent 75%, #ccc 75%);
	background-size: auto, 6px 6px, 6px 6px, 6px 6px, 6px 6px;
	background-position: 0 0, 0 0, 0 3px, 3px -3px, -3px 0;
}
.xtyle-color-picker__preset:focus-visible,
.xtyle-color-picker__preset[aria-pressed="true"] {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-color-picker__contrast {
	display: flex;
	align-items: center;
	gap: var(--space-2);
}
.xtyle-color-picker__contrast-sample {
	display: flex;
	align-items: center;
	justify-content: center;
	width: var(--space-6);
	height: var(--space-6);
	flex: none;
	border-radius: var(--radius-sm);
	border: var(--border-thin) solid var(--line-2);
	color: var(--fg-0);
	background: var(--bg-0);
	font-weight: var(--weight-medium);
	font-size: var(--text-sm);
}
.xtyle-color-picker__contrast-readout {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
}
.xtyle-color-picker__contrast-ratio {
	font-family: var(--font-mono);
	font-size: var(--text-sm);
	color: var(--fg-1);
}
.xtyle-color-picker__contrast-badges {
	display: flex;
	gap: var(--space-2);
}
.xtyle-color-picker__contrast-badge {
	font-size: var(--text-xs);
	font-weight: var(--weight-medium);
	color: var(--fg-1);
}
.xtyle-color-picker__contrast-badge.is-pass { color: var(--success-text); }
.xtyle-color-picker__contrast-badge.is-fail { color: var(--danger-text); }
.xtyle-color-picker--trigger {
	width: auto;
}
.xtyle-color-picker__trigger {
	position: relative;
	padding: 0;
	cursor: pointer;
	transition: box-shadow var(--duration-fast) var(--ease-standard);
}
.xtyle-color-picker__trigger:hover {
	box-shadow: var(--elevation-1);
}
.xtyle-color-picker__trigger:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-color-picker__trigger-caret {
	position: absolute;
	right: 1px;
	bottom: 1px;
	width: 9px;
	height: 9px;
	pointer-events: none;
	filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.9));
}
.xtyle-color-picker__trigger-badge {
	position: absolute;
	top: 1px;
	left: 1px;
	min-width: 13px;
	height: 13px;
	padding: 0 3px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 9px;
	font-weight: var(--weight-bold);
	line-height: 1;
	border-radius: var(--radius-sm);
	pointer-events: none;
	color: var(--neutral-fg);
	background: var(--neutral);
	box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35);
}
.xtyle-color-picker__trigger-badge[data-level=""] {
	display: none;
}
.xtyle-color-picker__trigger-badge[data-level="aaa"] {
	background: var(--success);
	color: var(--success-fg);
}
.xtyle-color-picker__trigger-badge[data-level="aa"] {
	background: var(--info);
	color: var(--info-fg);
}
.xtyle-color-picker__trigger-badge[data-level="a"] {
	background: var(--warn);
	color: var(--warn-fg);
}
.xtyle-color-picker__trigger-badge[data-level="fail"] {
	background: var(--danger);
	color: var(--danger-fg);
}
.xtyle-color-picker__popover {
	position: fixed;
	margin: 0;
	inset: auto;
	box-sizing: border-box;
	width: 16rem;
	flex-direction: column;
	gap: var(--space-2);
	padding: var(--space-2);
	background: var(--bg-0);
	border: var(--border-thin) solid var(--line-2);
	border-radius: var(--radius-md);
	box-shadow: var(--elevation-3);
}
.xtyle-color-picker__popover:popover-open {
	display: flex;
}
.xtyle-color-picker--disabled {
	color: var(--fg-disabled);
	opacity: 0.6;
	pointer-events: none;
}
`.trim();
