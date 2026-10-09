// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import "../src/elements/list.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/list/source.generated.js";

type ListEl = HTMLElement & { items: unknown; selected: string[] };

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});
afterEach(() => {
	document.body.innerHTML = "";
});

function make(attrs: Record<string, string>, options: string): ListEl {
	const el = document.createElement("xtyle-list") as ListEl;
	el.setAttribute("label", "Demo");
	for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
	el.setAttribute("options", options);
	document.body.appendChild(el);
	return el;
}
function root(el: ListEl): ShadowRoot {
	return el.shadowRoot as ShadowRoot;
}
function itemEl(el: ListEl, value: string): HTMLElement | null {
	return root(el).querySelector<HTMLElement>(`.xtyle-list__item[data-value="${value}"]`);
}
function selectedValues(el: ListEl): string[] {
	return [...root(el).querySelectorAll('.xtyle-list__item[aria-selected="true"]')].map((n) => n.getAttribute("data-value") as string);
}
function rovingKey(el: ListEl): string | null {
	return root(el).querySelector<HTMLElement>('.xtyle-list__item[tabindex="0"]')?.getAttribute("data-value") ?? null;
}
function click(el: ListEl, value: string, opts: MouseEventInit = {}): void {
	itemEl(el, value)?.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, cancelable: true, ...opts }));
}
function press(el: ListEl, value: string, key: string): void {
	itemEl(el, value)?.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, composed: true, cancelable: true }));
}

describe("<xtyle-list> roles", () => {
	it("is a listbox of options when selectable, a list of listitems otherwise", () => {
		const sel = make({ interaction: "selectable", selection: "single" }, "A,B,C");
		expect(root(sel).querySelector('[role="listbox"]')).not.toBeNull();
		expect(root(sel).querySelectorAll('[role="option"]')).toHaveLength(3);

		const nav = make({ interaction: "navigational" }, "A,B,C");
		expect(root(nav).querySelector('[role="list"]')).not.toBeNull();
		expect(root(nav).querySelectorAll('[role="listitem"]')).toHaveLength(3);
	});
});

describe("<xtyle-list> single selection", () => {
	it("selects one and replaces on the next click", () => {
		const el = make({ interaction: "selectable", selection: "single" }, "A,B,C");
		click(el, "A");
		expect(selectedValues(el)).toEqual(["A"]);
		click(el, "B");
		expect(selectedValues(el)).toEqual(["B"]);
	});
});

describe("<xtyle-list> multi selection", () => {
	it("plain click replaces; ctrl-click toggles independently", () => {
		const el = make({ interaction: "selectable", selection: "multi" }, "A,B,C,D");
		click(el, "A");
		expect(selectedValues(el)).toEqual(["A"]);
		click(el, "B", { ctrlKey: true });
		expect(new Set(selectedValues(el))).toEqual(new Set(["A", "B"]));
		click(el, "A", { ctrlKey: true });
		expect(selectedValues(el)).toEqual(["B"]);
	});
});

describe("<xtyle-list> range selection", () => {
	it("shift-click extends a span from the anchor", () => {
		const el = make({ interaction: "selectable", selection: "range" }, "A,B,C,D,E");
		click(el, "B");
		click(el, "D", { shiftKey: true });
		expect(selectedValues(el)).toEqual(["B", "C", "D"]);
	});
});

describe("<xtyle-list> keyboard", () => {
	it("ArrowDown moves the roving cursor and Enter selects it", () => {
		const el = make({ interaction: "selectable", selection: "single" }, "A,B,C");
		expect(rovingKey(el)).toBe("A");
		press(el, "A", "ArrowDown");
		expect(rovingKey(el)).toBe("B");
		press(el, "B", "Enter");
		expect(selectedValues(el)).toEqual(["B"]);
	});
});

describe("<xtyle-list> navigational", () => {
	it("emits a select event on activation and marks nothing", () => {
		const el = make({ interaction: "navigational" }, "A,B,C");
		let activated: string | null = null;
		el.addEventListener("select", (e) => {
			activated = (e as CustomEvent).detail.value;
		});
		click(el, "B");
		expect(activated).toBe("B");
		expect(selectedValues(el)).toEqual([]);
	});
});

