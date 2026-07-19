/**
 * Keeps a top-layer overlay sitting on its anchor for as long as it is open.
 *
 * This is the bill for the promotion. An overlay in the top layer can't be cropped by an ancestor's
 * `overflow` — the whole point — but its containing block becomes the viewport, so it can no longer
 * lean on its anchor in CSS and has to be placed from measured viewport coordinates instead. Those
 * coordinates are only true for the scroll offset they were measured at. Placing once, at open time,
 * looks right in every static screenshot and is wrong the moment anything moves.
 *
 * The three ways it moves, and why each listener is here:
 *
 * - **Scroll.** Scroll events don't bubble, so this captures. The anchor can sit in any scrolling
 *   ancestor — an app rail, a dock, a scrolling `<main>` — and a `window`-only listener sees exactly
 *   nothing in that case, which is the plausible-looking fix that stays broken.
 * - **Resize.** The viewport changing re-runs the flip/clamp decision, not just the coordinates.
 * - **Reflow.** A `ResizeObserver` catches what neither of the above reports: an anchor or overlay
 *   that changes size under the placement, late-loading webfonts being the everyday case.
 *
 * Repositions are coalesced onto an animation frame, so a scroll burst costs one measure-and-write
 * per painted frame rather than one per event.
 *
 * `stop()` is not optional bookkeeping: the listeners are on `document` and `window`, so an overlay
 * that forgets them keeps repositioning itself long after it closes, and keeps its element alive.
 */
export class AnchorTracker {
	private frame = 0;
	private observer: ResizeObserver | null = null;
	private tracking = false;

	constructor(private readonly reposition: () => void) {}

	private queue = (): void => {
		if (this.frame) return;
		this.frame = requestAnimationFrame(() => {
			this.frame = 0;
			this.reposition();
		});
	};

	/** Begin tracking, re-placing the overlay until `stop()`. Idempotent, so an event that fires on an
	 * already-open overlay (a re-entered trigger) doesn't stack a second set of listeners. `nodes` are
	 * the elements whose own reflow should re-place it — typically the anchor and the overlay. */
	start(...nodes: (Element | null | undefined)[]): void {
		if (this.tracking) return;
		this.tracking = true;
		document.addEventListener("scroll", this.queue, { capture: true, passive: true });
		window.addEventListener("resize", this.queue, { passive: true });
		this.observer ??= new ResizeObserver(this.queue);
		for (const node of nodes) if (node) this.observer.observe(node);
	}

	stop(): void {
		if (!this.tracking) return;
		this.tracking = false;
		document.removeEventListener("scroll", this.queue, { capture: true });
		window.removeEventListener("resize", this.queue);
		this.observer?.disconnect();
		cancelAnimationFrame(this.frame);
		this.frame = 0;
	}
}
