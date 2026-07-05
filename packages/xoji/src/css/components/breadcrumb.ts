import { FULL_TONES } from "../../vocab.js";

const toneRules = FULL_TONES.map(
	(t) => `.xoji-breadcrumb--${t} .xoji-breadcrumb__link {
	color: var(--${t}-vivid);
}`,
).join("\n");

export const breadcrumbCss = `
.xoji-breadcrumb {
	font-family: var(--font-sans);
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
	color: var(--fg-2);
}
.xoji-breadcrumb__list {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: var(--space-1);
	margin: 0;
	padding: 0;
	list-style: none;
}
.xoji-breadcrumb__item {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
}
.xoji-breadcrumb__link {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
	color: var(--accent-vivid);
	text-decoration: none;
	border-radius: var(--radius-sm);
	padding: var(--space-0) var(--space-1);
	transition:
		color var(--duration-fast) var(--ease-standard),
		box-shadow var(--duration-fast) var(--ease-standard);
}
button.xoji-breadcrumb__link {
	background: none;
	border: 0;
	margin: 0;
	font: inherit;
	cursor: pointer;
}
${toneRules}
.xoji-breadcrumb__link:hover {
	text-decoration: underline;
}
.xoji-breadcrumb__link:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xoji-breadcrumb__current {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
	padding: var(--space-0) var(--space-1);
	color: var(--fg-0);
	font-weight: var(--weight-medium);
}
.xoji-breadcrumb__separator {
	display: inline-flex;
	align-items: center;
	color: var(--fg-3);
	user-select: none;
}
.xoji-breadcrumb__separator svg {
	width: 1em;
	height: 1em;
}
.xoji-breadcrumb--sm {
	font-size: var(--text-xs);
}
.xoji-breadcrumb--lg {
	font-size: var(--text-body);
}
::slotted(.xoji-breadcrumb__item) {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
}
::slotted(.xoji-breadcrumb__separator) {
	display: inline-flex;
	align-items: center;
	color: var(--fg-3);
	user-select: none;
}
`.trim();
