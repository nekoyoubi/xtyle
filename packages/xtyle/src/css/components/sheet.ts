export const sheetCss = `
.xtyle-sheet {
	--sheet-block: 45dvh;
	--sheet-inline: 22rem;
	/* Load-bearing: each side sizes itself as "extent + safe-area-inset" and then pads that inset back
	   out of the content. Under the UA's content-box that padding would be added on top of the size
	   instead of carved out of it, so a device with a home indicator would get a panel an inset too tall. */
	box-sizing: border-box;
	position: fixed;
	inset: 0;
	padding: 0;
	border: 0 solid var(--surface-overlay-border);
	font-family: var(--font-sans);
	font-size: var(--text-body);
	line-height: var(--leading-normal);
	color: var(--fg-0);
	background: var(--surface-overlay);
	box-shadow: var(--elevation-5);
	overflow: hidden;
	transition:
		transform var(--duration-base) var(--ease-emphasized),
		overlay var(--duration-base) var(--ease-emphasized) allow-discrete,
		display var(--duration-base) var(--ease-emphasized) allow-discrete;
}
.xtyle-sheet[open] {
	display: flex;
}
/* A non-modal sheet is not in the top layer, so it needs a stacking position of its own; the modal
   one is promoted by the platform and needs none. */
.xtyle-sheet--non-modal {
	z-index: 1;
}
/* Held mid-drag the panel tracks the finger, so any easing would fight it. */
.xtyle-sheet[data-dragging] {
	transition: none;
	user-select: none;
}
.xtyle-sheet::backdrop {
	background: var(--scrim);
	opacity: 1;
	transition:
		opacity var(--duration-base) var(--ease-emphasized),
		overlay var(--duration-base) var(--ease-emphasized) allow-discrete,
		display var(--duration-base) var(--ease-emphasized) allow-discrete;
}
.xtyle-sheet:not([open])::backdrop { opacity: 0; }
@starting-style {
	.xtyle-sheet[open]::backdrop { opacity: 0; }
}
.xtyle-sheet--sm { --sheet-block: 28dvh; --sheet-inline: 16rem; }
.xtyle-sheet--lg { --sheet-block: 72dvh; --sheet-inline: 30rem; }
.xtyle-sheet--full { --sheet-block: 100dvh; --sheet-inline: 100%; }

/* Each edge pins the panel with an auto margin against the dialog's full-viewport positioning box,
   grows by that edge's safe-area inset, and pads the inset back out of the content — so the sheet
   meets the hardware edge without any of its content sliding under a notch or a home indicator. */
.xtyle-sheet--bottom {
	flex-direction: column;
	width: 100%;
	max-width: 100%;
	height: calc(var(--sheet-block) + env(safe-area-inset-bottom, 0px));
	max-height: 100%;
	margin: auto auto 0;
	padding-bottom: env(safe-area-inset-bottom, 0px);
	border-top-width: var(--border-thin);
	border-radius: var(--radius-lg) var(--radius-lg) 0 0;
	transform: translateY(0);
}
.xtyle-sheet--bottom:not([open]) { transform: translateY(100%); }
@starting-style {
	.xtyle-sheet--bottom[open] { transform: translateY(100%); }
}
.xtyle-sheet--top {
	flex-direction: column;
	width: 100%;
	max-width: 100%;
	height: calc(var(--sheet-block) + env(safe-area-inset-top, 0px));
	max-height: 100%;
	margin: 0 auto auto;
	padding-top: env(safe-area-inset-top, 0px);
	border-bottom-width: var(--border-thin);
	border-radius: 0 0 var(--radius-lg) var(--radius-lg);
	transform: translateY(0);
}
.xtyle-sheet--top .xtyle-sheet__handle { order: 1; }
.xtyle-sheet--top:not([open]) { transform: translateY(-100%); }
@starting-style {
	.xtyle-sheet--top[open] { transform: translateY(-100%); }
}
.xtyle-sheet--left {
	flex-direction: row;
	height: 100%;
	max-height: 100%;
	width: calc(var(--sheet-inline) + env(safe-area-inset-left, 0px));
	max-width: 100%;
	margin: 0 auto 0 0;
	padding-top: env(safe-area-inset-top, 0px);
	padding-bottom: env(safe-area-inset-bottom, 0px);
	padding-left: env(safe-area-inset-left, 0px);
	border-right-width: var(--border-thin);
	border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
	transform: translateX(0);
}
.xtyle-sheet--left .xtyle-sheet__handle { order: 1; }
.xtyle-sheet--left:not([open]) { transform: translateX(-100%); }
@starting-style {
	.xtyle-sheet--left[open] { transform: translateX(-100%); }
}
.xtyle-sheet--right {
	flex-direction: row;
	height: 100%;
	max-height: 100%;
	width: calc(var(--sheet-inline) + env(safe-area-inset-right, 0px));
	max-width: 100%;
	margin: 0 0 0 auto;
	padding-top: env(safe-area-inset-top, 0px);
	padding-bottom: env(safe-area-inset-bottom, 0px);
	padding-right: env(safe-area-inset-right, 0px);
	border-left-width: var(--border-thin);
	border-radius: var(--radius-lg) 0 0 var(--radius-lg);
	transform: translateX(0);
}
.xtyle-sheet--right:not([open]) { transform: translateX(100%); }
@starting-style {
	.xtyle-sheet--right[open] { transform: translateX(100%); }
}

.xtyle-sheet__panel {
	flex: 1 1 auto;
	display: flex;
	flex-direction: column;
	min-width: 0;
	min-height: 0;
}
.xtyle-sheet__handle {
	flex: 0 0 auto;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: var(--space-3) var(--space-4);
	cursor: grab;
	touch-action: none;
}
.xtyle-sheet[data-dragging] .xtyle-sheet__handle { cursor: grabbing; }
.xtyle-sheet--left .xtyle-sheet__handle,
.xtyle-sheet--right .xtyle-sheet__handle {
	padding: var(--space-4) var(--space-2);
}
.xtyle-sheet__grabber {
	display: block;
	width: 2.25rem;
	height: 0.25rem;
	background: var(--fg-2);
	border-radius: var(--radius-full);
	opacity: 0.4;
}
.xtyle-sheet--left .xtyle-sheet__grabber,
.xtyle-sheet--right .xtyle-sheet__grabber {
	width: 0.25rem;
	height: 2.25rem;
}
.xtyle-sheet__header {
	flex: 0 0 auto;
	display: flex;
	align-items: flex-start;
	gap: var(--space-3);
	padding: var(--space-4) var(--space-5);
	border-bottom: var(--border-thin) solid var(--line);
	touch-action: none;
}
.xtyle-sheet__title {
	flex: 1;
	margin: 0;
	font-size: var(--text-lg);
	font-weight: var(--weight-semibold);
	line-height: var(--leading-tight);
	color: var(--fg-0);
}
.xtyle-sheet__body {
	flex: 1 1 auto;
	min-height: 0;
	padding: var(--space-5);
	overflow-y: auto;
	overscroll-behavior: contain;
	color: var(--fg-1);
}
.xtyle-sheet__footer {
	flex: 0 0 auto;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: var(--space-2);
	padding: var(--space-4) var(--space-5);
	border-top: var(--border-thin) solid var(--line);
}
.xtyle-sheet__footer:empty { display: none; }
.xtyle-sheet__close {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1.5em;
	height: 1.5em;
	flex: none;
	padding: 0;
	color: var(--fg-2);
	background: transparent;
	border: none;
	border-radius: var(--radius-sm);
	cursor: pointer;
	position: relative;
	isolation: isolate;
	touch-action: auto;
	transition:
		color var(--duration-fast) var(--ease-standard),
		box-shadow var(--duration-fast) var(--ease-standard);
}
.xtyle-sheet__close::after {
	content: "";
	position: absolute;
	inset: 0;
	border-radius: inherit;
	background: transparent;
	transition: background-color var(--duration-fast) var(--ease-standard);
	z-index: -1;
}
.xtyle-sheet__close:hover { color: var(--fg-0); }
.xtyle-sheet__close:hover::after { background: var(--state-hover); }
.xtyle-sheet__close:active::after { background: var(--state-press); }
.xtyle-sheet__close:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-sheet__close svg {
	width: 1em;
	height: 1em;
}
@media (prefers-reduced-motion: reduce) {
	.xtyle-sheet,
	.xtyle-sheet::backdrop {
		transition: none;
	}
	.xtyle-sheet--bottom:not([open]),
	.xtyle-sheet--top:not([open]) { transform: translateY(0); }
	.xtyle-sheet--left:not([open]),
	.xtyle-sheet--right:not([open]) { transform: translateX(0); }
}
`.trim();
