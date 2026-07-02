import { FULL_TONES } from "../../vocab.js";

const cardToneVars = FULL_TONES.map((t) => `.xoji-card--${t} { --card-bar: var(--${t}); }`).join("\n");

export const cardCss = `
[data-card] { display: contents; }
.xoji-card {
	display: flex;
	flex-direction: column;
	font-family: var(--font-sans);
	font-size: var(--text-body);
	line-height: var(--leading-normal);
	color: var(--fg-0);
	background: var(--bg-1);
	border: var(--border-thin) solid var(--line);
	border-radius: var(--radius-lg);
	box-shadow: var(--elevation-2);
	padding: var(--space-5);
	gap: var(--space-4);
}
.xoji-card--overlay {
	background: var(--surface-overlay);
	border-color: var(--surface-overlay-border);
}
.xoji-card--compact {
	padding: var(--space-3);
	gap: var(--space-2);
}
.xoji-card__header {
	font-size: var(--text-lg);
	font-weight: var(--weight-semibold);
	line-height: var(--leading-tight);
	color: var(--fg-0);
}
.xoji-card__body {
	color: var(--fg-1);
}
.xoji-card__footer {
	padding-top: var(--space-3);
	border-top: var(--border-thin) solid var(--line);
	color: var(--fg-2);
}
.xoji-card--interactive {
	position: relative;
	isolation: isolate;
	cursor: pointer;
	transition:
		box-shadow var(--duration-fast) var(--ease-standard),
		border-color var(--duration-fast) var(--ease-standard),
		transform var(--duration-fast) var(--ease-standard);
}
.xoji-card--interactive::after {
	content: "";
	position: absolute;
	inset: 0;
	border-radius: inherit;
	background: transparent;
	transition: background-color var(--duration-fast) var(--ease-standard);
	z-index: -1;
}
.xoji-card--toned { position: relative; }
.xoji-card--toned::before {
	content: "";
	position: absolute;
	inset-block: 0;
	inset-inline-start: 0;
	width: var(--space-1);
	border-start-start-radius: var(--radius-lg);
	border-end-start-radius: var(--radius-lg);
	background: var(--card-bar);
}
${cardToneVars}
.xoji-card--interactive:hover {
	box-shadow: var(--elevation-4);
	border-color: var(--line-2);
	transform: translateY(calc(-1 * var(--space-1)));
}
.xoji-card--interactive:hover::after { background: var(--state-hover); }
.xoji-card--interactive:active { transform: none; }
.xoji-card--interactive:active::after { background: var(--state-press); }
.xoji-card--interactive:not(.xoji-card--action):focus-within,
.xoji-card--action:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
`.trim();
