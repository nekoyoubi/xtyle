interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface CardBindings {
	overlay?: boolean;
	interactive?: boolean;
	action?: boolean;
	compact?: boolean;
	tone?: string | null;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: CardBindings, ops: OpsBuilder) => void) => void };
};

function cardClass(b: CardBindings): string {
	return [
		"xoji-card",
		b.overlay && "xoji-card--overlay",
		(b.interactive || b.action) && "xoji-card--interactive",
		b.action && "xoji-card--action",
		b.compact && "xoji-card--compact",
		b.tone && `xoji-card--${b.tone}`,
		b.tone && "xoji-card--toned",
	]
		.filter(Boolean)
		.join(" ");
}

function cardHtml(b: CardBindings): string {
	return (
		`<div part="card" class="${cardClass(b)}">` +
		'<div class="xoji-card__header" part="header"><slot name="header"></slot></div>' +
		'<div class="xoji-card__body" part="body"><slot></slot></div>' +
		'<div class="xoji-card__footer" part="footer"><slot name="footer"></slot></div>' +
		"</div>"
	);
}

hooks.fragment.mount("card", (bindings, ops) => {
	ops.replaceChildren("[data-card]", cardHtml(bindings));
});

hooks.fragment.update("card", (bindings, ops) => {
	ops.setAttr('[part="card"]', "class", cardClass(bindings));
});
