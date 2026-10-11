import { FULL_TONES, TONES as STATUS_TONES } from "../../vocab.js";
import { AVATAR_DIAMOND } from "../../markup/avatar.js";

const toneFallback = FULL_TONES.map(
	(t) => `.xtyle-avatar--${t} .xtyle-avatar__fallback {
	background: var(--${t}-bg);
	color: var(--${t}-text);
}`,
).join("\n");

// INFO: the presence dot is a status signal, so it stays on the semantic tone roles, not the full palette
const statusTones = STATUS_TONES.map(
	(t) => `.xtyle-avatar--status-${t} .xtyle-avatar__status-dot { --dot-color: var(--${t}); }`,
).join("\n");

const frameTones = FULL_TONES.map(
	(t) => `.xtyle-avatar--frame-tone-${t} { --_frame: var(--${t}); }
.xtyle-avatar--frame-tone-2-${t} { --_frame-2: var(--${t}); }`,
).join("\n");

export const avatarCss = `
[data-root][data-avatar] { display: contents; }
xtyle-avatar[shape="diamond"]::before,
xtyle-avatar[shape="diamond"]::after { clip-path: ${AVATAR_DIAMOND}; }
.xtyle-avatar {
	--_frame-width: 0px;
	--_inset: var(--_frame-width);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	position: relative;
	flex: none;
	box-sizing: border-box;
	padding: var(--_inset);
	background: var(--_bevel, none), var(--xtyle-avatar-frame, var(--_frame-paint, transparent));
	box-shadow: var(--xtyle-avatar-ring, none);
	--_size: var(--space-7);
	--xtyle-icon-size: calc(var(--_size) * 0.55);
	width: var(--_size);
	height: var(--_size);
	font-family: var(--font-sans);
	font-size: var(--text-sm);
	font-weight: var(--weight-semibold);
	line-height: var(--leading-tight);
	color: var(--neutral-text);
	border-radius: var(--radius-full);
}
.xtyle-avatar--sm {
	--_size: var(--space-6);
	font-size: var(--text-xs);
}
.xtyle-avatar--lg {
	--_size: var(--space-8);
	font-size: var(--text-body);
}
.xtyle-avatar--xl {
	--_size: calc(var(--space-8) + var(--space-4));
	font-size: var(--text-lg);
}
.xtyle-avatar--square {
	border-radius: var(--radius-md);
}
.xtyle-avatar--sm.xtyle-avatar--square {
	border-radius: var(--radius-sm);
}
.xtyle-avatar--xl.xtyle-avatar--square {
	border-radius: var(--radius-lg);
}
.xtyle-avatar--diamond {
	--_inset: calc(var(--_frame-width) * 1.4142);
	--xtyle-icon-size: calc(var(--_size) * 0.42);
	border-radius: 0;
	background: none;
	box-shadow: none;
	isolation: isolate;
}
.xtyle-avatar--diamond::before {
	content: "";
	position: absolute;
	inset: 0;
	z-index: -1;
	background: var(--_bevel, none), var(--xtyle-avatar-frame, var(--_frame-paint, transparent));
	clip-path: ${AVATAR_DIAMOND};
}
.xtyle-avatar--diamond .xtyle-avatar__image,
.xtyle-avatar--diamond .xtyle-avatar__fallback {
	clip-path: ${AVATAR_DIAMOND};
}
.xtyle-avatar--diamond .xtyle-avatar__fallback svg:not(xtyle-icon svg) {
	width: 50%;
	height: 50%;
}
.xtyle-avatar--diamond .xtyle-avatar__initials {
	font-size: 0.8em;
}
.xtyle-avatar--frame-solid,
.xtyle-avatar--frame-gradient {
	--_frame-width: var(--xtyle-avatar-frame-width, var(--border-thick));
}
.xtyle-avatar--lg.xtyle-avatar--frame-solid,
.xtyle-avatar--lg.xtyle-avatar--frame-gradient,
.xtyle-avatar--xl.xtyle-avatar--frame-solid,
.xtyle-avatar--xl.xtyle-avatar--frame-gradient {
	--_frame-width: var(--xtyle-avatar-frame-width, calc(var(--border-thick) * 1.5));
}
.xtyle-avatar--frame-solid {
	--_frame-paint: var(--_frame, var(--line-2));
}
.xtyle-avatar--frame-gradient {
	--_frame-paint: linear-gradient(135deg, var(--_frame, var(--accent)), var(--_frame-2, var(--accent-2)));
}
.xtyle-avatar--bevel {
	--_bevel: linear-gradient(
		135deg,
		color-mix(in oklab, var(--white) 60%, transparent),
		transparent 45%,
		transparent 55%,
		color-mix(in oklab, var(--black) 55%, transparent)
	);
}
${frameTones}
.xtyle-avatar__image {
	position: absolute;
	inset: var(--_inset);
	width: calc(100% - 2 * var(--_inset));
	height: calc(100% - 2 * var(--_inset));
	object-fit: cover;
	border-radius: inherit;
	display: block;
}
.xtyle-avatar__fallback {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	border-radius: inherit;
	background: var(--neutral-bg);
	box-shadow: inset 0 0 0 var(--border-thin) var(--line-strong);
	color: var(--neutral-text);
	user-select: none;
	text-transform: uppercase;
}
.xtyle-avatar__fallback svg:not(xtyle-icon svg) {
	width: 60%;
	height: 60%;
}
.xtyle-avatar__initials {
	line-height: 1;
}
${toneFallback}
/* The presence dot is the shared .xtyle-dot primitive — shape, tone plumbing, pulse, and its
   reduced-motion hold-still all come from there. What is genuinely the avatar's own is the geometry:
   it scales with the chip rather than sitting on the dot size ramp, and it wears a ring so it reads
   against the portrait behind it. avatarCss is emitted after dotCss, so these override cleanly. */
.xtyle-avatar__status-dot {
	position: absolute;
	width: 28%;
	height: 28%;
	min-width: var(--space-2);
	min-height: var(--space-2);
	inset-block-end: 0;
	inset-inline-end: 0;
	box-shadow: 0 0 0 var(--border-thick) var(--bg-1);
}
.xtyle-avatar--square .xtyle-avatar__status-dot {
	transform: translate(25%, 25%);
}
.xtyle-avatar__marks {
	position: absolute;
	inset: 0;
	pointer-events: none;
}
.xtyle-avatar__marks:empty {
	display: none;
}
.xtyle-avatar--diamond .xtyle-avatar__status-dot {
	inset-block-end: 18%;
	inset-inline-end: 18%;
}
${statusTones}
`.trim();
