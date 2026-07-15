import { XtyleDecoratorElement, define } from "./base.js";
import { tableParts } from "../markup/table.js";
import "./icon.js";

type TableVariant = "default" | "striped" | "bordered";
type TableSize = "normal" | "compact";

const SORT_ICON = "chevron-down";

export class XtyleTable extends XtyleDecoratorElement {
	static get observedAttributes(): string[] {
		return ["variant", "size", "hover", "sticky", "max-height"];
	}

	get variant(): TableVariant {
		return (this.getAttribute("variant") as TableVariant) ?? "default";
	}
	set variant(value: TableVariant) {
		this.setAttribute("variant", value);
	}

	get size(): TableSize {
		return (this.getAttribute("size") as TableSize) ?? "normal";
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
