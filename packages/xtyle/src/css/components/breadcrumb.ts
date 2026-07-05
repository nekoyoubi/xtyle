import { FULL_TONES } from "../../vocab.js";

const toneRules = FULL_TONES.map(
	(t) => `.xtyle-breadcrumb--${t} .xtyle-breadcrumb__link {
	color: var(--${t}-vivid);
}`,
).join("\n");

export const breadcrumbCss = `
.xtyle-breadcrumb {
	font-family: var(--font-sans);
	font-size: var(--text-sm);
	line-height: var(--leading-normal);
	color: var(--fg-2);
}
.xtyle-breadcrumb__list {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: var(--space-1);
	margin: 0;
	padding: 0;
	list-style: none;
}
.xtyle-breadcrumb__item {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
}
.xtyle-breadcrumb__link {
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
button.xtyle-breadcrumb__link {
	background: none;
	border: 0;
	margin: 0;
	font: inherit;
	cursor: pointer;
}
${toneRules}
.xtyle-breadcrumb__link:hover {
	text-decoration: underline;
}
.xtyle-breadcrumb__link:focus-visible {
	outline: var(--border-normal) solid transparent;
	box-shadow: 0 0 0 var(--border-thick) var(--ring);
}
.xtyle-breadcrumb__current {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
	padding: var(--space-0) var(--space-1);
	color: var(--fg-0);
	font-weight: var(--weight-medium);
}
.xtyle-breadcrumb__separator {
	display: inline-flex;
	align-items: center;
	color: var(--fg-3);
	user-select: none;
}
.xtyle-breadcrumb__separator svg {
	width: 1em;
	height: 1em;
}
.xtyle-breadcrumb--sm {
	font-size: var(--text-xs);
}
.xtyle-breadcrumb--lg {
	font-size: var(--text-body);
}
::slotted(.xtyle-breadcrumb__item) {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
}
::slotted(.xtyle-breadcrumb__separator) {
	display: inline-flex;
	align-items: center;
	color: var(--fg-3);
	user-select: none;
}
`.trim();
