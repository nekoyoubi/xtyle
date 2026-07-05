interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface EyebrowBindings {
	as?: string;
	tone?: string;
	tracking?: string;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: EyebrowBindings, ops: OpsBuilder) => void) => void };
};

function eyebrowClass(b: EyebrowBindings): string {
	const tone = b.tone ?? "accent";
	const tracking = b.tracking ?? "normal";
	return ["xtyle-eyebrow", tone !== "accent" && `xtyle-eyebrow--${tone}`, tracking === "wide" && "xtyle-eyebrow--wide"]
		.filter(Boolean)
		.join(" ");
}

function eyebrowHtml(b: EyebrowBindings): string {
	const as = b.as ?? "p";
	const tag = as === "span" ? "span" : as === "div" ? "div" : "p";
	return `<${tag} part="eyebrow" class="${eyebrowClass(b)}"><slot></slot></${tag}>`;
}

hooks.fragment.mount("eyebrow", (bindings, ops) => {
	ops.replaceChildren("[data-eyebrow]", eyebrowHtml(bindings));
});

hooks.fragment.update("eyebrow", (bindings, ops) => {
	ops.setAttr('[part="eyebrow"]', "class", eyebrowClass(bindings));
});
