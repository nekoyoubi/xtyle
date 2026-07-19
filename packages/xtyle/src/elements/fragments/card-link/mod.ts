import { escapeAttr } from "../escape.js";

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
	hasHeader?: boolean;
	hasFooter?: boolean;
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
	const attrs = [`href="${escapeAttr(href)}"`, target ? `target="${escapeAttr(target)}"` : "", rel ? `rel="${escapeAttr(rel)}"` : ""]
		.filter(Boolean)
		.join(" ");
	// Header/footer keep their `<slot>` whether filled or not, so `:empty` can never match them: a
	// slot is a child node, and the nodes assigned to it are not. Only the host knows, so it says.
	// `data-slot` rides alongside each native slot so the auto-light (Astro SSR) render, which has no
	// shadow root to read host children from, can still capture the region.
	const headerHidden = b.hasHeader ? "" : " hidden";
	const footerHidden = b.hasFooter ? "" : " hidden";
	return `<a part="card" class="${cardLinkClass(b)}" ${attrs}><div class="xtyle-card__header" part="header" data-slot="header"${headerHidden}><slot name="header"></slot></div><div class="xtyle-card__body" part="body" data-slot><slot></slot></div><div class="xtyle-card__footer" part="footer" data-slot="footer"${footerHidden}><slot name="footer"></slot></div></a>`;
}

hooks.fragment.mount("card-link", (bindings, ops) => {
	ops.replaceChildren("[data-card-link]", cardLinkHtml(bindings));
});

hooks.fragment.update("card-link", (bindings, ops) => {
	ops.setAttr(".xtyle-card", "class", cardLinkClass(bindings));
	ops.setAttr('[part="card"]', "href", bindings.href ?? "#");
});
