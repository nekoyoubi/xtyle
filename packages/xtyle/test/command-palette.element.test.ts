// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
// side effect: defines the <xtyle-command-palette> custom element on the happy-dom registry
import "../src/elements/command-palette.js";
import type { CommandItem, CommandScorer } from "../src/elements/command-palette.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";
import { manifest, fragmentSources } from "../src/elements/fragments/command-palette/source.generated.js";

type PaletteEl = HTMLElement & {
	open: boolean;
	items: CommandItem[];
	scorer: CommandScorer | null;
	query: string;
	active: string;
	recent: string[];
	show(): void;
	close(reason?: string): void;
	toggle(): void;
	run(id: string): void;
};

const COMMANDS: CommandItem[] = [
	{ id: "file.new", label: "New file", group: "File", shortcut: "Ctrl+N" },
	{ id: "file.open", label: "Open file…", group: "File", shortcut: "Ctrl+O", keywords: ["browse"] },
	{ id: "file.save", label: "Save", group: "File" },
	{ id: "view.theme", label: "Toggle theme", group: "View", hint: "light / dark" },
	{ id: "view.zen", label: "Zen mode", group: "View", disabled: true },
];

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
	localStorage.clear();
});

function make(attrs: Record<string, string> = {}, items: CommandItem[] = COMMANDS): PaletteEl {
	const el = document.createElement("xtyle-command-palette") as PaletteEl;
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	document.body.appendChild(el);
	el.items = items;
	return el;
}

function root(el: PaletteEl): ShadowRoot {
	return el.shadowRoot as ShadowRoot;
}

function dialog(el: PaletteEl): HTMLDialogElement {
	return root(el).querySelector("dialog") as HTMLDialogElement;
}

function input(el: PaletteEl): HTMLInputElement {
	return root(el).querySelector(".xtyle-command-palette__input") as HTMLInputElement;
}

function options(el: PaletteEl): HTMLElement[] {
	return [...root(el).querySelectorAll<HTMLElement>(".xtyle-command-palette__option")];
}

function labels(el: PaletteEl): string[] {
	return options(el).map((option) => option.querySelector(".xtyle-command-palette__label")?.textContent ?? "");
}

function headings(el: PaletteEl): string[] {
	return [...root(el).querySelectorAll(".xtyle-command-palette__heading")].map((h) => h.textContent ?? "");
}

function activeId(el: PaletteEl): string {
	return options(el).find((option) => option.dataset.active === "true")?.dataset.id ?? "";
}

function type(el: PaletteEl, value: string): void {
	const field = input(el);
	field.value = value;
	field.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
}

function press(el: PaletteEl, key: string): KeyboardEvent {
	const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, composed: true });
	input(el).dispatchEvent(event);
	return event;
}

function click(target: HTMLElement): void {
	target.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, cancelable: true }));
}

describe("<xtyle-command-palette> filtering", () => {
	it("renders every command, grouped, with the first one active", () => {
		const el = make();
		expect(labels(el)).toEqual(["New file", "Open file…", "Save", "Toggle theme", "Zen mode"]);
		expect(headings(el)).toEqual(["File", "View"]);
		expect(activeId(el)).toBe("file.new");
	});

	it("filters as a subsequence, so `of` finds Open file", () => {
		const el = make();
		type(el, "of");
		expect(labels(el)).toEqual(["Open file…"]);
		expect(el.query).toBe("of");
	});

	it("marks the matched characters in the label", () => {
		const el = make();
		type(el, "of");
		const marks = [...options(el)[0]!.querySelectorAll("mark")].map((mark) => mark.textContent);
		expect(marks).toEqual(["O", "f"]);
	});

	it("surfaces a command on a keyword it never renders", () => {
		const el = make();
		type(el, "browse");
		expect(labels(el)).toEqual(["Open file…"]);
		expect(options(el)[0]!.querySelector("mark")).toBeNull();
	});

	it("shows the empty state, and hides it again, as the query stops and starts matching", () => {
		const el = make();
		const empty = root(el).querySelector(".xtyle-command-palette__empty") as HTMLElement;
		expect(empty.hasAttribute("hidden")).toBe(true);
		type(el, "zzzz");
		expect(options(el)).toHaveLength(0);
		expect(empty.hasAttribute("hidden")).toBe(false);
		expect(empty.textContent).toBe("No matching commands");
		expect(input(el).getAttribute("aria-expanded")).toBe("false");
		type(el, "save");
		expect(empty.hasAttribute("hidden")).toBe(true);
		expect(input(el).getAttribute("aria-expanded")).toBe("true");
	});

	it("ranks the tighter match first", () => {
		const el = make();
		type(el, "ne");
		expect(labels(el)[0]).toBe("New file");
	});

	it("takes a whole replacement ranker through `scorer`, ordering and filtering by it", () => {
		const el = make();
		el.scorer = (query, item) => (item.group === "View" ? { score: item.label.length } : null);
		expect(labels(el)).toEqual(["Toggle theme", "Zen mode"]);
		expect(headings(el)).toEqual(["View"]);
	});

	it("keeps a disabled command listed, unselectable, and out of the keyboard walk", () => {
		const el = make();
		const zen = options(el).find((option) => option.dataset.id === "view.zen") as HTMLElement;
		expect(zen.getAttribute("aria-disabled")).toBe("true");
		click(zen);
		expect(el.open).toBe(false);
		for (let i = 0; i < 4; i += 1) press(el, "ArrowDown");
		expect(activeId(el)).toBe("file.new");
	});
});

