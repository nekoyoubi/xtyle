import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

export interface DiffResult {
	ok: boolean;
	reason?: string;
	mismatchRatio: number;
	diffPng?: Buffer;
}

export interface Tolerance {
	maxMismatchRatio: number;
	sizePx: number;
}

// Both runtime, mounting the same fragment: must be near-identical (a couple
// percent absorbs sub-pixel text AA across dense grids like a calendar).
export const STRICT: Tolerance = { maxMismatchRatio: 0.02, sizePx: 2 };
// SSR light-DOM snapshot vs a runtime mount: sub-pixel AA and rounding on small
// high-contrast controls (a slider thumb, a radio dot) flip a few percent of a
// tiny area without being a real divergence.
export const LOOSE: Tolerance = { maxMismatchRatio: 0.08, sizePx: 6 };

function crop(png: PNG, width: number, height: number): PNG {
	if (png.width === width && png.height === height) return png;
	const out = new PNG({ width, height });
	PNG.bitblt(png, out, 0, 0, width, height, 0, 0);
	return out;
}

export function compareShots(
	a: Buffer,
	b: Buffer,
	tol: Tolerance = STRICT,
): DiffResult {
	const pa = PNG.sync.read(a);
	const pb = PNG.sync.read(b);

	const dw = Math.abs(pa.width - pb.width);
	const dh = Math.abs(pa.height - pb.height);
	if (dw > tol.sizePx || dh > tol.sizePx) {
		return {
			ok: false,
			mismatchRatio: 1,
			reason: `size mismatch: ${pa.width}x${pa.height} vs ${pb.width}x${pb.height}`,
		};
	}

	const width = Math.min(pa.width, pb.width);
	const height = Math.min(pa.height, pb.height);
	const ca = crop(pa, width, height);
	const cb = crop(pb, width, height);

	const diff = new PNG({ width, height });
	const mismatched = pixelmatch(ca.data, cb.data, diff.data, width, height, {
		threshold: 0.2,
	});
	const ratio = mismatched / (width * height);

	return {
		ok: ratio <= tol.maxMismatchRatio,
		mismatchRatio: ratio,
		reason:
			ratio <= tol.maxMismatchRatio
				? undefined
				: `${(ratio * 100).toFixed(2)}% of pixels differ (max ${(tol.maxMismatchRatio * 100).toFixed(0)}%)`,
		diffPng: PNG.sync.write(diff),
	};
}
