import { describe, expect, it } from "vitest";
import { toOklchColor } from "../src/color.js";
import { contrast, derive } from "../src/index.js";
import { xtyleDefault, xtyleHc, xtyleLoud, xtyleQuiet } from "../src/batteries.js";

const ALGORITHMS = { "xtyle-default": xtyleDefault, "xtyle-hc": xtyleHc, "xtyle-quiet": xtyleQuiet, "xtyle-loud": xtyleLoud };

const DARK_PAGE = "#101216";
const LIGHT_PIN = "#f5f5f5";

/**
 * Emitting a pin is not the same as deriving from it. Each scoped surface ships a companion set whose
 * contract is to be readable *on that surface*, and those read the derived value while the register
 * published the pinned one — so a light code block pinned onto a dark page kept syntax colours computed
 * for the dark scheme. Unreadable, and silent: the failure is in the pairing, not in either token.
 */
const COMPANIONS: Record<string, string[]> = {
	"--code-bg": ["--code-fg", "--code-keyword", "--code-string", "--code-number"],
	"--terminal-bg": ["--terminal-fg", "--terminal-red", "--terminal-green", "--terminal-blue"],
};

/** Comments are deliberately the quietest ink, so the palette's own floor for them is 3, not AA. */
const QUIET_INKS: Record<string, [string, number]> = { "--code-bg": ["--code-comment", 3] };

describe("a pinned scoped surface re-threads what sits on it", () => {
	for (const [surface, companions] of Object.entries(COMPANIONS)) {
		it(`keeps every ink readable when ${surface} is pinned against the page's scheme`, () => {
			const register = derive(xtyleDefault, { constraints: { "--bg-0": DARK_PAGE, [surface]: LIGHT_PIN } });
			expect(register[surface]).toBe(LIGHT_PIN);
			for (const ink of companions) {
				const value = register[ink];
				expect(value, ink).toBeTruthy();
				expect(contrast(value as string, LIGHT_PIN), `${ink} on ${surface}`).toBeGreaterThanOrEqual(4.5);
			}
			const quiet = QUIET_INKS[surface];
			if (quiet) {
				const [ink, floor] = quiet;
				expect(contrast(register[ink] as string, LIGHT_PIN), `${ink} on ${surface}`).toBeGreaterThanOrEqual(floor);
			}
		});

		it(`moves ${surface}'s inks off their unpinned values rather than publishing the pin alone`, () => {
			const constraints = { "--bg-0": DARK_PAGE };
			const before = derive(xtyleDefault, { constraints });
			const after = derive(xtyleDefault, { constraints: { ...constraints, [surface]: LIGHT_PIN } });
			expect(companions.some((ink) => before[ink] !== after[ink]), `no ink moved for ${surface}`).toBe(true);
		});
	}

	it("re-threads a field's border onto a pinned field surface", () => {
		const register = derive(xtyleHc, { constraints: { "--bg-0": DARK_PAGE, "--field-bg": "#3fbf5f" } });
		expect(register["--field-bg"]).toBe("#3fbf5f");
		expect(contrast(register["--field-border"] as string, "#3fbf5f")).toBeGreaterThanOrEqual(1.5);
	});

	/** The pin is an escape hatch, not a rewrite: a theme that pins nothing derives exactly as before. */
	it("changes nothing for a theme that pins no scoped surface", () => {
		for (const [name, algorithm] of Object.entries(ALGORITHMS)) {
			const register = derive(algorithm, { constraints: { "--bg-0": DARK_PAGE, "--accent": "#6ea8fe" } });
			expect(register["--code-bg"], name).toBeTruthy();
			expect(register["--code-bg"], name).not.toBe(LIGHT_PIN);
		}
	});

	it("holds across every blessed algorithm, not only the default", () => {
		for (const [name, algorithm] of Object.entries(ALGORITHMS)) {
			const register = derive(algorithm, { constraints: { "--bg-0": DARK_PAGE, "--code-bg": LIGHT_PIN } });
			expect(contrast(register["--code-fg"] as string, LIGHT_PIN), `${name} --code-fg`).toBeGreaterThanOrEqual(4.5);
		}
	});
});

const ROLES = ["--accent", "--neutral", "--success", "--warn", "--danger", "--info"] as const;
const TINT_ROLES = ["--accent", "--success", "--warn", "--danger", "--info"] as const;
/** Achromatic pins are the ones that used to fall through: a gray carries no hue to re-thread around. */
const PINS = ["#0a0a0a", "#f5f5f5", "#8a8a8a", "#3fbf5f"] as const;

describe("a pinned fill re-picks the text painted on it", () => {
	for (const role of ROLES) {
		it(`keeps ${role}-fg readable on every pinned ${role}`, () => {
			for (const pin of PINS) {
				const register = derive(xtyleDefault, { constraints: { "--bg-0": DARK_PAGE, [role]: pin } });
				expect(register[role]).toBe(pin);
				expect(contrast(register[`${role}-fg`] as string, pin), `${role}-fg on ${pin}`).toBeGreaterThanOrEqual(4.5);
			}
		});
	}

	/**
	 * The gate that used to swallow it: an achromatic pin has no usable hue, so the family cannot
	 * re-thread *around* it — but it is still the fill the text has to sit on. Reading one answer for
	 * both questions put black text on a near-black `--success`.
	 */
	it("takes an achromatic pin as the fill even though it cannot re-hue the family", () => {
		const register = derive(xtyleDefault, { constraints: { "--bg-0": DARK_PAGE, "--success": "#0a0a0a" } });
		expect(register["--success-fg"]).toBe("#ffffff");
	});
});

