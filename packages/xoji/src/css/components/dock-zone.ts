export const dockZoneCss = `
xoji-dock-zone {
	position: relative;
	display: flex;
	min-height: 0;
	min-width: 0;
	width: 100%;
	height: 100%;
	gap: var(--space-1);
	font-family: var(--font-sans);
}
.xoji-dock-split {
	display: flex;
	flex: 1;
	min-width: 0;
	min-height: 0;
	gap: var(--space-1);
}
.xoji-dock-split--row { flex-direction: row; }
.xoji-dock-split--column { flex-direction: column; }
.xoji-dock-zone__leaf {
	display: flex;
	flex-direction: column;
	min-width: 0;
	min-height: 0;
	background: var(--bg-1);
	border: var(--border-thin) solid var(--line);
	border-radius: var(--radius-md);
	overflow: hidden;
}
.xoji-dock-zone__tabs {
	display: flex;
	gap: var(--space-0);
	padding: var(--space-1) var(--space-1) 0;
	background: var(--bg-2);
	border-bottom: var(--border-thin) solid var(--line);
	overflow-x: auto;
}
.xoji-dock-zone__tab {
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
.xoji-dock-zone__tab:hover { color: var(--fg-0); background: var(--state-hover); }
.xoji-dock-zone__tab.is-active {
	color: var(--fg-0);
	background: var(--bg-1);
	box-shadow: inset 0 calc(-1 * var(--border-thick)) 0 var(--accent);
}
.xoji-dock-zone__tab:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-normal) var(--ring);
}
.xoji-dock-zone__body {
	flex: 1;
	min-height: 0;
	overflow: auto;
	padding: var(--space-3);
	color: var(--fg-1);
}
[data-dock-panel-host] { display: block; }
.xoji-dock-zone__film {
	position: absolute;
	pointer-events: none;
	z-index: 2;
	border-radius: var(--radius-md);
	transition: top var(--duration-fast) var(--ease-standard), left var(--duration-fast) var(--ease-standard), width var(--duration-fast) var(--ease-standard), height var(--duration-fast) var(--ease-standard);
}
.xoji-dock-zone__film--drop {
	background: color-mix(in oklch, var(--accent) 26%, transparent);
	border: var(--border-normal) solid var(--accent);
}
.xoji-dock-zone__film--remnant {
	background: color-mix(in oklch, var(--accent-2) 18%, transparent);
	border: var(--border-thin) solid var(--accent-2);
}
.xoji-dock-zone__film--rest {
	background: color-mix(in oklch, var(--accent-3) 13%, transparent);
	border: var(--border-thin) solid color-mix(in oklch, var(--accent-3) 45%, transparent);
}
`.trim();
