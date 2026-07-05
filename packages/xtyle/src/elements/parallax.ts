import { define } from "./base.js";

const DEFAULT_AMPLITUDE = 80;

type Vec = { x: number; y: number };
type Mode = "scroll" | "cursor";
type Layer = { el: HTMLElement; speed: number; dir: Vec | null };

const SQRT1_2 = Math.SQRT1_2;
const NAMED_DIRECTIONS: Record<string, Vec> = {
	n: { x: 0, y: -1 },
	s: { x: 0, y: 1 },
	e: { x: 1, y: 0 },
	w: { x: -1, y: 0 },
	ne: { x: SQRT1_2, y: -SQRT1_2 },
	nw: { x: -SQRT1_2, y: -SQRT1_2 },
	se: { x: SQRT1_2, y: SQRT1_2 },
	sw: { x: -SQRT1_2, y: SQRT1_2 },
};

/** A direction is either a compass token (`n`, `se`, …) or an angle in degrees clockwise from north
 * (`0` = up, `90` = right); anything else leaves the layer on its mode's default axis. */
function parseDirection(raw: string | null): Vec | null {
	if (!raw) return null;
	const key = raw.trim().toLowerCase();
	const named = NAMED_DIRECTIONS[key];
	if (named) return named;
	const deg = Number(key);
	if (!Number.isFinite(deg)) return null;
	const rad = (deg * Math.PI) / 180;
	return { x: Math.sin(rad), y: -Math.cos(rad) };
}

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

/**
 * A layered banner whose children drift for depth. The layers are the consumer's own children, stacked
 * in one grid cell by CSS (so the overlaid banner renders with no JavaScript at all), and the runtime
 * adds only the shift on layers that carry a `data-speed`. In the default `scroll` mode that shift is
 * scroll-linked; in `cursor` mode it follows the pointer. Each layer can pick a travel direction with
 * `data-direction` (a compass token or an angle). With no JS, or under `prefers-reduced-motion`, the
 * layers sit still: the parallax is an enhancement, never a requirement.
 */
export class XtyleParallax extends HTMLElement {
	static get observedAttributes(): string[] {
		return ["min-height", "amplitude", "mode"];
	}

	private controller: AbortController | null = null;
	private frame = 0;
	private mq = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
	private layers: Layer[] = [];
	private pointer: Vec = { x: 0, y: 0 };

	get amplitude(): number {
		const attr = this.getAttribute("amplitude");
		if (attr === null || attr.trim() === "") return DEFAULT_AMPLITUDE;
		const raw = Number(attr);
		// A negative amplitude flips every layer at once (per-layer `data-speed` sign still composes on top),
		// so an author can reverse the whole banner without touching each layer.
		return Number.isFinite(raw) ? raw : DEFAULT_AMPLITUDE;
	}

	get mode(): Mode {
		return this.getAttribute("mode") === "cursor" ? "cursor" : "scroll";
	}

	connectedCallback(): void {
		this.applyMinHeight();
		if (!this.hasAttribute("data-enhanced")) this.enhance();
	}

	disconnectedCallback(): void {
		this.teardown();
	}

	attributeChangedCallback(name: string): void {
		if (name === "min-height") this.applyMinHeight();
		else if (name === "mode" && this.isConnected) {
			this.teardown();
			this.enhance();
		}
	}

	private get reducedMotion(): boolean {
		return this.mq?.matches ?? false;
	}

	private applyMinHeight(): void {
		const value = this.getAttribute("min-height");
		if (value) this.style.setProperty("--xtyle-parallax-min-height", value);
		else this.style.removeProperty("--xtyle-parallax-min-height");
	}

	private enhance(): void {
		this.layers = Array.from(this.children)
			.filter((n): n is HTMLElement => n instanceof HTMLElement)
			.map((el) => ({ el, speed: Number(el.getAttribute("data-speed")) || 0, dir: parseDirection(el.getAttribute("data-direction")) }))
			.filter((layer) => layer.speed !== 0);
		if (this.layers.length === 0 || this.reducedMotion) return;

		this.setAttribute("data-enhanced", "");
		this.controller = new AbortController();
		const opts = { passive: true, signal: this.controller.signal } as const;
		if (this.mode === "cursor") {
			window.addEventListener("pointermove", this.onPointerMove, opts);
			document.addEventListener("pointerleave", this.resetPointer, opts);
		} else {
			// Capture phase so scrolls from any ancestor scroll container reach us: `scroll` does not bubble,
			// so a plain window listener misses an inner scroller (e.g. an app-shell main region).
			window.addEventListener("scroll", this.scheduleRepaint, { ...opts, capture: true });
			window.addEventListener("resize", this.scheduleRepaint, opts);
		}
		this.paint();
	}

	private onPointerMove = (event: PointerEvent): void => {
		const rect = this.getBoundingClientRect();
		this.pointer = {
			x: clamp((event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2), -1, 1),
			y: clamp((event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2), -1, 1),
		};
		this.scheduleRepaint();
	};

	private resetPointer = (): void => {
		this.pointer = { x: 0, y: 0 };
		this.scheduleRepaint();
	};

	private scheduleRepaint = (): void => {
		if (this.frame) return;
		this.frame = requestAnimationFrame(() => {
			this.frame = 0;
			this.paint();
		});
	};

	private paint(): void {
		const rect = this.getBoundingClientRect();
		if (rect.bottom < 0 || rect.top > window.innerHeight) return;
		const amp = this.amplitude;
		if (this.mode === "cursor") {
			// Layers push away from the pointer (negative), so the scene tilts to reveal depth as the cursor
			// moves toward an edge, rather than sliding after it.
			const { x: px, y: py } = this.pointer;
			for (const { el, speed, dir } of this.layers) {
				const [ox, oy] = dir
					? [-(px * dir.x + py * dir.y) * speed * amp * dir.x, -(px * dir.x + py * dir.y) * speed * amp * dir.y]
					: [-px * speed * amp, -py * speed * amp];
				el.style.translate = `${ox.toFixed(2)}px ${oy.toFixed(2)}px`;
			}
			return;
		}
		// Clamp progress to [-0.5, 0.5]: past half-off-screen the extra drift is barely visible but would
		// carry a layer beyond its scale headroom and reveal the band behind it, so the travel is bounded.
		const f = clamp((rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight, -0.5, 0.5);
		for (const { el, speed, dir } of this.layers) {
			const d = dir ?? { x: 0, y: 1 };
			const o = f * speed * amp;
			el.style.translate = `${(o * d.x).toFixed(2)}px ${(o * d.y).toFixed(2)}px`;
		}
	}

	private teardown(): void {
		this.controller?.abort();
		this.controller = null;
		if (this.frame) {
			cancelAnimationFrame(this.frame);
			this.frame = 0;
		}
		this.pointer = { x: 0, y: 0 };
		for (const { el } of this.layers) el.style.translate = "";
		this.removeAttribute("data-enhanced");
	}
}

define("xtyle-parallax", XtyleParallax);
