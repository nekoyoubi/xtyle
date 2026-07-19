export const swatchCss = `
[data-root][data-swatch] { display: contents; }
.xtyle-swatch {
	display: inline-flex;
	align-items: center;
	gap: 0.5em;
	min-width: 0;
	position: relative;
}
.xtyle-swatch__dot {
	flex: none;
	width: 1em;
	height: 1em;
	border: var(--border-thin) solid var(--line-2);
	border-radius: var(--radius-sm);
}
.xtyle-swatch__label {
	color: var(--fg-1);
	font-size: var(--text-sm);
	line-height: var(--leading-tight);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.xtyle-swatch__value {
	color: var(--fg-2);
	font-family: var(--font-mono);
	font-size: var(--text-xs);
	line-height: var(--leading-tight);
	white-space: nowrap;
}
.xtyle-swatch--sm { font-size: var(--text-xs); }
.xtyle-swatch--lg { font-size: var(--text-lg); }
.xtyle-swatch--interactive {
	cursor: pointer;
	border: none;
	background: none;
	padding: 0;
	margin: 0;
	font: inherit;
	color: inherit;
	text-align: left;
	border-radius: var(--radius-sm);
}
.xtyle-swatch--interactive:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-swatch--selected .xtyle-swatch__dot {
	box-shadow:
		0 0 0 var(--border-thin) var(--bg-1),
		0 0 0 calc(var(--border-thin) + var(--border-thick)) var(--accent);
}
@container style(--selection-cue: marker) {
	.xtyle-swatch--selected .xtyle-swatch__dot { position: relative; }
	.xtyle-swatch--selected .xtyle-swatch__dot::after {
		content: "";
		position: absolute;
		inset: calc(-1 * var(--space-1) - var(--border-thick));
		border-radius: var(--radius-md);
		box-shadow: 0 0 0 var(--border-normal) var(--fg-0);
		pointer-events: none;
	}
}
/* The readout renders in the top layer, so a chip inside a scrolling palette can't crop the values
   it exists to show. Same trade as the tip: a popover's containing block is the viewport, so it
   can't lean on the chip in CSS and is placed from measured coordinates instead — and the reveal
   moves from a CSS hover to the element, because only script can open a popover. */
.xtyle-swatch__details {
	position: fixed;
	inset: auto;
	margin: 0;
	display: grid;
	grid-template-columns: auto auto;
	gap: var(--space-1) var(--space-2);
	width: max-content;
	max-width: min(16rem, calc(100vw - var(--space-8)));
	padding: var(--space-1) var(--space-2);
	background: var(--surface-overlay);
	border: var(--border-thin) solid var(--surface-overlay-border);
	border-radius: var(--radius-md);
	box-shadow: var(--elevation-2);
	opacity: 0;
	transition:
		opacity var(--duration-fast) var(--ease-standard),
		overlay var(--duration-fast) var(--ease-standard) allow-discrete,
		display var(--duration-fast) var(--ease-standard) allow-discrete;
}
.xtyle-swatch__details:popover-open {
	opacity: 1;
}
@starting-style {
	.xtyle-swatch__details:popover-open {
		opacity: 0;
	}
}
.xtyle-swatch__detail-model,
.xtyle-swatch__detail-value {
	font-size: var(--text-xs);
	line-height: var(--leading-tight);
}
.xtyle-swatch__detail-model {
	color: var(--fg-2);
	font-family: var(--font-sans);
}
.xtyle-swatch__detail-value {
	color: var(--fg-1);
	font-family: var(--font-mono);
	white-space: nowrap;
}
`.trim();