describe("<xtyle-command-palette> keyboard", () => {
	it("walks the list with the arrows, wrapping at both ends, without moving DOM focus", () => {
		const el = make();
		el.show();
		expect(root(el).activeElement).toBe(input(el));
		press(el, "ArrowDown");
		expect(activeId(el)).toBe("file.open");
		press(el, "ArrowUp");
		press(el, "ArrowUp");
		expect(activeId(el)).toBe("view.theme");
		press(el, "ArrowDown");
		expect(activeId(el)).toBe("file.new");
		expect(root(el).activeElement).toBe(input(el));
	});

	it("tracks the active command with aria-activedescendant, never with focus", () => {
		const el = make();
		press(el, "ArrowDown");
		const active = options(el).find((option) => option.dataset.id === "file.open") as HTMLElement;
		expect(input(el).getAttribute("aria-activedescendant")).toBe(active.id);
		expect(active.getAttribute("aria-selected")).toBe("true");
	});

	it("jumps by a page, clamping at the ends", () => {
		const el = make();
		press(el, "PageDown");
		expect(activeId(el)).toBe("view.theme");
		press(el, "PageUp");
		expect(activeId(el)).toBe("file.new");
	});

	it("leaves Home and End to the caret", () => {
		const el = make();
		press(el, "ArrowDown");
		const home = press(el, "Home");
		expect(home.defaultPrevented).toBe(false);
		expect(activeId(el)).toBe("file.open");
	});

	it("runs the active command on Enter, and closes", () => {
		const el = make();
		const ran: unknown[] = [];
		el.addEventListener("select", (event) => ran.push((event as CustomEvent).detail));
		el.show();
		press(el, "ArrowDown");
		const enter = press(el, "Enter");
		expect(enter.defaultPrevented).toBe(true);
		expect(ran).toHaveLength(1);
		expect((ran[0] as { id: string; label: string; index: number }).id).toBe("file.open");
		expect((ran[0] as { index: number }).index).toBe(1);
		expect(el.open).toBe(false);
	});

	it("dismisses on Escape, with the reason on the close event", () => {
		const el = make();
		const reasons: string[] = [];
		el.addEventListener("close", (event) => reasons.push((event as CustomEvent).detail.reason));
		el.show();
		press(el, "Escape");
		expect(el.open).toBe(false);
		expect(reasons).toEqual(["escape"]);
	});

	it("does nothing on Enter with nothing to run", () => {
		const el = make();
		const ran: unknown[] = [];
		el.addEventListener("select", (event) => ran.push(event));
		el.show();
		type(el, "zzzz");
		press(el, "Enter");
		expect(ran).toHaveLength(0);
		expect(el.open).toBe(true);
	});
});

