/**
 * A static measurer for primitive bodies. The engine authors every primitive itself, so the ink a mark
 * actually covers is knowable without a DOM, a renderer, or a layout pass — which is what lets
 * `---center` re-center a composite anywhere the engine runs (the CLI, SSR, the sandbox).
 *
 * Two levels, because a box is not enough. {@link measureBody} bounds one primitive's geometry, curves
 * solved for their true extremes rather than bounded by their control points, so a `drop` or a `heart`
 * reads as the shape a viewer sees instead of a hull that overshoots it. {@link flattenBody} goes
 * further and hands back the outline itself, which is what makes a **knockout** measurable: a knockout
 * is not ink, it is the tool that *carves* ink, so a composite's real extent is what survives the carve.
 * A box-union can only ever ignore that, and ignoring it puts `---center` on art that is not there.
 *
 * It measures geometry, not paint: filters and the whole-mark outline are outside the result.
 */

export interface IconBox {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

function box(minX: number, minY: number, maxX: number, maxY: number): IconBox {
	return { minX, minY, maxX, maxY };
}

/** The union of two boxes; either may be null (an unmeasurable element contributes nothing). */
export function unionBox(a: IconBox | null, b: IconBox | null): IconBox | null {
	if (!a) return b;
	if (!b) return a;
	return box(Math.min(a.minX, b.minX), Math.min(a.minY, b.minY), Math.max(a.maxX, b.maxX), Math.max(a.maxY, b.maxY));
}

function fromPoints(points: number[][]): IconBox | null {
	if (points.length === 0) return null;
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const [x, y] of points) {
		minX = Math.min(minX, x as number);
		minY = Math.min(minY, y as number);
		maxX = Math.max(maxX, x as number);
		maxY = Math.max(maxY, y as number);
	}
	return box(minX, minY, maxX, maxY);
}

