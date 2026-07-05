import { FULL_TONES as TONES } from "../../vocab.js";

const toneRules = TONES.map(
	(t) => `.xoji-pagination--${t} .xoji-pagination__page--current {
	background: var(--${t});
	color: var(--${t}-fg);
}`,
).join("\n");

export const paginationCss = `
.xoji-pagination {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: center;
	gap: var(--space-1);
	font-family: var(--font-sans);
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
	color: var(--fg-2);
}
.xoji-pagination__list {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: var(--space-1);
	margin: 0;
	padding: 0;
	list-style: none;
}
.xoji-pagination__item {
	display: inline-flex;
}
.xoji-pagination__page,
.xoji-pagination__control {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: max(2em, 1.75rem);
	min-height: max(2em, 1.75rem);
	padding: var(--space-0) var(--space-1);
	color: var(--fg-1);
	background: transparent;
	border: var(--border-thin) solid transparent;
	border-radius: var(--radius-sm);
	font: inherit;
	text-decoration: none;
	cursor: pointer;
	transition:
		color var(--duration-fast) var(--ease-standard),
		background var(--duration-fast) var(--ease-standard),
		box-shadow var(--duration-fast) var(--ease-standard);
}
.xoji-pagination__control svg {
	width: 1em;
	height: 1em;
}
.xoji-pagination__page:hover,
.xoji-pagination__control:hover {
	background: var(--bg-2);
}
.xoji-pagination__page:focus-visible,
.xoji-pagination__control:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xoji-pagination__page--current {
	background: var(--accent);
	color: var(--accent-fg);
	font-weight: var(--weight-medium);
	cursor: default;
}
@container style(--selection-cue: marker) {
	.xoji-pagination__page--current {
		position: relative;
	}
	.xoji-pagination__page--current::after {
		content: "";
		position: absolute;
		inset-inline: 30%;
		inset-block-end: 15%;
		block-size: var(--border-thick);
		background: var(--accent-fg);
		border-radius: var(--radius-sm);
	}
}
${toneRules}
.xoji-pagination__control[aria-disabled="true"] {
	color: var(--fg-3);
	cursor: default;
	pointer-events: none;
}
.xoji-pagination__ellipsis {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: max(2em, 1.75rem);
	min-height: max(2em, 1.75rem);
	color: var(--fg-3);
	user-select: none;
}
.xoji-pagination--sm {
	font-size: var(--text-xs);
}
.xoji-pagination--lg {
	font-size: var(--text-body);
}
`.trim();
