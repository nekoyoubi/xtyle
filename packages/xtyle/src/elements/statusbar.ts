import { XtyleElement, define, type StyleMode } from "./base.js";
import { statusbarHostCss } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/statusbar/source.generated.js";
import { STATUSBAR_OVERFLOWS, resolveVocab } from "../vocab.js";

type Overflow = (typeof STATUSBAR_OVERFLOWS)[number];

interface Cell {
	el: HTMLElement;
	priority: number;
	required: boolean;
	naturalIndex: number;
}

export class XtyleStatusbar extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["live", "label", "overflow", "manual-overflow", "separated"];
	}

	get live(): boolean {
		return this.hasAttribute("live");
	}
	set live(value: boolean) {
		this.reflectBoolean("live", value);
	}

	get manualOverflow(): boolean {
		return this.hasAttribute("manual-overflow");
	}
	set manualOverflow(value: boolean) {
		this.reflectBoolean("manual-overflow", value);
	}

	get label(): string | null {
		return this.getAttribute("label");
	}
	set label(value: string | null | undefined) {
		this.reflectString("label", value);
	}

	get overflow(): Overflow {
		return resolveVocab(this.getAttribute("overflow"), STATUSBAR_OVERFLOWS, "clip", "statusbar overflow");
	}
	set overflow(value: Overflow) {
		this.setAttribute("overflow", value);
	}

	get separated(): boolean {
		return this.hasAttribute("separated");
	}
	set separated(value: boolean) {
		this.reflectBoolean("separated", value);
	}

	private observer: ResizeObserver | null = null;
	private hiddenEls = new Set<HTMLElement>();
	private elementId = `xtyle-statusbar-${Math.random().toString(36).slice(2, 8)}`;
	private lastEmittedHidden: HTMLElement[] | null = null;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "statusbar", {
		applyIntent: () => {},
		afterApply: () => this.armCollapse(),
	});

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.teardownCollapse();
	}

	private get bindings(): Record<string, unknown> {
		return {
			live: this.live,
			label: this.label,
			overflow: this.overflow,
			manualOverflow: this.manualOverflow,
			separated: this.separated,
			elementId: this.elementId,
		};
	}

	/** In `separated` mode, suppress the leading divider on the first *visible* item of each
	 * run (a run being the items between spacers). Static run-starts are handled by CSS
	 * (`:first-child`, `.spacer + .item`); this keeps the rule correct when a run-start collapses. */
	private markRuleStarts(): void {
		if (!this.separated) return;
		let runStart = true;
		for (const el of this.slotElements()) {
			if (el.classList.contains("xtyle-statusbar__spacer")) {
				runStart = true;
				continue;
			}
			if (el.style.display === "none") {
				el.removeAttribute("data-rule-start");
				continue;
			}
			if (runStart) {
				el.setAttribute("data-rule-start", "");
				runStart = false;
			} else {
				el.removeAttribute("data-rule-start");
			}
		}
	}

	/** A signature of the state ops can't patch incrementally: the `live` role/aria-live attrs,
	 * whether an `aria-label` is present, and whether the overflow menu renders. The overflow
	 * *class* is patched on update; these structural facts force a rebuild instead. */
	private shapeSignature(): string {
		const hasMenu = this.overflow === "collapse" && !this.manualOverflow;
		return `${this.live}|${this.label != null}|${hasMenu}`;
	}

	private get menu(): HTMLElement | null {
		return this.root.querySelector(".xtyle-statusbar__overflow");
	}

	private get overflowPopover(): HTMLElement | null {
		return this.root.querySelector(".xtyle-statusbar__overflow-popover");
	}

	private get bar(): HTMLElement | null {
		return this.root.querySelector(".xtyle-statusbar");
	}

	private get defaultSlot(): HTMLSlotElement | null {
		return this.root.querySelector("slot:not([name])") as HTMLSlotElement | null;
	}

	private slotElements(): HTMLElement[] {
		const slot = this.root.querySelector("slot:not([name])") as HTMLSlotElement | null;
		if (slot) {
			return slot
				.assignedElements({ flatten: true })
				.filter((el): el is HTMLElement => el instanceof HTMLElement);
		}
		// Light DOM has no `<slot>`, so cells are the bar's own children. The scaffold's overflow
		// menu and any injected script are excluded by matching only the item/spacer classes.
		const bar = this.bar;
		if (!bar) return [];
		return [...bar.children].filter(
			(el): el is HTMLElement =>
				el instanceof HTMLElement &&
				(el.classList.contains("xtyle-statusbar__item") ||
					el.classList.contains("xtyle-statusbar__spacer")),
		);
	}

	private cellsFrom(elements: HTMLElement[]): Cell[] {
		return elements
			.filter((el) => !el.classList.contains("xtyle-statusbar__spacer"))
			.map((el, naturalIndex) => {
				const required = el.hasAttribute("data-required") || el.dataset.required === "true";
				const rawPriority = el.dataset.priority;
				const priority = required
					? Number.POSITIVE_INFINITY
					: rawPriority !== undefined && rawPriority !== ""
						? Number(rawPriority)
						: 0;
				return { el, priority: Number.isNaN(priority) ? 0 : priority, required, naturalIndex };
			});
	}

	private restoreAll(): void {
		for (const el of this.hiddenEls) {
			el.style.removeProperty("display");
			el.removeAttribute("data-xtyle-collapsed");
		}
		this.hiddenEls.clear();
	}

	private setMenuLabel(count: number): void {
		const menu = this.menu;
		if (!menu) return;
		const trigger = menu.querySelector(".xtyle-statusbar__overflow-trigger");
		if (trigger) trigger.textContent = `+${count}`;
		menu.style.display = count > 0 ? "" : "none";
		menu.setAttribute("aria-hidden", count > 0 ? "false" : "true");
	}

	private fillPopover(dropped: Cell[]): void {
		const popover = this.overflowPopover;
		if (!popover) return;
		popover.replaceChildren();
		for (const cell of dropped) {
			const clone = cell.el.cloneNode(true) as HTMLElement;
			clone.style.removeProperty("display");
			clone.removeAttribute("data-xtyle-collapsed");
			clone.classList.add("xtyle-statusbar__overflow-item");
			popover.append(clone);
		}
	}

	private fits(bar: HTMLElement): boolean {
		return bar.scrollWidth <= bar.clientWidth + 1;
	}

	private recompute = (): void => {
		const bar = this.bar;
		if (!bar || this.overflow !== "collapse") return;

		const manual = this.manualOverflow;

		this.restoreAll();
		if (!manual) this.setMenuLabel(0);

		const cells = this.cellsFrom(this.slotElements());
		const dropped: Cell[] = [];

		if (cells.length > 0 && !this.fits(bar)) {
			const dropOrder = [...cells]
				.filter((cell) => !cell.required)
				.sort((a, b) => (a.priority - b.priority) || (b.naturalIndex - a.naturalIndex));

			for (const cell of dropOrder) {
				if (this.fits(bar)) break;
				cell.el.style.display = "none";
				cell.el.setAttribute("data-xtyle-collapsed", "");
				this.hiddenEls.add(cell.el);
				dropped.push(cell);
				if (!manual) this.setMenuLabel(dropped.length);
			}
		}

		if (!manual && dropped.length > 0) {
			const ordered = [...dropped].sort((a, b) => a.naturalIndex - b.naturalIndex);
			this.fillPopover(ordered);
		}

		this.markRuleStarts();
		this.emitOverflowChange(cells, dropped);
	};

	private emitOverflowChange(cells: Cell[], dropped: Cell[]): void {
		const hidden = [...dropped]
			.sort((a, b) => a.naturalIndex - b.naturalIndex)
			.map((cell) => cell.el);
		const droppedSet = new Set(hidden);
		const visible = cells.filter((cell) => !droppedSet.has(cell.el)).map((cell) => cell.el);

		if (this.sameAsLastEmitted(hidden)) return;
		this.lastEmittedHidden = hidden;

		this.dispatchEvent(
			new CustomEvent<{ hidden: HTMLElement[]; visible: HTMLElement[] }>("overflow-change", {
				bubbles: true,
				composed: true,
				detail: { hidden, visible },
			}),
		);
	}

	private sameAsLastEmitted(hidden: HTMLElement[]): boolean {
		const prev = this.lastEmittedHidden;
		if (!prev || prev.length !== hidden.length) return false;
		return prev.every((el, i) => el === hidden[i]);
	}

	private teardownCollapse(): void {
		this.observer?.disconnect();
		this.observer = null;
		this.overflowPopover?.removeEventListener("toggle", this.positionPopover);
		this.defaultSlot?.removeEventListener("slotchange", this.recompute);
		this.restoreAll();
		for (const el of this.slotElements()) el.removeAttribute("data-rule-start");
		this.lastEmittedHidden = null;
	}

	/** The fragment paints `.xtyle-statusbar` synchronously once its fill is warm, but the very
	 * first instance on a page resolves the fill on a microtask. Defer collapse wiring until the
	 * bar exists so the first statusbar isn't left un-observed. */
	private whenBar(run: (bar: HTMLElement) => void): void {
		const bar = this.bar;
		if (bar) {
			run(bar);
			return;
		}
		const raf =
			typeof requestAnimationFrame === "function"
				? requestAnimationFrame
				: (cb: () => void): void => void queueMicrotask(cb);
		raf(() => {
			if (this.overflow !== "collapse" || !this.isConnected) return;
			const ready = this.bar;
			if (ready) run(ready);
		});
	}

	private observeBar(bar: HTMLElement): void {
		if (typeof ResizeObserver === "undefined") {
			this.recompute();
			return;
		}
		this.observer = new ResizeObserver(() => this.recompute());
		this.observer.observe(bar);
		this.defaultSlot?.addEventListener("slotchange", this.recompute);
		this.recompute();
	}

	private positionPopover = (event: Event): void => {
		const popover = this.overflowPopover;
		const trigger = this.menu?.querySelector(".xtyle-statusbar__overflow-trigger") as HTMLElement | null;
		if (!popover || !trigger) return;
		if ((event as { newState?: string }).newState !== "open") return;
		const rect = trigger.getBoundingClientRect();
		const width = popover.offsetWidth || 192;
		const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));
		const top = Math.max(8, rect.top - popover.offsetHeight - 6);
		popover.style.left = `${Math.round(left)}px`;
		popover.style.top = `${Math.round(top)}px`;
	};

	protected template(): string {
		return "";
	}

	/** Arms the collapse machinery once the bar exists. Runs from both `render` (the bar is present
	 * synchronously in light DOM, and once the fill is warm in shadow DOM) and `afterApply` (the
	 * first shadow-DOM instance builds its bar on a later microtask, after `render`'s one-shot
	 * `whenBar` has already given up), so a statically-authored collapsing bar arms in either mode. */
	private armCollapse = (): void => {
		this.teardownCollapse();
		if (this.overflow !== "collapse" || !this.isConnected) return;
		this.whenBar((bar) => {
			if (!this.manualOverflow) {
				this.overflowPopover?.addEventListener("toggle", this.positionPopover);
			}
			this.observeBar(bar);
		});
	};

	protected override render(): void {
		this.teardownCollapse();
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(statusbarHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		this.armCollapse();
	}
}

define("xtyle-statusbar", XtyleStatusbar);
