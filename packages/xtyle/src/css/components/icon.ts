import { FULL_TONES as TONES } from "../../vocab.js";

const iconTones = TONES.map((t) => `.xtyle-icon--${t} { color: var(--${t}); }`).join("\n");

export const iconCss = `
[data-root][data-icon] { display: contents; }
.xtyle-icon {
	display: inline-block;
	width: 1em;
	height: 1em;
	vertical-align: -0.125em;
	flex: none;
}
.xtyle-icon--sm { font-size: 0.85em; }
.xtyle-icon--lg { font-size: 1.5em; }
.xtyle-icon--xl { font-size: 2em; }
.xtyle-icon--spin { animation: xtyle-icon-spin 1s linear infinite; transform-origin: center; }
@keyframes xtyle-icon-spin {
	to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
	.xtyle-icon--spin { animation: none; }
}
${iconTones}
`.trim();
