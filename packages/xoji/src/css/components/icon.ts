import { FULL_TONES as TONES } from "../../vocab.js";

const iconTones = TONES.map((t) => `.xoji-icon--${t} { color: var(--${t}); }`).join("\n");

export const iconCss = `
[data-icon] { display: contents; }
.xoji-icon {
	display: inline-block;
	width: 1em;
	height: 1em;
	vertical-align: -0.125em;
	flex: none;
}
.xoji-icon--sm { font-size: 0.85em; }
.xoji-icon--lg { font-size: 1.5em; }
.xoji-icon--xl { font-size: 2em; }
.xoji-icon--spin { animation: xoji-icon-spin 1s linear infinite; transform-origin: center; }
@keyframes xoji-icon-spin {
	to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
	.xoji-icon--spin { animation: none; }
}
${iconTones}
`.trim();
