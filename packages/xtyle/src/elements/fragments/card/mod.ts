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
	hasHeader?: boolean;
	hasFooter?: boolean;
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
	// INFO: :empty never matches a region holding a <slot> (the slot is a child, assigned nodes are
	// not), and the Astro SSR render has no shadow root, so data-slot markers make regions capturable
	const headerHidden = b.hasHeader ? "" : " hidden";
	const footerHidden = b.hasFooter ? "" : " hidden";
	return (
		`<div part="card" class="${cardClass(b)}">` +
		`<div class="xtyle-card__header" part="header" data-slot="header"${headerHidden}><slot name="header"></slot></div>` +
		'<div class="xtyle-card__body" part="body" data-slot><slot></slot></div>' +
		`<div class="xtyle-card__footer" part="footer" data-slot="footer"${footerHidden}><slot name="footer"></slot></div>` +
		"</div>"
	);
}

hooks.fragment.mount("card", (bindings, ops) => {
	ops.replaceChildren("[data-card]", cardHtml(bindings));
});

hooks.fragment.update("card", (bindings, ops) => {
	ops.setAttr(".xtyle-card", "class", cardClass(bindings));
});
