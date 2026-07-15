import { FULL_TONES as TONES } from "../../vocab.js";

const toneRules = TONES.map(
	(t) => `.xtyle-calendar--${t} {
	--cal-accent: var(--${t});
	--cal-accent-fg: var(--${t}-fg);
	--cal-band: var(--${t}-bg);
}
.xtyle-calendar__dot[data-tone="${t}"] {
	background: var(--${t});
}`,
).join("\n");

export const calendarCss = `
.xtyle-calendar {
	--cal-accent: var(--accent);
	--cal-accent-fg: var(--accent-fg);
	--cal-band: var(--accent-bg);
	display: block;
	font-family: var(--font-sans);
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
	color: var(--fg-1);
}
.xtyle-calendar__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-1);
	margin-block-end: var(--space-1);
}
.xtyle-calendar__title {
	font-size: var(--text-body);
	font-weight: var(--weight-medium);
	color: var(--fg-0);
}
.xtyle-calendar__nav {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-inline-size: 2em;
	min-block-size: 2em;
	padding: var(--space-0);
	color: var(--fg-1);
	background: transparent;
	border: var(--border-thin) solid transparent;
	border-radius: var(--radius-sm);
	font: inherit;
	cursor: pointer;
	transition:
		background var(--duration-fast) var(--ease-standard),
		color var(--duration-fast) var(--ease-standard);
}
.xtyle-calendar__nav svg {
	inline-size: 1em;
	block-size: 1em;
}
.xtyle-calendar__nav:hover {
	background: var(--state-hover);
}
.xtyle-calendar__nav:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-calendar__nav[aria-disabled="true"] {
	color: var(--fg-disabled);
	cursor: default;
	pointer-events: none;
}
.xtyle-calendar__grid {
	inline-size: 100%;
	border-collapse: collapse;
	table-layout: fixed;
}
.xtyle-calendar__weekday {
	padding-block: var(--space-0);
	font-size: var(--text-xs);
	font-weight: var(--weight-medium);
	color: var(--fg-3);
	text-align: center;
}
.xtyle-calendar__weeknum {
	inline-size: 2.5em;
	padding-inline-end: var(--space-1);
	font-size: var(--text-xs);
	font-weight: var(--weight-medium);
	color: var(--fg-3);
	text-align: end;
}
.xtyle-calendar__cell {
	padding: 0;
	text-align: center;
}
.xtyle-calendar__cell:focus {
	outline: none;
}
.xtyle-calendar__day {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.15em;
	min-block-size: 2.25em;
	margin: 1px;
	padding-block: var(--space-0);
	border: var(--border-thin) solid transparent;
	border-radius: var(--radius-sm);
	cursor: pointer;
	transition:
		background var(--duration-fast) var(--ease-standard),
		color var(--duration-fast) var(--ease-standard);
}
.xtyle-calendar__num {
	font-variant-numeric: tabular-nums;
}
.xtyle-calendar__cell[data-outside] .xtyle-calendar__day {
	color: var(--fg-3);
}
.xtyle-calendar__cell[data-today] .xtyle-calendar__day {
	border-color: var(--cal-accent);
	font-weight: var(--weight-semibold);
}
.xtyle-calendar__cell:not([aria-disabled="true"]):hover .xtyle-calendar__day {
	background: var(--state-hover);
}
.xtyle-calendar__cell:focus-visible .xtyle-calendar__day {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-calendar__cell[data-in-range],
.xtyle-calendar__cell[data-preview] {
	background: var(--cal-band);
}
.xtyle-calendar__cell[data-range-start],
.xtyle-calendar__cell[data-preview-start] {
	border-start-start-radius: var(--radius-sm);
	border-end-start-radius: var(--radius-sm);
}
.xtyle-calendar__cell[data-range-end],
.xtyle-calendar__cell[data-preview-end] {
	border-start-end-radius: var(--radius-sm);
	border-end-end-radius: var(--radius-sm);
}
.xtyle-calendar__cell[data-preview-edge] .xtyle-calendar__day {
	border-color: var(--cal-accent);
}
.xtyle-calendar__cell[data-filled] .xtyle-calendar__day {
	background: var(--cal-accent);
	color: var(--cal-accent-fg);
	font-weight: var(--weight-medium);
}
.xtyle-calendar__cell[aria-disabled="true"] .xtyle-calendar__day {
	color: var(--fg-disabled);
	cursor: default;
}
.xtyle-calendar__marks {
	display: flex;
	align-items: center;
	gap: 0.15em;
	block-size: 0.35em;
}
.xtyle-calendar__dot {
	inline-size: 0.35em;
	block-size: 0.35em;
	border-radius: var(--radius-full);
	background: var(--cal-accent);
}
.xtyle-calendar__busy {
	inline-size: 60%;
	block-size: var(--border-thick);
	border-radius: var(--radius-full);
	background: var(--fg-2);
}
.xtyle-calendar__cell[data-filled] .xtyle-calendar__dot,
.xtyle-calendar__cell[data-filled] .xtyle-calendar__busy {
	background: var(--cal-accent-fg);
}
.xtyle-calendar__cue {
	display: none;
}
@container style(--selection-cue: marker) {
	.xtyle-calendar__cell[data-filled] .xtyle-calendar__cue {
		display: block;
		inline-size: 45%;
		block-size: var(--border-thick);
		border-radius: var(--radius-full);
		background: var(--cal-accent-fg);
	}
}
.xtyle-calendar--sm {
	font-size: var(--text-xs);
}
.xtyle-calendar--sm .xtyle-calendar__day {
	min-block-size: 2em;
}
.xtyle-calendar--lg {
	font-size: var(--text-body);
}
.xtyle-calendar--lg .xtyle-calendar__day {
	min-block-size: 2.5em;
}
${toneRules}
`.trim();