describe("<xtyle-list> sections", () => {
	const settings = [
		{ value: "top", label: "Top" },
		{ value: "play", label: "Play", heading: true },
		{ value: "speed", label: "Speed" },
		{ value: "world", label: "World", heading: true, tone: "danger" },
		{ value: "wipe", label: "Wipe", disabled: true },
		{ value: "reset", label: "Reset", tone: "warn" },
	];

	function sectioned(attrs: Record<string, string>): ListEl {
		const el = document.createElement("xtyle-list") as ListEl;
		el.setAttribute("label", "Settings");
		for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
		document.body.appendChild(el);
		el.items = settings;
		return el;
	}

	it("groups the items after each heading under a section the heading labels", () => {
		const el = sectioned({ interaction: "navigational" });
		const groups = [...root(el).querySelectorAll<HTMLElement>(".xtyle-list__group")];
		expect(groups.map((g) => g.dataset.heading)).toEqual(["play", "world"]);
		const heading = groups[1]!.querySelector<HTMLElement>(".xtyle-list__heading")!;
		expect(groups[1]!.getAttribute("aria-labelledby")).toBe(heading.id);
		expect(heading.textContent).toBe("World");
		expect([...groups[1]!.querySelectorAll(".xtyle-list__item")].map((n) => n.getAttribute("data-value"))).toEqual(["wipe", "reset"]);
		expect(itemEl(el, "top")?.closest(".xtyle-list__group")).toBeNull();
		expect(root(el).querySelector('.xtyle-list__item[data-value="play"]')).toBeNull();
	});

	it("exposes each section's rows as a group-items part", () => {
		const el = sectioned({ interaction: "navigational" });
		const parts = [...root(el).querySelectorAll<HTMLElement>('[part~="group-items"]')];
		expect(parts).toHaveLength(2);
		expect(parts.every((p) => p.parentElement?.getAttribute("part") === "group")).toBe(true);
		expect([...parts[0]!.children].map((n) => n.getAttribute("data-value"))).toEqual(["speed"]);
	});

	it("is a group of options inside a listbox, and a nested list otherwise", () => {
		const sel = sectioned({ interaction: "selectable", selection: "single" });
		expect(root(sel).querySelectorAll('[role="listbox"] > [role="group"]')).toHaveLength(2);
		expect(root(sel).querySelectorAll('[role="option"]')).toHaveLength(4);
		const nav = sectioned({ interaction: "navigational" });
		expect(root(nav).querySelectorAll('.xtyle-list__group > [role="list"] > [role="listitem"]')).toHaveLength(3);
	});

	it("passes the roving cursor over headings and never selects one", () => {
		const el = sectioned({ interaction: "selectable", selection: "range" });
		press(el, "top", "ArrowDown");
		expect(rovingKey(el)).toBe("speed");
		press(el, "speed", "ArrowDown");
		expect(rovingKey(el), "the disabled row is skipped too").toBe("reset");
		click(el, "top");
		click(el, "reset", { shiftKey: true });
		expect(el.selected).not.toContain("play");
		expect(el.selected).not.toContain("world");
	});

	it("paints a toned heading's section and a toned row, but not a disabled row's ink", () => {
		const el = sectioned({ interaction: "navigational" });
		expect(root(el).querySelector(".xtyle-list__group--danger")).not.toBeNull();
		expect(itemEl(el, "reset")?.classList.contains("xtyle-list__item--warn")).toBe(true);
		const css = [...root(el).adoptedStyleSheets].flatMap((sheet) => [...sheet.cssRules].map((rule) => rule.cssText)).join("\n");
		expect(css).toContain("--danger-vivid");
	});

	it("warns on a tone outside the roster and renders the row with none", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const el = sectioned({ interaction: "navigational" });
		el.items = [{ value: "a", label: "A", tone: "crimson" }];
		expect(itemEl(el, "a")?.className).toBe("xtyle-list__item");
		expect(warn.mock.calls.some(([m]) => String(m).includes('"crimson" is not a tone'))).toBe(true);
		warn.mockRestore();
	});
});

