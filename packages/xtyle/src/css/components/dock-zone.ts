export const dockZoneCss = `
@property --dock-band {
	syntax: "<length>";
	inherits: true;
	initial-value: 48px;
}
xtyle-dock-zone {
	display: flex;
	min-height: 0;
	min-width: 0;
	width: 100%;
	height: 100%;
	font-family: var(--font-sans);
	--dock-band: calc(var(--space-8) * 1.5);
}
.xtyle-dock-zone__root {
	position: relative;
	display: flex;
	flex: 1;
	min-width: 0;
	min-height: 0;
	gap: var(--space-1);
}
.xtyle-dock-split {
	display: flex;
	flex: 1;
	min-width: 0;
	min-height: 0;
	gap: var(--space-1);
}
.xtyle-dock-split--row { flex-direction: row; }
.xtyle-dock-split--column { flex-direction: column; }
.xtyle-dock-zone__leaf {
	display: flex;
	flex-direction: column;
	min-width: 0;
	min-height: 0;
	background: var(--bg-1);
	border: var(--border-thin) solid var(--line);
	border-radius: var(--radius-md);
	overflow: hidden;
}
.xtyle-dock-zone__head {
	display: flex;
	align-items: stretch;
	background: var(--bg-2);
	border-bottom: var(--border-thin) solid var(--line);
}
.xtyle-dock-zone__tabs {
	display: flex;
	flex: 1;
	min-width: 0;
	gap: var(--space-0);
	padding: var(--space-1) var(--space-1) 0;
	overflow-x: auto;
}
.xtyle-dock-zone__actions {
	display: flex;
	flex: none;
	align-items: center;
	gap: var(--space-0);
	padding: 0 var(--space-1);
}
.xtyle-dock-zone__action {
	appearance: none;
	border: none;
	background: transparent;
	color: var(--fg-2);
	font: inherit;
	font-size: var(--text-sm);
	line-height: 1;
	display: grid;
	place-items: center;
	min-width: var(--space-6);
	height: var(--space-6);
	padding: 0 var(--space-1);
	border-radius: var(--radius-sm);
	cursor: pointer;
}
.xtyle-dock-zone__action:hover { color: var(--fg-0); background: var(--state-hover); }
.xtyle-dock-zone__action:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-normal) var(--ring);
}
.xtyle-dock-zone__close:hover { color: var(--danger); }
.xtyle-dock-zone__kebab-glyph {
	font-size: var(--text-lg);
	line-height: 1;
}
.xtyle-dock-zone__tab {
	appearance: none;
	border: none;
	background: transparent;
	color: var(--fg-2);
	font: inherit;
	font-size: var(--text-sm);
	padding: var(--space-1) var(--space-3);
	border-radius: var(--radius-sm) var(--radius-sm) 0 0;
	cursor: grab;
	white-space: nowrap;
	touch-action: none;
}
.xtyle-dock-zone__badge {
	margin-inline-start: var(--space-1);
	font-size: 0.85em;
	color: var(--fg-2);
	font-variant-numeric: tabular-nums;
}
.xtyle-dock-zone__tab:hover { color: var(--fg-0); background: var(--state-hover); }
.xtyle-dock-zone__tab.is-active {
	color: var(--fg-0);
	background: var(--bg-1);
	box-shadow: inset 0 calc(-1 * var(--border-thick)) 0 var(--accent);
}
.xtyle-dock-zone__tab:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-normal) var(--ring);
}
.xtyle-dock-zone__body {
	flex: 1;
	min-height: 0;
	overflow: auto;
	padding: var(--space-3);
	color: var(--fg-1);
}
.xtyle-dock-zone__leaf--stack {
	overflow-y: auto;
	overflow-x: hidden;
}
.xtyle-dock-zone__section {
	display: flex;
	flex-direction: column;
	min-height: 0;
	border-bottom: var(--border-thin) solid var(--line);
}
.xtyle-dock-zone__section.is-collapsed { flex: none; }
.xtyle-dock-zone__section-head {
	display: flex;
	align-items: stretch;
	background: var(--bg-2);
}
.xtyle-dock-zone__section-toggle {
	flex: 1;
	min-width: 0;
	appearance: none;
	border: none;
	background: transparent;
	color: var(--fg-2);
	font: inherit;
	font-size: var(--text-sm);
	display: flex;
	align-items: center;
	gap: var(--space-2);
	padding: var(--space-1) var(--space-2);
	cursor: grab;
	text-align: start;
	touch-action: none;
}
.xtyle-dock-zone__section-toggle:hover { color: var(--fg-0); background: var(--state-hover); }
.xtyle-dock-zone__section-toggle:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: inset 0 0 0 var(--border-normal) var(--ring);
}
.xtyle-dock-zone__chevron {
	flex: none;
	width: 0;
	height: 0;
	border-left: 0.4em solid currentColor;
	border-top: 0.3em solid transparent;
	border-bottom: 0.3em solid transparent;
	transition: transform var(--duration-fast) var(--ease-standard);
}
.xtyle-dock-zone__section:not(.is-collapsed) .xtyle-dock-zone__chevron { transform: rotate(90deg); }
.xtyle-dock-zone__section-title {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.xtyle-dock-zone__section-body {
	min-height: 0;
	overflow: auto;
	padding: var(--space-3);
	color: var(--fg-1);
}
[data-dock-panel-host] { display: block; }
.xtyle-dock-zone__film {
	position: absolute;
	pointer-events: none;
	z-index: 2;
	border-radius: var(--radius-md);
	transition: top var(--duration-fast) var(--ease-standard), left var(--duration-fast) var(--ease-standard), width var(--duration-fast) var(--ease-standard), height var(--duration-fast) var(--ease-standard);
}
.xtyle-dock-zone__film--drop {
	background: color-mix(in oklch, var(--accent) 26%, transparent);
	border: var(--border-normal) solid var(--accent);
}
.xtyle-dock-zone__film--remnant {
	background: color-mix(in oklch, var(--accent-2) 18%, transparent);
	border: var(--border-thin) solid var(--accent-2);
}
.xtyle-dock-zone__film--rest {
	background: color-mix(in oklch, var(--accent-3) 13%, transparent);
	border: var(--border-thin) solid color-mix(in oklch, var(--accent-3) 45%, transparent);
}
.xtyle-dock-zone__floats {
	position: absolute;
	inset: 0;
	z-index: 3;
	pointer-events: none;
}
.xtyle-dock-zone__float {
	position: absolute;
	display: flex;
	flex-direction: column;
	min-width: 10rem;
	min-height: 7rem;
	background: var(--bg-1);
	border: var(--border-thin) solid var(--line);
	border-radius: var(--radius-md);
	box-shadow: var(--elevation-4);
	overflow: hidden;
	pointer-events: auto;
}
.xtyle-dock-zone__float.is-dragging {
	opacity: 0.55;
}
.xtyle-dock-zone__float-head {
	display: flex;
	align-items: center;
	gap: var(--space-1);
	padding-left: var(--space-3);
	padding-block: var(--space-1);
	background: var(--bg-2);
	border-bottom: var(--border-thin) solid var(--line);
	cursor: grab;
	touch-action: none;
	user-select: none;
}
.xtyle-dock-zone__float-head:active { cursor: grabbing; }
.xtyle-dock-zone__float-title {
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: var(--text-sm);
	font-weight: var(--weight-medium);
	color: var(--fg-1);
}
.xtyle-dock-zone__float-body {
	flex: 1;
	min-height: 0;
	overflow: auto;
	padding: var(--space-3);
	color: var(--fg-1);
}
.xtyle-dock-zone__float-resize {
	position: absolute;
	right: 0;
	bottom: 0;
	width: var(--space-4);
	height: var(--space-4);
	cursor: nwse-resize;
	touch-action: none;
	background: linear-gradient(135deg, transparent 50%, var(--fg-2) 50%, var(--fg-2) 62%, transparent 62%, transparent 74%, var(--fg-2) 74%, var(--fg-2) 86%, transparent 86%);
	opacity: 0.5;
	border-bottom-right-radius: var(--radius-md);
}
.xtyle-dock-zone__float-resize:hover { opacity: 0.85; }
`.trim();
