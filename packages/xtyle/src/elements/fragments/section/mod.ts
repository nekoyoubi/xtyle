import { escapeAttr, escapeHtml } from "../escape.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, value: string): void;
}

interface SectionBindings {
	as?: string;
	variant?: string;
	tone?: string;
	bordered?: boolean;
	padding?: string;
	label?: string | null;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: SectionBindings, ops: OpsBuilder) => void) => void };
};

function sectionClass(b: SectionBindings): string {
	const variant = b.variant ?? "band";
	const tone = b.tone ?? "plain";
	const padding = b.padding ?? "lg";
	const classes = ["xtyle-section"];
	if (variant === "stage") {
		classes.push("xtyle-section--stage");
		return classes.join(" ");
	}
	if (tone !== "plain") classes.push(`xtyle-section--${tone}`);
	if (b.bordered) {
		classes.push("xtyle-section--bordered");
		if (tone === "plain") classes.push("xtyle-section--plain");
	}
	if (padding !== "lg") classes.push(`xtyle-section--${padding}`);
	return classes.join(" ");
}

function hasStageLabel(b: SectionBindings): boolean {
	return (b.variant ?? "band") === "stage" && b.label != null && b.label !== "";
}

function isLandmarkTag(tag: string): boolean {
	return tag === "section" || tag === "header" || tag === "footer";
}

function sectionHtml(b: SectionBindings): string {
	const tag = b.as ?? "section";
	const label = hasStageLabel(b)
		? `<span part="label" class="xtyle-section__label">${escapeHtml(String(b.label))}</span>`
		: "";
	const named = isLandmarkTag(tag) && b.label != null && b.label !== "";
	const nameAttr = named ? ` aria-label="${escapeAttr(String(b.label))}"` : "";
	return `<${tag} part="section" class="${sectionClass(b)}"${nameAttr}>${label}<span class="xtyle-slot"><slot></slot></span></${tag}>`;
}

hooks.fragment.mount("section", (bindings, ops) => {
	ops.replaceChildren("[data-section]", sectionHtml(bindings));
});

hooks.fragment.update("section", (bindings, ops) => {
	ops.setAttr(".xtyle-section", "class", sectionClass(bindings));
	if (hasStageLabel(bindings)) ops.setText('[part="label"]', String(bindings.label));
	const tag = bindings.as ?? "section";
	const named = isLandmarkTag(tag) && bindings.label != null && bindings.label !== "";
	ops.setAttr('[part="section"]', "aria-label", named ? String(bindings.label) : "");
});
