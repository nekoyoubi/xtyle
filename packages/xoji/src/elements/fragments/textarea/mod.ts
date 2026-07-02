interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, text: string): void;
	toggle(selector: string, condition: boolean): void;
}

interface TextareaBindings {
	fieldId?: string;
	errorId?: string;
	label?: string | null;
	error?: string | null;
	size?: string;
	resize?: string;
	invalid?: boolean;
	mono?: boolean;
}

interface EventPayload {
	value?: string;
}

interface Intent {
	emit?: { type: string; detail?: unknown };
	value?: string;
	commitValue?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: TextareaBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

const RESIZE_CLASS: Record<string, string> = {
	none: "xoji-textarea--resize-none",
	horizontal: "xoji-textarea--resize-horizontal",
	both: "xoji-textarea--resize-both",
};

function escapeHtml(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function rootClass(b: TextareaBindings): string {
	const size = b.size ?? "md";
	const resize = b.resize ?? "vertical";
	return [
		"xoji-textarea",
		b.invalid && "xoji-textarea--invalid",
		b.mono && "xoji-textarea--mono",
		size === "sm" && "xoji-textarea--sm",
		size === "lg" && "xoji-textarea--lg",
		RESIZE_CLASS[resize],
	]
		.filter(Boolean)
		.join(" ");
}

function inner(b: TextareaBindings): string {
	const fieldId = b.fieldId ?? "xoji-textarea";
	const errorId = b.errorId ?? `${fieldId}-error`;
	const labelText = b.label ?? "";
	const errorText = b.error ?? "";
	const labelHidden = labelText.length === 0 ? " hidden" : "";
	const errorHidden = errorText.length === 0 ? " hidden" : "";
	const ariaInvalid = b.invalid ? "true" : "false";
	const describedBy = errorText.length > 0 ? ` aria-describedby="${errorId}"` : "";

	return (
		`<label class="xoji-textarea__label" part="label" for="${fieldId}" data-label${labelHidden}>${escapeHtml(labelText)}</label>` +
		`<textarea class="xoji-control xoji-textarea__control" part="textarea control" id="${fieldId}" data-field aria-invalid="${ariaInvalid}"${describedBy}></textarea>` +
		`<span class="xoji-textarea__error" part="error" id="${errorId}" data-error${errorHidden}>${escapeHtml(errorText)}</span>`
	);
}

hooks.fragment.mount("textarea", (bindings, ops) => {
	ops.setAttr("[data-root]", "class", rootClass(bindings));
	ops.replaceChildren("[data-textarea]", inner(bindings));
});

hooks.fragment.update("textarea", (bindings, ops) => {
	ops.setAttr("[data-root]", "class", rootClass(bindings));
	ops.setAttr("[data-field]", "aria-invalid", String(bindings.invalid ?? false));

	const labelText = bindings.label ?? "";
	ops.setText("[data-label]", labelText);
	ops.toggle("[data-label]", labelText.length > 0);

	const errorText = bindings.error ?? "";
	ops.setText("[data-error]", errorText);
	ops.toggle("[data-error]", errorText.length > 0);
	const errorId = bindings.errorId ?? `${bindings.fieldId ?? "xoji-textarea"}-error`;
	ops.setAttr("[data-field]", "aria-describedby", errorText.length > 0 ? errorId : "");
});

xript.exports.register("onInput", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	return { value: e.value ?? "" };
});

xript.exports.register("onChange", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	return { value: e.value ?? "", commitValue: true, emit: { type: "change" } };
});
