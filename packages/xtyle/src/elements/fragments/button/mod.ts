import { escapeAttr } from "../escape.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface ButtonBindings {
	variant?: string;
	tone?: string;
	size?: string;
	align?: string;
	type?: string;
	href?: string | null;
	disabled?: boolean;
	loading?: boolean;
	block?: boolean;
	iconOnly?: boolean;
	pressed?: boolean | null;
	selected?: boolean | null;
	ariaLabel?: string | null;
	ariaLabelledby?: string | null;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: ButtonBindings, ops: OpsBuilder) => void) => void };
};

function buttonClass(b: ButtonBindings): string {
	const variant = b.variant ?? "solid";
	const tone = b.tone ?? "accent";
	const size = b.size ?? "md";
	const align = b.align ?? "center";
	return [
		"xtyle-button",
		`xtyle-button--${variant}`,
		`xtyle-button--${tone}`,
		size !== "md" && `xtyle-button--${size}`,
		align !== "center" && `xtyle-button--align-${align}`,
		b.block && "xtyle-button--block",
		b.iconOnly && "xtyle-button--icon",
		b.loading && "xtyle-button--loading",
	]
		.filter(Boolean)
		.join(" ");
}

function inner(b: ButtonBindings): string {
	const spinner = b.loading ? '<span class="xtyle-button__spinner" part="spinner" aria-hidden="true"></span>' : "";
	return (
		'<span class="xtyle-button__icon" part="icon-start"><slot name="icon-start"></slot></span>' +
		'<span class="xtyle-button__label" part="label"><slot></slot></span>' +
		'<span class="xtyle-button__icon" part="icon-end"><slot name="icon-end"></slot></span>' +
		spinner
	);
}

function buttonHtml(b: ButtonBindings): string {
	const blocked = (b.disabled ?? false) || (b.loading ?? false);
	const pressed = b.pressed ?? null;
	const ariaPressed = pressed === null ? "" : ` aria-pressed="${String(pressed)}"`;
	const selected = b.selected ?? null;
	const ariaCurrent = selected ? ' aria-current="true"' : "";
	const name = b.ariaLabelledby
		? ` aria-labelledby="${escapeAttr(b.ariaLabelledby)}"`
		: b.ariaLabel
			? ` aria-label="${escapeAttr(b.ariaLabel)}"`
			: "";
	const body = inner(b);
	if (b.href != null) {
		const hrefAttr = blocked ? "" : ` href="${escapeAttr(b.href)}"`;
		const ariaDisabled = blocked ? ' aria-disabled="true"' : "";
		const ariaBusy = b.loading ? ' aria-busy="true"' : "";
		return `<a part="button" class="${buttonClass(b)}"${hrefAttr}${ariaDisabled}${ariaBusy}${ariaPressed}${ariaCurrent}${name} role="button">${body}</a>`;
	}
	const disabledAttr = blocked ? " disabled" : "";
	const ariaBusy = b.loading ? ' aria-busy="true"' : "";
	const type = b.type ?? "button";
	return `<button part="button" class="${buttonClass(b)}" type="${escapeAttr(type)}"${disabledAttr}${ariaBusy}${ariaPressed}${ariaCurrent}${name}>${body}</button>`;
}

hooks.fragment.mount("button", (bindings, ops) => {
	ops.replaceChildren("[data-button]", buttonHtml(bindings));
});

hooks.fragment.update("button", (bindings, ops) => {
	ops.setAttr(".xtyle-button", "class", buttonClass(bindings));
	if (bindings.pressed != null) ops.setAttr('[part="button"]', "aria-pressed", String(bindings.pressed));
	if (bindings.selected != null) ops.setAttr('[part="button"]', "aria-current", bindings.selected ? "true" : "false");
});
