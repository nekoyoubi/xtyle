import { escapeAttr, escapeHtml } from "../escape.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, value: string): void;
}

interface DockBindings {
	side?: string;
	size?: string;
	tone?: string | null;
	reverseEdge?: boolean;
	edgeWidth?: string | null;
	nav?: boolean;
	label?: string | null;
	hasAriaLabel?: boolean;
	hideHeader?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: DockBindings, ops: OpsBuilder) => void) => void };
};

function dockClass(b: DockBindings): string {
	const size = b.size ?? "md";
	return [
		"xtyle-dock",
		b.side === "right" && "xtyle-dock--right",
		size !== "md" && `xtyle-dock--${size}`,
		b.tone && `xtyle-dock--${b.tone}`,
		b.reverseEdge && "xtyle-dock--edge-out",
		b.edgeWidth && `xtyle-dock--edge-${b.edgeWidth}`,
	]
		.filter(Boolean)
		.join(" ");
}

function dockInner(b: DockBindings): string {
	const header =
		b.label && !b.hideHeader
			? `<div class="xtyle-dock__header" part="header"><slot name="header">${escapeHtml(b.label)}</slot></div>`
			: `<slot name="header"></slot>`;
	return `${header}<div class="xtyle-dock__body" part="body"><slot></slot></div><slot name="footer"></slot>`;
}

function dockHtml(b: DockBindings): string {
	const tag = b.nav ? "nav" : "aside";
	const label = b.label ?? null;
	const labelAttr = label && !b.hasAriaLabel ? ` aria-label="${escapeAttr(label)}"` : "";
	return `<${tag} part="dock" class="${dockClass(b)}"${labelAttr}>${dockInner(b)}</${tag}>`;
}

hooks.fragment.mount("dock", (bindings, ops) => {
	ops.replaceChildren("[data-dock]", dockHtml(bindings));
});

hooks.fragment.update("dock", (bindings, ops) => {
	ops.setAttr(".xtyle-dock", "class", dockClass(bindings));
	const label = bindings.label ?? null;
	if (label && !bindings.hideHeader) {
		ops.setText('slot[name="header"]', label);
	}
	if (label && !bindings.hasAriaLabel) {
		ops.setAttr('[part="dock"]', "aria-label", label);
	}
});
