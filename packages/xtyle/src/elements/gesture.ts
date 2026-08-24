export type DragAxis = "x" | "y";

export interface DragState {
	dx: number;
	dy: number;
	axis: DragAxis | null;
	distance: number;
	velocity: number;
}

export interface DragHandlers {
	axes?: DragAxis | "both";
	lockThreshold?: number;
	onStart?: (event: PointerEvent) => boolean | void;
	onMove?: (state: DragState, event: PointerEvent) => void;
	onEnd?: (state: DragState, event: PointerEvent) => void;
}

const VELOCITY_WINDOW_MS = 100;

const dragStateFactory = (event: PointerEvent, axes: DragAxis | "both", lockThreshold: number) => {
	const startX = event.clientX;
	const startY = event.clientY;
	let axis: DragAxis | null = axes === "both" ? null : axes;
	const samples: Array<{ at: number; distance: number }> = [];

	return (moved: PointerEvent): DragState => {
		const dx = moved.clientX - startX;
		const dy = moved.clientY - startY;
		if (axis === null) {
			const travel = Math.hypot(dx, dy);
			if (travel > 0 && travel >= lockThreshold) axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
		}
		const distance = axis === "y" ? dy : axis === "x" ? dx : 0;

		const at = moved.timeStamp;
		samples.push({ at, distance });
		while (samples.length > 1 && at - (samples[0] as { at: number }).at > VELOCITY_WINDOW_MS) samples.shift();
		const oldest = samples[0] ?? { at, distance };
		const elapsed = at - oldest.at;
		const velocity = elapsed > 0 ? (distance - oldest.distance) / elapsed : 0;

		return { dx, dy, axis, distance, velocity };
	};
};

/**
 * Track one pointer drag from `event` until its pointerup or pointercancel, then clean up.
 *
 * `axes` restricts travel to one axis, or leaves it to the lock: with `"both"`, the axis stays
 * `null` until the pointer has travelled `lockThreshold` pixels, then latches to whichever of
 * x/y moved further and never changes again for that drag. `distance` is the travel along the
 * locked axis, and reads 0 while the axis is still undecided.
 *
 * `velocity` is signed pixels per millisecond along the locked axis, averaged over the last
 * 100ms of the gesture, so a consumer can honor a short fast flick as intent the way a slow
 * long drag is. It reads 0 before the axis locks and whenever the pointer is at rest.
 *
 * Return `false` from `onStart` to refuse the drag; no listeners are attached and nothing else fires.
 */
export function startDrag(event: PointerEvent, handlers: DragHandlers): void {
	if (handlers.onStart?.(event) === false) return;

	const nextState = dragStateFactory(event, handlers.axes ?? "both", handlers.lockThreshold ?? 0);
	const pointerId = event.pointerId;
	try {
		(event.target as Element | null)?.setPointerCapture?.(pointerId);
	} catch {}

	const move = (raw: Event): void => {
		const moved = raw as PointerEvent;
		if (moved.pointerId !== pointerId) return;
		handlers.onMove?.(nextState(moved), moved);
	};

	const end = (raw: Event): void => {
		const ended = raw as PointerEvent;
		if (ended.pointerId !== pointerId) return;
		window.removeEventListener("pointermove", move);
		window.removeEventListener("pointerup", end);
		window.removeEventListener("pointercancel", end);
		handlers.onEnd?.(nextState(ended), ended);
	};

	window.addEventListener("pointermove", move);
	window.addEventListener("pointerup", end);
	window.addEventListener("pointercancel", end);
}

export function prefersReducedMotion(): boolean {
	return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const parseDuration = (raw: string): number => {
	const trimmed = raw.trim();
	if (trimmed.endsWith("ms")) return Number.parseFloat(trimmed) || 0;
	if (trimmed.endsWith("s")) return (Number.parseFloat(trimmed) || 0) * 1000;
	return 0;
};

export interface SettleOptions {
	durationToken?: string;
	easingToken?: string;
	scale?: number;
}

/**
 * Move `element` to `transform` and animate the trip, reading its duration and easing from the
 * theme's own motion tokens rather than hardcoding either. Resolves once the element has landed.
 *
 * Under `prefers-reduced-motion`, or anywhere the Web Animations API is missing, the transform is
 * assigned outright and the promise resolves immediately, so the end state is identical and only
 * the travel is skipped. Any animation already running on the element is cancelled first, so a
 * gesture interrupting a settle wins.
 */
export function settle(element: HTMLElement, transform: string, options: SettleOptions = {}): Promise<void> {
	const from = element.style.transform;
	const land = (): void => {
		element.style.transform = transform;
	};

	if (prefersReducedMotion() || typeof element.animate !== "function") {
		land();
		return Promise.resolve();
	}

	const styles = getComputedStyle(element);
	const duration = parseDuration(styles.getPropertyValue(options.durationToken ?? "--duration-base")) * (options.scale ?? 1);
	const easing = styles.getPropertyValue(options.easingToken ?? "--ease-standard").trim() || "ease";

	if (duration <= 0) {
		land();
		return Promise.resolve();
	}

	for (const running of element.getAnimations?.() ?? []) running.cancel();

	const animation = element.animate([{ transform: from }, { transform }], { duration, easing, fill: "none" });
	land();
	return animation.finished.then(
		() => undefined,
		() => undefined,
	);
}