describe("a pinned tint re-picks the text painted on it", () => {
	for (const role of TINT_ROLES) {
		it(`keeps ${role}-text readable on every pinned ${role}-bg`, () => {
			for (const pin of PINS) {
				const register = derive(xtyleDefault, { constraints: { "--bg-0": DARK_PAGE, [`${role}-bg`]: pin } });
				expect(register[`${role}-bg`]).toBe(pin);
				expect(contrast(register[`${role}-text`] as string, pin), `${role}-text on ${pin}`).toBeGreaterThanOrEqual(4.5);
			}
		});
	}
});

const RAMPS = ["red", "blue", "gray", "white", "black"] as const;

describe("a pinned palette ramp builds its family around the pin", () => {
	for (const hue of RAMPS) {
		it(`takes a pin on --color-${hue} through to --${hue}`, () => {
			for (const pin of ["#666666", "#cccccc", "#3fbf5f"]) {
				const register = derive(xtyleDefault, { constraints: { "--bg-0": DARK_PAGE, [`--color-${hue}`]: pin } });
				expect(register[`--${hue}`], `--${hue} under ${pin}`).toBe(pin);
				expect(contrast(register[`--${hue}-fg`] as string, pin), `--${hue}-fg on ${pin}`).toBeGreaterThanOrEqual(4.5);
			}
		});
	}

	/**
	 * `gray`, `white` and `black` are catalog entries rather than `{h,c}` specs, and the pin resolution
	 * was gated on being a spec *and* on carrying a hue — so an achromatic ramp could never take one.
	 * Warm-versus-cool gray is an ordinary brand decision, and it was silently unavailable.
	 */
	it("honours a pin on an achromatic ramp, which no chroma gate can speak for", () => {
		const register = derive(xtyleDefault, { constraints: { "--bg-0": DARK_PAGE, "--color-gray": "#8a7f75" } });
		expect(register["--gray"]).toBe("#8a7f75");
	});

	/** The swatch ladder is the ramp's own shape and deliberately keeps its rungs; only the family moves. */
	it("leaves the swatch ladder deriving rather than snapping it to the pin", () => {
		const base = derive(xtyleDefault, { constraints: { "--bg-0": DARK_PAGE } });
		const pinned = derive(xtyleDefault, { constraints: { "--bg-0": DARK_PAGE, "--color-gray": "#666666" } });
		expect(pinned["--color-gray-subtle"]).toBe(base["--color-gray-subtle"]);
		expect(pinned["--color-gray-strong"]).toBe(base["--color-gray-strong"]);
	});
});

const LADDER = ["--bg-sunken", "--body-bg", "--bg-0", "--bg-1", "--bg-2", "--bg-3"] as const;

function ladderLightness(register: Record<string, string>): number[] {
	return LADDER.map((token) => toOklchColor(register[token] as string).l);
}

function ascends(values: number[]): boolean {
	return values.every((value, index) => index === 0 || value > (values[index - 1] as number));
}

function neverDoublesBack(values: number[]): boolean {
	const rising = values.every((value, index) => index === 0 || value >= (values[index - 1] as number));
	const falling = values.every((value, index) => index === 0 || value <= (values[index - 1] as number));
	return rising || falling;
}

describe("a pinned surface re-spaces the ladder around it", () => {
	for (const [id, algorithm] of Object.entries(ALGORITHMS)) {
		it(`keeps the ladder ordered when a mid surface is pinned (${id})`, () => {
			for (const pin of ["#4a3a6b", "#2a2f33", "#565c62"]) {
				const register = derive(algorithm, { constraints: { "--bg-0": DARK_PAGE, "--bg-2": pin } });
				expect(register["--bg-2"], `--bg-2 under ${pin}`).toBe(pin);
				expect(ascends(ladderLightness(register)), `ladder under --bg-2 ${pin}`).toBe(true);
			}
		});
	}

	it("seats the unpinned rungs between two pins rather than beside them", () => {
		const register = derive(xtyleDefault, {
			constraints: { "--bg-0": DARK_PAGE, "--body-bg": "#05070a", "--bg-3": "#3a4450" },
		});
		expect(register["--body-bg"]).toBe("#05070a");
		expect(register["--bg-3"]).toBe("#3a4450");
		const [, bodyBg, bg0, bg1, bg2, bg3] = ladderLightness(register);
		expect(ascends([bodyBg as number, bg0 as number, bg1 as number, bg2 as number, bg3 as number])).toBe(true);
		expect(bg1 as number).toBeGreaterThan(bg0 as number);
		expect(bg2 as number).toBeLessThan(bg3 as number);
	});

	it("carries --bg-sunken below a pinned --body-bg instead of leaving it stranded above", () => {
		const register = derive(xtyleDefault, {
			constraints: { "--bg-0": DARK_PAGE, "--body-bg": "#05070a" },
		});
		const [sunken, bodyBg] = ladderLightness(register);
		expect(sunken as number).toBeLessThan(bodyBg as number);
	});

	for (const [id, algorithm] of Object.entries(ALGORITHMS)) {
		it(`leaves an unpinned ladder ordered, so the re-spacing costs nothing by default (${id})`, () => {
			for (const constraints of [{}, { "--accent": "#3fbf5f" }, { "--bg-0": DARK_PAGE }]) {
				const register = derive(algorithm, { constraints });
				const rungs = ladderLightness(register);
				expect(neverDoublesBack(rungs), `ladder under ${JSON.stringify(constraints)}`).toBe(true);
			}
		});
	}
});
