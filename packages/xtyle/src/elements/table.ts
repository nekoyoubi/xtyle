import { XtyleDecoratorElement, define } from "./base.js";
import { tableParts } from "../markup/table.js";
import { SelectionModel, resolveRoving, linearNav, type SelectionMode } from "./collection/index.js";
import "./icon.js";
import { TABLE_VARIANTS, TABLE_SIZES, resolveVocab, SELECTION_MODES } from "../vocab.js";

type TableVariant = (typeof TABLE_VARIANTS)[number];
type TableSize = (typeof TABLE_SIZES)[number];

const SORT_ICON = "chevron-down";

export class XtyleTable extends XtyleDecoratorElement {
	static get observedAttributes(): string[] {
		return ["variant", "size", "hover", "sticky", "max-height", "selection"];
	}

	/** Row selection — the table's consumption of the shared collection core (host-side, no fragment).
	 * `none` leaves the native table untouched; any other mode makes the body rows a selectable,
	 * arrow-navigable grid keyed by each row's `data-value` (or its index). */
	get selection(): SelectionMode {
		return resolveVocab(this.getAttribute("selection"), SELECTION_MODES, "none", "table selection");
	}
	set selection(value: SelectionMode) {
		this.setAttribute("selection", value);
	}

	private selectionModel = new SelectionModel("none");
	private rovingKey: string | null = null;
	private seeded = false;
	private selectionWired = false;

	/** The selected row values. */
	get selected(): string[] {
		return this.selectionModel.selectedKeys();
	}

	get variant(): TableVariant {
		return resolveVocab(this.getAttribute("variant"), TABLE_VARIANTS, "default", "table variant");
	}
	set variant(value: TableVariant) {
		this.setAttribute("variant", value);
	}

	get size(): TableSize {
		return resolveVocab(this.getAttribute("size"), TABLE_SIZES, "normal", "table size");
	}
	set size(value: TableSize) {
		this.setAttribute("size", value);
	}

	get hover(): boolean {
		return this.hasAttribute("hover");
	}
	set hover(value: boolean) {
		this.reflectBoolean("hover", value);
	}

	get sticky(): boolean {
		return this.hasAttribute("sticky");
	}
	set sticky(value: boolean) {
		this.reflectBoolean("sticky", value);
	}

	private overflowObserver: ResizeObserver | null = null;
	private contentObserver: MutationObserver | null = null;

	connectedCallback(): void {
		super.connectedCallback();
		this.wireSelection();
		this.decorate();
		this.observeOverflow();
		this.observeContent();
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.overflowObserver?.disconnect();
		this.overflowObserver = null;
		this.contentObserver?.disconnect();
		this.contentObserver = null;
	}

	/** `decorate()` classes the light-DOM `<table>` once. A reactive framework recreating rows
	 * (a new keyed `{#each}` page, appended columns, live rows) leaves them undecorated, so watch
	 * the subtree and re-decorate when it changes. `decorate()` disconnects this while it runs, so
	 * its own class/attribute writes and the header-wrapper append can't re-trigger the observer. */
	private observeContent(): void {
		if (typeof MutationObserver === "undefined" || this.contentObserver) return;
		this.contentObserver = new MutationObserver(() => {
			if (this.isConnected) this.decorate();
		});
		this.contentObserver.observe(this, { childList: true, subtree: true });
	}

	attributeChangedCallback(): void {
		if (this.isConnected) this.decorate();
	}

	/** The wrapper has `overflow: auto`, so it scrolls whenever its table outgrows it — by a
	 * capped height or just by wide content. That can't be known from markup, so detect it live
	 * and make the scroll region keyboard-reachable only when it actually scrolls. */
	private observeOverflow(): void {
		const check = (): void => this.updateScrollAffordance();
		if (typeof requestAnimationFrame === "function") requestAnimationFrame(check);
		else check();
		if (typeof ResizeObserver !== "undefined" && !this.overflowObserver) {
			this.overflowObserver = new ResizeObserver(check);
			this.overflowObserver.observe(this);
			const table = this.querySelector("table");
			if (table) this.overflowObserver.observe(table);
		}
	}

	private updateScrollAffordance(): void {
		const scrolls = this.scrollWidth > this.clientWidth + 1 || this.scrollHeight > this.clientHeight + 1;
		if (scrolls) {
			if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
		} else if (this.getAttribute("tabindex") === "0") {
			this.removeAttribute("tabindex");
		}
	}

	private get computedTableClass(): string[] {
		return [
			tableParts.table,
			this.variant !== "default" && `xtyle-table--${this.variant}`,
			this.size === "compact" && "xtyle-table--compact",
			this.hover && "xtyle-table--hover",
			this.sticky && "xtyle-table--sticky",
		].filter(Boolean) as string[];
	}

