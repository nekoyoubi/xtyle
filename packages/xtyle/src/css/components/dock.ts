import { FULL_TONES } from "../../vocab.js";

const dockToneEdges = FULL_TONES.map(
	(t) => `.xtyle-dock--${t} { --dock-edge: var(--${t}); --dock-edge-w: var(--border-thick); }`,
).join("\n");

export const dockCss = `
[data-root][data-dock] { display: contents; }
.xtyle-dock {
	display: flex;
	flex-direction: column;
	flex: none;
	width: 100%;
	height: 100%;
	box-sizing: border-box;
	gap: var(--space-2);
	font-family: var(--font-sans);
	font-size: var(--text-body);
	line-height: var(--leading-normal);
	color: var(--fg-1);
	background: var(--bg-1);
	border-right: var(--dock-edge-w, var(--border-thin)) solid var(--dock-edge, var(--line));
	padding: var(--space-4) var(--space-3);
	overflow-y: auto;
	overflow-x: hidden;
}
.xtyle-dock--right {
	border-right: none;
	border-left: var(--dock-edge-w, var(--border-thin)) solid var(--dock-edge, var(--line));
}
.xtyle-dock__header {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	font-size: var(--text-xs);
	font-weight: var(--weight-semibold);
	line-height: var(--leading-tight);
	letter-spacing: var(--space-0);
	text-transform: uppercase;
	color: var(--fg-2);
	padding: var(--space-1) var(--space-2);
}
.xtyle-dock__body {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	min-height: 0;
}
.xtyle-dock__footer {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	margin-top: auto;
	padding-top: var(--space-3);
	border-top: var(--border-thin) solid var(--line);
}
${dockToneEdges}
.xtyle-dock--edge-thin { --dock-edge-w: var(--border-thin); }
.xtyle-dock--edge-thick { --dock-edge-w: var(--border-thick); }
.xtyle-dock--edge-bold { --dock-edge-w: var(--space-1); }
.xtyle-dock--edge-out {
	border-right: none;
	border-left: var(--dock-edge-w, var(--border-thin)) solid var(--dock-edge, var(--line));
}
.xtyle-dock--right.xtyle-dock--edge-out {
	border-left: none;
	border-right: var(--dock-edge-w, var(--border-thin)) solid var(--dock-edge, var(--line));
}
`.trim();
