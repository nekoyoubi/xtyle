import { escapeAttr } from "../escape.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, value: string): void;
}

interface TocItem {
	id: string;
	label: string;
	level?: number;
}

interface TocBindings {
	items?: TocItem[];
	label?: string;
	sticky?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: TocBindings, ops: OpsBuilder) => void) => void };
};

function tocClass(bindings: TocBindings): string {
	return ["xtyle-toc", bindings.sticky && "xtyle-toc--sticky"].filter(Boolean).join(" ");
}

function link(item: TocItem): string {
	return `<a class="xtyle-toc__link" part="link" href="#${escapeAttr(item.id)}" data-toc-link="${escapeAttr(item.id)}">${escapeAttr(item.label)}</a>`;
}

/**
 * Build the outline as nested lists, so the hierarchy is real to a screen reader rather than an
 * indent. A `level` more than one step deeper than its predecessor is treated as one step: heading
 * sources skip depths freely (an `h2` followed by an `h4`), and a list cannot nest into a level that
 * has no parent.
 */
function links(bindings: TocBindings): string {
	const items = bindings.items ?? [];
	let out = "";
	let depth = 1;
	let open = false;

	for (const item of items) {
		const raw = Math.trunc(Number(item.level));
		const wanted = Number.isFinite(raw) && raw >= 1 ? raw : 1;
		const level = open ? Math.min(wanted, depth + 1) : 1;

		if (open && level > depth) {
			out += `<ul class="xtyle-toc__list xtyle-toc__list--nested" role="list" data-level="${level}">`;
		} else {
			if (open) out += "</li>";
			for (; depth > level; depth--) out += "</ul></li>";
		}
		depth = level;
		out += `<li>${link(item)}`;
		open = true;
	}

	if (open) out += "</li>";
	for (; depth > 1; depth--) out += "</ul></li>";
	return out;
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