	private decorate(): void {
		this.contentObserver?.disconnect();
		try {
			this.decorateTable();
		} finally {
			if (this.contentObserver && this.isConnected) {
				this.contentObserver.observe(this, { childList: true, subtree: true });
			}
		}
	}

	private decorateTable(): void {
		this.classList.add(tableParts.wrap);
		this.setAttribute("part", "wrap");

		const maxHeight = this.getAttribute("max-height");
		if (maxHeight) this.style.setProperty("--xtyle-table-max-height", maxHeight);
		else this.style.removeProperty("--xtyle-table-max-height");
		this.updateScrollAffordance();

		const table = this.querySelector("table");
		if (!table) {
			console.warn("xtyle-table: no `<table>` child to style. Author a real table and the wrapper styles it.");
			return;
		}

		table.classList.add(tableParts.table);
		for (const cls of this.computedTableClass) table.classList.add(cls);
		table.setAttribute("part", "table");

		if (!table.getAttribute("aria-label") && !table.querySelector("caption") && !this.getAttribute("aria-label")) {
			console.warn(
				"xtyle-table: no `<caption>` or `aria-label` — the table has no accessible name. Add one so it is announced.",
			);
		}
		if (!table.getAttribute("aria-label") && this.getAttribute("aria-label")) {
			table.setAttribute("aria-label", this.getAttribute("aria-label") as string);
		}

		table.querySelector("thead")?.classList.add(tableParts.head);
		table.querySelector("tbody")?.classList.add(tableParts.body);
		for (const row of Array.from(table.querySelectorAll("tr"))) row.classList.add(tableParts.row);
		for (const cell of Array.from(table.querySelectorAll("td"))) cell.classList.add(tableParts.cell);
		for (const header of Array.from(table.querySelectorAll("th"))) {
			header.classList.add(tableParts.headerCell);
			this.decorateHeader(header);
		}
		for (const caption of Array.from(table.querySelectorAll("caption"))) {
			caption.classList.add(tableParts.caption);
		}
		for (const footCell of Array.from(table.querySelectorAll("tfoot td, tfoot th"))) {
			footCell.classList.remove(tableParts.cell, tableParts.headerCell);
			footCell.classList.add(tableParts.footerCell);
		}

		this.applySelection(table);
	}

	// --- Row selection (the collection-core seam) -------------------------------------------------

	private bodyRows(): HTMLElement[] {
		const table = this.querySelector("table");
		return table ? Array.from(table.querySelectorAll<HTMLElement>("tbody tr")) : [];
	}

	private rowKey(row: HTMLElement, index: number): string {
		return row.dataset.value ?? String(index);
	}

	/** ARIA + selection state for the body rows, recomputed on every decorate so a live-data row swap
	 * keeps its marks. `aria-selected`/`tabindex` are attribute writes, which the content observer
	 * (childList only) does not watch, so no disconnect guard is needed here. */
	private applySelection(table: HTMLTableElement): void {
		const mode = this.selection;
		const rows = this.bodyRows();
		if (mode === "none") {
			if (table.getAttribute("role") === "grid") table.removeAttribute("role");
			table.removeAttribute("aria-multiselectable");
			for (const row of rows) {
				row.removeAttribute("aria-selected");
				row.removeAttribute("tabindex");
				delete row.dataset.key;
			}
			return;
		}
		table.setAttribute("role", "grid");
		if (mode === "multi" || mode === "range") table.setAttribute("aria-multiselectable", "true");
		else table.removeAttribute("aria-multiselectable");

		const keys = rows.map((row, i) => this.rowKey(row, i));
		this.selectionModel.setMode(mode);
		if (!this.seeded) {
			const flagged = rows.flatMap((row, i) => (row.hasAttribute("data-selected") ? [this.rowKey(row, i)] : []));
			this.selectionModel.reset(mode === "single" ? flagged.slice(0, 1) : flagged);
			this.seeded = true;
		} else {
			this.selectionModel.retain(new Set(keys));
		}
		this.rovingKey = resolveRoving(
			keys.map((key) => ({ key })),
			[this.rovingKey, this.selectionModel.selectedKeys()[0] ?? null],
		);
		this.markRows(rows);
	}

	private markRows(rows: HTMLElement[]): void {
		rows.forEach((row, i) => {
			const key = this.rowKey(row, i);
			row.dataset.key = key;
			const isSelected = this.selectionModel.isSelected(key);
			row.setAttribute("aria-selected", String(isSelected));
			row.setAttribute("tabindex", key === this.rovingKey ? "0" : "-1");
			const box = row.querySelector<HTMLInputElement>('input[type="checkbox"][data-row-select]');
			if (box) box.checked = isSelected;
		});
	}

