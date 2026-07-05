interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface CardLinkBindings {
	href?: string | null;
	target?: string | null;
	rel?: string | null;
	interactive?: boolean;
	overlay?: boolean;
	compact?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: CardLinkBindings, ops: OpsBuilder) => void) => void };
};

function cardLinkClass(b: CardLinkBindings): string {
	return [
		"xtyle-card",
		"xtyle-card-link",
		b.overlay && "xtyle-card--overlay",
		b.interactive && "xtyle-card--interactive",
		b.compact && "xtyle-card--compact",
	]
		.filter(Boolean)
		.join(" ");
}

function cardLinkHtml(b: CardLinkBindings): string {
	const href = b.href ?? "#";
	const target = b.target ?? null;
	const rel = b.rel ?? null;
	const attrs = [`href="${href}"`, target ? `target="${target}"` : "", rel ? `rel="${rel}"` : ""]
		.filter(Boolean)
		.join(" ");
	return `<a part="card" class="${cardLinkClass(b)}" ${attrs}><div class="xtyle-card__header" part="header"><slot name="header"></slot></div><div class="xtyle-card__body" part="body"><slot></slot></div><div class="xtyle-card__footer" part="footer"><slot name="footer"></slot></div></a>`;
}

hooks.fragment.mount("card-link", (bindings, ops) => {
	ops.replaceChildren("[data-card-link]", cardLinkHtml(bindings));
});

hooks.fragment.update("card-link", (bindings, ops) => {
	ops.setAttr('[part="card"]', "class", cardLinkClass(bindings));
	ops.setAttr('[part="card"]', "href", bindings.href ?? "#");
});
