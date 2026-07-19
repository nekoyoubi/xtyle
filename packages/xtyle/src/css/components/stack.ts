const GAPS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
const ALIGN = ["start", "center", "end", "stretch", "baseline"] as const;
const JUSTIFY = ["start", "center", "end", "between", "around", "evenly"] as const;

const ALIGN_VALUE: Record<(typeof ALIGN)[number], string> = {
	start: "flex-start",
	center: "center",
	end: "flex-end",
	stretch: "stretch",
	baseline: "baseline",
};
const JUSTIFY_VALUE: Record<(typeof JUSTIFY)[number], string> = {
	start: "flex-start",
	center: "center",
	end: "flex-end",
	between: "space-between",
	around: "space-around",
	evenly: "space-evenly",
};

const gapRules = GAPS.map((g) => `.xtyle-stack--gap-${g} { gap: var(--space-${g}); }`).join("\n");
const alignRules = ALIGN.map((a) => `.xtyle-stack--align-${a} { align-items: ${ALIGN_VALUE[a]}; }`).join("\n");
const justifyRules = JUSTIFY.map((j) => `.xtyle-stack--justify-${j} { justify-content: ${JUSTIFY_VALUE[j]}; }`).join("\n");

export const stackCss = `
[data-root][data-stack] { display: contents; }
.xtyle-stack {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}
.xtyle-stack--inline {
	display: inline-flex;
}
${gapRules}
${alignRules}
${justifyRules}
`.trim();
