import { escapeAttr } from "../escape.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, text: string): void;
}

interface PickerTheme {
	key: string;
	name?: string | null;
	algorithm?: string | null;
	scheme?: string | null;
	knobs?: unknown;
	constraints?: unknown;
	selected?: boolean;
}

interface ThemePickerBindings {
	themes?: PickerTheme[];
	label?: string | null;
	swatches?: boolean;
	minColWidth?: string | null;
	empty?: string | null;
	layout?: string | null;
	open?: boolean;
	/** The chosen theme's name, shown on the menu layout's trigger. */
	currentName?: string | null;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: ThemePickerBindings, ops: OpsBuilder) => void) => void };
};

function jsonAttr(name: string, value: unknown): string {
	if (value === undefined || value === null) return "";
	return ` ${name}="${escapeAttr(JSON.stringify(value))}"`;
}

function stringAttr(name: string, value: string | null | undefined): string {
	return value ? ` ${name}="${escapeAttr(value)}"` : "";
}

function invocationAttrs(theme: PickerTheme): string {
	return (
		stringAttr("algorithm", theme.algorithm) +
		stringAttr("scheme", theme.scheme) +
		jsonAttr("knobs", theme.knobs) +
		jsonAttr("constraints", theme.constraints)
	);
}

function itemMarkup(theme: PickerTheme, b: ThemePickerBindings, index: number): string {
	const invocation = invocationAttrs(theme);
	const card =
		`<xtyle-theme-card part="card" interactive data-index="${index}" data-key="${escapeAttr(theme.key)}"` +
		stringAttr("name", theme.name) +
		invocation +
		(theme.selected ? " selected" : "") +
		`></xtyle-theme-card>`;
	const swatch = b.swatches
		? `<xtyle-theme-swatch part="swatch" size="sm" labels="false"${invocation}></xtyle-theme-swatch>`
		: "";
	return `<div class="xtyle-theme-picker__item" part="item">${card}${swatch}</div>`;
}

function gallery(b: ThemePickerBindings): string {
	const themes = b.themes ?? [];
	if (themes.length === 0) {
		const message = b.empty ?? "No themes to choose from.";
		return `<p class="xtyle-theme-picker__empty" part="empty">${escapeAttr(message)}</p>`;
	}
	const min = b.minColWidth ? ` style="--xtyle-theme-picker-min: ${escapeAttr(b.minColWidth)}"` : "";
	const label = b.label ? ` aria-label="${escapeAttr(b.label)}"` : "";
	const items = themes.map((theme, i) => itemMarkup(theme, b, i)).join("");
	return `<div class="xtyle-theme-picker__grid" part="grid" role="group"${label}${min}>${items}</div>`;
}

/** The same gallery behind a trigger, for a toolbar that has no room to show it outright. The panel
 * is an `<xtyle-popover>` rather than a hand-rolled one, so placement, light dismiss, Escape, and
 * focus return are the overlay component's job here as everywhere else. */
function menu(b: ThemePickerBindings): string {
	const label = b.label ?? "Theme";
	const current = b.currentName ?? "";
	return (
		`<xtyle-popover class="xtyle-theme-picker__menu" part="menu" placement="bottom" align="end"` +
		` panel-role="menu" label="${escapeAttr(label)}"${b.open ? " open" : ""}>` +
		`<xtyle-button slot="trigger" part="trigger" variant="outline" size="sm">` +
		`<span class="xtyle-theme-picker__current" part="trigger-label">${escapeAttr(current)}</span>` +
		`<span class="xtyle-theme-picker__caret" aria-hidden="true">▾</span>` +
		`</xtyle-button>` +
		`<div class="xtyle-theme-picker__panel" part="panel">${gallery(b)}</div>` +
		`</xtyle-popover>`
	);
}

function inner(b: ThemePickerBindings): string {
	return b.layout === "menu" ? menu(b) : gallery(b);
}

hooks.fragment.mount("theme-picker", (bindings, ops) => {
	ops.replaceChildren("[data-theme-picker]", inner(bindings));
});

/**
 * Patch which card is current rather than redrawing the gallery. Rebuilding would detach the very
 * button the visitor just activated, dropping focus to the top of the document and re-deriving every
 * other card for a change that touched one attribute.
 */
hooks.fragment.update("theme-picker", (bindings, ops) => {
	(bindings.themes ?? []).forEach((theme, index) => {
		ops.setAttr(`[data-index="${index}"]`, "selected", theme.selected ? "selected" : "");
	});
	if (bindings.layout === "menu") ops.setText('[part="trigger-label"]', bindings.currentName ?? "");
});
