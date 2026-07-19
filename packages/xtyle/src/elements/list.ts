import { XtyleElement, define, type StyleMode } from "./base.js";
import type { Size } from "../index.js";
import {
	listHostCss,
	normalizeItems,
	seededSelection,
	type ListItem,
	type ListInput,
	type ListInteraction,
	type ListSelection,
	type ListOrientation,
} from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { resolveRoving, SelectionModel } from "./collection/index.js";
import { manifest, fragmentSources } from "./fragments/list/source.generated.js";
import { resolveVocab, LIST_INTERACTIONS, LIST_SELECTIONS, ORIENTATIONS, SIZES } from "../vocab.js";

export type { ListItem, ListAction, ListInput } from "../markup/index.js";

interface ListNavContext {
	navItems: Array<{ key: string; skip?: boolean }>;
	interaction: string;
	selection: string;
	orientation: string;
}

export class XtyleList extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private itemsProp: ListItem[] | null = null;
	private rovingValue: string | null = null;
	private selection = new SelectionModel("none");
	private seeded = false;
	private elementId = `xtyle-list-${Math.random().toString(36).slice(2, 8)}`;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "list", {
		context: (handler) =>
			handler === "navKeydown" || handler === "selectItem" ? this.navContext() : undefined,
		applyIntent: (intent, event) => this.applyIntent(intent, event),
	});

	static get observedAttributes(): string[] {
		return ["items", "options", "interaction", "selection", "orientation", "size", "label", "labelledby", "aria-label"];
	}

	get items(): ListItem[] {
		if (this.itemsProp) return this.itemsProp;
		const raw = this.getAttribute("items");
		if (raw) {
			try {
				return normalizeItems(JSON.parse(raw) as ListInput);
			} catch {
				return normalizeItems(raw);
			}
		}
		return normalizeItems(this.getAttribute("options"));
	}
	set items(value: ListInput | null | undefined) {
		this.itemsProp = value == null ? null : normalizeItems(value);
		this.reseed();
		if (this.root.firstChild) this.render();
	}

	get interaction(): ListInteraction {
		return resolveVocab(this.getAttribute("interaction"), LIST_INTERACTIONS, "navigational", "list interaction");
	}
	set interaction(value: ListInteraction) {
		this.setAttribute("interaction", value);
	}

	get selectionMode(): ListSelection {
		return resolveVocab(this.getAttribute("selection"), LIST_SELECTIONS, "none", "list selection");
	}
	set selectionMode(value: ListSelection) {
		this.setAttribute("selection", value);
	}

	get orientation(): ListOrientation {
		return resolveVocab(this.getAttribute("orientation"), ORIENTATIONS, "vertical", "list orientation");
	}
	set orientation(value: ListOrientation) {
		this.setAttribute("orientation", value);
	}

	get size(): Size {
		return resolveVocab(this.getAttribute("size"), SIZES, "md", "list size");
	}
	set size(value: Size) {
		this.setAttribute("size", value);
	}

	/** The selected item values (empty in `none`, at most one in `single`). */
	get selected(): string[] {
		return this.selection.selectedKeys();
	}
	set selected(values: string[]) {
		this.selection.reset(values);
		this.seeded = true;
		if (this.root.firstChild) this.render();
	}

	/** The first selected value, for single-select convenience. */
	get value(): string | null {
		return this.selection.selectedKeys()[0] ?? null;
	}

	attributeChangedCallback(name: string): void {
		if (name === "selection") {
			this.selection.setMode(this.selectionMode);
			this.seeded = false;
		}
		if (name === "items" || name === "options") this.reseed();
		if (this.root.firstChild) this.render();
	}

	/** Seed the selection model from the items' authored `selected` flags on first data, then keep it
	 * host-owned — a later data swap retains the live keys rather than re-seeding (mirrors tree). */
	private reseed(): void {
		this.selection.setMode(this.selectionMode);
		if (!this.seeded) {
			this.selection.reset(seededSelection(this.items, this.selectionMode));
			this.seeded = true;
			return;
		}
		this.selection.retain(new Set(this.items.map((item) => item.value)));
		if (this.rovingValue !== null && !this.items.some((item) => item.value === this.rovingValue)) {
			this.rovingValue = null;
		}
	}

	private navItems(): Array<{ key: string; skip?: boolean }> {
		return this.items.map((item) => ({ key: item.value, skip: item.disabled }));
	}

	private ensureRoving(): string | null {
		if (this.interaction === "static") return null;
		return resolveRoving(this.navItems(), [this.rovingValue, this.selection.selectedKeys()[0] ?? null]);
	}

	private navContext(): ListNavContext {
		return {
			navItems: this.navItems(),
			interaction: this.interaction,
			selection: this.selectionMode,
			orientation: this.orientation,
		};
	}

	private get bindings(): Record<string, unknown> {
		return {
			items: this.items,
			interaction: this.interaction,
			selection: this.selectionMode,
			orientation: this.orientation,
			size: this.size,
			selectedKeys: this.selection.selectedKeys(),
			rovingValue: this.ensureRoving(),
			label: this.getAttribute("label"),
			labelledby: this.getAttribute("labelledby"),
			ariaLabel: this.getAttribute("aria-label"),
			elementId: this.elementId,
		};
	}

	private shapeSignature(): string {
		return `${this.interaction}|${this.selectionMode}|${this.orientation}|${this.size}|${JSON.stringify(this.items)}`;
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (intent.preventDefault) event.preventDefault();
		if (intent.stopPropagation) event.stopPropagation();
		if (intent.emit) {
			this.dispatchEvent(new CustomEvent(intent.emit.type, { bubbles: true, composed: true, detail: intent.emit.detail }));
		}
		if (intent.select !== undefined) {
			const key = intent.select;
			const order = this.items.map((item) => item.value);
			if (intent.selectMode === "toggle") this.selection.toggle(key);
			else if (intent.selectMode === "range") this.selection.extendTo(key, order);
			else this.selection.replaceWith(key);
			this.dispatchEvent(
				new CustomEvent("change", {
					bubbles: true,
					composed: true,
					detail: { value: key, selected: this.selection.selectedKeys() },
				}),
			);
		}
		if (intent.activate !== undefined) {
			this.dispatchEvent(new CustomEvent("select", { bubbles: true, composed: true, detail: { value: intent.activate } }));
		}
		if (intent.focus !== undefined) this.rovingValue = intent.focus;
		this.render();
		if (intent.focus !== undefined) {
			this.root
				.querySelector<HTMLElement>(`.xtyle-list__item[data-value="${CSS.escape(intent.focus)}"]`)
				?.focus();
		}
	}

	private warnIfUnnamed(): void {
		if (!this.getAttribute("label") && !this.getAttribute("labelledby") && !this.getAttribute("aria-label")) {
			console.warn("xtyle-list: no accessible name. Provide a `label`, `labelledby`, or `aria-label` so the list is announced.");
		}
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(listHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		this.warnIfUnnamed();
	}
}

define("xtyle-list", XtyleList);
