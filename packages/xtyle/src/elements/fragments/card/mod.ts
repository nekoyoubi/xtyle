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
	depthStrength?: string | null;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: CardBindings, ops: OpsBuilder) => void) => void };
};

function cardClass(b: CardBindings): string {
	return [
		"xtyle-card",
		b.overlay && "xtyle-card--overlay",
		(b.interactive || b.action) && "xtyle-card--interactive",
		b.action && "xtyle-card--action",
		b.compact && "xtyle-card--compact",
		b.depthStrength && `xtyle-card--depth-${b.depthStrength}`,
		b.tone && `xtyle-card--${b.tone}`,
		b.tone && "xtyle-card--toned",
	]
		.filter(Boolean)
		.join(" ");
}

function cardHtml(b: CardBindings): string {
	return (
		`<div part="card" class="${cardClass(b)}">` +
		'<div class="xtyle-card__header" part="header"><slot name="header"></slot></div>' +
		'<div class="xtyle-card__body" part="body"><slot></slot></div>' +
		'<div class="xtyle-card__footer" part="footer"><slot name="footer"></slot></div>' +
		"</div>"
	);
}

hooks.fragment.mount("card", (bindings, ops) => {
	ops.replaceChildren("[data-card]", cardHtml(bindings));
});

hooks.fragment.update("card", (bindings, ops) => {
	ops.setAttr('[part="card"]', "class", cardClass(bindings));
});
