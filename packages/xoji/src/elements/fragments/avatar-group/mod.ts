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

const AMP = /&/g;
const LT = /</g;
const GT = />/g;
const QUOT = /"/g;

function esc(value: string): string {
	return value.replace(AMP, "&amp;").replace(LT, "&lt;").replace(GT, "&gt;").replace(QUOT, "&quot;");
}

function groupClass(b: AvatarGroupBindings): string {
	const size = b.size === "sm" || b.size === "lg" || b.size === "xl" ? b.size : "md";
	const spacing = b.spacing === "snug" || b.spacing === "loose" ? b.spacing : "normal";
	return [
		"xoji-avatar-group",
		size !== "md" && `xoji-avatar-group--${size}`,
		spacing !== "normal" && `xoji-avatar-group--${spacing}`,
	]
		.filter(Boolean)
		.join(" ");
}

function overflowMarkup(b: AvatarGroupBindings): string {
	const n = Math.trunc(Number(b.overflow));
	if (!Number.isFinite(n) || n <= 0) return "";
	return `<span class="xoji-avatar-group__overflow" part="overflow" role="img" aria-label="${esc(`${n} more`)}">+${n}</span>`;
}

function groupHtml(b: AvatarGroupBindings): string {
	const label = b.label ? ` aria-label="${esc(b.label)}"` : "";
	return `<div part="group" class="${groupClass(b)}" role="group"${label}><slot></slot>${overflowMarkup(b)}</div>`;
}

hooks.fragment.mount("avatar-group", (bindings, ops) => {
	ops.replaceChildren("[data-avatar-group]", groupHtml(bindings));
});

// Update only re-classes the row (which re-sizes the chip via CSS); rebuilding the children would
// blow away the adopted light-DOM avatars, since a bare `<slot>` projects nothing without a shadow
// root. The `+N` chip is seeded at mount / SSR from the explicit `overflow`.
hooks.fragment.update("avatar-group", (bindings, ops) => {
	ops.setAttr('[part="group"]', "class", groupClass(bindings));
});
