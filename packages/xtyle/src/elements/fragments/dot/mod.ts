interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface DotBindings {
	tone?: string;
	size?: string;
	pulse?: string;
	ping?: boolean;
	glow?: boolean;
	color?: string;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: DotBindings, ops: OpsBuilder) => void) => void };
};

function dotClass(b: DotBindings): string {
	const size = b.size ?? "md";
	return [
		"xtyle-dot",
		size !== "md" && `xtyle-dot--${size}`,
		!b.color && b.tone && `xtyle-dot--${b.tone}`,
		b.pulse && `xtyle-dot--pulse-${b.pulse}`,
		b.ping && "xtyle-dot--ping",
		b.glow && "xtyle-dot--glow",
	]
		.filter(Boolean)
		.join(" ");
}

function dotStyle(b: DotBindings): string {
	return b.color ? `--dot-color: ${b.color}` : "";
}

function dotHtml(b: DotBindings): string {
	return `<span part="dot" class="${dotClass(b)}" style="${dotStyle(b)}" aria-hidden="true"></span>`;
}

hooks.fragment.mount("dot", (bindings, ops) => {
	ops.replaceChildren("[data-dot]", dotHtml(bindings));
});

hooks.fragment.update("dot", (bindings, ops) => {
	ops.setAttr('[part="dot"]', "class", dotClass(bindings));
	ops.setAttr('[part="dot"]', "style", dotStyle(bindings));
});
