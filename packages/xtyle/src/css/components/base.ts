/**
 * The shared base of the component class layer: global accessibility rules every
 * xtyle app wants, plus `.xtyle-control` — the common input chrome that Field,
 * Select, and Textarea inherit. Concatenated FIRST in `componentsCss` so the
 * resets cascade correctly and component modules can rely on `.xtyle-control`.
 *
 * The reduced-motion block neutralizes motion at the consumption layer rather
 * than zeroing the duration/easing token values, so the tokens stay inspectable
 * and any non-motion consumer is untouched. The forced-colors block pairs every
 * box-shadow focus ring with a transparent `outline` on `:focus-visible`: shadows
 * are dropped in forced-colors mode, but a transparent outline becomes a real,
 * system-colored one — so keyboard focus survives.
 */
export const baseCss = `
@media (prefers-reduced-motion: reduce) {
	[class^="xtyle-"],
	[class*=" xtyle-"],
	[class^="xtyle-"] *,
	[class*=" xtyle-"] * {
		transition-duration: 0.01ms !important;
		animation-duration: 0.01ms !important;
		animation-iteration-count: 1 !important;
		scroll-behavior: auto !important;
	}
}
@media (forced-colors: active) {
	[class^="xtyle-"]:focus-visible,
	[class*=" xtyle-"]:focus-visible {
		outline: var(--border-normal) solid Highlight;
		outline-offset: var(--border-normal);
	}
}
.xtyle-control {
	box-sizing: border-box;
	font-family: var(--font-sans);
	font-size: var(--text-body);
	line-height: var(--leading-normal);
	color: var(--fg-0);
	background: var(--field-bg);
	border: var(--border-thin) solid var(--field-border);
	border-radius: var(--radius-md);
	padding: var(--space-2) var(--space-3);
	transition:
		border-color var(--duration-fast) var(--ease-standard),
		box-shadow var(--duration-fast) var(--ease-standard);
}
.xtyle-control::placeholder { color: var(--placeholder); }
.xtyle-control:focus-visible {
	outline: var(--border-normal) solid transparent;
	border-color: var(--accent);
	box-shadow: 0 0 0 var(--border-normal) var(--ring);
}
.xtyle-control:disabled {
	cursor: not-allowed;
	color: var(--fg-disabled);
	background: var(--state-disabled);
}
.xtyle-control--invalid {
	border-color: var(--danger);
}
`.trim();
