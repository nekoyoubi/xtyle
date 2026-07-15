// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
// side effect: defines <xtyle-combobox> (and, through it, <xtyle-popover>) on the happy-dom registry
import "../src/elements/combobox.js";
import { parseValueList } from "../src/elements/combobox.js";
import { filterOptions, optionLabel } from "../src/markup/combobox.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";
import { manifest, fragmentSources } from "../src/elements/fragments/combobox/source.generated.js";
import { manifest as popoverManifest, fragmentSources as popoverSources } from "../src/elements/fragments/popover/source.generated.js";

type ComboboxEl = HTMLElement & {
	options: ReadonlyArray<string | { value: string; label?: string }>;
	value: string;
	values: string[];
	query: string;
	open: boolean;
	multiple: boolean;
	clearable: boolean;
	allowCustom: boolean;
	disabled: boolean;
	readonly: boolean;
	visibleOptions: { value: string; label?: string }[];
};

const OPEN_FLAG = "data-test-popover-open";

const ZONES = [
	{ value: "Europe/London", label: "London" },
	{ value: "Europe/Berlin", label: "Berlin" },
	{ value: "America/New_York", label: "New York" },
	{ value: "Asia/Tokyo", label: "Tokyo" },
];

/** happy-dom 15 ships no Popover API; the popover element the combobox floats its listbox in needs one.
 * Same stand-in the popover's own suite uses: track the state, answer `:popover-open`, fire `toggle`. */
beforeAll(async () => {
	const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
	const nativeMatches = HTMLElement.prototype.matches;
	proto.matches = function matches(this: HTMLElement, selector: string): boolean {
		if (selector === ":popover-open") return this.hasAttribute(OPEN_FLAG);
		return nativeMatches.call(this, selector);
	};
	const toggle = (el: HTMLElement, newState: "open" | "closed"): void => {
		el.dispatchEvent(Object.assign(new Event("toggle"), { newState }));
	};
	proto.showPopover = function showPopover(this: HTMLElement): void {
		if (this.hasAttribute(OPEN_FLAG)) return;
		this.setAttribute(OPEN_FLAG, "");
		toggle(this, "open");
	};
	proto.hidePopover = function hidePopover(this: HTMLElement): void {
		if (!this.hasAttribute(OPEN_FLAG)) return;
		this.removeAttribute(OPEN_FLAG);
		toggle(this, "closed");
	};
	await loadFill(popoverManifest, popoverSources);
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
	vi.restoreAllMocks();
});

/** `options: null` leaves the property alone, for the declarative (`options` attribute) path. */
function make(attrs: Record<string, string> = {}, options: unknown = ZONES): ComboboxEl {
	const el = document.createElement("xtyle-combobox") as ComboboxEl;
	for (const [name, value] of Object.entries({ label: "Time zone", ...attrs })) el.setAttribute(name, value);
	document.body.appendChild(el);
	if (options !== null) el.options = options as ReadonlyArray<string>;
	return el;
}

/** Where focus really is: with the element in shadow DOM, `document.activeElement` is the host, and the
 * focused node inside it is the shadow root's own `activeElement`. */
function focused(el: ComboboxEl): Element | null {
	return root(el).activeElement;
}

function root(el: ComboboxEl): ShadowRoot {
	return el.shadowRoot as ShadowRoot;
}

function input(el: ComboboxEl): HTMLInputElement {
	return root(el).querySelector("[data-input]") as HTMLInputElement;
}

function control(el: ComboboxEl): HTMLElement {
	return root(el).querySelector("[data-control]") as HTMLElement;
}

function optionRows(el: ComboboxEl): HTMLElement[] {
	return [...root(el).querySelectorAll<HTMLElement>("[data-option]")];
}

function chips(el: ComboboxEl): HTMLElement[] {
	return [...root(el).querySelectorAll<HTMLElement>("[data-chip]")];
}

function pop(el: ComboboxEl): HTMLElement {
	return root(el).querySelector("[data-pop]") as HTMLElement;
}

function panel(el: ComboboxEl): HTMLElement {
	return (pop(el).shadowRoot as ShadowRoot).querySelector(".xtyle-popover__panel") as HTMLElement;
}

function type(el: ComboboxEl, text: string): void {
	const field = input(el);
	field.value = text;
	field.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
}

function key(el: ComboboxEl, name: string): KeyboardEvent {
	const event = new KeyboardEvent("keydown", { key: name, bubbles: true, composed: true, cancelable: true });
	input(el).dispatchEvent(event);
	return event;
}

