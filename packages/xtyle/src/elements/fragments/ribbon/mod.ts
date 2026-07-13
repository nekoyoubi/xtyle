interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface RibbonBindings {
	tone?: string;
	corner?: string;
	size?: string;
	variant?: string;
	color?: string;
	textColor?: string;
	label?: string;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: RibbonBindings, ops: OpsBuilder) => void) => void };
};

function esc(value: string): string {
	return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function ribbonClass(b: RibbonBindings): string {
	const corner = b.corner ?? "top-right";
	const size = b.size ?? "md";
	const variant = b.variant ?? "solid";
	return [
		"xtyle-ribbon",
		`xtyle-ribbon--${corner}`,
		size !== "md" && `xtyle-ribbon--${size}`,
		variant !== "solid" && `xtyle-ribbon--${variant}`,
		!b.color && b.tone && `xtyle-ribbon--${b.tone}`,
	]
		.filter(Boolean)
		.join(" ");
}

function ribbonStyle(b: RibbonBindings): string {
	return [b.color && `--rb-bg: ${b.color}`, b.textColor && `--rb-fg: ${b.textColor}`]
		.filter(Boolean)
		.join("; ");
}

function bandHtml(b: RibbonBindings): string {
	return `<span part="band" class="xtyle-ribbon__band">${esc(b.label ?? "")}</span>`;
}

function ribbonHtml(b: RibbonBindings): string {
	return `<span part="ribbon" class="${ribbonClass(b)}" style="${ribbonStyle(b)}">${bandHtml(b)}</span>`;
}

hooks.fragment.mount("ribbon", (bindings, ops) => {
	ops.replaceChildren("[data-ribbon]", ribbonHtml(bindings));
});

hooks.fragment.update("ribbon", (bindings, ops) => {
	ops.setAttr('[part="ribbon"]', "class", ribbonClass(bindings));
	ops.setAttr('[part="ribbon"]', "style", ribbonStyle(bindings));
	ops.replaceChildren('[part="ribbon"]', bandHtml(bindings));
});
