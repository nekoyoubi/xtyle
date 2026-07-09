import { FULL_TONES } from "../../vocab.js";

const cardToneVars = FULL_TONES.map((t) => `.xtyle-card--${t} { --card-bar: var(--${t}); }`).join("\n");

export const cardCss = `
[data-card] { display: contents; }
.xtyle-card {
	display: flex;
	flex-direction: column;
	font-family: var(--font-sans);
	font-size: var(--text-body);
	line-height: var(--leading-normal);
	color: var(--fg-0);
	background: var(--bg-1);
	border: var(--border-thin) solid var(--line);
	border-radius: var(--radius-lg);
	box-shadow: var(--card-shadow, var(--elevation-1));
	padding: var(--space-5);
	gap: var(--space-4);
}
/* depthStrength: how far the surface lifts. The default (no class) is the eased md; sm is a
   whisper, lg keeps the heavier legacy elevation. An interactive card bumps one step on hover. */
.xtyle-card--depth-sm { --card-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.35); --card-shadow-hover: var(--elevation-1); }
.xtyle-card--depth-md { --card-shadow: var(--elevation-1); --card-shadow-hover: var(--elevation-2); }
.xtyle-card--depth-lg { --card-shadow: var(--elevation-2); --card-shadow-hover: var(--elevation-3); }
.xtyle-card--overlay {
	background: var(--surface-overlay);
	border-color: var(--surface-overlay-border);
}
.xtyle-card--compact {
	padding: var(--space-3);
	gap: var(--space-2);
}
.xtyle-card__header {
	font-size: var(--text-lg);
	font-weight: var(--weight-semibold);
	line-height: var(--leading-tight);
	color: var(--fg-0);
}
.xtyle-card__body {
	color: var(--fg-1);
}
.xtyle-card__footer {
	padding-top: var(--space-3);
	border-top: var(--border-thin) solid var(--line);
	color: var(--fg-2);
}
.xtyle-card__header:empty,
.xtyle-card__footer:empty {
	display: none;
}
.xtyle-card--interactive {
	position: relative;
	isolation: isolate;
	cursor: pointer;
	transition:
		box-shadow var(--duration-fast) var(--ease-standard),
		border-color var(--duration-fast) var(--ease-standard),
		transform var(--duration-fast) var(--ease-standard);
}
.xtyle-card--interactive::after {
	content: "";
	position: absolute;
	inset: 0;
	border-radius: inherit;
	background: transparent;
	transition: background-color var(--duration-fast) var(--ease-standard);
	z-index: -1;
}
.xtyle-card--toned { position: relative; }
.xtyle-card--toned::before {
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
.xtyle-card--interactive:hover {
	box-shadow: var(--card-shadow-hover, var(--elevation-2));
	border-color: var(--line-2);
	transform: translateY(calc(-1 * var(--space-1)));
}
.xtyle-card--interactive:hover::after { background: var(--state-hover); }
.xtyle-card--interactive:active { transform: none; }
.xtyle-card--interactive:active::after { background: var(--state-press); }
.xtyle-card--interactive:not(.xtyle-card--action):focus-within,
.xtyle-card--action:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
`.trim();
