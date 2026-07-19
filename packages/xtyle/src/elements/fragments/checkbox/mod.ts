import { escapeAttr } from "../escape.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface CheckboxBindings {
	checked?: boolean;
	indeterminate?: boolean;
	disabled?: boolean;
	size?: string;
	tone?: string;
	label?: string | null;
	labelledby?: string | null;
}

interface EventPayload {
	checked?: boolean;
	disabled?: boolean;
}

interface Intent {
	setChecked?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: CheckboxBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

const INDICATOR =
	`<span class="xtyle-checkbox__indicator" part="indicator" aria-hidden="true">` +
	`<svg viewBox="0 0 16 16" width="16" height="16">` +
	`<path class="xtyle-checkbox__check" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m4 8 3 3 5-6" />` +
	`<path class="xtyle-checkbox__dash" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M4 8h8" />` +
	`</svg></span>`;

function checkboxClass(b: CheckboxBindings): string {
	const size = b.size ?? "md";
	const tone = b.tone ?? "accent";
	return [
		"xtyle-checkbox",
		`xtyle-checkbox--${tone}`,
		size !== "md" && `xtyle-checkbox--${size}`,
		b.indeterminate && "xtyle-checkbox--indeterminate",
	]
		.filter(Boolean)
		.join(" ");
}

function inner(b: CheckboxBindings): string {
	const label = b.label ?? null;
	const labelledby = b.labelledby ?? null;
	const checkedAttr = b.checked ? " checked" : "";
	const disabledAttr = b.disabled ? " disabled" : "";
	const ariaLabel = label && !labelledby ? ` aria-label="${escapeAttr(label)}"` : "";
	const ariaLabelledby = labelledby ? ` aria-labelledby="${escapeAttr(labelledby)}"` : "";
	const box =
		`<span class="xtyle-checkbox__box" part="box">` +
		`<input part="control" class="xtyle-checkbox__control" type="checkbox"${checkedAttr}${disabledAttr}${ariaLabel}${ariaLabelledby} />` +
		INDICATOR +
		`</span>`;
	const labelPart = `<span class="xtyle-checkbox__label" part="label"><slot></slot></span>`;
	return box + labelPart;
}

hooks.fragment.mount("checkbox", (bindings, ops) => {
	ops.setAttr(".xtyle-checkbox", "class", checkboxClass(bindings));
	ops.replaceChildren("[data-checkbox]", inner(bindings));
});

hooks.fragment.update("checkbox", (bindings, ops) => {
	ops.setAttr(".xtyle-checkbox", "class", checkboxClass(bindings));
});

xript.exports.register("toggle", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.disabled) return {};
	return { setChecked: e.checked === true };
});
