interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, text: string): void;
}

interface PopoverBindings {
	panelId?: string;
	hasTrigger?: boolean;
	arrow?: boolean;
	modal?: boolean;
	flush?: boolean;
	panelRole?: string;
	label?: string | null;
	labelledby?: string | null;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: PopoverBindings, ops: OpsBuilder) => void) => void };
};

function rootClass(b: PopoverBindings): string {
	return b.flush ? "xtyle-popover xtyle-popover--flush" : "xtyle-popover";
}

/** Every op an `update` can also apply — the popover's chrome is all attribute state, so mount and
 * update share one body and a re-render never rebuilds the panel out from under an open popover. */
function paint(b: PopoverBindings, ops: OpsBuilder): void {
	const panelId = b.panelId ?? "xtyle-popover-panel";
	const modal = b.modal ?? false;
	ops.setAttr(".xtyle-popover", "class", rootClass(b));
	ops.setAttr("[data-trigger]", "hidden", b.hasTrigger ? "" : "hidden");
	ops.setAttr("[data-arrow]", "hidden", b.arrow ? "" : "hidden");
	ops.setAttr("[data-surface]", "id", panelId);
	ops.setAttr("[data-surface]", "role", b.panelRole ?? "dialog");
	ops.setAttr("[data-surface]", "data-modal", modal ? "true" : "");
	ops.setAttr("[data-surface]", "aria-modal", modal ? "true" : "");
	ops.setAttr("[data-surface]", "aria-label", b.label ?? "");
	ops.setAttr("[data-surface]", "aria-labelledby", b.labelledby ?? "");
}

hooks.fragment.mount("popover", (bindings, ops) => {
	paint(bindings, ops);
});

hooks.fragment.update("popover", (bindings, ops) => {
	paint(bindings, ops);
});
