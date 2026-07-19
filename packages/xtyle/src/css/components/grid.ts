const GAPS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
const COLUMNS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const ALIGN = ["start", "center", "end", "stretch"] as const;
const JUSTIFY = ["start", "center", "end", "stretch"] as const;

const ALIGN_VALUE: Record<(typeof ALIGN)[number], string> = {
	start: "start",
	center: "center",
	end: "end",
	stretch: "stretch",
};

const gapRules = GAPS.map((g) => `.xtyle-grid--gap-${g} { gap: var(--space-${g}); }`).join("\n");
const columnRules = COLUMNS.map(
	(c) => `.xtyle-grid--cols-${c} { grid-template-columns: repeat(${c}, minmax(0, 1fr)); }`,
).join("\n");
const columnTabletRules = COLUMNS.filter((c) => c >= 3)
	.map((c) => `.xtyle-grid--cols-${c} { grid-template-columns: repeat(2, minmax(0, 1fr)); }`)
	.join("\n");
const columnMobileRules = COLUMNS.filter((c) => c >= 2)
	.map((c) => `.xtyle-grid--cols-${c} { grid-template-columns: minmax(0, 1fr); }`)
	.join("\n");
const alignRules = ALIGN.map((a) => `.xtyle-grid--align-${a} { align-items: ${ALIGN_VALUE[a]}; }`).join("\n");
const justifyRules = JUSTIFY.map((j) => `.xtyle-grid--justify-${j} { justify-items: ${ALIGN_VALUE[j]}; }`).join("\n");

export const gridCss = `
[data-root][data-grid] { display: contents; }
.xtyle-grid {
	display: grid;
	grid-template-columns: repeat(12, minmax(0, 1fr));
	gap: var(--space-4);
}
.xtyle-grid--inline {
	display: inline-grid;
}
${gapRules}
${columnRules}
${alignRules}
${justifyRules}
@media (max-width: 60rem) {
${columnTabletRules}
}
@media (max-width: 40rem) {
${columnMobileRules}
}
`.trim();
