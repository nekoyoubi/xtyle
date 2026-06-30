interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, value: string): void;
}

interface TooltipBindings {
	text?: string | null;
	placement?: string;
	contentId?: string;
	open?: boolean;
	tone?: string | null;
	variant?: string | null;
	mode?: string | null;
	size?: string | null;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: TooltipBindings, ops: OpsBuilder) => void) => void };
};

function tooltipClass(b: TooltipBindings): string {
	const cls = ["xoji-tooltip", `xoji-tooltip--${b.placement ?? "top"}`];
	if (b.tone) cls.push(`xoji-tooltip--${b.tone}`);
	if (b.variant === "soft" || b.variant === "solid") cls.push(`xoji-tooltip--${b.variant}`);
	if (b.mode === "rich") cls.push("xoji-tooltip--rich");
	if (b.size === "md") cls.push("xoji-tooltip--md");
	return cls.join(" ");
}

/** Set the bound tip text on its own node and leave the `content` slot untouched, so a hydration
 * `update` can't clobber the consumer's SSR-composed rich content (a panel-wide `replaceChildren`
 * would re-emit an inert light-DOM `<slot>` and drop it). Text and slot are mutually exclusive at
 * the call site; an empty `data-text` node in the slot case is inert. */
function textValue(b: TooltipBindings): string {
	return b.text ?? "";
}

hooks.fragment.mount("tooltip", (bindings, ops) => {
	ops.setAttr("[data-root]", "class", tooltipClass(bindings));
	ops.setAttr("[data-content]", "id", bindings.contentId ?? "");
	ops.setAttr("[data-content]", "data-open", String(bindings.open ?? false));
	ops.setText("[data-text]", textValue(bindings));
});

hooks.fragment.update("tooltip", (bindings, ops) => {
	ops.setAttr("[data-root]", "class", tooltipClass(bindings));
	ops.setAttr("[data-content]", "data-open", String(bindings.open ?? false));
	ops.setText("[data-text]", textValue(bindings));
});