function click(node: HTMLElement): void {
	node.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, cancelable: true }));
}

describe("filterOptions (the pure narrowing)", () => {
	it("matches case-insensitively across both the label and the value", () => {
		expect(filterOptions(ZONES, "london").map((o) => o.value)).toEqual(["Europe/London"]);
		expect(filterOptions(ZONES, "europe").map((o) => o.value)).toEqual(["Europe/London", "Europe/Berlin"]);
	});

	it("honors the prefix mode", () => {
		expect(filterOptions(ZONES, "asia", "starts").map((o) => o.value)).toEqual(["Asia/Tokyo"]);
		expect(filterOptions(ZONES, "tokyo", "starts").map((o) => o.value)).toEqual(["Asia/Tokyo"]);
		expect(filterOptions(ZONES, "okyo", "starts")).toEqual([]);
	});

	it("leaves the list alone in `none` mode — the server already filtered it", () => {
		expect(filterOptions(ZONES, "nothing-matches-this", "none")).toHaveLength(ZONES.length);
	});

	it("never filters on an empty query", () => {
		expect(filterOptions(ZONES, "   ")).toHaveLength(ZONES.length);
	});

	it("falls back to the value when an option carries no label", () => {
		expect(optionLabel({ value: "bug" })).toBe("bug");
		expect(optionLabel({ value: "Europe/London", label: "London" })).toBe("London");
	});
});

describe("parseValueList (the declarative `values` attribute)", () => {
	it("reads a JSON array — what the bindings emit", () => {
		expect(parseValueList('["bug", "docs"]')).toEqual(["bug", "docs"]);
	});

	it("reads a comma list — what a hand-written author reaches for", () => {
		expect(parseValueList("bug, docs ,enhancement")).toEqual(["bug", "docs", "enhancement"]);
	});

	it("is empty for empty input", () => {
		expect(parseValueList("  ")).toEqual([]);
		expect(parseValueList("[]")).toEqual([]);
	});
});

describe("<xtyle-combobox> the option contract", () => {
	it("takes the same shapes Field and Select take: a string[], a {value,label}[], or a JSON attribute", () => {
		expect(make({}, ["main", "dev"]).visibleOptions).toEqual([{ value: "main" }, { value: "dev" }]);
		expect(make({}, ZONES).visibleOptions).toHaveLength(4);
		const declarative = make({ options: '["a","b"]' }, null);
		expect(declarative.visibleOptions).toEqual([{ value: "a" }, { value: "b" }]);
	});

	it("renders no options at all while closed, so the pre-hydration paint is just the input", () => {
		const el = make();
		expect(optionRows(el)).toHaveLength(0);
	});
});