describe("<xtyle-command-palette> the modal posture", () => {
	it("opens the native dialog, focuses the input, and starts from a clean query", () => {
		const el = make();
		type(el, "save");
		el.show();
		expect(el.open).toBe(true);
		expect(dialog(el).open).toBe(true);
		expect(el.query).toBe("");
		expect(input(el).value).toBe("");
		expect(root(el).activeElement).toBe(input(el));
	});

	it("returns focus to whatever had it when the palette opened", () => {
		const launcher = document.createElement("button");
		document.body.appendChild(launcher);
		launcher.focus();
		const el = make();
		el.show();
		expect(document.activeElement).not.toBe(launcher);
		el.close();
		expect(document.activeElement).toBe(launcher);
	});

	it("closes on a click on the scrim (the dialog element itself)", () => {
		const el = make();
		const reasons: string[] = [];
		el.addEventListener("close", (event) => reasons.push((event as CustomEvent).detail.reason));
		el.show();
		click(dialog(el));
		expect(el.open).toBe(false);
		expect(reasons).toEqual(["dismiss"]);
	});

	it("mounts on the body while open and goes home again on close", () => {
		const host = document.createElement("div");
		document.body.appendChild(host);
		const el = document.createElement("xtyle-command-palette") as PaletteEl;
		host.appendChild(el);
		el.items = COMMANDS;
		el.show();
		expect(el.parentElement).toBe(document.body);
		el.close();
		expect(el.parentElement).toBe(host);
	});

	it("toggles, and runs a command by id from the API", () => {
		const el = make();
		const ran: string[] = [];
		el.addEventListener("select", (event) => ran.push((event as CustomEvent).detail.id));
		el.toggle();
		expect(el.open).toBe(true);
		el.run("file.save");
		expect(ran).toEqual(["file.save"]);
		expect(el.open).toBe(false);
		el.toggle();
		expect(el.open).toBe(true);
	});

	it("stays open after a selection under no-close-on-select", () => {
		const el = make({ "no-close-on-select": "" });
		el.show();
		el.run("file.save");
		expect(el.open).toBe(true);
	});

	it("opens on its hotkey, and toggles shut on it again", () => {
		const el = make({ hotkey: "mod+k" });
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true, cancelable: true }));
		expect(el.open).toBe(true);
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
		expect(el.open).toBe(false);
	});

	it("ignores a chord that is not its hotkey", () => {
		const el = make({ hotkey: "mod+k" });
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", bubbles: true }));
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, shiftKey: true, bubbles: true }));
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "j", ctrlKey: true, bubbles: true }));
		expect(el.open).toBe(false);
	});
});

describe("<xtyle-command-palette> recents", () => {
	it("lifts recently-run commands to their own leading group, out of their own", () => {
		const el = make();
		el.run("file.save");
		el.show();
		expect(headings(el)[0]).toBe("Recent");
		expect(labels(el)[0]).toBe("Save");
		// lifted, not duplicated
		expect(labels(el).filter((label) => label === "Save")).toHaveLength(1);
		expect(el.recent).toEqual(["file.save"]);
	});

	it("orders recents newest-first and never repeats an id", () => {
		const el = make();
		el.run("file.save");
		el.run("file.new");
		el.run("file.save");
		expect(el.recent).toEqual(["file.save", "file.new"]);
	});

	it("drops the recents group entirely once a query is typed", () => {
		const el = make();
		el.run("file.save");
		el.show();
		type(el, "e");
		expect(headings(el)).not.toContain("Recent");
	});

	it("caps the recents group at recent-limit", () => {
		const el = make({ "recent-limit": "1" });
		el.run("file.save");
		el.run("file.new");
		el.show();
		const recentGroup = root(el).querySelector(".xtyle-command-palette__group") as HTMLElement;
		expect(recentGroup.querySelectorAll(".xtyle-command-palette__option")).toHaveLength(1);
		expect(labels(el)[0]).toBe("New file");
	});

	it("tracks nothing under no-recent", () => {
		const el = make({ "no-recent": "" });
		el.run("file.save");
		el.show();
		expect(el.recent).toEqual([]);
		expect(headings(el)).not.toContain("Recent");
	});

	it("persists recents to localStorage and reads them back on the next mount", () => {
		const first = make({ "storage-key": "test.palette" });
		first.run("file.open");
		expect(JSON.parse(localStorage.getItem("test.palette") ?? "[]")).toEqual(["file.open"]);
		document.body.innerHTML = "";

		const second = make({ "storage-key": "test.palette" });
		expect(second.recent).toEqual(["file.open"]);
		expect(labels(second)[0]).toBe("Open file…");
	});
});

