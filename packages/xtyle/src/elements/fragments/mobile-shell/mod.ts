interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface MobileShellBindings {
	heading?: string;
	mainId?: string;
}

declare const hooks: {
	fragment: {
		[k: string]: (
			id: string,
			handler: (bindings: MobileShellBindings, ops: OpsBuilder) => void,
		) => void;
	};
};

function esc(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function titleText(b: MobileShellBindings): string {
	return b.heading ? esc(b.heading) : "";
}

/**
 * The frame: a sticky bar, one scrolling column, a bottom nav. The regions are the component's own
 * chrome (so a mod can reshape them) and the consumer's content arrives through the slots.
 */
function shellHtml(b: MobileShellBindings): string {
	const mainId = esc(b.mainId ?? "main");
	return (
		`<div class="xtyle-mshell" part="shell">` +
		`<header class="xtyle-mshell__bar" part="bar">` +
		`<span class="xtyle-mshell__lead" part="lead">` +
		`<slot name="brand"></slot>` +
		`<span class="xtyle-mshell__title" part="title" data-mshell-title>${titleText(b)}</span>` +
		`</span>` +
		`<span class="xtyle-mshell__actions" part="actions"><slot name="actions"></slot></span>` +
		`</header>` +
		// `tabindex="-1"` so a skip link (or the nav) can move focus into the column without making it
		// a tab stop of its own.
		`<main class="xtyle-mshell__content" part="content" id="${mainId}" tabindex="-1"><slot></slot></main>` +
		`<div class="xtyle-mshell__nav" part="nav" data-slot="nav"><slot name="nav"></slot></div>` +
		`</div>`
	);
}

function mount(bindings: MobileShellBindings, ops: OpsBuilder): void {
	ops.replaceChildren("[data-mobile-shell]", shellHtml(bindings));
}

// A non-destructive patch: it repaints the title and the main id, never the slot regions, so a live
// re-render can't discard the consumer's bar actions, content, or nav.
function patch(bindings: MobileShellBindings, ops: OpsBuilder): void {
	ops.replaceChildren("[data-mshell-title]", titleText(bindings));
	ops.setAttr('[part="content"]', "id", esc(bindings.mainId ?? "main"));
}

hooks.fragment.mount("mobile-shell", mount);
hooks.fragment.update("mobile-shell", patch);
