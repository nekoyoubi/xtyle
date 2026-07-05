import { FULL_TONES, TONES as STATUS_TONES } from "../../vocab.js";

const toneFallback = FULL_TONES.map(
	(t) => `.xoji-avatar--${t} .xoji-avatar__fallback {
	background: var(--${t}-bg);
	color: var(--${t}-text);
}`,
).join("\n");

// The presence dot is a status signal, not a free color choice — it stays on the semantic roles.
const statusTones = STATUS_TONES.map((t) => `.xoji-avatar--status-${t} .xoji-avatar__status-dot { background: var(--${t}); }`).join("\n");

export const avatarCss = `
[data-avatar] { display: contents; }
.xoji-avatar {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	position: relative;
	flex: none;
	width: var(--space-7);
	height: var(--space-7);
	font-family: var(--font-sans);
	font-size: var(--text-sm);
	font-weight: var(--weight-semibold);
	line-height: var(--leading-tight);
	color: var(--neutral-text);
	border-radius: var(--radius-full);
}
.xoji-avatar--sm {
	width: var(--space-6);
	height: var(--space-6);
	font-size: var(--text-xs);
}
.xoji-avatar--lg {
	width: var(--space-8);
	height: var(--space-8);
	font-size: var(--text-body);
}
.xoji-avatar--xl {
	width: calc(var(--space-8) + var(--space-4));
	height: calc(var(--space-8) + var(--space-4));
	font-size: var(--text-lg);
}
.xoji-avatar--square {
	border-radius: var(--radius-md);
}
.xoji-avatar--sm.xoji-avatar--square {
	border-radius: var(--radius-sm);
}
.xoji-avatar--xl.xoji-avatar--square {
	border-radius: var(--radius-lg);
}
.xoji-avatar__image {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
	border-radius: inherit;
	display: block;
}
.xoji-avatar__fallback {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	border-radius: inherit;
	background: var(--neutral-bg);
	color: var(--neutral-text);
	user-select: none;
	text-transform: uppercase;
	letter-spacing: var(--space-0);
}
.xoji-avatar__fallback svg {
	width: 60%;
	height: 60%;
}
${toneFallback}
.xoji-avatar__status-dot {
	position: absolute;
	display: block;
	width: 28%;
	height: 28%;
	min-width: var(--space-2);
	min-height: var(--space-2);
	inset-block-end: 0;
	inset-inline-end: 0;
	background: var(--neutral);
	border-radius: var(--radius-full);
	box-shadow: 0 0 0 var(--border-thick) var(--bg-1);
}
.xoji-avatar--square .xoji-avatar__status-dot {
	inset-block-end: 0;
	inset-inline-end: 0;
	transform: translate(25%, 25%);
}
.xoji-avatar--pulse-slow .xoji-avatar__status-dot {
	animation: xoji-badge-pulse 1.8s var(--ease-standard) infinite;
}
.xoji-avatar--pulse-fast .xoji-avatar__status-dot {
	animation: xoji-badge-pulse 0.9s var(--ease-standard) infinite;
}
@media (prefers-reduced-motion: reduce) {
	.xoji-avatar--pulse-slow .xoji-avatar__status-dot,
	.xoji-avatar--pulse-fast .xoji-avatar__status-dot {
		animation: none;
	}
}
${statusTones}
`.trim();
