/**
 * A self-contained QR Code encoder — pure math, zero DOM, no `fs`/`process`, so it runs at
 * build (the CLI, the Astro binding) and in the browser (the live element) alike. It takes a
 * string and yields the module matrix plus an SVG path; everything visual (color, shape, the
 * center knockout, the frame) is layered on top by the element and its fragment.
 *
 * Implements ISO/IEC 18004: automatic mode selection (numeric / alphanumeric / byte over UTF-8),
 * the full error-correction block tables for versions 1-40, Reed-Solomon over GF(256), the eight
 * data masks with the standard penalty scoring, and the finder / timing / alignment / format /
 * version function patterns. The algorithm follows the well-trodden reference structure (Nayuki's
 * public reference), reshaped to xtyle's conventions.
 */

export type QrEcLevel = "L" | "M" | "Q" | "H";

/** A fully placed, masked QR symbol: a square grid of dark (`true`) / light (`false`) modules. */
export interface QrMatrix {
	/** The side length in modules (`version * 4 + 17`). */
	size: number;
	/** Row-major module grid; `modules[y][x]` is dark when `true`. */
	modules: boolean[][];
	/** The symbol version, 1-40. */
	version: number;
	/** The error-correction level the payload was encoded at. */
	ecLevel: QrEcLevel;
	/** The mask pattern (0-7) chosen by the penalty scoring. */
	mask: number;
}

export interface EncodeQrOptions {
	/** Error-correction level; higher tolerates more occlusion (an injected center logo) at the cost
	 * of density. Defaults to `"M"`. */
	ecLevel?: QrEcLevel;
	/** Smallest version to consider; the encoder still grows past it when the data won't fit. */
	minVersion?: number;
	/** Largest version to consider; encoding throws when the data can't fit by here. Defaults to 40. */
	maxVersion?: number;
	/** Force a specific mask (0-7) instead of penalty-scoring all eight. For testing / determinism. */
	mask?: number;
}

export type QrModuleShape = "square" | "dot" | "rounded";

export interface QrPathOptions {
	/** Modules of empty margin around the symbol (the "quiet zone"); the spec floor is 4. */
	quietZone?: number;
	/** Module rendering: full squares (the default, densest-scanning), circular dots, or squares with
	 * rounded corners. Dots and rounded shapes read softer but stay within scanner tolerance. */
	shape?: QrModuleShape;
	/** A square region (in module units) to leave clear for an injected center logo, so its modules
	 * don't fight the artwork. The caller is responsible for keeping the cleared area within the error
	 * correction budget (bump `ecLevel` to `"H"` when injecting). */
	clear?: { size: number };
}

export interface QrPath {
	/** The SVG `d` attribute drawing every dark module. */
	d: string;
	/** The side length of the drawn viewBox in module units (symbol + two quiet zones). */
	extent: number;
	/** The `viewBox` string sized to `extent`. */
	viewBox: string;
	/** The cleared center region in viewBox units, when `clear` was requested — for placing the logo. */
	clear?: { x: number; y: number; size: number };
}

const EC_ORDINAL: Record<QrEcLevel, number> = { L: 0, M: 1, Q: 2, H: 3 };

const ALPHANUMERIC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

