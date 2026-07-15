interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, text: string): void;
}

interface SplitButtonBindings {
	variant?: string;
	tone?: string;
	size?: string;
	disabled?: boolean;
	loading?: boolean;
	block?: boolean;
	open?: boolean;
	type?: string;
	menuLabel?: string;
	itemsJson?: string;
}

interface EventPayload {
	key?: string;
	disabled?: boolean;
	ariaDisabled?: string;
}

interface Intent {
	toggleOpen?: boolean;
	openMenu?: "first" | "last";
	closeMenu?: boolean;
	preventDefault?: boolean;
	stopPropagation?: boolean;
}

declare const hooks: {
	fragment: {
		[k: string]: (id: string, handler: (bindings: SplitButtonBindings, ops: OpsBuilder) => void) => void;
	};
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

function buttonClasses(b: SplitButtonBindings, part: "primary" | "toggle"): string {
	const variant = b.variant ?? "solid";
	const tone = b.tone ?? "accent";
	const size = b.size ?? "md";
	return [
		"xtyle-button",
		`xtyle-button--${variant}`,
		`xtyle-button--${tone}`,
		size !== "md" && `xtyle-button--${size}`,
		b.loading && part === "primary" && "xtyle-button--loading",
		`xtyle-split-button__${part}`,
	]
		.filter(Boolean)
		.join(" ");
}

function rootClass(b: SplitButtonBindings): string {
	return [
		"xtyle-split-button",
		b.disabled && "xtyle-split-button--disabled",
		b.block && "xtyle-split-button--block",
		b.open && "xtyle-split-button--open",
	]
		.filter(Boolean)
		.join(" ");
}

/**
 * Two kinds of selector, and the split is the whole mod contract. A `class` is this fill's *own name* for a
 * node, so the paint keys its class ops to those: a mod that renamed the node matches none of them and keeps
 * its own skin. Everything else — the state a mod inherits precisely by keeping the `data-*` hooks it wires
 * its behavior through — stays keyed to the markers, so a reskinned caret still gets its `aria-expanded`.
 */
function paint(b: SplitButtonBindings, ops: OpsBuilder): void {
	const disabled = b.disabled === true;
	const loading = b.loading === true;
	ops.setAttr(".xtyle-split-button", "class", rootClass(b));
	ops.setAttr(".xtyle-split-button__primary", "class", buttonClasses(b, "primary"));
	ops.setAttr("[data-primary]", "type", b.type ?? "button");
	// a loading primary is not a pressable primary — the same block Button applies, so the click can't fire
	// twice while the first one is still in flight. The caret stays live: a running export is still cancellable
	// from its own menu.
	ops.setAttr("[data-primary]", "disabled", disabled || loading ? "disabled" : "");
	ops.setAttr("[data-primary]", "aria-busy", loading ? "true" : "");
	ops.setAttr("[data-busy]", "hidden", loading ? "" : "hidden");
	ops.setAttr(".xtyle-split-button__toggle", "class", buttonClasses(b, "toggle"));
	ops.setAttr("[data-toggle]", "disabled", disabled ? "disabled" : "");
	ops.setAttr("[data-toggle]", "aria-label", b.menuLabel ?? "More actions");
	ops.setAttr("[data-toggle]", "aria-expanded", b.open === true ? "true" : "false");
	ops.setAttr("[data-dropdown]", "items", b.itemsJson ?? "[]");
}

hooks.fragment.mount("split-button", (bindings, ops) => {
	paint(bindings, ops);
});

hooks.fragment.update("split-button", (bindings, ops) => {
	paint(bindings, ops);
});

xript.exports.register("toggleClick", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.disabled || e.ariaDisabled === "true") return {};
	// the caret's click never reaches a consumer's `click` listener, so the default action and the menu
	// stay two distinct paths
	return { toggleOpen: true, preventDefault: true, stopPropagation: true };
});

// the caret is a menu button, so the menu keys answer from either half of the group: a split button whose
// primary action is focused still drops its menu on ArrowDown, the way a real one does
xript.exports.register("groupKeydown", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	switch (e.key) {
		case "ArrowDown":
			return { openMenu: "first", preventDefault: true };
		case "ArrowUp":
			return { openMenu: "last", preventDefault: true };
		case "Escape":
			return { closeMenu: true };
		default:
			return {};
	}
});
