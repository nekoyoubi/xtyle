import { describe, expect, it } from "vitest";
import { encodeQr, qrPath, qrScannability, qrLinkHref, qrLogoModules, QR_MIN_CONTRAST, getComponent, coverComponent, derive } from "../src/index.js";
import { __qrInternals } from "../src/qr.js";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";
import { bakedAlgorithms, xtyleDefault } from "../src/batteries.js";

const register = derive(xtyleDefault, {
	constraints: { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef", "--accent": "#6ea8fe" },
});

// The canonical ISO/IEC 18004 example: "01234567" at version 1, EC level M encodes to these 16
// data codewords (numeric mode, before Reed-Solomon), a widely-published reference vector.
const ISO_DATA = [0x10, 0x20, 0x0c, 0x56, 0x61, 0x80, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11];

describe("qr encoder", () => {
	it("picks version 1 for a short numeric payload at M and is 21 modules", () => {
		const m = encodeQr("01234567", { ecLevel: "M" });
		expect(m.version).toBe(1);
		expect(m.size).toBe(21);
		expect(m.modules.length).toBe(21);
		expect(m.modules[0]).toHaveLength(21);
	});

	it("matches the ISO 01234567 data-codeword vector before EC", () => {
		expect(__qrInternals.dataCodewordsFor("01234567", "M")).toEqual(ISO_DATA);
	});

	it("produces Reed-Solomon parity with zero syndromes (self-consistent GF math)", () => {
		const data = __qrInternals.dataCodewordsFor("01234567", "M");
		const ecLen = 10; // version 1, level M
		const parity = __qrInternals.blockEcCodewords(data, ecLen);
		const codeword = [...data, ...parity];
		const n = codeword.length;
		for (let i = 0; i < ecLen; i++) {
			let syndrome = 0;
			for (let k = 0; k < n; k++) {
				syndrome ^= __qrInternals.gfMul(codeword[k]!, __qrInternals.GF_EXP[(i * (n - 1 - k)) % 255]!);
			}
			expect(syndrome, `syndrome ${i} must be zero`).toBe(0);
		}
	});

	it("places the three finder patterns and the dark module", () => {
		const m = encodeQr("https://xtyle.dev", { ecLevel: "M" });
		const isFinder = (cx: number, cy: number): boolean =>
			m.modules[cy]![cx] === true && m.modules[cy - 2]![cx] === false && m.modules[cy - 3]![cx] === true;
		expect(isFinder(3, 3)).toBe(true);
		expect(isFinder(m.size - 4, 3)).toBe(true);
		expect(isFinder(3, m.size - 4)).toBe(true);
		expect(m.modules[m.size - 8]![8]).toBe(true);
	});

	it("grows the version with the payload and with the EC level", () => {
		const small = encodeQr("a", { ecLevel: "L" });
		const big = encodeQr("x".repeat(300), { ecLevel: "L" });
		expect(big.version).toBeGreaterThan(small.version);
		const l = encodeQr("x".repeat(120), { ecLevel: "L" });
		const h = encodeQr("x".repeat(120), { ecLevel: "H" });
		expect(h.version).toBeGreaterThanOrEqual(l.version);
	});

	it("selects numeric / alphanumeric / byte modes and always fits", () => {
		expect(() => encodeQr("1234567890")).not.toThrow();
		expect(() => encodeQr("HELLO WORLD $:/")).not.toThrow();
		expect(() => encodeQr("héllo → wörld")).not.toThrow();
	});

	it("throws only when the payload cannot fit even at version 40", () => {
		expect(() => encodeQr("x".repeat(3000), { ecLevel: "H" })).toThrow(/too large/);
	});

	it("is deterministic under a forced mask", () => {
		const a = encodeQr("determinism", { ecLevel: "Q", mask: 3 });
		const b = encodeQr("determinism", { ecLevel: "Q", mask: 3 });
		expect(a.mask).toBe(3);
		expect(a.modules).toEqual(b.modules);
	});

	// An independent decoder that shares none of the encoder's internal maps: it reads the mask back
	// from where the spec puts the format bits, then re-reads the data through a from-scratch standard
	// reserved map. A wrong function-pattern reservation or a nonstandard placement shows up here as a
	// codeword mismatch, even though the encoder's own round-trip would miss it. Version 1 only (no
	// alignment patterns), which is where the reserved map is simple enough to hand-write.
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

	function readV1(modules: boolean[][]): { mask: number; data: number[] } {
		const size = 21;
		// Read the 15 format bits from copy 1 and recover the applied mask.
		const fmt: number[] = [];
		for (let i = 0; i <= 5; i++) fmt[i] = modules[i]![8] ? 1 : 0;
		fmt[6] = modules[7]![8] ? 1 : 0;
		fmt[7] = modules[8]![8] ? 1 : 0;
		fmt[8] = modules[8]![7] ? 1 : 0;
		for (let i = 9; i < 15; i++) fmt[i] = modules[8]![14 - i] ? 1 : 0;
		let bits = 0;
		for (let i = 0; i < 15; i++) bits |= fmt[i]! << i;
		const format = (bits ^ 0x5412) >> 10;
		const mask = format & 7;
		const fn = MASK_FN[mask]!;
		const reserved = (x: number, y: number): boolean =>
			(x <= 8 && y <= 8) || (x >= size - 8 && y <= 8) || (x <= 8 && y >= size - 8) || x === 6 || y === 6;
		const dataBits: number[] = [];
		for (let right = size - 1; right >= 1; right -= 2) {
			if (right === 6) right = 5;
			for (let vert = 0; vert < size; vert++) {
				for (let j = 0; j < 2; j++) {
					const x = right - j;
					const up = ((right + 1) & 2) === 0;
					const y = up ? size - 1 - vert : vert;
					if (reserved(x, y)) continue;
					dataBits.push((modules[y]![x] ? 1 : 0) ^ (fn(x, y) ? 1 : 0));
				}
			}
		}
		const data: number[] = [];
		for (let i = 0; i + 8 <= dataBits.length; i += 8) {
			let b = 0;
			for (let k = 0; k < 8; k++) b = (b << 1) | dataBits[i + k]!;
			data.push(b);
		}
		return { mask, data };
	}

	it("round-trips through an independent standard decoder (catches placement/format bugs)", () => {
		const m = encodeQr("01234567", { ecLevel: "M", mask: 2 });
		const read = readV1(m.modules);
		expect(read.mask, "format bits must report the applied mask").toBe(2);
		// The first 16 codewords are the data block; they must equal the ISO reference exactly.
		expect(read.data.slice(0, 16)).toEqual(ISO_DATA);
	});
});

describe("qr path", () => {
	it("emits one path with a quiet-zone-sized viewBox", () => {
		const m = encodeQr("01234567", { ecLevel: "M" });
		const p = qrPath(m, { quietZone: 4 });
		expect(p.extent).toBe(21 + 8);
		expect(p.viewBox).toBe("0 0 29 29");
		expect(p.d.length).toBeGreaterThan(0);
	});

	it("sizes the logo patch to tightly wrap the mark, growing across the presets", () => {
		const m = encodeQr("https://xtyle.dev", { ecLevel: "H" });
		const scales = [0.18, 0.24, 0.28, 0.32];
		const sizes = scales.map((s) => qrLogoModules(m.size, s));
		for (let i = 1; i < sizes.length; i++) expect(sizes[i]!).toBeGreaterThanOrEqual(sizes[i - 1]!);
		expect(sizes[3]!).toBeGreaterThan(sizes[0]!);
		// the patch is the ceil of the scaled width (no extra padding), so the glyph fills it
		for (const s of scales) expect(qrLogoModules(m.size, s)).toBe(Math.max(3, Math.ceil(m.size * s)));
	});

	it("clears a centered region when a logo is injected", () => {
		const m = encodeQr("https://xtyle.dev/a/reasonably/long/path/to/grow/the/symbol", { ecLevel: "H" });
		const withClear = qrPath(m, { quietZone: 4, clear: { size: 7 } });
		const without = qrPath(m, { quietZone: 4 });
		expect(withClear.clear).toBeDefined();
		expect(withClear.clear!.size).toBe(7);
		// Clearing the center drops modules, so the path is shorter.
		expect(withClear.d.length).toBeLessThan(without.d.length);
	});
});

describe("qr scannability", () => {
	it("grades the module/background pair against the documented floor", () => {
		const scan = qrScannability({ "--fg-0": "#000000", "--bg-0": "#ffffff" });
		expect(scan.floor).toBe(QR_MIN_CONTRAST);
		expect(scan.ratio).toBeGreaterThan(20);
		expect(scan.scannable).toBe(true);
	});

	it("fails a low-contrast pairing", () => {
		const scan = qrScannability({ "--fg-0": "#777777", "--bg-0": "#888888" });
		expect(scan.scannable).toBe(false);
	});

	it("treats missing tokens as unscannable", () => {
		expect(qrScannability({}).scannable).toBe(false);
	});

	// The invariant, wired across the blessed set: every algorithm's default derive must yield a
	// scannable themed QR, so a themed code is never the one un-audited patch of a page.
	it("holds for every blessed algorithm's default theme", () => {
		for (const [id, algorithm] of Object.entries(bakedAlgorithms)) {
			const reg = derive(algorithm, {});
			const scan = qrScannability(reg);
			expect(scan.scannable, `${id}: --fg-0 on --bg-0 is ${scan.ratio}:1, below ${QR_MIN_CONTRAST}:1`).toBe(true);
		}
	});
});

describe("qr link detection", () => {
	it("linkifies safe schemes and bare hosts", () => {
		expect(qrLinkHref("https://xtyle.dev")).toBe("https://xtyle.dev");
		expect(qrLinkHref("http://xtyle.dev/x")).toBe("http://xtyle.dev/x");
		expect(qrLinkHref("mailto:hello@xtyle.dev")).toBe("mailto:hello@xtyle.dev");
		expect(qrLinkHref("tel:+15551234567")).toBe("tel:+15551234567");
		expect(qrLinkHref("xtyle.dev/components/qr")).toBe("https://xtyle.dev/components/qr");
	});

	it("refuses unsafe or non-link payloads", () => {
		expect(qrLinkHref("javascript:alert(1)")).toBeNull();
		expect(qrLinkHref("data:text/html,<script>")).toBeNull();
		expect(qrLinkHref("WIFI:T:WPA;S:net;P:pw;;")).toBeNull();
		expect(qrLinkHref("01234567")).toBeNull();
		expect(qrLinkHref("just some text")).toBeNull();
	});
});

describe("qr component", () => {
	it("is registered under the media category", () => {
		const manifest = getComponent("qr");
		expect(manifest.category).toBe("media");
		expect(manifest.name).toBe("QR Code");
	});

	it("covers every consumed token against xtyle-default", () => {
		const result = coverComponent(getComponent("qr"), register);
		expect(result.missing, `missing: ${result.missing.join(", ")}`).toEqual([]);
		expect(result.covered).toBe(true);
	});

	it("renders an svg with a background rect and a modules path via SSR", async () => {
		const m = encodeQr("https://xtyle.dev", { ecLevel: "M" });
		const p = qrPath(m, { quietZone: 4, shape: "square" });
		const html = await renderFragmentLight("qr", {
			path: p.d,
			viewBox: p.viewBox,
			extent: p.extent,
			shape: "square",
			size: 200,
			frame: false,
			label: "QR code: https://xtyle.dev",
			version: m.version,
			ecLevel: m.ecLevel,
		});
		expect(html).toContain('class="xtyle-qr');
		expect(html).toContain("<svg");
		expect(html).toContain('class="xtyle-qr__bg"');
		expect(html).toContain('class="xtyle-qr__modules"');
		expect(html).toContain('aria-label="QR code: https://xtyle.dev"');
	});

	it("renders a framed caption and a knockout icon logo via SSR", async () => {
		const m = encodeQr("https://xtyle.dev", { ecLevel: "H" });
		const p = qrPath(m, { quietZone: 4, clear: { size: 7 } });
		const html = await renderFragmentLight("qr", {
			path: p.d,
			viewBox: p.viewBox,
			extent: p.extent,
			shape: "square",
			size: 240,
			logoBox: { x: p.extent / 2 - 3.5, y: p.extent / 2 - 3.5, size: 5 },
			iconName: "palette",
			frame: true,
			caption: "https://xtyle.dev",
			label: "QR code",
			version: m.version,
			ecLevel: m.ecLevel,
		});
		expect(html).toContain("xtyle-qr--framed");
		expect(html).toContain('class="xtyle-qr__caption"');
		expect(html).toContain('<xtyle-icon class="xtyle-qr__icon" name="palette"');
		expect(html).toContain("xtyle-qr__logo--knockout");
	});

	it("renders the framed caption as a link when the payload is one, and text otherwise", async () => {
		const base = (data: string, linkHref: string | null) => ({
			path: "M0 0h1v1h-1z",
			viewBox: "0 0 29 29",
			extent: 29,
			shape: "square",
			size: 200,
			frame: true,
			caption: data,
			linkHref,
			label: "QR code",
			version: 2,
			ecLevel: "M",
		});
		const link = await renderFragmentLight("qr", base("https://xtyle.dev", "https://xtyle.dev"));
		expect(link).toContain('<a class="xtyle-qr__caption xtyle-link" part="caption" href="https://xtyle.dev"');
		expect(link).toContain('rel="noopener noreferrer"');
		const text = await renderFragmentLight("qr", base("WIFI:T:WPA;S:net;;", null));
		expect(text).toContain("<figcaption");
		expect(text).not.toContain("<a class=");
	});

	it("renders the themed/bitonal swap button with a pressed state via SSR", async () => {
		const html = await renderFragmentLight("qr", {
			path: "M0 0h1v1h-1z",
			viewBox: "0 0 29 29",
			extent: 29,
			shape: "square",
			size: 200,
			frame: true,
			caption: "https://xtyle.dev",
			linkHref: "https://xtyle.dev",
			modeToggle: true,
			isBitonal: false,
			label: "QR code",
			version: 2,
			ecLevel: "M",
		});
		expect(html).toContain("xtyle-qr__toggle");
		expect(html).toContain("data-qr-toggle");
		expect(html).toContain('aria-pressed="false"');
	});

	it("renders an overlay logo with an outline via SSR", async () => {
		const m = encodeQr("https://xtyle.dev", { ecLevel: "H" });
		const p = qrPath(m, { quietZone: 4 });
		const html = await renderFragmentLight("qr", {
			path: p.d,
			viewBox: p.viewBox,
			extent: p.extent,
			shape: "square",
			size: 240,
			logoBox: { x: p.extent / 2 - 3.5, y: p.extent / 2 - 3.5, size: 7 },
			iconName: "palette",
			iconOverlay: true,
			iconOutline: true,
			frame: false,
			label: "QR code",
			version: m.version,
			ecLevel: m.ecLevel,
		});
		expect(html).toContain("xtyle-qr__logo--overlay");
		expect(html).toContain("xtyle-qr__logo--outline");
	});

	it("pins bitonal colors into the inline style and flags low contrast", async () => {
		const m = encodeQr("x", { ecLevel: "L" });
		const p = qrPath(m, {});
		const html = await renderFragmentLight("qr", {
			path: p.d,
			viewBox: p.viewBox,
			extent: p.extent,
			moduleColor: "#000000",
			bgColor: "#ffffff",
			shape: "square",
			size: 200,
			frame: false,
			label: "QR",
			lowContrast: true,
			version: m.version,
			ecLevel: m.ecLevel,
		});
		expect(html).toContain("--qr-module:#000000");
		expect(html).toContain("--qr-bg:#ffffff");
		expect(html).toContain('data-contrast="low"');
	});
});