describe("<xtyle-list> toggle rows", () => {
	const rows = [
		{ value: "music", label: "Music", checked: true },
		{ value: "motion", label: "Reduce motion", checked: false },
		{ value: "plain", label: "Plain" },
	];

	function toggles(attrs: Record<string, string>): ListEl {
		const el = document.createElement("xtyle-list") as ListEl;
		el.setAttribute("label", "Options");
		for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
		document.body.appendChild(el);
		el.items = rows;
		return el;
	}

	it("leads a toggle row with a check and marks its state, leaving an ordinary row alone", () => {
		const el = toggles({ interaction: "static" });
		expect(itemEl(el, "music")?.dataset.checked).toBe("true");
		expect(itemEl(el, "motion")?.dataset.checked).toBe("false");
		expect(itemEl(el, "plain")?.hasAttribute("data-checked")).toBe(false);
		expect(itemEl(el, "plain")?.querySelector(".xtyle-list__check")).toBeNull();
		expect(itemEl(el, "music")?.querySelector(".xtyle-list__check xtyle-icon")?.getAttribute("name")).toBe("--border--check-s60");
		expect(itemEl(el, "motion")?.querySelector(".xtyle-list__check xtyle-icon")?.getAttribute("name")).toBe("--border");
	});

	it("announces the state as words on a listitem, which cannot carry aria-checked", () => {
		const el = toggles({ interaction: "navigational" });
		expect(itemEl(el, "music")?.getAttribute("role")).toBe("listitem");
		expect(itemEl(el, "music")?.hasAttribute("aria-checked")).toBe(false);
		expect(itemEl(el, "music")?.querySelector(".xtyle-list__state")?.textContent).toBe(", checked");
		expect(itemEl(el, "motion")?.querySelector(".xtyle-list__state")?.textContent).toBe(", not checked");
		expect(itemEl(el, "music")?.querySelector(".xtyle-list__check")?.getAttribute("aria-hidden")).toBe("true");
	});

	it("announces the state in the words checked-label and unchecked-label give it", () => {
		const el = toggles({ interaction: "navigational", "checked-label": "activado", "unchecked-label": "desactivado" });
		expect(itemEl(el, "music")?.querySelector(".xtyle-list__state")?.textContent).toBe(", activado");
		expect(itemEl(el, "motion")?.querySelector(".xtyle-list__state")?.textContent).toBe(", desactivado");
	});

	it("announces through aria-checked on an option, with no state words to double it", () => {
		const el = toggles({ interaction: "selectable", selection: "multi" });
		expect(itemEl(el, "music")?.getAttribute("aria-checked")).toBe("true");
		expect(itemEl(el, "motion")?.getAttribute("aria-checked")).toBe("false");
		expect(itemEl(el, "music")?.querySelector(".xtyle-list__state")).toBeNull();
	});

	it("treats a checked that is not a boolean as an ordinary row", () => {
		const el = toggles({ interaction: "static" });
		el.items = [{ value: "odd", label: "Odd", checked: "yes" as unknown as boolean }];
		expect(itemEl(el, "odd")?.hasAttribute("data-checked")).toBe(false);
		expect(itemEl(el, "odd")?.querySelector(".xtyle-list__check")).toBeNull();
	});
});

describe("<xtyle-list> rich rows", () => {
	function rich(items: unknown[], attrs: Record<string, string> = { interaction: "selectable", selection: "single" }): ListEl {
		const el = document.createElement("xtyle-list") as ListEl;
		el.setAttribute("label", "Saves");
		for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
		document.body.appendChild(el);
		el.items = items;
		return el;
	}

	it("puts a description under the label and points the row's aria-describedby at it", () => {
		const el = rich([
			{ value: "a", label: "Slot 1", description: "Harbor, day 12" },
			{ value: "b", label: "Slot 2" },
		]);
		const row = itemEl(el, "a")!;
		const description = row.querySelector<HTMLElement>(".xtyle-list__content .xtyle-list__description")!;
		expect(description.textContent).toBe("Harbor, day 12");
		expect(row.getAttribute("aria-describedby")).toBe(description.id);
		expect(root(el).querySelectorAll(`#${CSS.escape(description.id)}`)).toHaveLength(1);
		expect(itemEl(el, "b")?.hasAttribute("aria-describedby")).toBe(false);
		expect(itemEl(el, "b")?.querySelector(".xtyle-list__content")).toBeNull();
	});

	it("draws each trailing field as its own numbered part, and one field exactly as before", () => {
		const el = rich([
			{ value: "a", label: "A", trail: ["3h", "Lv 14", "Harbor", "extra"] },
			{ value: "b", label: "B", trail: "Fast" },
		]);
		const parts = [...itemEl(el, "a")!.querySelectorAll(".xtyle-list__trail")].map((n) => [n.getAttribute("part"), n.textContent]);
		expect(parts).toEqual([
			["trail trail-1", "3h"],
			["trail trail-2", "Lv 14"],
			["trail trail-3", "Harbor"],
			["trail", "extra"],
		]);
		expect([...itemEl(el, "b")!.querySelectorAll(".xtyle-list__trail")].map((n) => n.getAttribute("part"))).toEqual(["trail trail-1"]);
	});

	it("draws badges beside the label as row text, toned or plain, and drops an empty one", () => {
		const el = rich([{ value: "a", label: "A", badge: [{ text: "locked", tone: "warn" }, "backup", ""] }]);
		const badges = [...itemEl(el, "a")!.querySelectorAll(".xtyle-list__badge")];
		expect(badges.map((b) => [b.textContent, b.className])).toEqual([
			["locked", "xtyle-list__badge xtyle-list__badge--warn"],
			["backup", "xtyle-list__badge"],
		]);
		expect(badges[0]!.hasAttribute("aria-hidden")).toBe(false);
	});

	it("warns on a badge tone outside the roster and keeps the badge untoned", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const el = rich([{ value: "a", label: "A", badge: { text: "new", tone: "crimson" } }]);
		expect(itemEl(el, "a")?.querySelector(".xtyle-list__badge")?.className).toBe("xtyle-list__badge");
		expect(warn.mock.calls.some(([m]) => String(m).includes('"crimson" is not a tone'))).toBe(true);
		warn.mockRestore();
	});
});

