import { FULL_TONES as TONES } from "../../vocab.js";

export const dotCss = `
.xtyle-dot {
	--dot-color: var(--neutral);
	--dot-pulse-duration: 1.4s;
	position: relative;
	display: inline-block;
	/* An empty inline-block's baseline is its bottom margin edge, so a bare dot hangs its bottom off
	   the text baseline and reads as sitting below the line. Center it on the text instead. */
	vertical-align: middle;
	width: var(--space-3);
	height: var(--space-3);
	flex: none;
	border-radius: var(--radius-full);
	background: var(--dot-color);
}
.xtyle-dot--sm {
	width: var(--space-2);
	height: var(--space-2);
}
.xtyle-dot--lg {
	width: var(--space-4);
	height: var(--space-4);
}
${TONES.map((t) => `.xtyle-dot--${t} { --dot-color: var(--${t}); }`).join("\n")}
.xtyle-dot--pulse-slow {
	--dot-pulse-duration: 1.8s;
	animation: xtyle-dot-pulse var(--dot-pulse-duration) var(--ease-standard) infinite;
}
.xtyle-dot--pulse-fast {
	--dot-pulse-duration: 0.9s;
	animation: xtyle-dot-pulse var(--dot-pulse-duration) var(--ease-standard) infinite;
}
.xtyle-dot--glow {
	box-shadow:
		0 0 0 var(--border-thin) color-mix(in oklch, var(--dot-color) 35%, transparent),
		0 0 var(--space-2) 0 var(--dot-color);
}
.xtyle-dot--ping::after {
	content: "";
	position: absolute;
	inset: 0;
	border-radius: inherit;
	background: var(--dot-color);
	animation: xtyle-dot-ping var(--dot-pulse-duration) var(--ease-standard) infinite;
}
@keyframes xtyle-dot-pulse {
	50% { opacity: 0.4; }
}
@keyframes xtyle-dot-ping {
	0% {
		transform: scale(1);
		opacity: 0.55;
	}
	80%,
	100% {
		transform: scale(2.6);
		opacity: 0;
	}
}
@media (prefers-reduced-motion: reduce) {
	.xtyle-dot--pulse-slow,
	.xtyle-dot--pulse-fast {
		animation: none;
	}
	.xtyle-dot--ping::after {
		animation: none;
		opacity: 0;
	}
}
`.trim();