// ISO/IEC 18004 error-correction tables, indexed [ecOrdinal][version]. Index 0 (version "0") is a
// sentinel so real versions read 1-based. These two arrays plus the raw-module formula fully
// determine the block layout for every version/level pair.
const ECC_CODEWORDS_PER_BLOCK: number[][] = [
	[-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
	[-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
	[-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
	[-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
];
const NUM_EC_BLOCKS: number[][] = [
	[-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
	[-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
	[-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
	[-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
];

/** Total data-carrying modules for a version, before splitting into data + EC codewords. The
 * quadratic term is the full grid minus the finder / timing overhead; the corrections subtract the
 * alignment patterns and the version-information blocks. */
function rawDataModules(version: number): number {
	let result = (16 * version + 128) * version + 64;
	if (version >= 2) {
		const numAlign = Math.floor(version / 7) + 2;
		result -= (25 * numAlign - 10) * numAlign - 55;
		if (version >= 7) result -= 36;
	}
	return result;
}

function rawCodewords(version: number): number {
	return Math.floor(rawDataModules(version) / 8);
}

function dataCodewords(version: number, ec: QrEcLevel): number {
	const o = EC_ORDINAL[ec];
	return rawCodewords(version) - ECC_CODEWORDS_PER_BLOCK[o]![version]! * NUM_EC_BLOCKS[o]![version]!;
}

type Mode = "numeric" | "alphanumeric" | "byte";

function detectMode(text: string): Mode {
	if (/^[0-9]*$/.test(text)) return "numeric";
	for (const ch of text) if (!ALPHANUMERIC.includes(ch)) return "byte";
	return "alphanumeric";
}

const MODE_INDICATOR: Record<Mode, number> = { numeric: 0x1, alphanumeric: 0x2, byte: 0x4 };

/** Character-count-indicator width in bits, which widens in two steps as versions grow. */
function charCountBits(mode: Mode, version: number): number {
	const group = version <= 9 ? 0 : version <= 26 ? 1 : 2;
	const table: Record<Mode, [number, number, number]> = {
		numeric: [10, 12, 14],
		alphanumeric: [9, 11, 13],
		byte: [8, 16, 16],
	};
	return table[mode]![group]!;
}

function utf8Bytes(text: string): number[] {
	const out: number[] = [];
	for (const ch of text) {
		let code = ch.codePointAt(0)!;
		if (code < 0x80) out.push(code);
		else if (code < 0x800) out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
		else if (code < 0x10000) out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
		else out.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
	}
	return out;
}

class BitBuffer {
	readonly bits: number[] = [];
	append(value: number, length: number): void {
		for (let i = length - 1; i >= 0; i--) this.bits.push((value >>> i) & 1);
	}
}

/** The mode segment's data bits (not counting the mode indicator or char-count header), the count
 * of encoded characters, and a writer that emits the payload once the version is known. */
function encodeSegment(text: string, mode: Mode): { charCount: number; dataBits: number; write: (bb: BitBuffer) => void } {
	if (mode === "numeric") {
		return {
			charCount: text.length,
			dataBits: 10 * Math.floor(text.length / 3) + [0, 4, 7][text.length % 3]!,
			write: (bb) => {
				for (let i = 0; i < text.length; i += 3) {
					const chunk = text.slice(i, i + 3);
					bb.append(Number(chunk), chunk.length * 3 + 1);
				}
			},
		};
	}
	if (mode === "alphanumeric") {
		return {
			charCount: text.length,
			dataBits: 11 * Math.floor(text.length / 2) + 6 * (text.length % 2),
			write: (bb) => {
				for (let i = 0; i < text.length; i += 2) {
					if (i + 1 < text.length) {
						bb.append(ALPHANUMERIC.indexOf(text[i]!) * 45 + ALPHANUMERIC.indexOf(text[i + 1]!), 11);
					} else {
						bb.append(ALPHANUMERIC.indexOf(text[i]!), 6);
					}
				}
			},
		};
	}
	const bytes = utf8Bytes(text);
	return {
		charCount: bytes.length,
		dataBits: bytes.length * 8,
		write: (bb) => {
			for (const b of bytes) bb.append(b, 8);
		},
	};
}

// --- Reed-Solomon over GF(256), primitive polynomial 0x11d ---

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
	let x = 1;
	for (let i = 0; i < 255; i++) {
		GF_EXP[i] = x;
		GF_LOG[x] = i;
		x <<= 1;
		if (x & 0x100) x ^= 0x11d;
	}
	for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255]!;
})();

function gfMul(a: number, b: number): number {
	if (a === 0 || b === 0) return 0;
	return GF_EXP[GF_LOG[a]! + GF_LOG[b]!]!;
}

/** The Reed-Solomon generator polynomial of the given degree, product of `(x - α^i)`. */
function rsGenerator(degree: number): number[] {
	let poly = [1];
	for (let i = 0; i < degree; i++) {
		const next = new Array<number>(poly.length + 1).fill(0);
		for (let j = 0; j < poly.length; j++) {
			next[j] = next[j]! ^ poly[j]!;
			next[j + 1] = next[j + 1]! ^ gfMul(poly[j]!, GF_EXP[i]!);
		}
		poly = next;
	}
	return poly;
}

function rsRemainder(data: number[], generator: number[]): number[] {
	const result = new Array<number>(generator.length - 1).fill(0);
	for (const byte of data) {
		const factor = byte ^ result.shift()!;
		result.push(0);
		for (let i = 0; i < result.length; i++) result[i] = result[i]! ^ gfMul(generator[i + 1]!, factor);
	}
	return result;
}

/** Split the data codewords into the version's blocks, append each block's EC codewords, then
 * interleave both back into the final codeword stream the matrix consumes. */
function addEcAndInterleave(data: number[], version: number, ec: QrEcLevel): number[] {
	const o = EC_ORDINAL[ec];
	const numBlocks = NUM_EC_BLOCKS[o]![version]!;
	const ecLen = ECC_CODEWORDS_PER_BLOCK[o]![version]!;
	const raw = rawCodewords(version);
	const numShort = numBlocks - (raw % numBlocks);
	const shortLen = Math.floor(raw / numBlocks);
	const generator = rsGenerator(ecLen);

	const blocks: { data: number[]; ec: number[] }[] = [];
	let offset = 0;
	for (let i = 0; i < numBlocks; i++) {
		const dataLen = shortLen - ecLen + (i < numShort ? 0 : 1);
		const chunk = data.slice(offset, offset + dataLen);
		offset += dataLen;
		blocks.push({ data: chunk, ec: rsRemainder(chunk, generator) });
	}

	const result: number[] = [];
	const maxData = shortLen - ecLen + 1;
	for (let i = 0; i < maxData; i++) {
		for (const block of blocks) if (i < block.data.length) result.push(block.data[i]!);
	}
	for (let i = 0; i < ecLen; i++) {
		for (const block of blocks) result.push(block.ec[i]!);
	}
	return result;
}

// --- Matrix construction ---

function alignmentPositions(version: number): number[] {
	if (version === 1) return [];
	const numAlign = Math.floor(version / 7) + 2;
	const size = version * 4 + 17;
	const step = version === 32 ? 26 : Math.ceil((size - 13) / (numAlign * 2 - 2)) * 2;
	const result = [6];
	for (let pos = size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
	return result;
}

type Grid = { modules: boolean[][]; reserved: boolean[][]; size: number };

function newGrid(size: number): Grid {
	const modules = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
	const reserved = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
	return { modules, reserved, size };
}

function setModule(grid: Grid, x: number, y: number, dark: boolean, reserve = true): void {
	grid.modules[y]![x] = dark;
	if (reserve) grid.reserved[y]![x] = true;
}

function drawFinder(grid: Grid, cx: number, cy: number): void {
	for (let dy = -4; dy <= 4; dy++) {
		for (let dx = -4; dx <= 4; dx++) {
			const x = cx + dx;
			const y = cy + dy;
			if (x < 0 || x >= grid.size || y < 0 || y >= grid.size) continue;
			const dist = Math.max(Math.abs(dx), Math.abs(dy));
			setModule(grid, x, y, dist !== 2 && dist <= 3);
		}
	}
}

function drawAlignment(grid: Grid, cx: number, cy: number): void {
	for (let dy = -2; dy <= 2; dy++) {
		for (let dx = -2; dx <= 2; dx++) {
			setModule(grid, cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
		}
	}
}

function drawFunctionPatterns(grid: Grid, version: number): void {
	const size = grid.size;
	// Timing lines.
	for (let i = 0; i < size; i++) {
		setModule(grid, 6, i, i % 2 === 0);
		setModule(grid, i, 6, i % 2 === 0);
	}
	// Finders + their separators (the separators fall out of the 9x9 clamp in drawFinder).
	drawFinder(grid, 3, 3);
	drawFinder(grid, size - 4, 3);
	drawFinder(grid, 3, size - 4);
	// Alignment patterns, skipping any that collide with a finder.
	const positions = alignmentPositions(version);
	for (const cy of positions) {
		for (const cx of positions) {
			const nearFinder = (cx <= 8 && cy <= 8) || (cx <= 8 && cy >= size - 9) || (cx >= size - 9 && cy <= 8);
			if (!nearFinder) drawAlignment(grid, cx, cy);
		}
	}
	// Reserve the format-info strips (filled later) and the dark module. The first copy wraps the
	// top-left finder (9 cells down col 8, 9 across row 8); the second copy is 8 cells along row 8 by
	// the top-right finder and 8 down col 8 by the bottom-left finder (the last of which is the dark
	// module). Running the second copy to 9 would wrongly reserve a data cell at `size - 9`.
	for (let i = 0; i < 9; i++) {
		grid.reserved[i]![8] = true;
		grid.reserved[8]![i] = true;
	}
	for (let i = 0; i < 8; i++) {
		grid.reserved[8]![size - 1 - i] = true;
		grid.reserved[size - 1 - i]![8] = true;
	}
	setModule(grid, 8, size - 8, true); // the always-dark module
	// Reserve version-info blocks for v7+.
	if (version >= 7) {
		for (let i = 0; i < 18; i++) {
			const a = size - 11 + (i % 3);
			const b = Math.floor(i / 3);
			grid.reserved[b]![a] = true;
			grid.reserved[a]![b] = true;
		}
	}
}

/** Walk the data codewords through the standard upward/downward zigzag, skipping reserved modules. */
function placeData(grid: Grid, codewords: number[]): void {
	const size = grid.size;
	let bitIndex = 0;
	const totalBits = codewords.length * 8;
	for (let right = size - 1; right >= 1; right -= 2) {
		if (right === 6) right = 5; // the timing column shifts the pair left
		for (let vert = 0; vert < size; vert++) {
			for (let j = 0; j < 2; j++) {
				const x = right - j;
				const upward = ((right + 1) & 2) === 0;
				const y = upward ? size - 1 - vert : vert;
				if (grid.reserved[y]![x]) continue;
				let dark = false;
				if (bitIndex < totalBits) {
					dark = ((codewords[bitIndex >> 3]! >> (7 - (bitIndex & 7))) & 1) === 1;
					bitIndex++;
				}
				grid.modules[y]![x] = dark;
			}
		}
	}
}

const MASK_FN: ((x: number, y: number) => boolean)[] = [
	(x, y) => (x + y) % 2 === 0,
	(_x, y) => y % 2 === 0,
	(x) => x % 3 === 0,
	(x, y) => (x + y) % 3 === 0,
	(x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
	(x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
	(x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
	(x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

function applyMask(grid: Grid, mask: number): void {
	const fn = MASK_FN[mask]!;
	for (let y = 0; y < grid.size; y++) {
		for (let x = 0; x < grid.size; x++) {
			if (!grid.reserved[y]![x] && fn(x, y)) grid.modules[y]![x] = !grid.modules[y]![x];
		}
	}
}

function drawFormatBits(grid: Grid, ec: QrEcLevel, mask: number): void {
	const size = grid.size;
	const ecBits = { M: 0, L: 1, H: 2, Q: 3 }[ec];
	const data = (ecBits << 3) | mask;
	let rem = data;
	for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537);
	const bits = ((data << 10) | rem) ^ 0x5412;
	const get = (i: number): boolean => ((bits >> i) & 1) === 1;
	// First copy: around the top-left finder.
	for (let i = 0; i <= 5; i++) setModule(grid, 8, i, get(i));
	setModule(grid, 8, 7, get(6));
	setModule(grid, 8, 8, get(7));
	setModule(grid, 7, 8, get(8));
	for (let i = 9; i < 15; i++) setModule(grid, 14 - i, 8, get(i));
	// Second copy: along the top-right and bottom-left finders.
	for (let i = 0; i < 8; i++) setModule(grid, size - 1 - i, 8, get(i));
	for (let i = 8; i < 15; i++) setModule(grid, 8, size - 15 + i, get(i));
	setModule(grid, 8, size - 8, true);
}

function drawVersionBits(grid: Grid, version: number): void {
	if (version < 7) return;
	let rem = version;
	for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >> 11) * 0x1f25);
	const bits = (version << 12) | rem;
	const size = grid.size;
	for (let i = 0; i < 18; i++) {
		const bit = ((bits >> i) & 1) === 1;
		const a = size - 11 + (i % 3);
		const b = Math.floor(i / 3);
		setModule(grid, a, b, bit);
		setModule(grid, b, a, bit);
	}
}

/** The four ISO penalty rules; a lower total means a mask a scanner reads more reliably. */
function maskPenalty(grid: Grid): number {
	const size = grid.size;
	const m = grid.modules;
	let penalty = 0;
	// Rule 1: runs of 5+ same-color modules in a row/column.
	for (let y = 0; y < size; y++) {
		let runColor = m[y]![0]!;
		let run = 1;
		let runColorV = m[0]![y]!;
		let runV = 1;
		for (let x = 1; x < size; x++) {
			if (m[y]![x] === runColor) run++;
			else { if (run >= 5) penalty += run - 2; runColor = m[y]![x]!; run = 1; }
			if (m[x]![y] === runColorV) runV++;
			else { if (runV >= 5) penalty += runV - 2; runColorV = m[x]![y]!; runV = 1; }
		}
		if (run >= 5) penalty += run - 2;
		if (runV >= 5) penalty += runV - 2;
	}
	// Rule 2: 2x2 blocks of one color.
	for (let y = 0; y < size - 1; y++) {
		for (let x = 0; x < size - 1; x++) {
			const c = m[y]![x];
			if (c === m[y]![x + 1] && c === m[y + 1]![x] && c === m[y + 1]![x + 1]) penalty += 3;
		}
	}
	// Rule 3: finder-like 1:1:3:1:1 patterns with a 4-module clear run, in both orientations.
	const hasPattern = (get: (i: number) => boolean): boolean => {
		const p = [true, false, true, true, true, false, true];
		const check = (start: number): boolean => {
			for (let k = 0; k < 7; k++) if (get(start + k) !== p[k]) return false;
			return true;
		};
		return check(0);
	};
	for (let y = 0; y < size; y++) {
		for (let x = 0; x <= size - 7; x++) {
			if (hasPattern((i) => m[y]![x + i]!)) {
				const before = x - 4 < 0 || [m[y]![x - 1], m[y]![x - 2], m[y]![x - 3], m[y]![x - 4]].every((v) => v === false);
				const after = x + 10 > size || [m[y]![x + 7], m[y]![x + 8], m[y]![x + 9], m[y]![x + 10]].every((v) => v === false);
				if (before || after) penalty += 40;
			}
			if (hasPattern((i) => m[x + i]![y]!)) {
				const before = x - 4 < 0 || [m[x - 1]?.[y], m[x - 2]?.[y], m[x - 3]?.[y], m[x - 4]?.[y]].every((v) => v === false);
				const after = x + 10 > size || [m[x + 7]?.[y], m[x + 8]?.[y], m[x + 9]?.[y], m[x + 10]?.[y]].every((v) => v === false);
				if (before || after) penalty += 40;
			}
		}
	}
	// Rule 4: deviation of the dark-module ratio from 50%.
	let dark = 0;
	for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (m[y]![x]) dark++;
	const ratio = (dark * 100) / (size * size);
	penalty += Math.floor(Math.abs(ratio - 50) / 5) * 10;
	return penalty;
}

function buildMatrix(codewords: number[], version: number, ec: QrEcLevel, forcedMask?: number): QrMatrix {
	const size = version * 4 + 17;
	let best: { grid: Grid; mask: number } | null = null;
	const masks = forcedMask !== undefined ? [forcedMask] : [0, 1, 2, 3, 4, 5, 6, 7];
	let bestPenalty = Infinity;
	for (const mask of masks) {
		const grid = newGrid(size);
		drawFunctionPatterns(grid, version);
		placeData(grid, codewords);
		applyMask(grid, mask);
		drawFormatBits(grid, ec, mask);
		drawVersionBits(grid, version);
		const penalty = maskPenalty(grid);
		if (penalty < bestPenalty) {
			bestPenalty = penalty;
			best = { grid, mask };
		}
	}
	const chosen = best!;
	return { size, modules: chosen.grid.modules, version, ecLevel: ec, mask: chosen.mask };
}

/** Encode `text` into a placed, masked QR symbol, growing the version until the payload fits. */
export function encodeQr(text: string, options: EncodeQrOptions = {}): QrMatrix {
	const ec = options.ecLevel ?? "M";
	const minVersion = Math.max(1, options.minVersion ?? 1);
	const maxVersion = Math.min(40, options.maxVersion ?? 40);
	const mode = detectMode(text);
	const segment = encodeSegment(text, mode);

	let version = minVersion;
	for (; version <= maxVersion; version++) {
		const capacity = dataCodewords(version, ec) * 8;
		const used = 4 + charCountBits(mode, version) + segment.dataBits;
		if (used <= capacity) break;
		if (version === maxVersion) throw new Error(`xtyle qr: payload too large for version ${maxVersion} at EC level ${ec}`);
	}

	const capacityBits = dataCodewords(version, ec) * 8;
	const bb = new BitBuffer();
	bb.append(MODE_INDICATOR[mode], 4);
	bb.append(segment.charCount, charCountBits(mode, version));
	segment.write(bb);
	// Terminator (up to 4 zero bits) then pad to a byte boundary.
	for (let i = 0; i < 4 && bb.bits.length < capacityBits; i++) bb.bits.push(0);
	while (bb.bits.length % 8 !== 0) bb.bits.push(0);

	const codewords: number[] = [];
	for (let i = 0; i < bb.bits.length; i += 8) {
		let byte = 0;
		for (let j = 0; j < 8; j++) byte = (byte << 1) | bb.bits[i + j]!;
		codewords.push(byte);
	}
	// Pad codewords with the alternating fill bytes until the data capacity is met.
	for (let pad = 0xec; codewords.length < capacityBits / 8; pad ^= 0xec ^ 0x11) codewords.push(pad);

	const interleaved = addEcAndInterleave(codewords, version, ec);
	return buildMatrix(interleaved, version, ec, options.mask);
}

function moduleRect(x: number, y: number, shape: QrModuleShape): string {
	if (shape === "dot") return `M${x + 0.5} ${y}a.5 .5 0 1 0 .001 0z`;
	if (shape === "rounded") return `M${x + 0.2} ${y}h.6a.2 .2 0 0 1 .2 .2v.6a.2 .2 0 0 1 -.2 .2h-.6a.2 .2 0 0 1 -.2 -.2v-.6a.2 .2 0 0 1 .2 -.2z`;
	return `M${x} ${y}h1v1h-1z`;
}

/** Whether a module sits inside one of the three 7×7 finder patterns. Finders must render as solid
 * squares for a reader to lock onto the symbol, so a `dot` / `rounded` style is applied only to the
 * data modules and never breaks up the finders. */
function inFinder(x: number, y: number, size: number): boolean {
	const near = (fx: number, fy: number): boolean => x >= fx && x < fx + 7 && y >= fy && y < fy + 7;
	return near(0, 0) || near(size - 7, 0) || near(0, size - 7);
}

/** Build a single SVG path drawing every dark module, plus the viewBox and (optional) cleared center
 * region for a logo. One path keeps the DOM tiny even for a dense v10+ symbol. */
export function qrPath(matrix: QrMatrix, options: QrPathOptions = {}): QrPath {
	const quiet = options.quietZone ?? 4;
	const shape = options.shape ?? "square";
	const size = matrix.size;
	const extent = size + quiet * 2;

	let clearRegion: { x: number; y: number; size: number } | undefined;
	let clearBounds: { lo: number; hi: number } | undefined;
	if (options.clear && options.clear.size > 0) {
		const clearModules = Math.min(size, Math.round(options.clear.size));
		const lo = Math.floor((size - clearModules) / 2);
		const hi = lo + clearModules;
		clearBounds = { lo, hi };
		clearRegion = { x: quiet + lo, y: quiet + lo, size: clearModules };
	}

	let d = "";
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			if (!matrix.modules[y]![x]) continue;
			if (clearBounds && x >= clearBounds.lo && x < clearBounds.hi && y >= clearBounds.lo && y < clearBounds.hi) continue;
			const cellShape = shape !== "square" && inFinder(x, y, size) ? "square" : shape;
			d += moduleRect(x + quiet, y + quiet, cellShape);
		}
	}
	return { d, extent, viewBox: `0 0 ${extent} ${extent}`, clear: clearRegion };
}

/** WCAG contrast between the module and background of a rendered symbol reads through
 * {@link import("./audit.js").qrScannability}; this module stays color-free. */

/** Test-only internals — the padded data codewords and the interleaved (data + EC) stream, plus the
 * GF(256) exponentials — so the suite can assert the ISO reference vector and self-check RS parity.
 * Not re-exported from the package barrel. */
export const __qrInternals = {
	dataCodewordsFor(text: string, ec: QrEcLevel): number[] {
		const mode = detectMode(text);
		const segment = encodeSegment(text, mode);
		let version = 1;
		for (; version <= 40; version++) {
			if (4 + charCountBits(mode, version) + segment.dataBits <= dataCodewords(version, ec) * 8) break;
		}
		const capacityBits = dataCodewords(version, ec) * 8;
		const bb = new BitBuffer();
		bb.append(MODE_INDICATOR[mode], 4);
		bb.append(segment.charCount, charCountBits(mode, version));
		segment.write(bb);
		for (let i = 0; i < 4 && bb.bits.length < capacityBits; i++) bb.bits.push(0);
		while (bb.bits.length % 8 !== 0) bb.bits.push(0);
		const codewords: number[] = [];
		for (let i = 0; i < bb.bits.length; i += 8) {
			let byte = 0;
			for (let j = 0; j < 8; j++) byte = (byte << 1) | bb.bits[i + j]!;
			codewords.push(byte);
		}
		for (let pad = 0xec; codewords.length < capacityBits / 8; pad ^= 0xec ^ 0x11) codewords.push(pad);
		return codewords;
	},
	blockEcCodewords(data: number[], ecLen: number): number[] {
		return rsRemainder(data, rsGenerator(ecLen));
	},
	gfMul,
	GF_EXP,
};
