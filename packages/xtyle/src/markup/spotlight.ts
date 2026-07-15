/** The shape of the hole cut in the veil. `auto` follows the target's own corner radius. */
export type SpotlightShape = "auto" | "rect" | "circle";

/** How the callout's pointer behaves: still, or animated toward the target (gated by `prefers-reduced-motion`). */
export type SpotlightArrow = "none" | "static" | "bounce";

/** Whether (and how fast) the ring around the hole pulses. `slow` is the default cadence; both stop under
 * `prefers-reduced-motion`, and neither is fast enough to be a flashing hazard. */
export type SpotlightPulse = "none" | "slow" | "fast";

export interface SpotlightRect {
	top: number;
	left: number;
	width: number;
	height: number;
}

export interface CutoutOptions {
	/** Breathing room around the target, in px. */
	padding?: number;
	/** Corner radius of the hole, in px. Ignored when `shape` is `circle`. */
	radius?: number;
	shape?: SpotlightShape;
}

const round = (value: number): number => Math.round(value * 100) / 100;

/**
 * The veil's clip path: the whole viewport, minus a hole over the target.
 *
 * Two subpaths under `evenodd` — the outer rectangle and the inner shape — so the fill covers everything
 * the hole doesn't. This is a `path()` rather than a `polygon()` precisely so the hole can have real corner
 * radii and a circle can be a circle; approximating either with polygon points is what makes a spotlight
 * look like a cheap cardboard cutout.
 *
 * A target that is off-screen, collapsed, or not yet laid out has no hole at all: the veil goes solid rather
 * than punching a hole at 0,0, which is the one failure that reads as a bug rather than as a design.
 */
export function cutoutPath(target: SpotlightRect | null, viewport: SpotlightRect, opts: CutoutOptions = {}): string {
	const outer = `M0 0H${round(viewport.width)}V${round(viewport.height)}H0Z`;
	if (!target || target.width <= 0 || target.height <= 0) return outer;

	const padding = opts.padding ?? 8;
	const shape = opts.shape ?? "auto";
	const left = target.left - padding;
	const top = target.top - padding;
	const width = target.width + padding * 2;
	const height = target.height + padding * 2;

	if (shape === "circle") {
		const cx = round(left + width / 2);
		const cy = round(top + height / 2);
		const r = round(Math.max(width, height) / 2);
		// two arcs, because a single 360° arc is a no-op in SVG path terms
		return `${outer}M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
	}

	const radius = Math.max(0, Math.min(opts.radius ?? 0, width / 2, height / 2));
	const l = round(left);
	const t = round(top);
	const r = round(left + width);
	const b = round(top + height);
	if (radius <= 0) return `${outer}M${l} ${t}H${r}V${b}H${l}Z`;

	const rad = round(radius);
	return (
		`${outer}M${round(l + rad)} ${t}` +
		`H${round(r - rad)}A${rad} ${rad} 0 0 1 ${r} ${round(t + rad)}` +
		`V${round(b - rad)}A${rad} ${rad} 0 0 1 ${round(r - rad)} ${b}` +
		`H${round(l + rad)}A${rad} ${rad} 0 0 1 ${l} ${round(b - rad)}` +
		`V${round(t + rad)}A${rad} ${rad} 0 0 1 ${round(l + rad)} ${t}Z`
	);
}

/** The host-layout rule for a spotlight — the `:host` rule, shared by the element's fragment scaffold and the SSR declarative shadow root. A spotlight takes no space in the flow; it paints over the page. */
export const spotlightHostCss = ":host { display: contents; }";
