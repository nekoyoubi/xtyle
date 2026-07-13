import { FULL_TONES as TONES } from "../../vocab.js";

export const ribbonCss = `
.xtyle-ribbon {
	--rb-w: 9.5rem;
	--rb-py: 0.26rem;
	--rb-fs: var(--text-sm);
	--rb-bg: var(--accent);
	--rb-fg: var(--accent-fg);
	position: absolute;
	inset: 0;
	pointer-events: none;
}
.xtyle-ribbon--sm {
	--rb-w: 8rem;
	--rb-py: 0.16rem;
	--rb-fs: var(--text-xs);
}
.xtyle-ribbon--lg {
	--rb-w: 12rem;
	--rb-py: 0.34rem;
	--rb-fs: var(--text-lg);
}
.xtyle-ribbon__band {
	position: absolute;
	width: var(--rb-w);
	padding: var(--rb-py) 0;
	text-align: center;
	font-size: var(--rb-fs);
	font-weight: var(--weight-semibold);
	line-height: 1.25;
	letter-spacing: 0.02em;
	white-space: nowrap;
	color: var(--rb-fg);
	background: var(--rb-bg);
	box-shadow: var(--elevation-2);
	transform-origin: center;
}
${TONES.map((t) => `.xtyle-ribbon--${t} { --rb-bg: var(--${t}); --rb-fg: var(--${t}-fg); }`).join("\n")}
.xtyle-ribbon--soft {
	--rb-bg: var(--accent-bg);
	--rb-fg: var(--accent-text);
}
${TONES.map((t) => `.xtyle-ribbon--soft.xtyle-ribbon--${t} { --rb-bg: var(--${t}-bg); --rb-fg: var(--${t}-text); }`).join("\n")}
.xtyle-ribbon--top-right .xtyle-ribbon__band {
	top: calc(var(--rb-w) * 0.2);
	right: calc(var(--rb-w) * -0.27);
	transform: rotate(45deg);
}
.xtyle-ribbon--top-left .xtyle-ribbon__band {
	top: calc(var(--rb-w) * 0.2);
	left: calc(var(--rb-w) * -0.27);
	transform: rotate(-45deg);
}
.xtyle-ribbon--bottom-right .xtyle-ribbon__band {
	bottom: calc(var(--rb-w) * 0.2);
	right: calc(var(--rb-w) * -0.27);
	transform: rotate(-45deg);
}
.xtyle-ribbon--bottom-left .xtyle-ribbon__band {
	bottom: calc(var(--rb-w) * 0.2);
	left: calc(var(--rb-w) * -0.27);
	transform: rotate(45deg);
}
`.trim();