describe("<xtyle-combobox> the WAI-ARIA combobox pattern", () => {
	it("wires the input as a combobox pointing at its listbox", () => {
		const el = make();
		const list = root(el).querySelector("[data-list]") as HTMLElement;
		expect(input(el).getAttribute("role")).toBe("combobox");
		expect(input(el).getAttribute("aria-autocomplete")).toBe("list");
		expect(input(el).getAttribute("aria-expanded")).toBe("false");
		expect(input(el).getAttribute("aria-controls")).toBe(list.id);
		expect(list.getAttribute("role")).toBe("listbox");
	});

	it("says it is expanded once the list opens, and stops saying so when it closes", () => {
		const el = make();
		key(el, "ArrowDown");
		expect(el.open).toBe(true);
		expect(input(el).getAttribute("aria-expanded")).toBe("true");
		key(el, "Escape");
		expect(el.open).toBe(false);
		expect(input(el).getAttribute("aria-expanded")).toBe("false");
	});

	it("carries the keyboard cursor on aria-activedescendant — focus never leaves the input", () => {
		const el = make();
		input(el).focus();
		key(el, "ArrowDown");
		const rows = optionRows(el);
		expect(input(el).getAttribute("aria-activedescendant")).toBe(rows[0].id);
		expect(rows[0].getAttribute("data-active")).toBe("true");
		expect(focused(el)).toBe(input(el));
	});

	it("moves the cursor with the arrows, wrapping at both ends", () => {
		const el = make();
		key(el, "ArrowDown");
		key(el, "ArrowDown");
		expect(input(el).getAttribute("aria-activedescendant")).toBe(optionRows(el)[1].id);
		key(el, "ArrowUp");
		key(el, "ArrowUp");
		// wrapped off the top onto the last row
		expect(input(el).getAttribute("aria-activedescendant")).toBe(optionRows(el)[3].id);
	});

	it("jumps to the first and last match with Home and End", () => {
		const el = make();
		key(el, "ArrowDown");
		key(el, "End");
		expect(input(el).getAttribute("aria-activedescendant")).toBe(optionRows(el)[3].id);
		key(el, "Home");
		expect(input(el).getAttribute("aria-activedescendant")).toBe(optionRows(el)[0].id);
	});

	it("opens onto the last option on ArrowUp from a closed list", () => {
		const el = make();
		key(el, "ArrowUp");
		expect(el.open).toBe(true);
		expect(input(el).getAttribute("aria-activedescendant")).toBe(optionRows(el)[3].id);
	});

	it("marks the listbox multiselectable only in the multi posture", () => {
		expect(root(make()).querySelector("[data-list]")?.hasAttribute("aria-multiselectable")).toBe(false);
		expect(root(make({ multiple: "" })).querySelector("[data-list]")?.getAttribute("aria-multiselectable")).toBe(
			"true",
		);
	});

	it("leaves Enter alone when there is nothing to commit, so the form still submits", () => {
		const el = make();
		expect(key(el, "Enter").defaultPrevented).toBe(false);
	});

	it("names the control, the description, and the error the way a form control must", () => {
		const el = make({ description: "Pick a zone", error: "Required", invalid: "", required: "" });
		const described = input(el).getAttribute("aria-describedby") ?? "";
		expect(described).toContain("-desc");
		expect(described).toContain("-error");
		expect(input(el).getAttribute("aria-required")).toBe("true");
		expect(input(el).getAttribute("aria-invalid")).toBe("true");
		expect((root(el).querySelector("[data-label]") as HTMLElement).getAttribute("for")).toBe(input(el).id);
	});

	it("warns when the input has no accessible name at all", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const el = document.createElement("xtyle-combobox");
		document.body.appendChild(el);
		expect(warn).toHaveBeenCalled();
	});
});

describe("<xtyle-combobox> type-ahead", () => {
	it("filters the list as the user types, and makes the first match active", () => {
		const el = make();
		type(el, "lon");
		expect(el.open).toBe(true);
		expect(optionRows(el).map((row) => row.dataset.value)).toEqual(["Europe/London"]);
		expect(input(el).getAttribute("aria-activedescendant")).toBe(optionRows(el)[0].id);
	});

	it("shows the empty message when nothing matches, and nothing else", () => {
		const el = make({ "empty-text": "No zones" });
		type(el, "zzz");
		expect(optionRows(el)).toHaveLength(0);
		const empty = root(el).querySelector("[data-empty]") as HTMLElement;
		expect(empty.hasAttribute("hidden")).toBe(false);
		expect(empty.textContent).toBe("No zones");
	});

	it("does not filter under `filter=\"none\"` — the async path shows exactly what it is given", () => {
		const el = make({ filter: "none" });
		type(el, "zzz");
		expect(optionRows(el)).toHaveLength(4);
	});

	it("exposes the typed text as `query`, distinct from the committed `value`", () => {
		const el = make();
		type(el, "ber");
		expect(el.query).toBe("ber");
		expect(el.value).toBe("");
		key(el, "Enter");
		expect(el.value).toBe("Europe/Berlin");
		expect(el.query).toBe("Berlin");
	});
});

