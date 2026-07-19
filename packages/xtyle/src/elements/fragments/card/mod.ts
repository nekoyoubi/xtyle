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
	// The header/footer keep their `<slot>` whether filled or not, so `:empty` can never match them:
	// a slot is a child node, and the nodes assigned to it are not. Only the host knows, so it says.
	// `data-slot` rides alongside each native slot: under the auto-light (Astro SSR) render there is
	// no shadow root to read host children from, so a region is only capturable by its marker.
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
