interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface BreadcrumbItem {
	label?: string;
	href?: string;
	value?: string;
	title?: string;
	current?: boolean;
}

interface SelectIntent {
	select?: string;
}

interface EventPayload {
	dataset?: { value?: string };
}

declare const xript: { exports: { register: (name: string, fn: (payload: unknown) => SelectIntent) => void } };

interface BreadcrumbBindings {
	items?: BreadcrumbItem[];
	separator?: string;
	tone?: string;
	size?: string;
	label?: string;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: BreadcrumbBindings, ops: OpsBuilder) => void) => void };
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

function breadcrumbClass(bindings: BreadcrumbBindings): string {
	const tone = bindings.tone ?? "accent";
	const size = bindings.size ?? "md";
	return ["xoji-breadcrumb", `xoji-breadcrumb--${tone}`, size !== "md" && `xoji-breadcrumb--${size}`]
		.filter(Boolean)
		.join(" ");
}

function separatorMarkup(separator: string): string {
	return `<li class="xoji-breadcrumb__separator" part="separator" aria-hidden="true">${escapeHtml(separator)}</li>`;
}

function crumbCell(item: BreadcrumbItem, isCurrent: boolean, label: string): string {
	const title = item.title ? ` title="${escapeAttr(item.title)}"` : "";
	if (isCurrent) return `<span class="xoji-breadcrumb__current" part="item" aria-current="page"${title}>${label}</span>`;
	if (item.href) return `<a class="xoji-breadcrumb__link" part="item" href="${escapeAttr(item.href)}"${title}>${label}</a>`;
	if (item.value !== undefined)
		return `<button type="button" class="xoji-breadcrumb__link" part="item" data-value="${escapeAttr(item.value)}"${title}>${label}</button>`;
	return `<span class="xoji-breadcrumb__current" part="item"${title}>${label}</span>`;
}

function list(bindings: BreadcrumbBindings): string {
	const items = bindings.items ?? [];
	if (items.length === 0) return "<slot></slot>";
	const separator = bindings.separator ?? "/";
	const lastIndex = items.length - 1;
	return items
		.map((item, index) => {
			const isCurrent = item.current === true || (item.current === undefined && index === lastIndex);
			const label = escapeHtml(item.label ?? "");
			const cell = crumbCell(item, isCurrent, label);
			const row = `<li class="xoji-breadcrumb__item" part="item-wrap">${cell}</li>`;
			return index < lastIndex ? `${row}${separatorMarkup(separator)}` : row;
		})
		.join("");
}

hooks.fragment.mount("breadcrumb", (bindings, ops) => {
	ops.setAttr("[data-root]", "class", breadcrumbClass(bindings));
	ops.setAttr("[data-root]", "aria-label", bindings.label ?? "Breadcrumb");
	ops.replaceChildren("[data-list]", list(bindings));
});

hooks.fragment.update("breadcrumb", (bindings, ops) => {
	ops.setAttr("[data-root]", "class", breadcrumbClass(bindings));
	ops.setAttr("[data-root]", "aria-label", bindings.label ?? "Breadcrumb");
});

/** A valued crumb was activated (click, or Enter/Space on the native button): hand its value up so
 * the element fires `select`. */
xript.exports.register("selectCrumb", (payload: unknown): SelectIntent => {
	const value = (payload as EventPayload).dataset?.value;
	return value !== undefined ? { select: value } : {};
});
