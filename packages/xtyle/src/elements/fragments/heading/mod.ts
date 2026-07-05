interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface HeadingBindings {
	level?: number;
	size?: string;
	tone?: string;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: HeadingBindings, ops: OpsBuilder) => void) => void };
};

function headingClass(b: HeadingBindings): string {
	const size = b.size ?? "body";
	const tone = b.tone ?? "default";
	return [
		"xtyle-heading",
		size !== "body" && `xtyle-heading--${size}`,
		tone !== "default" && `xtyle-heading--${tone}`,
	]
		.filter(Boolean)
		.join(" ");
}

function headingHtml(b: HeadingBindings): string {
	const raw = b.level ?? 2;
	const level = raw >= 1 && raw <= 6 ? raw : 2;
	const tag = `h${level}`;
	return `<${tag} part="heading" class="${headingClass(b)}"><slot></slot></${tag}>`;
}

hooks.fragment.mount("heading", (bindings, ops) => {
	ops.replaceChildren("[data-heading]", headingHtml(bindings));
});

hooks.fragment.update("heading", (bindings, ops) => {
	ops.setAttr('[part="heading"]', "class", headingClass(bindings));
});
