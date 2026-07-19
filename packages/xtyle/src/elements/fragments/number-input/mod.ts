import { escapeAttr, escapeHtml } from "../escape.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, text: string): void;
}

interface NumberInputBindings {
	value?: string;
	min?: number;
	max?: number;
	disabled?: boolean;
	size?: string;
	label?: string | null;
	labelledby?: string | null;
	placeholder?: string | null;
	elementId?: string;
	canDec?: boolean;
	canInc?: boolean;
}

interface EventPayload {
	value?: string;
	key?: string;
	disabled?: boolean;
	dataset?: Record<string, string>;
}

interface Intent {
	nudge?: 1 | -1;
	forceAlt?: boolean;
	commit?: string;
	preventDefault?: boolean;
}

declare const hooks: {
	fragment: {
		[k: string]: (id: string, handler: (bindings: NumberInputBindings, ops: OpsBuilder) => void) => void;
	};
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

function numberClass(b: NumberInputBindings): string {
	const size = b.size ?? "md";
	return ["xtyle-number", size !== "md" && `xtyle-number--${size}`, b.disabled && "xtyle-number--disabled"]
		.filter(Boolean)
		.join(" ");
}

function inner(b: NumberInputBindings): string {
	const value = b.value ?? "";
	const labelText = b.label ?? null;
	const labelledby = b.labelledby ?? null;
	const uid = b.elementId ?? "xtyle-number";
	const labelId = `${uid}-label`;
	const placeholder = b.placeholder ?? null;
	const nameAttr = labelledby
		? ` aria-labelledby="${escapeAttr(labelledby)}"`
		: labelText
			? ` aria-labelledby="${labelId}"`
			: "";
	const disabledAttr = b.disabled ? " disabled" : "";
	const minAttr = b.min !== undefined ? ` aria-valuemin="${b.min}"` : "";
	const maxAttr = b.max !== undefined ? ` aria-valuemax="${b.max}"` : "";
	const placeholderAttr = placeholder ? ` placeholder="${escapeAttr(placeholder)}"` : "";
	const decDisabled = b.disabled || b.canDec === false ? " disabled" : "";
	const incDisabled = b.disabled || b.canInc === false ? " disabled" : "";
	const label = labelText
		? `<span class="xtyle-number__label" part="label" id="${labelId}">${escapeHtml(labelText)}</span>`
		: "";

	return (
		`${label}<div class="xtyle-number__control" part="control">` +
		`<button class="xtyle-number__step xtyle-number__step--dec" part="step-down" type="button" tabindex="-1" aria-label="Decrease"${decDisabled}>&#8722;</button>` +
		`<input class="xtyle-number__input" part="input" type="text" inputmode="decimal" role="spinbutton" autocomplete="off" spellcheck="false" value="${escapeAttr(value)}"${placeholderAttr}${nameAttr}${minAttr}${maxAttr} aria-valuenow="${escapeAttr(value)}"${disabledAttr} />` +
		`<button class="xtyle-number__step xtyle-number__step--inc" part="step-up" type="button" tabindex="-1" aria-label="Increase"${incDisabled}>&#43;</button></div>`
	);
}

hooks.fragment.mount("number-input", (bindings, ops) => {
	ops.setAttr(".xtyle-number", "class", numberClass(bindings));
	ops.replaceChildren("[data-number]", inner(bindings));
});

hooks.fragment.update("number-input", (bindings, ops) => {
	ops.setAttr(".xtyle-number", "class", numberClass(bindings));
	const value = bindings.value ?? "";
	ops.setAttr(".xtyle-number__input", "value", value);
	ops.setAttr(".xtyle-number__input", "aria-valuenow", value);
});

xript.exports.register("dec", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.disabled) return {};
	return { nudge: -1 };
});

xript.exports.register("inc", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.disabled) return {};
	return { nudge: 1 };
});

xript.exports.register("commit", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.disabled) return {};
	return { commit: e.value ?? "" };
});

xript.exports.register("keydown", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.disabled) return {};
	switch (e.key) {
		case "ArrowUp":
			return { nudge: 1, preventDefault: true };
		case "ArrowDown":
			return { nudge: -1, preventDefault: true };
		case "PageUp":
			return { nudge: 1, forceAlt: true, preventDefault: true };
		case "PageDown":
			return { nudge: -1, forceAlt: true, preventDefault: true };
		case "Enter":
			return { commit: e.value ?? "" };
		default:
			return {};
	}
});