describe("<xtyle-list> pause-menu rows", () => {
	function rows(items: unknown[], attrs: Record<string, string> = { interaction: "navigational" }): ListEl {
		const el = document.createElement("xtyle-list") as ListEl;
		el.setAttribute("label", "Paused");
		for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
		document.body.appendChild(el);
		el.items = items;
		return el;
	}

	it("underlines the first letter matching the accelerator and carries it as aria-keyshortcuts", () => {
		const el = rows([
			{ value: "quit", label: "Quit <now>", accelerator: "T" },
			{ value: "none", label: "Resume", accelerator: "z" },
		]);
		const quit = itemEl(el, "quit")!;
		expect(quit.querySelector(".xtyle-list__accelerator")?.textContent).toBe("t");
		expect(quit.querySelector(".xtyle-list__label")?.textContent).toBe("Quit <now>");
		expect(quit.getAttribute("aria-keyshortcuts")).toBe("T");
		expect(itemEl(el, "none")?.querySelector(".xtyle-list__accelerator")).toBeNull();
		expect(itemEl(el, "none")?.getAttribute("aria-keyshortcuts")).toBe("z");
	});

	it("draws a separator as an aria-hidden break the cursor passes over", () => {
		const el = rows([
			{ value: "a", label: "A" },
			{ value: "gap", label: "", separator: true },
			{ value: "b", label: "B" },
		]);
		const separator = root(el).querySelector(".xtyle-list__separator")!;
		expect(separator.getAttribute("aria-hidden")).toBe("true");
		expect(separator.getAttribute("role")).toBe("none");
		expect(itemEl(el, "gap")).toBeNull();
		press(el, "a", "ArrowDown");
		expect(rovingKey(el)).toBe("b");
	});

	it("gives a row its variant in its tone, accent when it names none", () => {
		const el = rows([
			{ value: "retire", label: "Retire", variant: "subtle" },
			{ value: "quit", label: "Quit", variant: "outline", tone: "danger" },
			{ value: "odd", label: "Odd", variant: "glow" },
		]);
		expect(itemEl(el, "retire")?.className).toBe("xtyle-list__item xtyle-list__item--accent xtyle-list__item--subtle");
		expect(itemEl(el, "quit")?.className).toBe("xtyle-list__item xtyle-list__item--danger xtyle-list__item--outline");
		expect(itemEl(el, "odd")?.className).toBe("xtyle-list__item");
	});

	it("inks only the trailing fields with a trail tone", () => {
		const el = rows([{ value: "map", label: "Old map", trail: ["250g", "x1"], trailTone: "danger" }]);
		const row = itemEl(el, "map")!;
		expect(row.className).toBe("xtyle-list__item");
		expect([...row.querySelectorAll(".xtyle-list__trail")].every((t) => t.classList.contains("xtyle-list__trail--danger"))).toBe(true);
	});
});
