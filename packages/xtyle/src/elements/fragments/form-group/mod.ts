interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	toggle(selector: string, condition: boolean): void;
	addClass(selector: string, className: string): void;
	removeClass(selector: string, className: string): void;
	setText(selector: string, value: string): void;
}

interface FormGroupBindings {
	label?: string;
	description?: string;
	error?: string;
	size?: string;
	invalid?: boolean;
	required?: boolean;
	hasFor?: boolean;
	controlTarget?: string;
	labelId?: string;
	descriptionId?: string;
	errorId?: string;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: FormGroupBindings, ops: OpsBuilder) => void) => void };
};

function escape(text: string): string {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function groupClass(b: FormGroupBindings): string {
	const size = b.size ?? "md";
	return ["xtyle-form-group", b.invalid && "xtyle-form-group--invalid", size !== "md" && `xtyle-form-group--${size}`]
		.filter(Boolean)
		.join(" ");
}

function inner(b: FormGroupBindings): string {
	const label = b.label ?? "";
	const description = b.description ?? "";
	const error = b.error ?? "";
	const invalid = b.invalid === true;
	const required = b.required === true;
	const labelFor = b.hasFor ? ` for="${b.controlTarget ?? ""}"` : "";
	const labelHidden = label.length === 0 ? " hidden" : "";
	const requiredHidden = required ? "" : " hidden";
	const descriptionHidden = description.length === 0 ? " hidden" : "";
	const errorHidden = !invalid || error.length === 0 ? " hidden" : "";
	return (
		`<label class="xtyle-form-group__label" part="label" data-label id="${b.labelId ?? ""}"${labelFor}${labelHidden}>` +
		`<span data-label-text>${escape(label)}</span>` +
		`<span class="xtyle-form-group__required" part="required-indicator" data-required aria-hidden="true"${requiredHidden}>*</span>` +
		`</label>` +
		`<span class="xtyle-form-group__description" part="description" data-description id="${b.descriptionId ?? ""}"${descriptionHidden}>${escape(description)}</span>` +
		`<div class="xtyle-form-group__control" part="control"><slot></slot></div>` +
		`<span class="xtyle-form-group__error" part="error" data-error id="${b.errorId ?? ""}" role="alert"${errorHidden}>${escape(error)}</span>`
	);
}

hooks.fragment.mount("form-group", (bindings, ops) => {
	ops.setAttr(".xtyle-form-group", "class", groupClass(bindings));
	ops.replaceChildren("[data-group]", inner(bindings));
});

hooks.fragment.update("form-group", (bindings, ops) => {
	const label = bindings.label ?? "";
	const description = bindings.description ?? "";
	const error = bindings.error ?? "";
	const invalid = bindings.invalid === true;
	const required = bindings.required === true;

	ops.setAttr(".xtyle-form-group", "class", groupClass(bindings));

	ops.setText("[data-label-text]", label);
	ops.toggle("[data-label]", label.length > 0);
	ops.toggle("[data-required]", required);
	if (bindings.hasFor) ops.setAttr("[data-label]", "for", bindings.controlTarget ?? "");

	ops.setText("[data-description]", description);
	ops.toggle("[data-description]", description.length > 0);

	ops.setText("[data-error]", error);
	ops.toggle("[data-error]", invalid && error.length > 0);
});
