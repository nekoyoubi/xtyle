import { FULL_TONES as TONES } from "../../vocab.js";

const solidRules = TONES.map(
	(t) => `.xtyle-button--solid.xtyle-button--${t} {
	background: var(--${t});
	color: var(--${t}-fg);
	border-color: transparent;
}`,
).join("\n");

const outlineRules = TONES.map(
	(t) => `.xtyle-button--outline.xtyle-button--${t} {
	background: transparent;
	color: var(--${t}-text);
	border-color: var(--${t});
}`,
).join("\n");

const ghostRules = TONES.map(
	(t) => `.xtyle-button--ghost.xtyle-button--${t} {
	background: transparent;
	color: var(--${t}-text);
	border-color: transparent;
}`,
).join("\n");

const subtleRules = TONES.map(
	(t) => `.xtyle-button--subtle.xtyle-button--${t} {
	background: var(--${t}-bg);
	color: var(--${t}-text);
	border-color: transparent;
}`,
).join("\n");

const linkRules = TONES.map(
	(t) => `.xtyle-button--link.xtyle-button--${t} {
	color: var(--${t}-text);
}`,
).join("\n");

export const buttonCss = `
[data-button] { display: contents; }
.xtyle-button {
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
.xtyle-button::after {
	content: "";
	position: absolute;
	inset: 0;
	border-radius: inherit;
	background: transparent;
	transition: background-color var(--duration-fast) var(--ease-standard);
	z-index: -1;
}
.xtyle-button--xs {
	font-size: var(--text-xs);
	gap: var(--space-1);
	padding: var(--space-0) var(--space-2);
}
.xtyle-button--sm {
	font-size: var(--text-sm);
	gap: var(--space-1);
	padding: var(--space-1) var(--space-3);
}
.xtyle-button--lg {
	font-size: var(--text-lg);
	gap: var(--space-3);
	padding: var(--space-3) var(--space-5);
}
${solidRules}
${outlineRules}
${ghostRules}
${subtleRules}
${linkRules}
.xtyle-button--link {
	background: transparent;
	border-color: transparent;
	padding: 0;
	border-radius: var(--radius-sm);
}
.xtyle-button--link:hover {
	text-decoration: underline;
}
.xtyle-button--link:hover::after,
.xtyle-button--link:active::after {
	background: transparent;
}
.xtyle-button:hover::after { background: var(--state-hover); }
.xtyle-button:active::after { background: var(--state-press); }
.xtyle-button[aria-pressed="true"]::after,
.xtyle-button[aria-pressed="true"]:hover::after { background: var(--state-press); }
.xtyle-button--link[aria-pressed="true"]::after { background: transparent; }
.xtyle-button[aria-selected="true"]::after,
.xtyle-button[aria-selected="true"]:hover::after { background: var(--state-selected); }
.xtyle-button--link[aria-selected="true"]::after { background: transparent; }
.xtyle-button:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-button--block {
	display: flex;
	width: 100%;
}
.xtyle-button--align-start { justify-content: flex-start; }
.xtyle-button--align-end { justify-content: flex-end; }
.xtyle-button--icon {
	padding: var(--space-2);
	aspect-ratio: 1;
	/* Zero the inter-slot gap so the lone icon centers — the empty label/end slots
	   would otherwise keep their gaps and push the icon off to one side. */
	gap: 0;
}
.xtyle-button--icon.xtyle-button--xs { padding: var(--space-0); }
.xtyle-button--icon.xtyle-button--sm { padding: var(--space-1); }
.xtyle-button--icon.xtyle-button--lg { padding: var(--space-3); }
.xtyle-button__icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: none;
}
.xtyle-button__label {
	display: inline-flex;
	align-items: center;
}
.xtyle-button__spinner {
	display: inline-flex;
	width: 1em;
	height: 1em;
	flex: none;
	border: var(--border-normal) solid currentColor;
	border-top-color: transparent;
	border-radius: var(--radius-full);
	animation: xtyle-button-spin var(--duration-slow) linear infinite;
}
@keyframes xtyle-button-spin {
	to { transform: rotate(360deg); }
}
.xtyle-button--loading {
	cursor: progress;
}
.xtyle-button--loading .xtyle-button__label,
.xtyle-button--loading .xtyle-button__icon {
	opacity: 0;
}
.xtyle-button--loading .xtyle-button__spinner {
	position: absolute;
	inset: 0;
	margin: auto;
}
.xtyle-button:disabled,
.xtyle-button[aria-disabled="true"] {
	cursor: not-allowed;
	color: var(--fg-disabled);
	background: var(--state-disabled);
	border-color: transparent;
}
.xtyle-button:disabled::after,
.xtyle-button[aria-disabled="true"]::after { background: transparent; }
@media (prefers-reduced-motion: reduce) {
	.xtyle-button__spinner { animation: none; }
}
`.trim();
