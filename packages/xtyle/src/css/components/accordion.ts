export const accordionCss = `
.xtyle-accordion {
	display: flex;
	flex-direction: column;
	font-family: var(--font-sans);
	color: var(--fg-0);
	background: var(--bg-1);
	border: var(--border-thin) solid var(--line);
	border-radius: var(--radius-md);
	overflow: hidden;
}
.xtyle-accordion__item + .xtyle-accordion__item {
	border-top: var(--border-thin) solid var(--line);
}
.xtyle-accordion__heading {
	margin: 0;
	font-size: inherit;
	font-weight: inherit;
	line-height: inherit;
}
.xtyle-accordion__trigger {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-3);
	width: 100%;
	font-family: inherit;
	font-size: var(--text-body);
	font-weight: var(--weight-medium);
	line-height: var(--leading-tight);
	text-align: start;
	color: var(--fg-0);
	background: transparent;
	border: none;
	padding: var(--space-3) var(--space-4);
	cursor: pointer;
	position: relative;
	isolation: isolate;
	transition: color var(--duration-fast) var(--ease-standard);
}
.xtyle-accordion__trigger::after {
	content: "";
	position: absolute;
	inset: 0;
	background: transparent;
	transition: background-color var(--duration-fast) var(--ease-standard);
	z-index: -1;
}
.xtyle-accordion__trigger:hover::after { background: var(--state-hover); }
.xtyle-accordion__trigger:active::after { background: var(--state-press); }
.xtyle-accordion__trigger:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: inset 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-accordion__trigger:disabled,
.xtyle-accordion__trigger[aria-disabled="true"] {
	cursor: not-allowed;
	color: var(--fg-disabled);
}
.xtyle-accordion__trigger:disabled::after,
.xtyle-accordion__trigger[aria-disabled="true"]::after { background: transparent; }
.xtyle-accordion__chevron {
	width: 1em;
	height: 1em;
	flex: none;
	color: var(--fg-2);
	transition: transform var(--duration-fast) var(--ease-standard);
}
.xtyle-accordion__trigger[aria-expanded="true"] .xtyle-accordion__chevron {
	transform: rotate(180deg);
}
.xtyle-accordion__panel {
	color: var(--fg-1);
}
.xtyle-accordion__panel[hidden] { display: none; }
.xtyle-accordion__content {
	padding: var(--space-1) var(--space-4) var(--space-4);
	font-size: var(--text-body);
	line-height: var(--leading-normal);
}
.xtyle-accordion--sm .xtyle-accordion__trigger {
	font-size: var(--text-sm);
	padding: var(--space-2) var(--space-3);
}
.xtyle-accordion--sm .xtyle-accordion__content {
	padding: var(--space-1) var(--space-3) var(--space-3);
	font-size: var(--text-sm);
}
.xtyle-accordion--lg .xtyle-accordion__trigger {
	font-size: var(--text-lg);
	padding: var(--space-4) var(--space-5);
}
.xtyle-accordion--lg .xtyle-accordion__content {
	padding: var(--space-2) var(--space-5) var(--space-5);
	font-size: var(--text-lg);
}
`.trim();
