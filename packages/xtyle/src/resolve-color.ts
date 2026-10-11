import { parseColor, type RgbColor } from "./convert.js";

const SENTINELS = ["rgb(1, 2, 3)", "rgb(4, 5, 6)"] as const;
const PROBE_ATTRIBUTE = "data-xtyle-probe";

export function isXtyleProbe(node: Node): boolean {
	return node instanceof Element && node.hasAttribute(PROBE_ATTRIBUTE);
}

let canvasContext: CanvasRenderingContext2D | null | undefined;

function scratchContext(): CanvasRenderingContext2D | null {
	if (canvasContext !== undefined) return canvasContext;
	const canvas = document.createElement("canvas");
	canvas.width = 1;
	canvas.height = 1;
	canvasContext = canvas.getContext("2d", { willReadFrequently: true });
	return canvasContext;
}

function rasterize(value: string): RgbColor | null {
	const context = scratchContext();
	if (!context) return null;
	context.clearRect(0, 0, 1, 1);
	context.fillStyle = "#000";
	context.fillStyle = value;
	context.fillRect(0, 0, 1, 1);
	const [r = 0, g = 0, b = 0, a = 0] = context.getImageData(0, 0, 1, 1).data;
	return { r: r / 255, g: g / 255, b: b / 255, alpha: a / 255 };
}

function probeParent(context: Element): Element | ShadowRoot {
	return context.shadowRoot ?? context;
}

function computeInContext(value: string, context: Element): string | null {
	const probe = document.createElement("span");
	probe.hidden = true;
	probe.setAttribute(PROBE_ATTRIBUTE, "");
	probeParent(context).appendChild(probe);
	try {
		const readings = SENTINELS.map((sentinel) => {
			probe.style.setProperty("color", sentinel);
			probe.style.setProperty("border-top-color", value);
			return getComputedStyle(probe).borderTopColor;
		});
		if (!readings[0] || readings[0] !== readings[1]) return null;
		return readings[0];
	} finally {
		probe.remove();
	}
}

function isCurrentColor(value: string): boolean {
	return value.trim().toLowerCase() === "currentcolor";
}

function resolveValue(value: string, context: Element | undefined): RgbColor | null {
	const direct = parseColor(value);
	if (direct) return direct;
	if (typeof document === "undefined") return null;
	const scope = context ?? document.documentElement;
	const computed = isCurrentColor(value) ? getComputedStyle(scope).color : computeInContext(value, scope);
	if (!computed) return null;
	return parseColor(computed) ?? rasterize(computed);
}

/**
 * Resolve any CSS color a browser can compute (a `color-mix()`, a `var(--token)`, relative color
 * syntax, `currentColor`) to a concrete sRGB color, for places a color has to leave CSS: an SVG
 * presentation attribute, a canvas `fillStyle`, a WebGL uniform. Pair it with `formatColor` for a
 * string (`formatColor(color, "hex")`).
 *
 * - `resolveColor(value, context?)` resolves a color expression; `var()` references resolve against
 *   `context` (default `document.documentElement`), so a token scoped to a subtree reads correctly.
 * - `resolveColor(element, property)` reads a property, custom or not, off the element's computed style.
 *
 * Returns `null` when the value is not a color. Plain colors resolve without a DOM; anything that needs
 * the cascade returns `null` outside a browser.
 */
export function resolveColor(value: string, context?: Element): RgbColor | null;
export function resolveColor(element: Element, property: string): RgbColor | null;
export function resolveColor(subject: string | Element, extra?: Element | string): RgbColor | null {
	if (typeof subject === "string") {
		return resolveValue(subject, typeof extra === "string" ? undefined : extra);
	}
	if (typeof extra !== "string" || typeof getComputedStyle === "undefined") return null;
	const raw = getComputedStyle(subject).getPropertyValue(extra).trim();
	if (!raw) return null;
	return resolveValue(raw, subject);
}
