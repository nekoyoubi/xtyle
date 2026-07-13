export const panelCss = `
.xtyle-panel {
	display: flex;
	flex-direction: column;
	background: var(--bg-0);
	border: var(--border-thin) solid var(--line);
	border-radius: var(--radius-lg);
	overflow: hidden;
}
.xtyle-panel__header {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	padding: var(--space-3) var(--space-4);
	background: var(--bg-1);
	border-bottom: var(--border-thin) solid var(--line);
}
.xtyle-panel__title {
	font-family: var(--font-display);
	font-weight: var(--weight-semibold);
	font-size: var(--text-sm);
	color: var(--fg-1);
	margin: 0;
}
.xtyle-panel__spacer { flex: 1; }
.xtyle-panel__header--toggle { padding: 0 var(--space-4) 0 0; }
.xtyle-panel__header--toggle .xtyle-panel__toggle {
	flex: 1;
	background: transparent;
	border-bottom: none;
}
.xtyle-panel__body {
	padding: var(--space-4);
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}
.xtyle-panel__footer {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	padding: var(--space-3) var(--space-4);
	background: var(--bg-1);
	border-top: var(--border-thin) solid var(--line);
	color: var(--fg-2);
	font-size: var(--text-sm);
}
.xtyle-panel--scroll .xtyle-panel__body {
	overflow-y: auto;
	max-height: var(--space-8);
	scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}
.xtyle-panel--scroll .xtyle-panel__body:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: inset 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-panel--collapsible > summary,
.xtyle-panel__toggle {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	width: 100%;
	margin: 0;
	padding: var(--space-3) var(--space-4);
	background: var(--bg-1);
	border: none;
	border-bottom: var(--border-thin) solid var(--line);
	border-radius: 0;
	color: var(--fg-1);
	font-family: var(--font-display);
	font-weight: var(--weight-semibold);
	font-size: var(--text-sm);
	text-align: start;
	cursor: pointer;
	list-style: none;
	position: relative;
	isolation: isolate;
	transition: background-color var(--duration-fast) var(--ease-standard);
}
.xtyle-panel--collapsible > summary::-webkit-details-marker { display: none; }
.xtyle-panel--collapsible > summary::after,
.xtyle-panel__toggle::after {
	content: "";
	position: absolute;
	inset: 0;
	background: transparent;
	transition: background-color var(--duration-fast) var(--ease-standard);
	z-index: -1;
}
.xtyle-panel--collapsible > summary:hover::after,
.xtyle-panel__toggle:hover::after { background: var(--state-hover); }
.xtyle-panel--collapsible > summary:active::after,
.xtyle-panel__toggle:active::after { background: var(--state-press); }
.xtyle-panel--collapsible > summary:focus-visible,
.xtyle-panel__toggle:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: inset 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-panel__marker {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: none;
	width: 1em;
	height: 1em;
	color: var(--fg-2);
	transition: transform var(--duration-fast) var(--ease-emphasized);
}
.xtyle-panel--collapsible[open] > summary .xtyle-panel__marker,
.xtyle-panel__toggle[aria-expanded="true"] .xtyle-panel__marker {
	transform: rotate(90deg);
}
.xtyle-dock .xtyle-panel { border: none; border-radius: 0; border-bottom: var(--border-thin) solid var(--line); }
.xtyle-dock .xtyle-panel__header { background: transparent; }
`.trim();