describe("<xtyle-command-palette> chrome and semantics", () => {
	it("spells a command's shortcut in keycaps and announces it", () => {
		const el = make();
		const option = options(el).find((entry) => entry.dataset.id === "file.new") as HTMLElement;
		expect(option.getAttribute("aria-keyshortcuts")).toBe("Ctrl+N");
		expect([...option.querySelectorAll("kbd")].map((key) => key.textContent)).toEqual(["Ctrl", "N"]);
		expect(option.querySelector("kbd")?.classList.contains("xtyle-kbd")).toBe(true);
	});

	it("names the dialog, the combobox, and the listbox, and wires them together", () => {
		const el = make({ label: "Run anything" });
		expect(dialog(el).getAttribute("aria-label")).toBe("Run anything");
		const list = root(el).querySelector(".xtyle-command-palette__list") as HTMLElement;
		expect(list.getAttribute("role")).toBe("listbox");
		expect(input(el).getAttribute("role")).toBe("combobox");
		expect(input(el).getAttribute("aria-autocomplete")).toBe("list");
		expect(input(el).getAttribute("aria-controls")).toBe(list.id);
		expect(input(el).getAttribute("aria-label")).toBe("Run anything");
	});

	it("labels each group by its own heading", () => {
		const el = make();
		const group = root(el).querySelector(".xtyle-command-palette__group") as HTMLElement;
		expect(group.getAttribute("role")).toBe("group");
		const heading = group.querySelector(".xtyle-command-palette__heading") as HTMLElement;
		expect(group.getAttribute("aria-labelledby")).toBe(heading.id);
	});

	it("draws the keyboard legend, and drops it under no-footer", () => {
		const el = make();
		const footer = root(el).querySelector(".xtyle-command-palette__footer") as HTMLElement;
		expect(footer.hasAttribute("hidden")).toBe(false);
		expect(footer.textContent).toContain("navigate");

		const bare = make({ "no-footer": "" });
		expect((root(bare).querySelector(".xtyle-command-palette__footer") as HTMLElement).hasAttribute("hidden")).toBe(true);
	});

	it("renders an ungrouped command in a headingless run", () => {
		const el = make({}, [{ id: "solo", label: "A lone command" }]);
		expect(headings(el)).toEqual([]);
		expect(labels(el)).toEqual(["A lone command"]);
	});

	it("takes its command list off a JSON attribute too", () => {
		const el = document.createElement("xtyle-command-palette") as PaletteEl;
		el.setAttribute("items", JSON.stringify([{ id: "a", label: "Alpha" }]));
		document.body.appendChild(el);
		expect(labels(el)).toEqual(["Alpha"]);
	});

	it("survives a malformed items attribute rather than throwing", () => {
		const el = document.createElement("xtyle-command-palette") as PaletteEl;
		el.setAttribute("items", "{not json");
		document.body.appendChild(el);
		expect(options(el)).toHaveLength(0);
	});

	it("hovers the pointer's command into the active slot", () => {
		const el = make();
		const save = options(el).find((option) => option.dataset.id === "file.save") as HTMLElement;
		save.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, composed: true }));
		expect(activeId(el)).toBe("file.save");
	});

	it("runs the command a click lands on", () => {
		const el = make();
		const ran: string[] = [];
		el.addEventListener("select", (event) => ran.push((event as CustomEvent).detail.id));
		el.show();
		click(options(el).find((option) => option.dataset.id === "view.theme") as HTMLElement);
		expect(ran).toEqual(["view.theme"]);
		expect(el.open).toBe(false);
	});
});

describe("<xtyle-command-palette> SSR", () => {
	it("renders the whole surface — dialog, combobox, list, keycaps — with no runtime on the page", async () => {
		const html = await renderFragmentLight("command-palette", {
			label: "Command palette",
			placeholder: "Type…",
			emptyText: "Nothing",
			listId: "p-list",
			inputId: "p-input",
			count: 1,
			activeId: "p-option-0",
			footer: true,
			groups: [
				{
					id: "p-group-0",
					heading: "File",
					options: [
						{
							id: "file.new",
							optionId: "p-option-0",
							runs: [{ text: "New file", match: false }],
							shortcut: "Ctrl+N",
							active: true,
						},
					],
				},
			],
		});
		expect(html).toContain('<dialog class="xtyle-command-palette__dialog"');
		expect(html).toContain('role="combobox"');
		expect(html).toContain('id="p-list"');
		expect(html).toContain('aria-activedescendant="p-option-0"');
		expect(html).toContain(">New file<");
		expect(html).toContain('<kbd class="xtyle-kbd xtyle-kbd--sm" part="key">Ctrl</kbd>');
		expect(html).toContain('aria-keyshortcuts="Ctrl+N"');
		// no light-DOM `<style>` ships — the global sheet styles it
		expect(html).not.toContain("<style>");
	});
});
