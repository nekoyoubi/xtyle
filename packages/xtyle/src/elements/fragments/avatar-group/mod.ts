import { escapeAttr } from "../escape.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface AvatarGroupBindings {
	size?: string | null;
	spacing?: string | null;
	overflow?: number;
	label?: string | null;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: AvatarGroupBindings, ops: OpsBuilder) => void) => void };
};

function groupClass(b: AvatarGroupBindings): string {
	const size = b.size === "sm" || b.size === "lg" || b.size === "xl" ? b.size : "md";
	const spacing = b.spacing === "snug" || b.spacing === "loose" ? b.spacing : "normal";
	return [
		"xtyle-avatar-group",
		size !== "md" && `xtyle-avatar-group--${size}`,
		spacing !== "normal" && `xtyle-avatar-group--${spacing}`,
	]
		.filter(Boolean)
		.join(" ");
}

function overflowMarkup(b: AvatarGroupBindings): string {
	const n = Math.trunc(Number(b.overflow));
	if (!Number.isFinite(n) || n <= 0) return "";
	return `<span class="xtyle-avatar-group__overflow" part="overflow" role="img" aria-label="${escapeAttr(`${n} more`)}">+${n}</span>`;
}

function groupHtml(b: AvatarGroupBindings): string {
	const label = b.label ? ` aria-label="${escapeAttr(b.label)}"` : "";
	return `<div part="group" class="${groupClass(b)}" role="group"${label}><slot></slot>${overflowMarkup(b)}</div>`;
}

hooks.fragment.mount("avatar-group", (bindings, ops) => {
	ops.replaceChildren("[data-avatar-group]", groupHtml(bindings));
});

// INFO: update only re-classes the row; rebuilding children would drop the adopted light-DOM avatars, since a bare <slot> projects nothing without a shadow root
hooks.fragment.update("avatar-group", (bindings, ops) => {
	ops.setAttr(".xtyle-avatar-group", "class", groupClass(bindings));
});