	private commitSelection(key: string, mode: "replace" | "toggle" | "range"): void {
		const rows = this.bodyRows();
		const order = rows.map((row, i) => this.rowKey(row, i));
		if (mode === "toggle") this.selectionModel.toggle(key);
		else if (mode === "range") this.selectionModel.extendTo(key, order);
		else this.selectionModel.replaceWith(key);
		this.rovingKey = key;
		this.markRows(rows);
		this.dispatchEvent(
			new CustomEvent("change", {
				bubbles: true,
				composed: true,
				detail: { value: key, selected: this.selectionModel.selectedKeys() },
			}),
		);
	}

	private focusRow(key: string): void {
		this.querySelector<HTMLElement>(`tbody tr[data-key="${CSS.escape(key)}"]`)?.focus();
	}

	private wireSelection(): void {
		if (this.selectionWired) return;
		this.selectionWired = true;
		this.addEventListener("click", (event) => this.onRowClick(event));
		this.addEventListener("keydown", (event) => this.onRowKeydown(event));
	}

	private onRowClick(event: MouseEvent): void {
		if (this.selection === "none") return;
		const target = event.target as HTMLElement;
		const row = target.closest<HTMLElement>("tbody tr");
		if (!row) return;
		const key = row.dataset.key ?? "";
		// A dedicated selection checkbox toggles its row; other interactive controls act on their own.
		if (target.closest('input[type="checkbox"][data-row-select]')) {
			this.commitSelection(key, "toggle");
			return;
		}
		if (target.closest("a, button, input, select, textarea, label, [role='button']")) return;
		const mode = event.shiftKey ? "range" : event.ctrlKey || event.metaKey ? "toggle" : "replace";
		this.commitSelection(key, mode);
	}

	private onRowKeydown(event: KeyboardEvent): void {
		if (this.selection === "none") return;
		const row = (event.target as HTMLElement).closest<HTMLElement>("tbody tr");
		if (!row) return;
		const current = row.dataset.key ?? "";
		const key = event.key;
		if (key === " " || key === "Spacebar") {
			event.preventDefault();
			this.commitSelection(current, this.selection === "single" ? "replace" : "toggle");
			return;
		}
		if (key === "Enter") {
			event.preventDefault();
			this.commitSelection(current, "replace");
			return;
		}
		const rows = this.bodyRows();
		const move = linearNav(
			rows.map((r, i) => ({ key: this.rowKey(r, i) })),
			current,
			key,
			{ orientation: "vertical", homeEnd: true },
		);
		if (move.focus !== undefined) {
			event.preventDefault();
			// Shift+Arrow in range mode extends the selection as the cursor moves.
			if (event.shiftKey && this.selection === "range") this.commitSelection(move.focus, "range");
			else {
				this.rovingKey = move.focus;
				this.markRows(rows);
			}
			this.focusRow(move.focus);
		}
	}

	private decorateHeader(header: Element): void {
		const sortable = header.hasAttribute("data-sortable") || header.hasAttribute("aria-sort");
		if (!sortable) return;
		header.classList.add(tableParts.sortableHeaderCell);
		if (!header.hasAttribute("tabindex")) header.setAttribute("tabindex", "0");
		if (!header.hasAttribute("aria-sort")) header.setAttribute("aria-sort", "none");
		if (!header.querySelector(`.${tableParts.headerContent}`)) {
			const content = document.createElement("span");
			content.className = tableParts.headerContent;
			while (header.firstChild) content.appendChild(header.firstChild);
			content.appendChild(sortGlyph());
			header.appendChild(content);
		}
	}
}

/** The sort caret is an `<xtyle-icon>`, not an inline `<svg>`: the glyph then renders through the
 * icon component's fragment, so a mod that reskins `component.icon` reshapes the caret too. A `<th>`
 * cannot host a fragment of its own (`FragmentHost` binds one root per element), so the icon element
 * is how this glyph reaches the mod surface — and it is why Table, like the other decorators over
 * author-owned markup, declares no fill slot of its own in `component-host.json`: the `<table>` is the
 * author's to edit, and this caret is the only chrome the component invents. */
function sortGlyph(): HTMLElement {
	const glyph = document.createElement("xtyle-icon");
	glyph.className = tableParts.sort;
	glyph.setAttribute("name", SORT_ICON);
	glyph.setAttribute("aria-hidden", "true");
	return glyph;
}

define("xtyle-table", XtyleTable);
