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
[data-root][data-button] { display: contents; }
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
.xtyle-button:hover::after { background: var(--state-hover); }
.xtyle-button:active::after { background: var(--state-press); }
.xtyle-button[aria-pressed="true"]::after,
.xtyle-button[aria-pressed="true"]:hover::after { background: var(--state-press); }
.xtyle-button[aria-current="true"]::after,
.xtyle-button[aria-current="true"]:hover::after { background: var(--state-selected); }
/* The link variant carries no state wash in any state, so its overrides come after the generic
   ones. They used to sit before, where an equal-specificity :hover rule and a higher-specificity
   pressed/selected one both beat them, and a link button lit up with a surface it has no surface
   for. The underline is its state signal instead. */
.xtyle-button--link::after,
.xtyle-button--link:hover::after,
.xtyle-button--link:active::after,
.xtyle-button--link[aria-pressed="true"]::after,
.xtyle-button--link[aria-pressed="true"]:hover::after,
.xtyle-button--link[aria-current="true"]::after,
.xtyle-button--link[aria-current="true"]:hover::after { background: transparent; }
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
/* The link variant is the no-chrome one, and that has to hold for a lone icon too: the base
   icon padding lands after the variant rule and would otherwise put the box back. */
.xtyle-button--icon.xtyle-button--link { padding: 0; }
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
/* a class rule outweighs the UA's hidden-attribute rule, so a spinner that lives in the markup and is
   toggled by the attribute (rather than built on demand) would spin on every button in the set */
.xtyle-button__spinner[hidden] {
	display: none;
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