function attrNumber(tag: string, name: string, fallback = 0): number {
	const match = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`).exec(tag);
	if (!match) return fallback;
	const value = Number(match[1]);
	return Number.isFinite(value) ? value : fallback;
}

/** Every number in a path's `d`, tagged with the command that owns it, in source order. */
interface PathStep {
	command: string;
	args: number[];
}

const PATH_ARITY: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };

/** Splits a path `d` into commands with their argument runs expanded (`L1 2 3 4` → two `L` steps). */
function pathSteps(d: string): PathStep[] {
	const steps: PathStep[] = [];
	const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|[+-]?(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?/g) ?? [];
	let command = "";
	let index = 0;
	while (index < tokens.length) {
		const token = tokens[index] as string;
		if (/[A-Za-z]/.test(token)) {
			command = token;
			index++;
		} else if (!command) {
			index++;
			continue;
		}
		const arity = PATH_ARITY[command.toLowerCase()] ?? 0;
		if (arity === 0) {
			steps.push({ command, args: [] });
			if (command === "m" || command === "M") command = command === "m" ? "l" : "L";
			continue;
		}
		const args = tokens.slice(index, index + arity).map(Number);
		if (args.length < arity || args.some((value) => !Number.isFinite(value))) break;
		steps.push({ command, args });
		index += arity;
		if (command === "m") command = "l";
		else if (command === "M") command = "L";
	}
	return steps;
}

/** The real extremes of a cubic Bézier on one axis: its endpoints plus any stationary point inside the span. */
function cubicExtremes(p0: number, p1: number, p2: number, p3: number): number[] {
	const values = [p0, p3];
	const a = -p0 + 3 * p1 - 3 * p2 + p3;
	const b = 2 * (p0 - 2 * p1 + p2);
	const c = p1 - p0;
	const at = (t: number): void => {
		if (t <= 0 || t >= 1) return;
		const u = 1 - t;
		values.push(u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3);
	};
	if (Math.abs(a) < 1e-9) {
		if (Math.abs(b) > 1e-9) at(-c / b);
	} else {
		const disc = b * b - 4 * a * c;
		if (disc >= 0) {
			const root = Math.sqrt(disc);
			at((-b + root) / (2 * a));
			at((-b - root) / (2 * a));
		}
	}
	return values;
}

/** The real extremes of a quadratic Bézier on one axis. */
function quadExtremes(p0: number, p1: number, p2: number): number[] {
	const values = [p0, p2];
	const denominator = p0 - 2 * p1 + p2;
	if (Math.abs(denominator) > 1e-9) {
		const t = (p0 - p1) / denominator;
		if (t > 0 && t < 1) {
			const u = 1 - t;
			values.push(u * u * p0 + 2 * u * t * p1 + t * t * p2);
		}
	}
	return values;
}

function angleInSweep(angle: number, start: number, sweep: number): boolean {
	const delta = ((angle - start) % 360 + 360) % 360;
	return sweep >= 0 ? delta <= sweep + 1e-9 : delta - 360 >= sweep - 1e-9;
}

/**
 * The points an elliptical arc reaches: its endpoints plus whichever of the ellipse's four axis extremes
 * the swept range actually passes through, via the endpoint-to-center conversion in the SVG path spec.
 *
 * An arc with a non-zero x-axis rotation falls back to the whole rotated ellipse's bounding square — a
 * conservative box rather than a wrong one. No primitive in the library rotates an arc, and a box that
 * is too generous only makes `---center` less eager, never misplaced.
 */
function arcPoints(x1: number, y1: number, rxIn: number, ryIn: number, rotation: number, largeArc: number, sweepFlag: number, x2: number, y2: number): number[][] {
	const points: number[][] = [[x1, y1], [x2, y2]];
	let rx = Math.abs(rxIn);
	let ry = Math.abs(ryIn);
	if (rx === 0 || ry === 0) return points;
	if (rotation % 180 !== 0) {
		const r = Math.max(rx, ry);
		const cx = (x1 + x2) / 2;
		const cy = (y1 + y2) / 2;
		points.push([cx - r * 2, cy - r * 2], [cx + r * 2, cy + r * 2]);
		return points;
	}
	const dx = (x1 - x2) / 2;
	const dy = (y1 - y2) / 2;
	const lambda = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
	if (lambda > 1) {
		const scale = Math.sqrt(lambda);
		rx *= scale;
		ry *= scale;
	}
	const numerator = rx * rx * ry * ry - rx * rx * dy * dy - ry * ry * dx * dx;
	const denominator = rx * rx * dy * dy + ry * ry * dx * dx;
	const factor = (largeArc !== sweepFlag ? 1 : -1) * Math.sqrt(Math.max(0, numerator / denominator));
	const cxPrime = (factor * rx * dy) / ry;
	const cyPrime = (-factor * ry * dx) / rx;
	const cx = cxPrime + (x1 + x2) / 2;
	const cy = cyPrime + (y1 + y2) / 2;
	const degrees = (x: number, y: number): number => (Math.atan2(y, x) * 180) / Math.PI;
	const start = degrees((dx - cxPrime) / rx, (dy - cyPrime) / ry);
	const end = degrees((-dx - cxPrime) / rx, (-dy - cyPrime) / ry);
	let sweep = end - start;
	if (sweepFlag && sweep < 0) sweep += 360;
	if (!sweepFlag && sweep > 0) sweep -= 360;
	const extremes: [number, number[]][] = [
		[0, [cx + rx, cy]],
		[90, [cx, cy + ry]],
		[180, [cx - rx, cy]],
		[270, [cx, cy - ry]],
	];
	for (const [angle, point] of extremes) {
		if (angleInSweep(angle, start, sweep)) points.push(point);
	}
	return points;
}

/** The box a path's `d` covers, curves solved for their true extremes. */
export function measurePath(d: string): IconBox | null {
	const points: number[][] = [];
	let x = 0;
	let y = 0;
	let startX = 0;
	let startY = 0;
	let reflectX = 0;
	let reflectY = 0;
	let smooth = "";
	for (const { command, args } of pathSteps(d)) {
		const kind = command.toLowerCase();
		const relative = command === command.toLowerCase();
		const rx = relative ? x : 0;
		const ry = relative ? y : 0;
		switch (kind) {
			case "m": {
				x = (args[0] as number) + rx;
				y = (args[1] as number) + ry;
				startX = x;
				startY = y;
				points.push([x, y]);
				break;
			}
			case "l": {
				x = (args[0] as number) + rx;
				y = (args[1] as number) + ry;
				points.push([x, y]);
				break;
			}
			case "h": {
				x = (args[0] as number) + rx;
				points.push([x, y]);
				break;
			}
			case "v": {
				y = (args[0] as number) + ry;
				points.push([x, y]);
				break;
			}
			case "c":
			case "s": {
				const cubic = kind === "c";
				const c1x = cubic ? (args[0] as number) + rx : smooth === "c" ? 2 * x - reflectX : x;
				const c1y = cubic ? (args[1] as number) + ry : smooth === "c" ? 2 * y - reflectY : y;
				const c2x = (args[cubic ? 2 : 0] as number) + rx;
				const c2y = (args[cubic ? 3 : 1] as number) + ry;
				const ex = (args[cubic ? 4 : 2] as number) + rx;
				const ey = (args[cubic ? 5 : 3] as number) + ry;
				for (const vx of cubicExtremes(x, c1x, c2x, ex)) points.push([vx, y]);
				for (const vy of cubicExtremes(y, c1y, c2y, ey)) points.push([x, vy]);
				reflectX = c2x;
				reflectY = c2y;
				x = ex;
				y = ey;
				points.push([x, y]);
				break;
			}
			case "q":
			case "t": {
				const quad = kind === "q";
				const cx = quad ? (args[0] as number) + rx : smooth === "q" ? 2 * x - reflectX : x;
				const cy = quad ? (args[1] as number) + ry : smooth === "q" ? 2 * y - reflectY : y;
				const ex = (args[quad ? 2 : 0] as number) + rx;
				const ey = (args[quad ? 3 : 1] as number) + ry;
				for (const vx of quadExtremes(x, cx, ex)) points.push([vx, y]);
				for (const vy of quadExtremes(y, cy, ey)) points.push([x, vy]);
				reflectX = cx;
				reflectY = cy;
				x = ex;
				y = ey;
				points.push([x, y]);
				break;
			}
			case "a": {
				const ex = (args[5] as number) + rx;
				const ey = (args[6] as number) + ry;
				for (const point of arcPoints(x, y, args[0] as number, args[1] as number, args[2] as number, args[3] as number, args[4] as number, ex, ey)) {
					points.push(point);
				}
				x = ex;
				y = ey;
				break;
			}
			case "z": {
				x = startX;
				y = startY;
				break;
			}
		}
		smooth = kind === "c" || kind === "s" ? "c" : kind === "q" || kind === "t" ? "q" : "";
	}
	return fromPoints(points);
}

/** The nominal box a `letter` layer's `<text>` covers: text metrics need a font, which the engine has no
 * way to measure, so a glyph reads as the centered em square its `font-size` sets. */
const TEXT_BOX = box(2, 2, 22, 22);

/** A flattened region of one primitive: a closed ring of points, plus a stroke width when the source was
 * a pen-stroke rather than a fill (a `line`, a `ring`, an `arc`), whose ink is the path dilated, not enclosed. */
export interface IconRegion {
	points: number[][];
	stroke: number;
}

const CURVE_STEPS = 12;

function cubicAt(p0: number[], p1: number[], p2: number[], p3: number[], t: number): number[] {
	const u = 1 - t;
	const a = u * u * u;
	const b = 3 * u * u * t;
	const c = 3 * u * t * t;
	const d = t * t * t;
	return [
		a * (p0[0] as number) + b * (p1[0] as number) + c * (p2[0] as number) + d * (p3[0] as number),
		a * (p0[1] as number) + b * (p1[1] as number) + c * (p2[1] as number) + d * (p3[1] as number),
	];
}

function quadAt(p0: number[], p1: number[], p2: number[], t: number): number[] {
	const u = 1 - t;
	return [
		u * u * (p0[0] as number) + 2 * u * t * (p1[0] as number) + t * t * (p2[0] as number),
		u * u * (p0[1] as number) + 2 * u * t * (p1[1] as number) + t * t * (p2[1] as number),
	];
}

function ellipseRing(cx: number, cy: number, rx: number, ry: number, steps = 48): number[][] {
	const ring: number[][] = [];
	for (let i = 0; i < steps; i++) {
		const a = (i / steps) * Math.PI * 2;
		ring.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
	}
	return ring;
}

/** Walks an arc's swept range as a polyline, via the same endpoint-to-center conversion {@link arcPoints} uses. */
function arcRing(x1: number, y1: number, rxIn: number, ryIn: number, rotation: number, largeArc: number, sweepFlag: number, x2: number, y2: number): number[][] {
	let rx = Math.abs(rxIn);
	let ry = Math.abs(ryIn);
	if (rx === 0 || ry === 0 || rotation % 180 !== 0) return [[x2, y2]];
	const dx = (x1 - x2) / 2;
	const dy = (y1 - y2) / 2;
	const lambda = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
	if (lambda > 1) {
		const s = Math.sqrt(lambda);
		rx *= s;
		ry *= s;
	}
	const numerator = rx * rx * ry * ry - rx * rx * dy * dy - ry * ry * dx * dx;
	const denominator = rx * rx * dy * dy + ry * ry * dx * dx;
	const factor = (largeArc !== sweepFlag ? 1 : -1) * Math.sqrt(Math.max(0, numerator / denominator));
	const cxPrime = (factor * rx * dy) / ry;
	const cyPrime = (-factor * ry * dx) / rx;
	const cx = cxPrime + (x1 + x2) / 2;
	const cy = cyPrime + (y1 + y2) / 2;
	const angle = (px: number, py: number): number => Math.atan2(py, px);
	const start = angle((dx - cxPrime) / rx, (dy - cyPrime) / ry);
	const end = angle((-dx - cxPrime) / rx, (-dy - cyPrime) / ry);
	let sweep = end - start;
	if (sweepFlag && sweep < 0) sweep += Math.PI * 2;
	if (!sweepFlag && sweep > 0) sweep -= Math.PI * 2;
	const steps = Math.max(4, Math.ceil((Math.abs(sweep) / (Math.PI * 2)) * 48));
	const ring: number[][] = [];
	for (let i = 1; i <= steps; i++) {
		const a = start + (sweep * i) / steps;
		ring.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
	}
	return ring;
}

/** Flattens a path's `d` into one polyline per subpath, curves sampled and arcs walked. */
function flattenPath(d: string): number[][][] {
	const rings: number[][][] = [];
	let ring: number[][] = [];
	let x = 0;
	let y = 0;
	let startX = 0;
	let startY = 0;
	let reflectX = 0;
	let reflectY = 0;
	let smooth = "";
	const push = (px: number, py: number): void => void ring.push([px, py]);
	for (const { command, args } of pathSteps(d)) {
		const kind = command.toLowerCase();
		const relative = command === command.toLowerCase();
		const rx = relative ? x : 0;
		const ry = relative ? y : 0;
		if (kind === "m") {
			if (ring.length > 1) rings.push(ring);
			ring = [];
			x = (args[0] as number) + rx;
			y = (args[1] as number) + ry;
			startX = x;
			startY = y;
			push(x, y);
		} else if (kind === "l") {
			x = (args[0] as number) + rx;
			y = (args[1] as number) + ry;
			push(x, y);
		} else if (kind === "h") {
			x = (args[0] as number) + rx;
			push(x, y);
		} else if (kind === "v") {
			y = (args[0] as number) + ry;
			push(x, y);
		} else if (kind === "c" || kind === "s") {
			const cubic = kind === "c";
			const c1x = cubic ? (args[0] as number) + rx : smooth === "c" ? 2 * x - reflectX : x;
			const c1y = cubic ? (args[1] as number) + ry : smooth === "c" ? 2 * y - reflectY : y;
			const c2x = (args[cubic ? 2 : 0] as number) + rx;
			const c2y = (args[cubic ? 3 : 1] as number) + ry;
			const ex = (args[cubic ? 4 : 2] as number) + rx;
			const ey = (args[cubic ? 5 : 3] as number) + ry;
			for (let i = 1; i <= CURVE_STEPS; i++) {
				const p = cubicAt([x, y], [c1x, c1y], [c2x, c2y], [ex, ey], i / CURVE_STEPS);
				push(p[0] as number, p[1] as number);
			}
			reflectX = c2x;
			reflectY = c2y;
			x = ex;
			y = ey;
		} else if (kind === "q" || kind === "t") {
			const quad = kind === "q";
			const cx = quad ? (args[0] as number) + rx : smooth === "q" ? 2 * x - reflectX : x;
			const cy = quad ? (args[1] as number) + ry : smooth === "q" ? 2 * y - reflectY : y;
			const ex = (args[quad ? 2 : 0] as number) + rx;
			const ey = (args[quad ? 3 : 1] as number) + ry;
			for (let i = 1; i <= CURVE_STEPS; i++) {
				const p = quadAt([x, y], [cx, cy], [ex, ey], i / CURVE_STEPS);
				push(p[0] as number, p[1] as number);
			}
			reflectX = cx;
			reflectY = cy;
			x = ex;
			y = ey;
		} else if (kind === "a") {
			const ex = (args[5] as number) + rx;
			const ey = (args[6] as number) + ry;
			for (const p of arcRing(x, y, args[0] as number, args[1] as number, args[2] as number, args[3] as number, args[4] as number, ex, ey)) {
				push(p[0] as number, p[1] as number);
			}
			x = ex;
			y = ey;
		} else if (kind === "z") {
			if (ring.length > 1) rings.push(ring);
			ring = [];
			x = startX;
			y = startY;
			push(x, y);
		}
		smooth = kind === "c" || kind === "s" ? "c" : kind === "q" || kind === "t" ? "q" : "";
	}
	if (ring.length > 1) rings.push(ring);
	return rings;
}

/**
 * Flattens a primitive body into the regions it inks. A filled element becomes its outline; a pen-stroke
 * (`fill="none"` with a `stroke`) keeps its `stroke-width`, because its ink is the path dilated by half
 * that width rather than the area it encloses — a `ring` covers its rim, not its middle.
 */
export function flattenBody(body: string): IconRegion[] {
	const regions: IconRegion[] = [];
	const tags = body.match(/<[a-z]+\b[^>]*>/gi) ?? [];
	for (const tag of tags) {
		const name = (/^<([a-z]+)/i.exec(tag)?.[1] ?? "").toLowerCase();
		const stroked = /fill\s*=\s*"none"/.test(tag) && /\bstroke\s*=/.test(tag);
		const stroke = stroked ? attrNumber(tag, "stroke-width", 1) : 0;
		const add = (points: number[][]): void => void (points.length > 1 && regions.push({ points, stroke }));
		if (name === "rect") {
			const x = attrNumber(tag, "x");
			const y = attrNumber(tag, "y");
			const w = attrNumber(tag, "width");
			const h = attrNumber(tag, "height");
			add([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
		} else if (name === "circle") {
			const r = attrNumber(tag, "r");
			add(ellipseRing(attrNumber(tag, "cx"), attrNumber(tag, "cy"), r, r));
		} else if (name === "ellipse") {
			add(ellipseRing(attrNumber(tag, "cx"), attrNumber(tag, "cy"), attrNumber(tag, "rx"), attrNumber(tag, "ry")));
		} else if (name === "line") {
			add([
				[attrNumber(tag, "x1"), attrNumber(tag, "y1")],
				[attrNumber(tag, "x2"), attrNumber(tag, "y2")],
			]);
		} else if (name === "polygon" || name === "polyline") {
			const numbers = ((/\bpoints\s*=\s*"([^"]*)"/.exec(tag)?.[1] ?? "").match(/[+-]?(?:\d*\.\d+|\d+\.?)/g) ?? []).map(Number);
			const points: number[][] = [];
			for (let i = 0; i + 1 < numbers.length; i += 2) points.push([numbers[i] as number, numbers[i + 1] as number]);
			add(points);
		} else if (name === "path") {
			const d = /\bd\s*=\s*"([^"]*)"/.exec(tag)?.[1];
			if (d) for (const ring of flattenPath(d)) add(ring);
		} else if (name === "text") {
			add([[TEXT_BOX.minX, TEXT_BOX.minY], [TEXT_BOX.maxX, TEXT_BOX.minY], [TEXT_BOX.maxX, TEXT_BOX.maxY], [TEXT_BOX.minX, TEXT_BOX.maxY]]);
		}
	}
	return regions;
}

function pointInRing(px: number, py: number, ring: number[][]): boolean {
	let inside = false;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const [xi, yi] = ring[i] as number[];
		const [xj, yj] = ring[j] as number[];
		if (yi as number > py !== (yj as number) > py) {
			const t = (py - (yi as number)) / ((yj as number) - (yi as number));
			if (px < (xi as number) + t * ((xj as number) - (xi as number))) inside = !inside;
		}
	}
	return inside;
}

function nearPolyline(px: number, py: number, ring: number[][], reach: number): boolean {
	const limit = reach * reach;
	for (let i = 1; i < ring.length; i++) {
		const [ax, ay] = ring[i - 1] as number[];
		const [bx, by] = ring[i] as number[];
		const dx = (bx as number) - (ax as number);
		const dy = (by as number) - (ay as number);
		const len = dx * dx + dy * dy;
		const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((px - (ax as number)) * dx + (py - (ay as number)) * dy) / len));
		const ex = (ax as number) + t * dx - px;
		const ey = (ay as number) + t * dy - py;
		if (ex * ex + ey * ey <= limit) return true;
	}
	return false;
}

/** True when a point falls on a flattened region's ink: inside a fill, or within half a stroke of a pen-path. */
export function regionCovers(region: IconRegion, px: number, py: number): boolean {
	if (region.stroke > 0) return nearPolyline(px, py, [...region.points, region.points[0] as number[]], region.stroke / 2);
	return pointInRing(px, py, region.points);
}

/**
 * The box a primitive body covers on the 24-grid, or null when it draws nothing measurable. Handles the
 * element vocabulary the primitive library and the functional glyph set use: `rect`, `circle`, `ellipse`,
 * `line`, `polygon`/`polyline`, `path`, and `text`.
 */
export function measureBody(body: string): IconBox | null {
	let result: IconBox | null = null;
	const tags = body.match(/<[a-z]+\b[^>]*>/gi) ?? [];
	for (const tag of tags) {
		const name = (/^<([a-z]+)/i.exec(tag)?.[1] ?? "").toLowerCase();
		if (name === "rect") {
			const x = attrNumber(tag, "x");
			const y = attrNumber(tag, "y");
			result = unionBox(result, box(x, y, x + attrNumber(tag, "width"), y + attrNumber(tag, "height")));
		} else if (name === "circle") {
			const cx = attrNumber(tag, "cx");
			const cy = attrNumber(tag, "cy");
			const r = attrNumber(tag, "r");
			result = unionBox(result, box(cx - r, cy - r, cx + r, cy + r));
		} else if (name === "ellipse") {
			const cx = attrNumber(tag, "cx");
			const cy = attrNumber(tag, "cy");
			const rx = attrNumber(tag, "rx");
			const ry = attrNumber(tag, "ry");
			result = unionBox(result, box(cx - rx, cy - ry, cx + rx, cy + ry));
		} else if (name === "line") {
			const x1 = attrNumber(tag, "x1");
			const y1 = attrNumber(tag, "y1");
			const x2 = attrNumber(tag, "x2");
			const y2 = attrNumber(tag, "y2");
			result = unionBox(result, box(Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)));
		} else if (name === "polygon" || name === "polyline") {
			const raw = /\bpoints\s*=\s*"([^"]*)"/.exec(tag)?.[1] ?? "";
			const numbers = (raw.match(/[+-]?(?:\d*\.\d+|\d+\.?)/g) ?? []).map(Number);
			const points: number[][] = [];
			for (let i = 0; i + 1 < numbers.length; i += 2) points.push([numbers[i] as number, numbers[i + 1] as number]);
			result = unionBox(result, fromPoints(points));
		} else if (name === "path") {
			const d = /\bd\s*=\s*"([^"]*)"/.exec(tag)?.[1];
			if (d) result = unionBox(result, measurePath(d));
		} else if (name === "text") {
			result = unionBox(result, TEXT_BOX);
		}
	}
	return result;
}
