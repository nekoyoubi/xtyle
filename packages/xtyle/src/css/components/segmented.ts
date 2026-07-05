import { FULL_TONES } from "../../vocab.js";

const segmentedToneVars = FULL_TONES.map(
	(t) => `.xtyle-segmented--${t} { --seg-fill: var(--${t}); --seg-ink: var(--${t}-fg); }`,
).join("\n");

export const segmentedCss = `
.xtyle-segmented-field {
	display: inline-flex;
	flex-direction: column;
	gap: var(--space-2);
	font-family: var(--font-sans);
}
.xtyle-segmented__label {
	color: var(--fg-1);
	font-size: var(--text-sm);
}
.xtyle-segmented {
	--seg-fill: var(--accent);
	--seg-ink: var(--accent-fg);
	display: inline-flex;
	gap: var(--space-1);
	padding: var(--space-1);
	background: var(--bg-1);
	border: var(--border-thin) solid var(--line-2);
	border-radius: var(--radius-md);
}
.xtyle-segmented__option {
	appearance: none;
	border: none;
	background: transparent;
	color: var(--fg-1);
	font: inherit;
	font-size: var(--text-sm);
	font-weight: var(--weight-medium);
	padding: var(--space-1) var(--space-3);
	border-radius: var(--radius-sm);
	cursor: pointer;
	position: relative;
	isolation: isolate;
	white-space: nowrap;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	transition:
		color var(--duration-fast) var(--ease-standard),
		background-color var(--duration-fast) var(--ease-standard);
}
.xtyle-segmented__option::after {
	content: "";
	position: absolute;
	inset: 0;
	border-radius: inherit;
	background: transparent;
	z-index: -1;
	transition: background-color var(--duration-fast) var(--ease-standard);
}
.xtyle-segmented__option:hover {
	color: var(--fg-0);
}
.xtyle-segmented__option:hover::after {
	background: var(--state-hover);
}
.xtyle-segmented__option:active::after {
	background: var(--state-press);
}
.xtyle-segmented__option[aria-checked="true"] {
	color: var(--seg-ink);
	background: var(--seg-fill);
}
.xtyle-segmented__option:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-segmented__option:disabled {
	cursor: not-allowed;
	color: var(--fg-disabled);
}
.xtyle-segmented__option:disabled:hover::after { background: transparent; }
.xtyle-segmented__badge {
	margin-inline-start: var(--space-1);
	font-size: 0.85em;
	opacity: 0.7;
	font-variant-numeric: tabular-nums;
}
.xtyle-segmented--sm .xtyle-segmented__option {
	padding: var(--space-1) var(--space-2);
}
.xtyle-segmented--lg .xtyle-segmented__option {
	padding: var(--space-2) var(--space-4);
	font-size: var(--text-body);
}
/* Icon segments carry no text, so grow the glyph and square the padding: a prominent mark in a
   snug box, rather than a tiny icon lost in text-sized padding. */
.xtyle-segmented__option--icon {
	font-size: 1.35em;
	padding: var(--space-2);
}
.xtyle-segmented--sm .xtyle-segmented__option--icon {
	padding: var(--space-1);
}
.xtyle-segmented--lg .xtyle-segmented__option--icon {
	font-size: 1.5em;
	padding: var(--space-2);
}
/* Collapse the projected segment's own line box so an icon's inline baseline can't leave it sitting
   a pixel high inside the flex-centered option. ::slotted reaches the light-DOM child from the
   shadow sheet, which a document-level selector on the host's children can't. */
.xtyle-segmented__option ::slotted(*) {
	display: inline-flex;
	align-items: center;
}
.xtyle-segmented--disabled {
	opacity: 0.6;
}
.xtyle-segmented--disabled .xtyle-segmented__option {
	cursor: not-allowed;
	color: var(--fg-disabled);
}
.xtyle-segmented--disabled .xtyle-segmented__option[aria-checked="true"] {
	background: var(--state-disabled);
	color: var(--fg-disabled);
}
@container style(--selection-cue: marker) {
	.xtyle-segmented__option[aria-checked="true"]::before {
		content: "✓";
		margin-inline-end: var(--space-1);
		font-size: 0.85em;
	}
}
${segmentedToneVars}
`.trim();
