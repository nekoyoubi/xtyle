interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, text: string): void;
}

interface DetailRow {
	model: string;
	value: string;
}

interface SwatchBindings {
	color?: string | null;
	label?: string | null;
	value?: string | null;
	size?: string;
	interactive?: boolean;
	selected?: boolean;
	showsDetails?: boolean;
	detailRows?: DetailRow[];
	detailsId?: string;
}

interface EventPayload {
	disabled?: boolean;
	ariaDisabled?: string;
}

interface SelectContext {
	color?: string | null;
	label?: string | null;
	value?: string | null;
}

interface Intent {
	emit?: { type: string; detail?: unknown };
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: SwatchBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

function esc(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function swatchClass(b: SwatchBindings): string {
	const size = b.size ?? "md";
	return [
		"xtyle-swatch",
		size !== "md" && `xtyle-swatch--${size}`,
		b.interactive && "xtyle-swatch--interactive",
		b.selected && "xtyle-swatch--selected",
	]
		.filter(Boolean)
		.join(" ");
}

function detailsMarkup(b: SwatchBindings): string {
	if (!b.showsDetails) return "";
	const rows = (b.detailRows ?? [])
		.map(
			(row) =>
				`<span class="xtyle-swatch__detail-model" part="detail-model">${esc(row.model)}</span>` +
				`<span class="xtyle-swatch__detail-value" part="detail-value">${esc(row.value)}</span>`,
		)
		.join("");
	const id = b.detailsId ?? "xtyle-swatch-details";
	return `<span class="xtyle-swatch__details" part="details" id="${id}" role="tooltip">${rows}</span>`;
}

function bodyMarkup(b: SwatchBindings): string {
	const color = esc(b.color ?? "transparent");
	const dot = `<span class="xtyle-swatch__dot" part="dot" style="background:${color}" aria-hidden="true"></span>`;
	const label = b.label ? `<span class="xtyle-swatch__label" part="label">${esc(b.label)}</span>` : "";
	const value = b.value ? `<span class="xtyle-swatch__value" part="value">${esc(b.value)}</span>` : "";
	return `${dot}${label}${value}${detailsMarkup(b)}`;
}

function describedBy(b: SwatchBindings): string {
	return b.showsDetails ? ` aria-describedby="${b.detailsId ?? "xtyle-swatch-details"}"` : "";
}

function accessibleName(b: SwatchBindings): string | null | undefined {
	return b.label ?? b.value ?? b.color;
}

function inner(b: SwatchBindings): string {
	const body = bodyMarkup(b);
	if (!b.interactive) {
		const focusable = b.showsDetails ? ` tabindex="0"` : "";
		return `<span part="swatch" class="${swatchClass(b)}"${focusable}${describedBy(b)}>${body}</span>`;
	}
	const ariaPressed = ` aria-pressed="${String(!!b.selected)}"`;
	const name = accessibleName(b);
	const ariaLabel = !b.label && name ? ` aria-label="${esc(name)}"` : "";
	return `<button part="swatch" type="button" class="${swatchClass(b)}"${ariaPressed}${ariaLabel}${describedBy(b)}>${body}</button>`;
}

hooks.fragment.mount("swatch", (bindings, ops) => {
	ops.replaceChildren("[data-swatch]", inner(bindings));
});

hooks.fragment.update("swatch", (bindings, ops) => {
	ops.setAttr('[part="swatch"]', "class", swatchClass(bindings));
	if (bindings.interactive) ops.setAttr('[part="swatch"]', "aria-pressed", String(!!bindings.selected));
	ops.setAttr('[part="dot"]', "style", `background:${bindings.color ?? "transparent"}`);
	if (bindings.label) ops.setText('[part="label"]', bindings.label);
	if (bindings.value) ops.setText('[part="value"]', bindings.value);
	if (bindings.interactive && !bindings.label) {
		const name = accessibleName(bindings);
		if (name) ops.setAttr('[part="swatch"]', "aria-label", name);
	}
});

xript.exports.register("select", (payload: unknown, context: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.disabled || e.ariaDisabled === "true") return {};
	const ctx = (context ?? {}) as SelectContext;
	return {
		emit: {
			type: "select",
			detail: { color: ctx.color ?? null, label: ctx.label ?? null, value: ctx.value ?? null },
		},
	};
});
