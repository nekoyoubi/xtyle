import { FULL_TONES as TONES } from "../../vocab.js";

const softRules = TONES.map(
	(t) => `.xtyle-toast--soft.xtyle-toast--${t} {
	background: var(--surface-overlay);
	color: var(--fg-0);
	border-color: var(--${t});
}
.xtyle-toast--soft.xtyle-toast--${t} .xtyle-toast__icon { color: var(--${t}); }`,
).join("\n");

const solidRules = TONES.map(
	(t) => `.xtyle-toast--solid.xtyle-toast--${t} {
	background: var(--${t});
	color: var(--${t}-fg);
	border-color: transparent;
}
.xtyle-toast--solid.xtyle-toast--${t} .xtyle-toast__icon { color: var(--${t}-fg); }`,
).join("\n");

export const toastCss = `
.xtyle-toast-region {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
	position: fixed;
	inset: auto var(--space-5) var(--space-5) auto;
	width: min(24rem, calc(100vw - var(--space-6)));
	max-width: 100%;
	z-index: var(--elevation-5);
	pointer-events: none;
}
.xtyle-toast-region--top { inset: var(--space-5) var(--space-5) auto auto; }
.xtyle-toast-region--top-left { inset: var(--space-5) auto auto var(--space-5); }
.xtyle-toast-region--bottom-left { inset: auto auto var(--space-5) var(--space-5); }
.xtyle-toast-region--top-center {
	inset: var(--space-5) auto auto 50%;
	transform: translateX(-50%);
}
.xtyle-toast-region--bottom-center {
	inset: auto auto var(--space-5) 50%;
	transform: translateX(-50%);
}
.xtyle-toast {
	display: flex;
	align-items: flex-start;
	gap: var(--space-3);
	font-family: var(--font-sans);
	font-size: var(--text-body);
	line-height: var(--leading-normal);
	background: var(--surface-overlay);
	color: var(--fg-0);
	border: var(--border-thin) solid var(--surface-overlay-border);
	border-radius: var(--radius-md);
	box-shadow: var(--shadow);
	padding: var(--space-3) var(--space-4);
	pointer-events: auto;
	transition:
		opacity var(--duration-base) var(--ease-emphasized),
		transform var(--duration-base) var(--ease-emphasized);
}
${softRules}
${solidRules}
.xtyle-toast--enter {
	opacity: 0;
	transform: translateY(var(--space-3));
}
.xtyle-toast--leave {
	opacity: 0;
	transform: translateY(var(--space-3));
}
.xtyle-toast__icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: none;
	width: 1em;
	height: 1em;
	font-size: var(--text-lg);
}
.xtyle-toast--noicon .xtyle-toast__icon { display: none; }
.xtyle-toast__body {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	min-width: 0;
	flex: 1;
}
.xtyle-toast__message {
	display: block;
	font-weight: var(--weight-medium);
}
.xtyle-toast__action {
	display: inline-flex;
	align-items: center;
	align-self: flex-start;
	gap: var(--space-1);
	font-family: var(--font-sans);
	font-size: var(--text-sm);
	font-weight: var(--weight-semibold);
	line-height: var(--leading-tight);
	color: currentColor;
	background: transparent;
	border: var(--border-thin) solid currentColor;
	border-radius: var(--radius-sm);
	padding: var(--space-1) var(--space-3);
	margin-top: var(--space-1);
	cursor: pointer;
	position: relative;
	isolation: isolate;
	transition:
		background-color var(--duration-fast) var(--ease-standard),
		box-shadow var(--duration-fast) var(--ease-standard);
}
.xtyle-toast__action::after {
	content: "";
	position: absolute;
	inset: 0;
	border-radius: inherit;
	background: transparent;
	transition: background-color var(--duration-fast) var(--ease-standard);
	z-index: -1;
}
.xtyle-toast__action:hover::after { background: var(--state-hover); }
.xtyle-toast__action:active::after { background: var(--state-press); }
.xtyle-toast__action:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-toast__close {
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
.xtyle-toast__close::after {
	content: "";
	position: absolute;
	inset: calc(-1 * var(--space-1));
	border-radius: inherit;
	background: transparent;
	transition: background-color var(--duration-fast) var(--ease-standard);
	z-index: -1;
}
.xtyle-toast__close:hover::after { background: var(--state-hover); }
.xtyle-toast__close:active::after { background: var(--state-press); }
.xtyle-toast__close:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
`.trim();
