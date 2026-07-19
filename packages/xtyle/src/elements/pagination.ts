import { XtyleElement, define, type StyleMode } from "./base.js";
import { paginationHostCss } from "../markup/index.js";
import type { FullTone, Size } from "../index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/pagination/source.generated.js";
import { resolveTone, resolveVocab, SIZES } from "../vocab.js";

/**
 * A page navigator: previous/next controls around a windowed list of page numbers with ellipses.
 * When an `href` template is set the pages render as links (zero-JS navigation); otherwise they
 * render as buttons and the element emits a `page-change` event carrying the chosen page.
 */
export class XtylePagination extends XtyleElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "pagination", {
		applyIntent: () => {},
	});
	private clickWired = false;

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["page", "total", "siblings", "boundaries", "href", "tone", "size", "label", "prev-label", "next-label"];
	}

	get page(): number {
		return Math.max(1, Number(this.getAttribute("page") ?? 1) || 1);
	}
	set page(value: number) {
		this.setAttribute("page", String(value));
	}

	get total(): number {
		return Math.max(1, Number(this.getAttribute("total") ?? 1) || 1);
	}
	set total(value: number) {
		this.setAttribute("total", String(value));
	}

	get siblings(): number {
		return Math.max(0, Number(this.getAttribute("siblings") ?? 1) || 0);
	}
	set siblings(value: number) {
		this.setAttribute("siblings", String(value));
	}

	get boundaries(): number {
		return Math.max(1, Number(this.getAttribute("boundaries") ?? 1) || 1);
	}
	set boundaries(value: number) {
		this.setAttribute("boundaries", String(value));
	}

	get href(): string | null {
		return this.getAttribute("href");
	}
	set href(value: string | null | undefined) {
		this.reflectString("href", value);
	}

	get tone(): FullTone {
		return resolveTone(this.getAttribute("tone"), "accent");
	}
	set tone(value: FullTone) {
		this.setAttribute("tone", value);
	}

	get size(): Size {
		return resolveVocab(this.getAttribute("size"), SIZES, "md", "pagination size");
	}
	set size(value: Size) {
		this.setAttribute("size", value);
	}

	get label(): string {
		return this.getAttribute("label") ?? "Pagination";
	}
	set label(value: string | null | undefined) {
		this.reflectString("label", value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			page: this.page,
			total: this.total,
			siblings: this.siblings,
			boundaries: this.boundaries,
			href: this.href ?? undefined,
			tone: this.tone,
			size: this.size,
			label: this.label,
			prevLabel: this.getAttribute("prev-label") ?? undefined,
			nextLabel: this.getAttribute("next-label") ?? undefined,
		};
	}

	/** Inputs that change the rendered list structure; a diff here triggers remount rather than patch. */
	private shapeSignature(): string {
		return JSON.stringify({
			page: this.page,
			total: this.total,
			siblings: this.siblings,
			boundaries: this.boundaries,
			href: this.href,
		});
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(paginationHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		this.wireClicks();
	}

	/** In button mode (no `href`) emit `page-change` when a page or control is activated; links navigate on their own. */
	private wireClicks(): void {
		if (this.clickWired || this.href !== null) return;
		this.clickWired = true;
		this.root.addEventListener("click", (event) => {
			const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-page]");
			if (!target) return;
			const page = Number(target.getAttribute("data-page"));
			if (!Number.isInteger(page) || page === this.page) return;
			this.dispatchEvent(new CustomEvent("page-change", { bubbles: true, composed: true, detail: { page } }));
		});
	}
}

define("xtyle-pagination", XtylePagination);