describe("<xtyle-combobox> single-select", () => {
	it("commits the active option on Enter, closes, and shows its label", () => {
		const el = make();
		key(el, "ArrowDown");
		key(el, "ArrowDown");
		key(el, "Enter");
		expect(el.value).toBe("Europe/Berlin");
		expect(el.open).toBe(false);
		expect(input(el).value).toBe("Berlin");
		expect(el.getAttribute("value")).toBe("Europe/Berlin");
	});

	it("commits on an option click", () => {
		const el = make();
		key(el, "ArrowDown");
		click(optionRows(el)[2]);
		expect(el.value).toBe("America/New_York");
		expect(el.open).toBe(false);
	});

	it("fires change and select, and select carries the value and its label", () => {
		const el = make();
		const changes: string[] = [];
		const picks: { value: string; label: string; selected: boolean }[] = [];
		el.addEventListener("change", () => changes.push(el.value));
		el.addEventListener("select", (event) => picks.push((event as CustomEvent).detail));
		key(el, "ArrowDown");
		key(el, "Enter");
		expect(changes).toEqual(["Europe/London"]);
		expect(picks).toEqual([{ value: "Europe/London", label: "London", selected: true }]);
	});

	it("marks the chosen row selected", () => {
		const el = make({ value: "Asia/Tokyo" });
		key(el, "ArrowDown");
		const tokyo = optionRows(el).find((row) => row.dataset.value === "Asia/Tokyo") as HTMLElement;
		expect(tokyo.getAttribute("aria-selected")).toBe("true");
		expect(optionRows(el)[0].getAttribute("aria-selected")).toBe("false");
	});

	it("shows the selected label in the input when it starts with a value", () => {
		expect(input(make({ value: "Asia/Tokyo" })).value).toBe("Tokyo");
	});

	it("names a value the options could not name yet when the list arrives late (the async path)", () => {
		const el = make({ value: "Asia/Tokyo" }, null);
		expect(input(el).value).toBe("Asia/Tokyo");
		el.options = ZONES;
		expect(input(el).value).toBe("Tokyo");
	});

	// the committed label sits in the input — but it is the selection echoed back, not a query, so reopening
	// the list must still offer every option rather than the one row that happens to match the box's text
	it("reopens onto the whole list after a commit, not just the row it matches", () => {
		const el = make();
		key(el, "ArrowDown");
		key(el, "Enter");
		expect(el.value).toBe("Europe/London");
		key(el, "ArrowDown");
		expect(optionRows(el)).toHaveLength(4);
		expect(el.visibleOptions).toHaveLength(4);
	});

	it("refuses a value the list never offered unless allow-custom is set", () => {
		const strict = make();
		type(strict, "Mars/Olympus");
		key(strict, "Enter");
		expect(strict.value).toBe("");

		const loose = make({ "allow-custom": "" });
		type(loose, "Mars/Olympus");
		key(loose, "Enter");
		expect(loose.value).toBe("Mars/Olympus");
	});

	it("snaps the query back to the selection when a stray edit is abandoned", () => {
		const el = make({ value: "Asia/Tokyo" });
		type(el, "not a zone");
		key(el, "Escape"); // closes
		key(el, "Escape"); // clears the stray query
		expect(input(el).value).toBe("Tokyo");
		expect(el.value).toBe("Asia/Tokyo");
	});
});

describe("<xtyle-combobox> multi-select (the tag input)", () => {
	it("keeps the list open, chips each pick, and empties the query", () => {
		const el = make({ multiple: "" });
		type(el, "lon");
		key(el, "Enter");
		expect(el.values).toEqual(["Europe/London"]);
		expect(el.open).toBe(true);
		expect(el.query).toBe("");
		expect(chips(el).map((chip) => chip.textContent?.trim())).toEqual(["London"]);
	});

	it("leaves the cursor on the row it just picked, so the next pick is one Arrow away", () => {
		const el = make({ multiple: "" });
		key(el, "ArrowDown");
		key(el, "Enter");
		expect(input(el).getAttribute("aria-activedescendant")).toBe(optionRows(el)[0].id);
		key(el, "ArrowDown");
		key(el, "Enter");
		expect(el.values).toEqual(["Europe/London", "Europe/Berlin"]);
	});

	it("toggles a value back out when it is picked twice", () => {
		const el = make({ multiple: "" });
		key(el, "ArrowDown");
		click(optionRows(el)[0]);
		click(optionRows(el)[0]);
		expect(el.values).toEqual([]);
	});

	it("removes a chip through its own remove button", () => {
		const el = make({ multiple: "", values: '["Europe/London","Asia/Tokyo"]' });
		expect(chips(el)).toHaveLength(2);
		click(chips(el)[0].querySelector("[data-chip-remove]") as HTMLElement);
		expect(el.values).toEqual(["Asia/Tokyo"]);
		expect(chips(el)).toHaveLength(1);
	});

	it("takes the last chip back on Backspace against an empty query, and never mid-word", () => {
		const el = make({ multiple: "", values: '["Europe/London","Asia/Tokyo"]' });
		type(el, "ber");
		key(el, "Backspace");
		expect(el.values).toEqual(["Europe/London", "Asia/Tokyo"]);
		type(el, "");
		key(el, "Backspace");
		expect(el.values).toEqual(["Europe/London"]);
	});

	it("clears the lot with the clear action", () => {
		const el = make({ multiple: "", clearable: "", values: '["Europe/London","Asia/Tokyo"]' });
		const clear = root(el).querySelector("[data-clear]") as HTMLElement;
		expect(clear.hasAttribute("hidden")).toBe(false);
		click(clear);
		expect(el.values).toEqual([]);
		expect(chips(el)).toHaveLength(0);
		expect(clear.hasAttribute("hidden")).toBe(true);
	});

	it("reflects the selection as a JSON `values` attribute, and reads one back", () => {
		const el = make({ multiple: "" });
		el.values = ["Asia/Tokyo", "Europe/Berlin"];
		expect(el.getAttribute("values")).toBe('["Asia/Tokyo","Europe/Berlin"]');
		expect(chips(el)).toHaveLength(2);
	});

	it("takes a JSON string on the property too — the path a framework's prop-setting takes", () => {
		const el = make({ multiple: "" });
		(el as unknown as { values: unknown }).values = '["Asia/Tokyo"]';
		expect(el.values).toEqual(["Asia/Tokyo"]);
	});
});

