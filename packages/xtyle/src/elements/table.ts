import { define } from "./base.js";

type TableVariant = "default" | "striped" | "bordered";
type TableSize = "normal" | "compact";

const SORT_GLYPH = `<span class="xtyle-table__sort" aria-hidden="true"><svg viewBox="0 0 24 24" width="1em" height="1em"><path fill="currentColor" d="M12 8l5 6H7l5-6Z" /></svg></span>`;

export class XtyleTable extends HTMLElement {
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
		this.decorate();
		this.observeOverflow();
		this.observeContent();
	}

	disconnectedCallback(): void {
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

	private reflectBoolean(name: string, value: boolean): void {
		if (value) this.setAttribute(name, "");
		else this.removeAttribute(name);
	}

	private get computedTableClass(): string[] {
		return [
			"xtyle-table",
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
		this.classList.add("xtyle-table-wrap");
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

		table.classList.add("xtyle-table");
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

		table.querySelector("thead")?.classList.add("xtyle-table__head");
		table.querySelector("tbody")?.classList.add("xtyle-table__body");
		for (const row of Array.from(table.querySelectorAll("tr"))) row.classList.add("xtyle-table__row");
		for (const cell of Array.from(table.querySelectorAll("td"))) cell.classList.add("xtyle-table__cell");
		for (const header of Array.from(table.querySelectorAll("th"))) {
			header.classList.add("xtyle-table__header-cell");
			this.decorateHeader(header);
		}
		for (const caption of Array.from(table.querySelectorAll("caption"))) {
			caption.classList.add("xtyle-table__caption");
		}
		for (const footCell of Array.from(table.querySelectorAll("tfoot td, tfoot th"))) {
			footCell.classList.remove("xtyle-table__cell", "xtyle-table__header-cell");
			footCell.classList.add("xtyle-table__footer-cell");
		}
	}

	private decorateHeader(header: Element): void {
		const sortable = header.hasAttribute("data-sortable") || header.hasAttribute("aria-sort");
		if (!sortable) return;
		header.classList.add("xtyle-table__header-cell--sortable");
		if (!header.hasAttribute("tabindex")) header.setAttribute("tabindex", "0");
		if (!header.hasAttribute("aria-sort")) header.setAttribute("aria-sort", "none");
		if (!header.querySelector(".xtyle-table__header-content")) {
			const content = document.createElement("span");
			content.className = "xtyle-table__header-content";
			while (header.firstChild) content.appendChild(header.firstChild);
			content.insertAdjacentHTML("beforeend", SORT_GLYPH);
			header.appendChild(content);
		}
	}
}

define("xtyle-table", XtyleTable);
