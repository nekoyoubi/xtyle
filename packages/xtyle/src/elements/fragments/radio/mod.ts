interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, text: string): void;
}

interface RadioBindings {
	tone?: string;
	size?: string;
	name?: string | null;
	value?: string;
	checked?: boolean;
	disabled?: boolean;
	invalid?: boolean;
	label?: string | null;
	labelledby?: string | null;
	description?: string | null;
	card?: boolean;
	descriptionId?: string;
}

interface EventPayload {
	checked?: boolean;
	disabled?: boolean;
	ariaDisabled?: string;
}

interface Intent {
	selectRadio?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: RadioBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

function escapeHtml(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(value: string): string {
	return escapeHtml(value).replace(/"/g, "&quot;");
}

function radioClass(b: RadioBindings): string {
	const tone = b.tone ?? "accent";
	const size = b.size ?? "md";
	return [
		"xtyle-radio",
		`xtyle-radio--${tone}`,
		size !== "md" && `xtyle-radio--${size}`,
		b.invalid && "xtyle-radio--invalid",
		b.card && "xtyle-radio--card",
	]
		.filter(Boolean)
		.join(" ");
}

function inner(b: RadioBindings): string {
	const name = b.name ?? null;
	const value = b.value ?? "on";
	const label = b.label ?? null;
	const labelledby = b.labelledby ?? null;
	const description = b.description ?? "";
	const descriptionId = b.descriptionId ?? "xtyle-radio-desc";
	const nameAttr = name !== null ? ` name="${name}"` : "";
	const valueAttr = ` value="${value}"`;
	const checkedAttr = b.checked ? " checked" : "";
	const disabledAttr = b.disabled ? " disabled" : "";
	const ariaInvalid = b.invalid ? ` aria-invalid="true"` : "";
	const ariaLabel = label && !labelledby ? ` aria-label="${label}"` : "";
	const ariaLabelledby = labelledby ? ` aria-labelledby="${labelledby}"` : "";
	const describedby = description.length > 0 ? ` aria-describedby="${escapeAttr(descriptionId)}"` : "";
	const descriptionHidden = description.length === 0 ? " hidden" : "";
	const labelText = label !== null ? label : "";
	return (
		`<input part="control" class="xtyle-radio__control" type="radio"` +
		`${nameAttr}${valueAttr}${checkedAttr}${disabledAttr}${ariaInvalid}${ariaLabel}${ariaLabelledby}${describedby} />` +
		`<span part="indicator" class="xtyle-radio__indicator" aria-hidden="true"></span>` +
		`<span class="xtyle-radio__text">` +
		`<span part="label" class="xtyle-radio__label"><slot>${labelText}</slot></span>` +
		`<span part="description" class="xtyle-radio__description" id="${escapeAttr(descriptionId)}"${descriptionHidden}>${escapeHtml(description)}</span>` +
		`</span>`
	);
}

hooks.fragment.mount("radio", (bindings, ops) => {
	ops.setAttr("[data-root]", "class", radioClass(bindings));
	ops.replaceChildren("[data-radio]", inner(bindings));
});

hooks.fragment.update("radio", (bindings, ops) => {
	ops.setAttr("[data-root]", "class", radioClass(bindings));
	ops.setAttr(".xtyle-radio__control", "value", bindings.value ?? "on");
});

xript.exports.register("select", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.disabled || e.ariaDisabled === "true") return {};
	if (e.checked === false) return {};
	return { selectRadio: true };
});
