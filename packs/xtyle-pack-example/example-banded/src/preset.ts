import {
	SHARED_KNOBS,
	contrast,
	formatCss,
	settlePass,
	toOklchColor,
	withLightness,
	type DeriveOptions,
	type Pass,
	type PresetDefaults,
	type XtyleAlgorithmSpec,
} from "@xtyle/core/authoring";

/** The tokens this pack adds to the standard register. */
export const BAND_TOKENS = ["--band-quiet", "--band-notice", "--band-alarm", "--band-ink"] as const;

export const BAND_CATEGORIES = {
	"--band-quiet": "color",
	"--band-notice": "color",
	"--band-alarm": "color",
	"--band-ink": "color",
} as const;

/**
 * How far each band steps past the last. One constant behind both the declared knob default and the
 * pass's own fallback, so a control cannot open on a value the derivation would never have produced —
 * at zero every band collapses onto the status token it came from and the four tokens say nothing.
 */
export const DEFAULT_BAND_LIFT = 0.06;

/** Each band's starting colour, in threshold order. The first sits on its status token; the rest step away. */
const BAND_SOURCES = [
	["--band-quiet", "--success"],
	["--band-notice", "--warn"],
	["--band-alarm", "--danger"],
] as const;

const LIGHT_INK = "#ffffff";
const DARK_INK = "#0b0b0d";

/** The lightness a band may not pass, either way, so a step never runs a colour out to pure black or white. */
const BAND_FLOOR = 0.08;
const BAND_CEILING = 0.96;

/**
 * A threshold ramp, derived rather than picked. Emits {@link BAND_TOKENS} over the status colours
 * already in the register, stepped apart by the `bandLift` knob, with one ink legible on all of them.
 */
export function bandPass(): Pass {
	return {
		name: "bands",
		run(register, ctx) {
			const raw = ctx.knobs.bandLift;
			const lift = typeof raw === "number" ? raw : DEFAULT_BAND_LIFT;
			const next: Record<string, string> = {};

			for (const [index, [token, source]] of BAND_SOURCES.entries()) {
				const from = register[source];
				if (!from) continue;
				const color = toOklchColor(from);
				const step = index * lift;
				const away = ctx.scheme === "dark" ? color.l + step : color.l - step;
				next[token] = formatCss(withLightness(color, Math.min(BAND_CEILING, Math.max(BAND_FLOOR, away))));
			}

			const bands = Object.values(next);
			if (bands.length > 0) {
				const worst = (ink: string) => Math.min(...bands.map((band) => contrast(ink, band)));
				next["--band-ink"] = worst(LIGHT_INK) >= worst(DARK_INK) ? LIGHT_INK : DARK_INK;
			}
			return { ...register, ...next };
		},
	};
}

export const spec: XtyleAlgorithmSpec = {
	id: "example-banded",
	vibrancy: 0.55,
	chroma: { accent: 1, status: 1.15, palette: 1, neutral: 0.012, accentTint: 0.4 },
	knobs: [...SHARED_KNOBS, "bandLift"],
	knobSpecs: [
		{
			name: "bandLift",
			kind: "range" as const,
			label: "Band lift",
			min: 0,
			max: 0.18,
			step: 0.01,
			default: DEFAULT_BAND_LIFT,
		},
	],
	adds: { tokens: [...BAND_TOKENS], categories: { ...BAND_CATEGORIES } },
	passes: (preset: PresetDefaults, input: DeriveOptions): Pass[] => [settlePass(preset, input), bandPass()],
};
