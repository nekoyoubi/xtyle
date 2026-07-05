import { FULL_TONES as TONES } from "../../vocab.js";

const kbdTones = TONES.map(
	(t) => `.xtyle-kbd--${t} {
	background-color: var(--${t}-bg);
	border-color: var(--${t});
	color: var(--${t}-text);
}`,
).join("\n");

export const kbdCss = `
[data-kbd] { display: contents; }
.xtyle-kbd {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 1.6em;
	padding: 0.15em 0.45em;
	border: var(--border-thin) solid var(--line-2);
	border-bottom-width: var(--border-thick);
	border-radius: var(--radius-sm);
	background-color: var(--bg-2);
	color: var(--fg-1);
	font-family: var(--font-mono);
	font-size: var(--text-sm);
	font-weight: var(--weight-medium);
	line-height: var(--leading-tight);
	white-space: nowrap;
}
.xtyle-kbd--sm { font-size: var(--text-xs); }
.xtyle-kbd--lg { font-size: var(--text-lg); }
${kbdTones}
`.trim();
