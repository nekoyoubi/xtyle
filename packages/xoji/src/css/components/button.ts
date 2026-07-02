import { FULL_TONES as TONES } from "../../vocab.js";

const solidRules = TONES.map(
	(t) => `.xoji-button--solid.xoji-button--${t} {
	background: var(--${t});
	color: var(--${t}-fg);
	border-color: transparent;
}`,
).join("\n");

const outlineRules = TONES.map(
	(t) => `.xoji-button--outline.xoji-button--${t} {
	background: transparent;
	color: var(--${t}-text);
	border-color: var(--${t});
}`,
).join("\n");

const ghostRules = TONES.map(
	(t) => `.xoji-button--ghost.xoji-button--${t} {
	background: transparent;
	color: var(--${t}-text);
	border-color: transparent;
}`,
).join("\n");

const subtleRules = TONES.map(
	(t) => `.xoji-button--subtle.xoji-button--${t} {
	background: var(--${t}-bg);
	color: var(--${t}-text);
	border-color: transparent;
}`,
).join("\n");

const linkRules = TONES.map(
	(t) => `.xoji-button--link.xoji-button--${t} {
	color: var(--${t}-text);
}`,
).join("\n");

export const buttonCss = `
[data-button] { display: contents; }
.xoji-button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: var(--space-2);
	font-family: var(--font-sans);
	font-size: var(--text-body);
	font-weight: var(--weight-medium);
	line-height: var(--leading-tight);
	text-decoration: none;
	white-space: nowrap;
	border: var(--border-thin) solid transparent;
	border-radius: var(--radius-md);
	padding: var(--space-2) var(--space-4);
	cursor: pointer;
	position: relative;
	isolation: isolate;
	transition:
		background-color var(--duration-fast) var(--ease-standard),
		border-color var(--duration-fast) var(--ease-standard),
		color var(--duration-fast) var(--ease-standard),
		box-shadow var(--duration-fast) var(--ease-standard);
}
.xoji-button::after {
	content: "";
	position: absolute;
	inset: 0;
	border-radius: inherit;
	background: transparent;
	transition: background-color var(--duration-fast) var(--ease-standard);
	z-index: -1;
}
.xoji-button--xs {
	font-size: var(--text-xs);
	gap: var(--space-1);
	padding: var(--space-0) var(--space-2);
}
.xoji-button--sm {
	font-size: var(--text-sm);
	gap: var(--space-1);
	padding: var(--space-1) var(--space-3);
}
.xoji-button--lg {
	font-size: var(--text-lg);
	gap: var(--space-3);
	padding: var(--space-3) var(--space-5);
}
${solidRules}
${outlineRules}
${ghostRules}
${subtleRules}
${linkRules}
.xoji-button--link {
	background: transparent;
	border-color: transparent;
	padding: 0;
	border-radius: var(--radius-sm);
}
.xoji-button--link:hover {
	text-decoration: underline;
}
.xoji-button--link:hover::after,
.xoji-button--link:active::after {
	background: transparent;
}
.xoji-button:hover::after { background: var(--state-hover); }
.xoji-button:active::after { background: var(--state-press); }
.xoji-button[aria-pressed="true"]::after,
.xoji-button[aria-pressed="true"]:hover::after { background: var(--state-press); }
.xoji-button--link[aria-pressed="true"]::after { background: transparent; }
.xoji-button[aria-selected="true"]::after,
.xoji-button[aria-selected="true"]:hover::after { background: var(--state-selected); }
.xoji-button--link[aria-selected="true"]::after { background: transparent; }
.xoji-button:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xoji-button--block {
	display: flex;
	width: 100%;
}
.xoji-button--align-start { justify-content: flex-start; }
.xoji-button--align-end { justify-content: flex-end; }
.xoji-button--icon {
	padding: var(--space-2);
	aspect-ratio: 1;
	/* Zero the inter-slot gap so the lone icon centers — the empty label/end slots
	   would otherwise keep their gaps and push the icon off to one side. */
	gap: 0;
}
.xoji-button--icon.xoji-button--xs { padding: var(--space-0); }
.xoji-button--icon.xoji-button--sm { padding: var(--space-1); }
.xoji-button--icon.xoji-button--lg { padding: var(--space-3); }
.xoji-button__icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: none;
}
.xoji-button__label {
	display: inline-flex;
	align-items: center;
}
.xoji-button__spinner {
	display: inline-flex;
	width: 1em;
	height: 1em;
	flex: none;
	border: var(--border-normal) solid currentColor;
	border-top-color: transparent;
	border-radius: var(--radius-full);
	animation: xoji-button-spin var(--duration-slow) linear infinite;
}
@keyframes xoji-button-spin {
	to { transform: rotate(360deg); }
}
.xoji-button--loading {
	cursor: progress;
}
.xoji-button--loading .xoji-button__label,
.xoji-button--loading .xoji-button__icon {
	opacity: 0;
}
.xoji-button--loading .xoji-button__spinner {
	position: absolute;
	inset: 0;
	margin: auto;
}
.xoji-button:disabled,
.xoji-button[aria-disabled="true"] {
	cursor: not-allowed;
	color: var(--fg-disabled);
	background: var(--state-disabled);
	border-color: transparent;
}
.xoji-button:disabled::after,
.xoji-button[aria-disabled="true"]::after { background: transparent; }
`.trim();
