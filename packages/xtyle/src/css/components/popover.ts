export const popoverCss = `
.xtyle-popover {
	display: contents;
}
.xtyle-popover__trigger {
	display: inline-flex;
	align-items: center;
}
.xtyle-popover__trigger[hidden] {
	display: none;
}
.xtyle-popover__panel {
	--xtyle-pop-arrow: 50%;
	position: fixed;
	inset: auto;
	margin: 0;
	width: max-content;
	max-width: min(22rem, calc(100vw - var(--space-8)));
	max-height: none;
	overflow: visible;
	padding: 0;
	font-family: var(--font-sans);
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
	color: var(--fg-1);
	background: var(--surface-overlay);
	border: var(--border-thin) solid var(--surface-overlay-border);
	border-radius: var(--radius-md);
	box-shadow: var(--elevation-3);
	opacity: 0;
	transition:
		opacity var(--duration-fast) var(--ease-standard),
		overlay var(--duration-fast) allow-discrete,
		display var(--duration-fast) allow-discrete;
}
.xtyle-popover__panel:popover-open,
.xtyle-popover__panel[open] {
	opacity: 1;
}
@starting-style {
	.xtyle-popover__panel:popover-open,
	.xtyle-popover__panel[open] {
		opacity: 0;
	}
}
.xtyle-popover__panel:focus-visible {
	outline: none;
	box-shadow:
		var(--elevation-3),
		0 0 0 var(--border-thick) var(--ring);
}
.xtyle-popover__panel::backdrop {
	background: transparent;
}
.xtyle-popover__panel[data-modal="true"]::backdrop {
	background: var(--scrim);
}
.xtyle-popover__content {
	max-height: min(24rem, calc(100vh - var(--space-8)));
	overflow: auto;
	padding: var(--space-3);
	border-radius: inherit;
}
.xtyle-popover--flush .xtyle-popover__content {
	padding: 0;
}
.xtyle-popover__arrow {
	position: absolute;
	width: var(--space-2);
	height: var(--space-2);
	background: var(--surface-overlay);
	border: var(--border-thin) solid var(--surface-overlay-border);
	pointer-events: none;
}
.xtyle-popover__arrow[hidden] {
	display: none;
}
.xtyle-popover__panel[data-placement="bottom"] .xtyle-popover__arrow {
	top: calc(var(--space-2) / -2);
	left: var(--xtyle-pop-arrow);
	transform: translateX(-50%) rotate(45deg);
	border-bottom: none;
	border-right: none;
}
.xtyle-popover__panel[data-placement="top"] .xtyle-popover__arrow {
	bottom: calc(var(--space-2) / -2);
	left: var(--xtyle-pop-arrow);
	transform: translateX(-50%) rotate(45deg);
	border-top: none;
	border-left: none;
}
.xtyle-popover__panel[data-placement="right"] .xtyle-popover__arrow {
	left: calc(var(--space-2) / -2);
	top: var(--xtyle-pop-arrow);
	transform: translateY(-50%) rotate(45deg);
	border-top: none;
	border-right: none;
}
.xtyle-popover__panel[data-placement="left"] .xtyle-popover__arrow {
	right: calc(var(--space-2) / -2);
	top: var(--xtyle-pop-arrow);
	transform: translateY(-50%) rotate(45deg);
	border-bottom: none;
	border-left: none;
}
`.trim();