describe("<xtyle-combobox> Tab (take it and go)", () => {
	it("commits the option the list is pointing at, and still lets focus leave", () => {
		const el = make();
		type(el, "ber");
		const event = key(el, "Tab");
		expect(el.value).toBe("Europe/Berlin");
		expect(input(el).value).toBe("Berlin");
		expect(el.open).toBe(false);
		expect(event.defaultPrevented).toBe(false);
	});

	it("chips the active option in multi-select and closes behind the departing focus", () => {
		const el = make({ multiple: "" });
		type(el, "lon");
		key(el, "Tab");
		expect(el.values).toEqual(["Europe/London"]);
		expect(el.open).toBe(false);
		expect(chips(el).map((chip) => chip.textContent?.trim())).toEqual(["London"]);
	});

	it("takes the typed text under allow-custom, the way Enter does", () => {
		const el = make({ "allow-custom": "" });
		type(el, "Mars/Olympus");
		key(el, "Tab");
		expect(el.value).toBe("Mars/Olympus");
		expect(el.open).toBe(false);
	});

	it("commits nothing when the query matches nothing — it just closes", () => {
		const el = make();
		type(el, "zzz");
		key(el, "Tab");
		expect(el.value).toBe("");
		expect(el.open).toBe(false);
	});

	it("leaves a closed combobox entirely alone", () => {
		const el = make({ value: "Asia/Tokyo" });
		const event = key(el, "Tab");
		expect(event.defaultPrevented).toBe(false);
		expect(el.value).toBe("Asia/Tokyo");
		expect(el.open).toBe(false);
	});
});

describe("<xtyle-combobox> the popup surface", () => {
	it("floats the listbox in a popover, anchored to the control, with the caret left in the input", () => {
		const el = make();
		const anchor = control(el);
		anchor.getBoundingClientRect = () =>
			({ top: 100, left: 40, width: 300, height: 36, right: 340, bottom: 136, x: 40, y: 100 }) as DOMRect;
		input(el).focus();
		key(el, "ArrowDown");
		expect(panel(el).hasAttribute(OPEN_FLAG)).toBe(true);
		expect(panel(el).style.top).toBe("140px"); // the control's bottom + the 4px gap
		expect(focused(el)).toBe(input(el));
	});

	it("hands the panel no listbox role of its own — the ul inside it is the listbox", () => {
		const el = make();
		expect(pop(el).getAttribute("panel-role")).toBe("none");
		expect(panel(el).getAttribute("role")).toBe("none");
	});

	it("follows the panel's own dismissal back into its state", () => {
		const el = make();
		key(el, "ArrowDown");
		expect(el.open).toBe(true);
		(panel(el) as HTMLElement & { hidePopover(): void }).hidePopover();
		expect(el.open).toBe(false);
		expect(input(el).getAttribute("aria-expanded")).toBe("false");
	});

	it("closes when focus leaves the component entirely", () => {
		const el = make();
		const elsewhere = document.createElement("button");
		document.body.appendChild(elsewhere);
		key(el, "ArrowDown");
		input(el).dispatchEvent(
			new FocusEvent("focusout", { relatedTarget: elsewhere, bubbles: true, composed: true }),
		);
		expect(el.open).toBe(false);
	});

	it("opens on a click in the control and closes again on the caret", () => {
		const el = make();
		click(control(el));
		expect(el.open).toBe(true);
		click(root(el).querySelector("[data-toggle]") as HTMLElement);
		expect(el.open).toBe(false);
	});

	it("never opens when disabled or readonly", () => {
		const off = make({ disabled: "" });
		key(off, "ArrowDown");
		click(control(off));
		expect(off.open).toBe(false);

		const frozen = make({ readonly: "" });
		key(frozen, "ArrowDown");
		expect(frozen.open).toBe(false);
	});

	it("swallows the input's own text-selection `select` so it can never read as a choice", () => {
		const el = make();
		let heard = 0;
		el.addEventListener("select", () => heard++);
		input(el).dispatchEvent(new Event("select", { bubbles: true }));
		expect(heard).toBe(0);
	});
});

