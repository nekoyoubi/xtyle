export const appShellCss = `
.xoji-app {
	display: grid;
	grid-template-rows: auto 1fr auto;
	grid-template-columns: minmax(0, 1fr);
	height: 100dvh;
	background: var(--body-bg);
	color: var(--fg-0);
	font-family: var(--font-sans);
	font-size: var(--text-body);
	line-height: var(--leading-normal);
	overflow: hidden;
}
.xoji-app__body {
	--xoji-app-left: auto;
	--xoji-app-right: auto;
	display: grid;
	grid-template-columns: var(--xoji-app-left) auto minmax(0, 1fr) var(--xoji-app-right);
	min-width: 0;
	min-height: 0;
	overflow: hidden;
	position: relative;
}
.xoji-app__rail {
	min-width: 0;
}
.xoji-app__rail--left {
	grid-column: 1;
}
.xoji-app__rail--right {
	grid-column: 4;
}
/* A resizable rail is the positioned, full-height container its content can fill (an inset panel that
   scrolls), while its handle rides the body edge. */
.xoji-app__rail--resizable {
	position: relative;
}
.xoji-main {
	grid-column: 3;
	min-width: 0;
	overflow-y: auto;
	padding: var(--space-5);
}
/* The rail resize handle: absolutely placed on the rail's inner edge (following its size var), so it
   spans the body row and never touches the toolbar or status bar. Driven by the element's drag. */
.xoji-app__resizer {
	position: absolute;
	top: 0;
	bottom: 0;
	width: 11px;
	z-index: 5;
	padding: 0;
	background: none;
	border: none;
	cursor: col-resize;
	touch-action: none;
}
.xoji-app__resizer--left {
	left: var(--xoji-app-left);
	transform: translateX(-50%);
}
.xoji-app__resizer--right {
	right: var(--xoji-app-right);
	transform: translateX(50%);
}
.xoji-app__resizer::before {
	content: "";
	position: absolute;
	top: 0;
	bottom: 0;
	left: 50%;
	width: var(--border-thin);
	transform: translateX(-50%);
	background: var(--line);
	transition:
		background var(--duration-fast) var(--ease-standard),
		width var(--duration-fast) var(--ease-standard);
}
.xoji-app__resizer:hover::before,
.xoji-app__resizer[data-active]::before {
	background: var(--accent);
	width: var(--border-normal);
}
.xoji-app__resizer:focus-visible {
	outline: none;
}
.xoji-app__resizer[data-focus-ring]::before {
	background: var(--accent);
	width: var(--border-normal);
	box-shadow: 0 0 0 var(--border-thin) var(--ring);
}
.xoji-main:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: inset 0 0 0 var(--border-thick) var(--ring);
}
.xoji-app__skip-link {
	position: absolute;
	top: var(--space-2);
	left: var(--space-2);
	z-index: 100;
	font-family: var(--font-sans);
	font-size: var(--text-sm);
	font-weight: var(--weight-medium);
	line-height: var(--leading-tight);
	color: var(--accent-fg);
	background: var(--accent);
	border: var(--border-thin) solid transparent;
	border-radius: var(--radius-md);
	padding: var(--space-2) var(--space-3);
	text-decoration: none;
	transform: translateY(calc(-100% - var(--space-4)));
	transition: transform var(--duration-fast) var(--ease-standard);
}
.xoji-app__skip-link:focus-visible {
	transform: translateY(0);
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
@media (max-width: 900px) {
	.xoji-app {
		height: auto;
		min-height: 100dvh;
		overflow: visible;
		/* Document scrolls vertically at this width; clip the x-axis so a wide child
		   (a code sample, a data table) scrolls itself instead of the whole page. */
		overflow-x: clip;
	}
	.xoji-app__body {
		grid-template-columns: minmax(0, 1fr);
		overflow: visible;
	}
	.xoji-main {
		grid-column: 1;
		overflow: visible;
	}
	.xoji-app__rail--left,
	.xoji-app__rail--right {
		grid-column: 1;
	}
	.xoji-app__resizer {
		display: none;
	}
}
`.trim();
