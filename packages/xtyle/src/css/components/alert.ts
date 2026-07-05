import { FULL_TONES as TONES } from "../../vocab.js";

const softRules = TONES.map(
	(t) => `.xtyle-alert--soft.xtyle-alert--${t} {
	background: var(--${t}-bg);
	color: var(--${t}-text);
	border-color: var(--${t});
}
.xtyle-alert--soft.xtyle-alert--${t} .xtyle-alert__icon { color: var(--${t}); }`,
).join("\n");

const solidRules = TONES.map(
	(t) => `.xtyle-alert--solid.xtyle-alert--${t} {
	background: var(--${t});
	color: var(--${t}-fg);
	border-color: transparent;
}
.xtyle-alert--solid.xtyle-alert--${t} .xtyle-alert__title { color: var(--${t}-fg); }
.xtyle-alert--solid.xtyle-alert--${t} .xtyle-alert__icon { color: var(--${t}-fg); }`,
).join("\n");

export const alertCss = `
.xtyle-alert {
	display: flex;
	gap: var(--space-3);
	font-family: var(--font-sans);
	font-size: var(--text-body);
	line-height: var(--leading-normal);
	border: var(--border-thin) solid transparent;
	border-radius: var(--radius-md);
	padding: var(--space-3) var(--space-4);
}
${softRules}
${solidRules}
.xtyle-alert__icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: none;
	width: 1em;
	height: 1em;
	font-size: var(--text-lg);
	margin-top: var(--space-0);
}
.xtyle-alert--noicon .xtyle-alert__icon { display: none; }
:host(:has([slot="icon"])) .xtyle-alert__icon { display: inline-flex; }
.xtyle-alert__body {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	min-width: 0;
	flex: 1;
}
.xtyle-alert__title {
	display: block;
	font-weight: var(--weight-semibold);
	font-size: var(--text-lg);
	line-height: var(--leading-tight);
	color: var(--fg-0);
}
.xtyle-alert__message { display: block; }
.xtyle-alert__actions {
	display: flex;
	flex-wrap: wrap;
	gap: var(--space-2);
	margin-top: var(--space-1);
}
.xtyle-alert__dismiss {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: none;
	width: 1em;
	height: 1em;
	font-size: var(--text-lg);
	padding: var(--space-0);
	margin: calc(-1 * var(--space-1)) calc(-1 * var(--space-1)) auto auto;
	color: currentColor;
	background: transparent;
	border: var(--border-thin) solid transparent;
	border-radius: var(--radius-sm);
	cursor: pointer;
	position: relative;
	isolation: isolate;
	transition:
		background-color var(--duration-fast) var(--ease-standard),
		box-shadow var(--duration-fast) var(--ease-standard);
}
.xtyle-alert__dismiss::after {
	content: "";
	position: absolute;
	inset: calc(-1 * var(--space-1));
	border-radius: inherit;
	background: transparent;
	transition: background-color var(--duration-fast) var(--ease-standard);
	z-index: -1;
}
.xtyle-alert__dismiss:hover::after { background: var(--state-hover); }
.xtyle-alert__dismiss:active::after { background: var(--state-press); }
.xtyle-alert__dismiss:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
`.trim();