describe("<xtyle-combobox> form participation", () => {
	it("mirrors the selection onto hidden inputs under the field name — one per value", () => {
		const el = make({ name: "zone", value: "Asia/Tokyo" });
		const hidden = [...root(el).querySelectorAll<HTMLInputElement>("input[data-form-value]")];
		expect(hidden).toHaveLength(1);
		expect(hidden[0].type).toBe("hidden");
		expect(hidden[0].name).toBe("zone");
		expect(hidden[0].value).toBe("Asia/Tokyo");
	});

	it("posts a multi-select the way a native multiple select does: the name repeated", () => {
		const el = make({ name: "labels", multiple: "", values: '["bug","docs"]' });
		const hidden = [...root(el).querySelectorAll<HTMLInputElement>("input[data-form-value]")];
		expect(hidden.map((node) => [node.name, node.value])).toEqual([
			["labels", "bug"],
			["labels", "docs"],
		]);
	});

	it("keeps the hidden inputs in step with the selection, and never renders them", () => {
		const el = make({ name: "zone" });
		key(el, "ArrowDown");
		key(el, "Enter");
		const hidden = root(el).querySelector<HTMLInputElement>("input[data-form-value]") as HTMLInputElement;
		expect(hidden.value).toBe("Europe/London");
		// plumbing, not chrome: it lives outside the fill's tree entirely
		expect(hidden.closest("[data-root]")).toBe(null);
	});

	it("carries no hidden input without a name — an unnamed control posts nothing", () => {
		const el = make({ value: "Asia/Tokyo" });
		expect(root(el).querySelector("input[data-form-value]")).toBe(null);
	});
});

describe("<xtyle-combobox> SSR (the pre-hydration paint)", () => {
	const ssr = (bindings: Record<string, unknown>): Promise<string> =>
		renderFragmentLight("combobox", {
			inputId: "cb-input",
			listId: "cb-list",
			descriptionId: "cb-desc",
			errorId: "cb-error",
			label: "Time zone",
			placeholder: "Start typing…",
			query: "",
			size: "md",
			multiple: false,
			open: false,
			disabled: false,
			readonly: false,
			invalid: false,
			required: false,
			clearable: false,
			description: null,
			error: null,
			emptyText: "No matches",
			activeId: null,
			showClear: false,
			options: [],
			chips: [],
			...bindings,
		});

	it("ships the control named, wired, and closed", async () => {
		const html = await ssr({});
		expect(html).toContain('id="cb-input"');
		expect(html).toContain('aria-controls="cb-list"');
		expect(html).toContain('aria-expanded="false"');
		expect(html).toContain('role="listbox"');
		expect(html).toContain("Time zone");
	});

	it("paints no options and no empty message while closed, so nothing flashes under the input", async () => {
		const html = await ssr({});
		expect(html).not.toContain("data-option");
		expect(html).toMatch(/<p[^>]*data-empty[^>]*\bhidden="hidden"/);
	});

	it("paints the chips a multi-select starts with", async () => {
		const html = await ssr({ multiple: true, chips: [{ value: "bug", label: "bug" }] });
		expect(html).toContain('data-value="bug"');
		expect(html).toContain("xtyle-combobox__chip");
		expect(html).not.toMatch(/<span[^>]*data-chips[^>]*\bhidden="hidden"/);
	});

	it("ships the popover the listbox floats in, so hydration has something to upgrade", async () => {
		const html = await ssr({});
		expect(html).toContain("<xtyle-popover");
		expect(html).toContain('panel-role="none"');
	});
});

describe("<xtyle-combobox> the mod seam", () => {
	it("draws the check and the caret as real nodes, not stylesheet furniture", () => {
		const el = make({ value: "Asia/Tokyo" });
		key(el, "ArrowDown");
		const tokyo = optionRows(el).find((row) => row.dataset.value === "Asia/Tokyo") as HTMLElement;
		expect(tokyo.querySelector(".xtyle-combobox__check")?.hasAttribute("hidden")).toBe(false);
		expect(optionRows(el)[0].querySelector(".xtyle-combobox__check")?.hasAttribute("hidden")).toBe(true);
		expect(root(el).querySelector(".xtyle-combobox__caret")).toBeInstanceOf(SVGElement);
	});
});
