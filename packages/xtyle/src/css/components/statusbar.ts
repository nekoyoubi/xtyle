export const statusbarCss = `
[data-root][data-statusbar] { display: contents; }
.xtyle-statusbar {
	display: flex;
	align-items: center;
	gap: var(--space-4);
	padding: var(--space-1) var(--space-4);
	background: var(--bg-1);
	border-top: var(--border-thin) solid var(--line);
	font-family: var(--font-mono);
	font-size: var(--text-xs);
	color: var(--fg-2);
	min-height: var(--space-6);
	overflow: hidden;
	min-width: 0;
}
.xtyle-statusbar--wrap {
	flex-wrap: wrap;
	overflow: visible;
}
.xtyle-statusbar--scroll {
	overflow-x: auto;
	overflow-y: hidden;
}
.xtyle-statusbar--collapse {
	flex-wrap: nowrap;
}
xtyle-statusbar[overflow="collapse"] .xtyle-statusbar__item {
	flex-shrink: 0;
}
xtyle-statusbar[separated] .xtyle-statusbar__item {
	position: relative;
}
xtyle-statusbar[separated] .xtyle-statusbar__item::before {
	content: "";
	position: absolute;
	inset-inline-start: calc(-0.5 * var(--space-4));
	top: 50%;
	width: var(--border-thin);
	height: 1.1em;
	background: var(--line);
	transform: translateY(-50%);
	pointer-events: none;
}
xtyle-statusbar[separated] .xtyle-statusbar__item:first-child::before,
xtyle-statusbar[separated] .xtyle-statusbar__spacer + .xtyle-statusbar__item::before,
xtyle-statusbar[separated] .xtyle-statusbar__item[data-rule-start]::before {
	display: none;
}
.xtyle-statusbar__overflow {
	display: inline-flex;
	align-items: center;
	flex: 0 0 auto;
}
.xtyle-statusbar__overflow-trigger {
	cursor: pointer;
	border: var(--border-thin) solid var(--surface-overlay-border);
	border-radius: var(--radius-sm);
	background: var(--bg-2);
	color: var(--fg-1);
	font-family: var(--font-mono);
	font-size: var(--text-xs);
	padding: 0 var(--space-1);
}
.xtyle-statusbar__overflow-trigger:hover {
	color: var(--fg-0);
}
.xtyle-statusbar__overflow-popover {
	position: fixed;
	margin: 0;
	inset: auto;
	box-sizing: border-box;
	flex-direction: column;
	gap: var(--space-2);
	min-width: var(--space-8);
	padding: var(--space-2);
	background: var(--surface-overlay);
	border: var(--border-thin) solid var(--surface-overlay-border);
	border-radius: var(--radius-md);
	box-shadow: var(--elevation-3);
	font-family: var(--font-mono);
	font-size: var(--text-xs);
	color: var(--fg-2);
}
.xtyle-statusbar__overflow-popover:popover-open {
	display: flex;
}
.xtyle-statusbar__overflow-item {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
	white-space: nowrap;
}
.xtyle-statusbar__item {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
	white-space: nowrap;
	margin: 0;
	padding: 0;
	background: none;
	border: 0;
	font: inherit;
	color: inherit;
}
.xtyle-statusbar__item--strong {
	color: var(--fg-0);
	font-weight: var(--weight-medium);
}
.xtyle-statusbar__item:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
	border-radius: var(--radius-sm);
}
.xtyle-statusbar__spacer {
	flex: 1;
	min-width: var(--space-2);
}
`.trim();
