interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface TextBindings {
	as?: string;
	size?: string;
	weight?: string;
	leading?: string;
	tone?: string;
	mono?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: TextBindings, ops: OpsBuilder) => void) => void };
};

function textClass(b: TextBindings): string {
	const size = b.size ?? "body";
	const weight = b.weight ?? "normal";
	const leading = b.leading ?? "snug";
	const tone = b.tone ?? "default";
	return [
		"xtyle-text",
		size !== "body" && `xtyle-text--${size}`,
		weight !== "normal" && `xtyle-text--${weight}`,
		leading !== "snug" && `xtyle-text--${leading}`,
		tone !== "default" && `xtyle-text--${tone}`,
		b.mono && "xtyle-text--mono",
	]
		.filter(Boolean)
		.join(" ");
}

function textHtml(b: TextBindings): string {
	const tag = b.as === "span" ? "span" : "p";
	return `<${tag} part="text" class="${textClass(b)}"><slot></slot></${tag}>`;
}

hooks.fragment.mount("text", (bindings, ops) => {
	ops.replaceChildren("[data-text]", textHtml(bindings));
});

hooks.fragment.update("text", (bindings, ops) => {
	ops.setAttr('[part="text"]', "class", textClass(bindings));
});
