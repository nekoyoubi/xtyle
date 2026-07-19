import { escapeAttr, escapeHtml } from "../escape.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, text: string): void;
}

interface LabelRun {
	text: string;
	match?: boolean;
}

interface OptionView {
	id: string;
	optionId: string;
	runs: LabelRun[];
	hint?: string;
	shortcut?: string;
	disabled?: boolean;
	active?: boolean;
}

interface GroupView {
	id: string;
	heading?: string;
	options: OptionView[];
}

interface PaletteBindings {
	label?: string;
	placeholder?: string;
	emptyText?: string;
	listId?: string;
	inputId?: string;
	groups?: GroupView[];
	count?: number;
	activeId?: string;
	footer?: boolean;
}

interface EventPayload {
	dataset?: Record<string, string>;
	value?: string;
	key?: string;
	ariaDisabled?: string;
}

interface Intent {
	inputValue?: string;
	activateValue?: string;
	focusValue?: string;
	nudge?: number;
	jump?: string;
	commitValue?: boolean;
	requestClose?: boolean;
	preventDefault?: boolean;
	stopPropagation?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: PaletteBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

const SEARCH_ICON =
	'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
	'<circle cx="11" cy="11" r="6" /><path d="M15.5 15.5 20 20" /></svg>';

const LEGEND: { keys: string[]; text: string }[] = [
	{ keys: ["↑", "↓"], text: "navigate" },
	{ keys: ["↵"], text: "run" },
	{ keys: ["Esc"], text: "dismiss" },
];

function keycap(key: string): string {
	return `<kbd class="xtyle-kbd xtyle-kbd--sm" part="key">${escapeHtml(key)}</kbd>`;
}

/** A command's own shortcut, spelled as keycaps: `"Ctrl+Shift+P"` becomes three caps. */
function keys(shortcut: string | undefined): string {
	const parts = (shortcut ?? "")
		.split("+")
		.map((part) => part.trim())
		.filter((part) => part !== "");
	if (parts.length === 0) return "";
	return `<span class="xtyle-command-palette__keys" part="keys">${parts.map(keycap).join("")}</span>`;
}

function label(runs: LabelRun[]): string {
	return runs
		.map((run) =>
			run.match
				? `<mark class="xtyle-command-palette__match" part="match">${escapeHtml(run.text)}</mark>`
				: escapeHtml(run.text),
		)
		.join("");
}

function option(view: OptionView): string {
	const disabled = view.disabled ? ' aria-disabled="true"' : "";
	const active = view.active ? ' data-active="true"' : "";
	const shortcut = view.shortcut ? ` aria-keyshortcuts="${escapeAttr(view.shortcut)}"` : "";
	const hint = view.hint
		? `<span class="xtyle-command-palette__hint" part="hint">${escapeHtml(view.hint)}</span>`
		: "";
	return (
		`<div class="xtyle-command-palette__option" part="option" role="option" id="${escapeAttr(view.optionId)}" ` +
		`data-id="${escapeAttr(view.id)}" aria-selected="${view.active ? "true" : "false"}"${disabled}${active}${shortcut}>` +
		`<span class="xtyle-command-palette__label" part="label">${label(view.runs ?? [])}</span>` +
		`${hint}${keys(view.shortcut)}</div>`
	);
}

function group(view: GroupView): string {
	const headingId = `${view.id}-heading`;
	const heading = view.heading
		? `<div class="xtyle-command-palette__heading" part="heading" id="${escapeAttr(headingId)}">${escapeHtml(view.heading)}</div>`
		: "";
	const named = view.heading ? ` aria-labelledby="${escapeAttr(headingId)}"` : "";
	return (
		`<div class="xtyle-command-palette__group" part="group" role="group"${named}>` +
		`${heading}${(view.options ?? []).map(option).join("")}</div>`
	);
}

function legend(): string {
	return LEGEND.map(
		(entry) =>
			`<span class="xtyle-command-palette__legend" part="legend">${entry.keys.map(keycap).join("")} ${entry.text}</span>`,
	).join("");
}

/** Mount and update paint the same surface: the list rebuilds on every keystroke, and nothing else has to. */
function paint(b: PaletteBindings, ops: OpsBuilder): void {
	const name = b.label ?? "Command palette";
	const listId = b.listId ?? "xtyle-command-palette-list";
	const count = b.count ?? 0;
	ops.setAttr("[data-modal]", "aria-label", name);
	ops.replaceChildren("[data-glyph]", SEARCH_ICON);
	ops.setAttr("[data-input]", "id", b.inputId ?? "xtyle-command-palette-input");
	ops.setAttr("[data-input]", "aria-label", name);
	ops.setAttr("[data-input]", "placeholder", b.placeholder ?? "");
	ops.setAttr("[data-input]", "aria-controls", listId);
	ops.setAttr("[data-input]", "aria-expanded", count > 0 ? "true" : "false");
	ops.setAttr("[data-input]", "aria-activedescendant", b.activeId ?? "");
	ops.setAttr("[data-list]", "id", listId);
	ops.setAttr("[data-list]", "aria-label", name);
	ops.replaceChildren("[data-list]", (b.groups ?? []).map(group).join(""));
	ops.setText("[data-empty]", b.emptyText ?? "");
	ops.setAttr("[data-empty]", "hidden", count > 0 ? "hidden" : "");
	ops.replaceChildren("[data-footer]", legend());
	ops.setAttr("[data-footer]", "hidden", b.footer ? "" : "hidden");
}

hooks.fragment.mount("command-palette", (bindings, ops) => {
	paint(bindings, ops);
});

hooks.fragment.update("command-palette", (bindings, ops) => {
	paint(bindings, ops);
});

xript.exports.register("paletteInput", (payload: unknown): Intent => {
	return { inputValue: (payload as EventPayload).value ?? "" };
});

xript.exports.register("paletteKeydown", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	switch (e.key) {
		case "ArrowDown":
			return { nudge: 1, preventDefault: true };
		case "ArrowUp":
			return { nudge: -1, preventDefault: true };
		case "PageDown":
			return { jump: "page-down", preventDefault: true };
		case "PageUp":
			return { jump: "page-up", preventDefault: true };
		case "Enter":
			return { commitValue: true, preventDefault: true };
		case "Escape":
			return { requestClose: true, preventDefault: true, stopPropagation: true };
		default:
			return {};
	}
});

xript.exports.register("optionClick", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.ariaDisabled === "true") return {};
	const id = e.dataset?.id;
	return id === undefined ? {} : { activateValue: id };
});

xript.exports.register("optionHover", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.ariaDisabled === "true") return {};
	const id = e.dataset?.id;
	return id === undefined ? {} : { focusValue: id };
});
