import { FULL_TONES } from "../../vocab.js";

const tonedBellies = FULL_TONES.map(
	(t) => `.xtyle-reveal__belly--toned.xtyle-reveal__belly--${t} {
	background: var(--${t}-bg);
	color: var(--${t}-text);
	box-shadow: inset 0 0 0 var(--border-thick) var(--${t});
}
.xtyle-reveal__grip--${t} { color: var(--${t}); }`,
).join("\n");

export const revealCss = `
[data-root][data-reveal] { display: contents; }
xtyle-reveal { display: block; position: relative; }
xtyle-reveal-group { display: block; }
.xtyle-reveal {
	position: relative;
	display: block;
	overflow: clip;
	border-radius: var(--radius-md);
	--xtyle-reveal-grip-span: calc(var(--xtyle-reveal-grip-size, var(--space-5)) + var(--xtyle-reveal-grip-pad, var(--space-3)) * 2);
}
.xtyle-reveal__belly {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	gap: var(--space-2);
	margin: 0;
	padding: var(--space-3) var(--space-5);
	background: var(--bg-2);
	color: var(--fg-1);
}
.xtyle-reveal__belly[hidden] { display: none; }
.xtyle-reveal__belly--start { justify-content: flex-start; }
.xtyle-reveal__belly--end { justify-content: flex-end; }
.xtyle-reveal__belly--top { align-items: flex-start; justify-content: center; }
.xtyle-reveal__belly--bottom { align-items: flex-end; justify-content: center; }
.xtyle-reveal__belly[data-dormant] {
	opacity: 0;
	pointer-events: none;
}
${tonedBellies}
.xtyle-reveal__lid {
	position: relative;
	display: block;
	z-index: 1;
	background: var(--bg-1);
	color: var(--fg-0);
	border-radius: inherit;
	cursor: grab;
	user-select: none;
	-webkit-user-select: none;
	touch-action: pan-y;
	will-change: transform;
}
.xtyle-reveal--has-top .xtyle-reveal__lid,
.xtyle-reveal--has-bottom .xtyle-reveal__lid { touch-action: none; }
.xtyle-reveal__lid:focus-visible {
	outline: var(--border-normal) solid var(--ring);
	outline-offset: calc(var(--border-normal) * -1);
}
.xtyle-reveal[data-dragging] .xtyle-reveal__lid { cursor: grabbing; }
.xtyle-reveal__content { display: block; }
.xtyle-reveal--has-start > .xtyle-reveal__lid > .xtyle-reveal__content { padding-inline-start: var(--xtyle-reveal-grip-span); }
.xtyle-reveal--has-end > .xtyle-reveal__lid > .xtyle-reveal__content { padding-inline-end: var(--xtyle-reveal-grip-span); }
.xtyle-reveal--has-top > .xtyle-reveal__lid > .xtyle-reveal__content { padding-block-start: var(--xtyle-reveal-grip-span); }
.xtyle-reveal--has-bottom > .xtyle-reveal__lid > .xtyle-reveal__content { padding-block-end: var(--xtyle-reveal-grip-span); }
.xtyle-reveal--bleed > .xtyle-reveal__lid > .xtyle-reveal__content { padding: 0; }
.xtyle-reveal--disabled .xtyle-reveal__lid { cursor: default; }
.xtyle-reveal--disabled .xtyle-reveal__belly { display: none; }

.xtyle-reveal--shaped .xtyle-reveal__lid { clip-path: var(--xtyle-reveal-shape); }
.xtyle-reveal--shaped .xtyle-reveal__belly { clip-path: var(--xtyle-reveal-shape); }
.xtyle-reveal__grip {
	position: absolute;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	border: 0;
	background: transparent;
	color: var(--fg-2);
	cursor: pointer;
}
.xtyle-reveal__grip--start,
.xtyle-reveal__grip--end {
	inset-block: 0;
	width: var(--xtyle-reveal-grip-span);
}
.xtyle-reveal__grip--start { inset-inline-start: var(--xtyle-reveal-grip-inset, 0); }
.xtyle-reveal__grip--end { inset-inline-end: var(--xtyle-reveal-grip-inset, 0); }
.xtyle-reveal__grip--top,
.xtyle-reveal__grip--bottom {
	inset-inline: 0;
	height: var(--xtyle-reveal-grip-span);
}
.xtyle-reveal__grip--top { inset-block-start: var(--xtyle-reveal-grip-inset, 0); }
.xtyle-reveal__grip--bottom { inset-block-end: var(--xtyle-reveal-grip-inset, 0); }
.xtyle-reveal__grip-icon {
	display: block;
	width: var(--xtyle-reveal-grip-size, var(--space-5));
	height: var(--xtyle-reveal-grip-size, var(--space-5));
	opacity: 0.7;
	transition: opacity var(--duration-base) var(--ease-standard);
}
.xtyle-reveal__grip-bar {
	display: block;
	width: var(--border-thick);
	height: calc(var(--xtyle-reveal-grip-size, var(--space-5)) * 1.1);
	border-radius: var(--radius-full);
	background: currentColor;
	opacity: 0.5;
	transition: opacity var(--duration-base) var(--ease-standard);
}
.xtyle-reveal__grip--top .xtyle-reveal__grip-bar,
.xtyle-reveal__grip--bottom .xtyle-reveal__grip-bar {
	width: calc(var(--xtyle-reveal-grip-size, var(--space-5)) * 1.1);
	height: var(--border-thick);
}
.xtyle-reveal__grip-dots {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	opacity: 0.5;
	transition: opacity var(--duration-base) var(--ease-standard);
}
.xtyle-reveal__grip--top .xtyle-reveal__grip-dots,
.xtyle-reveal__grip--bottom .xtyle-reveal__grip-dots { flex-direction: row; }
.xtyle-reveal__grip-dots > span {
	display: block;
	width: var(--space-1);
	height: var(--space-1);
	border-radius: var(--radius-full);
	background: currentColor;
}
.xtyle-reveal__grip:hover .xtyle-reveal__grip-icon,
.xtyle-reveal__grip:hover .xtyle-reveal__grip-bar,
.xtyle-reveal__grip:hover .xtyle-reveal__grip-dots { opacity: 1; }
.xtyle-reveal--open .xtyle-reveal__grip-icon,
.xtyle-reveal--open .xtyle-reveal__grip-bar,
.xtyle-reveal--open .xtyle-reveal__grip-dots { opacity: 1; }
.xtyle-reveal--shaped {
	overflow: visible;
	border-radius: 0;
	background: transparent;
}
.xtyle-reveal--shaped.xtyle-reveal--contained { overflow: clip; }
.xtyle-reveal--shaped .xtyle-reveal__lid { border-radius: 0; }
.xtyle-reveal--shaped .xtyle-reveal__belly--toned { box-shadow: none; }
`;
