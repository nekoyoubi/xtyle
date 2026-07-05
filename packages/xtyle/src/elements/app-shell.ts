import { XtyleElement, define, type StyleMode } from "./base.js";
import { appShellHostCss } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/app-shell/source.generated.js";

type Side = "left" | "right";

export class XtyleAppShell extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "app-shell", {
		applyIntent: () => {},
		// Handles are built by `mount` / reshape, so they may not exist when `render()` runs; wire them
		// after every apply. A fresh handle wires; an already-wired one no-ops.
		afterApply: () => this.wireHandles(),
	});

	static get observedAttributes(): string[] {
		return [
			"skip-link",
			"left-size",
			"right-size",
			"main-id",
			"left-resizable",
			"right-resizable",
			"left-min",
			"left-max",
			"right-min",
			"right-max",
		];
	}

	private get mainId(): string {
		const explicit = this.getAttribute("main-id");
		return explicit && explicit.length > 0 ? explicit : "main";
	}

	get skipLink(): string | null {
		return this.getAttribute("skip-link");
	}
	set skipLink(value: string | null) {
		if (value === null) this.removeAttribute("skip-link");
		else this.setAttribute("skip-link", value);
	}

	private get hasSkipLink(): boolean {
		return this.hasAttribute("skip-link");
	}

	private get skipLinkText(): string {
		const explicit = this.skipLink;
		return explicit && explicit.length > 0 ? explicit : "Skip to main content";
	}

	private isResizable(side: Side): boolean {
		return this.hasAttribute(`${side}-resizable`);
	}

	private bound(side: Side, which: "min" | "max"): number {
		const raw = this.getAttribute(`${side}-${which}`);
		if (raw !== null && raw.length > 0) {
			const n = Number(raw);
			if (Number.isFinite(n)) return n;
		}
		return which === "min" ? 160 : 720;
	}

	private clampSide(side: Side, value: number): number {
		return Math.min(this.bound(side, "max"), Math.max(this.bound(side, "min"), Math.round(value)));
	}

	/** The seed / double-click-reset size for a resizable rail: its `*-size` attr in px, clamped. */
	private seed(side: Side): number {
		const raw = this.getAttribute(`${side}-size`);
		const parsed = raw === null ? Number.NaN : Number.parseFloat(raw);
		return this.clampSide(side, Number.isFinite(parsed) ? parsed : side === "left" ? 240 : 320);
	}

	// Live rail sizes, lazily seeded from the attribute; the drag / keys own them after that.
	private current: Record<Side, number | null> = { left: null, right: null };

	private sizePx(side: Side): number {
		if (this.current[side] === null) this.current[side] = this.seed(side);
		return this.current[side] as number;
	}

	private railStyle(side: Side, prop: string): string | null {
		if (this.isResizable(side)) return `${prop}: ${this.sizePx(side)}px`;
		const raw = this.getAttribute(`${side}-size`);
		if (raw === null || raw.length === 0) return null;
		const size = /^\d+$/.test(raw) ? `${raw}px` : raw;
		return `${prop}: ${size}`;
	}

	private get bodyStyle(): string | null {
		const style = [this.railStyle("left", "--xtyle-app-left"), this.railStyle("right", "--xtyle-app-right")]
			.filter(Boolean)
			.join("; ");
		return style.length > 0 ? style : null;
	}

	attributeChangedCallback(name: string): void {
		// An external size / bound / resizable change re-seeds the live value on the next render.
		if (name.startsWith("left-")) this.current.left = null;
		if (name.startsWith("right-")) this.current.right = null;
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			skipLink: this.hasSkipLink,
			skipLinkText: this.skipLinkText,
			bodyStyle: this.bodyStyle,
			mainId: this.mainId,
			leftResizable: this.isResizable("left"),
			rightResizable: this.isResizable("right"),
		};
	}

	/** Structure the ops can't patch incrementally: the skip link, the main id, and whether each rail
	 * carries a handle. A change here rebuilds; a size change is a cheap style patch. */
	private shapeSignature(): string {
		return `${this.hasSkipLink}|${this.skipLinkText}|${this.mainId}|${this.isResizable("left")}|${this.isResizable("right")}`;
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(appShellHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
	}

	private setSize(side: Side, value: number, emit: "resize" | "resize-end"): void {
		const clamped = this.clampSide(side, value);
		const changed = clamped !== this.current[side];
		this.current[side] = clamped;
		this.fragment.update(this.bindings);
		this.syncHandleValue(side);
		if (!changed && emit === "resize") return;
		this.dispatchEvent(
			new CustomEvent(emit, { bubbles: true, composed: true, detail: { side, size: clamped } }),
		);
	}

	private focusViaPointer = false;

	private onHandlePointerdown(side: Side, handle: HTMLElement, event: PointerEvent): void {
		event.preventDefault();
		this.focusViaPointer = true;
		handle.focus();
		handle.setAttribute("data-active", "");
		const startX = event.clientX;
		const startSize = this.sizePx(side);
		// The right rail grows as the handle moves left; the left rail grows as it moves right.
		const sign = side === "right" ? -1 : 1;
		(event.target as Element).setPointerCapture?.(event.pointerId);
		const move = (e: PointerEvent): void => this.setSize(side, startSize + sign * (e.clientX - startX), "resize");
		const end = (e: PointerEvent): void => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", end);
			window.removeEventListener("pointercancel", end);
			handle.removeAttribute("data-active");
			this.focusViaPointer = false;
			this.setSize(side, startSize + sign * (e.clientX - startX), "resize-end");
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", end);
		window.addEventListener("pointercancel", end);
	}

	private onHandleKeydown(side: Side, event: KeyboardEvent): void {
		const step = event.shiftKey ? 40 : 16;
		const grow = side === "right" ? "ArrowLeft" : "ArrowRight";
		const shrink = side === "right" ? "ArrowRight" : "ArrowLeft";
		let next: number;
		if (event.key === grow) next = this.sizePx(side) + step;
		else if (event.key === shrink) next = this.sizePx(side) - step;
		else if (event.key === "Home") next = this.bound(side, "max");
		else if (event.key === "End") next = this.bound(side, "min");
		else return;
		event.preventDefault();
		this.setSize(side, next, "resize-end");
	}

	private syncHandleValue(side: Side): void {
		const handle = this.root.querySelector<HTMLElement>(`[data-handle="${side}"]`);
		handle?.setAttribute("aria-valuenow", String(this.sizePx(side)));
	}

	private wired = new WeakSet<HTMLElement>();
	private wireHandles(): void {
		for (const side of ["left", "right"] as Side[]) {
			const handle = this.root.querySelector<HTMLElement>(`[data-handle="${side}"]`);
			if (!handle || this.wired.has(handle)) continue;
			this.wired.add(handle);
			handle.setAttribute("aria-valuemin", String(this.bound(side, "min")));
			handle.setAttribute("aria-valuemax", String(this.bound(side, "max")));
			handle.setAttribute("aria-valuenow", String(this.sizePx(side)));
			handle.addEventListener("pointerdown", (e) => this.onHandlePointerdown(side, handle, e as PointerEvent));
			handle.addEventListener("keydown", (e) => this.onHandleKeydown(side, e as KeyboardEvent));
			handle.addEventListener("dblclick", () => this.setSize(side, this.seed(side), "resize-end"));
			handle.addEventListener("focus", () => {
				if (!this.focusViaPointer) handle.setAttribute("data-focus-ring", "");
			});
			handle.addEventListener("keydown", () => handle.setAttribute("data-focus-ring", ""));
			handle.addEventListener("blur", () => {
				handle.removeAttribute("data-focus-ring");
				this.focusViaPointer = false;
			});
		}
	}
}

define("xtyle-app-shell", XtyleAppShell);
