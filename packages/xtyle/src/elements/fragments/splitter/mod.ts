import { escapeAttr } from "../escape.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, text: string): void;
}

interface SplitterBindings {
	orientation?: string;
	size?: string;
	line?: boolean;
	value?: number;
	min?: number;
	max?: number;
	disabled?: boolean;
	label?: string | null;
	labelledby?: string | null;
}

interface EventPayload {
	key?: string;
	disabled?: boolean;
	ariaDisabled?: string;
}

interface NavContext {
	axisIsX: boolean;
	reversed: boolean;
}

interface Intent {
	nudge?: number;
	forceAlt?: boolean;
	jump?: "min" | "max";
	reset?: boolean;
	preventDefault?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: SplitterBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

function splitterClass(b: SplitterBindings): string {
	const orientation = b.orientation === "horizontal" ? "horizontal" : "vertical";
	const size = b.size ?? "md";
	return [
		"xtyle-splitter",
		`xtyle-splitter--${orientation}`,
		size !== "md" && `xtyle-splitter--${size}`,
		b.line && "xtyle-splitter--line",
		b.disabled && "xtyle-splitter--disabled",
	]
		.filter(Boolean)
		.join(" ");
}

function inner(b: SplitterBindings): string {
	const orientation = b.orientation === "horizontal" ? "horizontal" : "vertical";
	const name = b.labelledby ? ` aria-labelledby="${escapeAttr(b.labelledby)}"` : b.label ? ` aria-label="${escapeAttr(b.label)}"` : "";
	const disabled = b.disabled ? ` aria-disabled="true"` : "";
	const tabindex = b.disabled ? "" : ` tabindex="0"`;
	return (
		`<div part="splitter" class="${splitterClass(b)}" role="separator" aria-orientation="${escapeAttr(orientation)}" ` +
		`aria-valuenow="${b.value ?? 0}" aria-valuemin="${b.min ?? 0}" aria-valuemax="${b.max ?? 0}"${name}${disabled}${tabindex}>` +
		`<span class="xtyle-splitter__grip" part="grip" aria-hidden="true"></span></div>`
	);
}

hooks.fragment.mount("splitter", (bindings, ops) => {
	ops.replaceChildren("[data-splitter]", inner(bindings));
});

hooks.fragment.update("splitter", (bindings, ops) => {
	const orientation = bindings.orientation === "horizontal" ? "horizontal" : "vertical";
	ops.setAttr(".xtyle-splitter", "class", splitterClass(bindings));
	ops.setAttr(".xtyle-splitter", "aria-orientation", orientation);
	ops.setAttr(".xtyle-splitter", "aria-valuenow", String(bindings.value ?? 0));
	ops.setAttr(".xtyle-splitter", "aria-valuemin", String(bindings.min ?? 0));
	ops.setAttr(".xtyle-splitter", "aria-valuemax", String(bindings.max ?? 0));
});

xript.exports.register("keydown", (payload: unknown, context: unknown): Intent => {
	const e = payload as EventPayload;
	const ctx = context as NavContext;
	if (e.disabled || e.ariaDisabled === "true") return {};
	const sign = ctx.reversed ? -1 : 1;
	const grow = ctx.axisIsX ? "ArrowRight" : "ArrowDown";
	const shrink = ctx.axisIsX ? "ArrowLeft" : "ArrowUp";
	switch (e.key) {
		case grow:
			return { nudge: sign, preventDefault: true };
		case shrink:
			return { nudge: -sign, preventDefault: true };
		case "PageUp":
			return { nudge: sign, forceAlt: true, preventDefault: true };
		case "PageDown":
			return { nudge: -sign, forceAlt: true, preventDefault: true };
		case "Home":
			return { jump: "min", preventDefault: true };
		case "End":
			return { jump: "max", preventDefault: true };
		default:
			return {};
	}
});

xript.exports.register("reset", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.disabled || e.ariaDisabled === "true") return {};
	return { reset: true };
});
