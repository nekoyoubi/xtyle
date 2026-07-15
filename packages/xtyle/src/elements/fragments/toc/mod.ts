interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, value: string): void;
}

interface TocItem {
	id: string;
	label: string;
}

interface TocBindings {
	items?: TocItem[];
	label?: string;
	sticky?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: TocBindings, ops: OpsBuilder) => void) => void };
};

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function escapeAttr(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function tocClass(bindings: TocBindings): string {
	return ["xtyle-toc", bindings.sticky && "xtyle-toc--sticky"].filter(Boolean).join(" ");
}

function links(bindings: TocBindings): string {
	const items = bindings.items ?? [];
	return items
		.map(
			(item) =>
				`<li><a class="xtyle-toc__link" part="link" href="#${escapeAttr(item.id)}" data-toc-link="${escapeAttr(item.id)}">${escapeHtml(item.label)}</a></li>`,
		)
		.join("");
}

/** Build the whole list once — the expensive `replaceChildren` rebuild. */
hooks.fragment.mount("toc", (bindings, ops) => {
	const label = bindings.label ?? "On this page";
	ops.setAttr(".xtyle-toc", "class", tocClass(bindings));
	ops.setAttr("[data-root]", "aria-label", label);
	ops.setText("[data-label]", label);
	ops.replaceChildren("[data-list]", links(bindings));
});

/** A presentational change — patch the existing nodes, never rebuild the list. */
hooks.fragment.update("toc", (bindings, ops) => {
	const label = bindings.label ?? "On this page";
	ops.setAttr(".xtyle-toc", "class", tocClass(bindings));
	ops.setAttr("[data-root]", "aria-label", label);
	ops.setText("[data-label]", label);
});
