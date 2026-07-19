import { escapeAttr } from "../escape.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface StatusbarBindings {
	live?: boolean;
	label?: string | null;
	overflow?: string;
	manualOverflow?: boolean;
	separated?: boolean;
	elementId?: string;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: StatusbarBindings, ops: OpsBuilder) => void) => void };
};

function statusbarClass(b: StatusbarBindings): string {
	const overflow = b.overflow ?? "clip";
	return [
		"xtyle-statusbar",
		overflow !== "clip" && `xtyle-statusbar--${overflow}`,
		b.separated && "xtyle-statusbar--separated",
	]
		.filter(Boolean)
		.join(" ");
}

function overflowMenu(b: StatusbarBindings): string {
	const overflow = b.overflow ?? "clip";
	if (overflow !== "collapse" || b.manualOverflow) return "";
	const popoverId = `${b.elementId ?? "xtyle-statusbar"}-overflow`;
	return (
		`<span class="xtyle-statusbar__overflow" part="overflow" style="display:none">` +
		`<button class="xtyle-statusbar__item xtyle-statusbar__overflow-trigger" part="overflow-trigger" type="button" ` +
		`popovertarget="${escapeAttr(popoverId)}" aria-label="Show hidden status items">+0</button>` +
		`<div class="xtyle-statusbar__overflow-popover" part="overflow-popover" id="${escapeAttr(popoverId)}" popover ` +
		`role="group" aria-label="Hidden status items"></div></span>`
	);
}

function statusbarHtml(b: StatusbarBindings): string {
	const live = b.live ? ` role="status" aria-live="polite"` : "";
	const label = b.label ? ` aria-label="${escapeAttr(b.label)}"` : "";
	// A horizontally-scrolling statusbar must be reachable by keyboard to scroll it.
	const scrollable = (b.overflow ?? "clip") === "scroll" ? ` tabindex="0"` : "";
	return `<footer part="statusbar" class="${statusbarClass(b)}"${live}${label}${scrollable}><slot></slot>${overflowMenu(b)}</footer>`;
}

hooks.fragment.mount("statusbar", (bindings, ops) => {
	ops.replaceChildren("[data-statusbar]", statusbarHtml(bindings));
});

hooks.fragment.update("statusbar", (bindings, ops) => {
	ops.setAttr(".xtyle-statusbar", "class", statusbarClass(bindings));
	ops.setAttr('[part="statusbar"]', "tabindex", (bindings.overflow ?? "clip") === "scroll" ? "0" : "");
});
