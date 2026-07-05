/**
 * The canonical design-vocabulary unions shared across every binding and the
 * component manifest. These are the authoritative names; components import from
 * here so the vocabulary never drifts between the engine, the manifests, and the
 * bindings.
 */

/** Semantic color roles — the `--{role}-*` token families. */
export type Tone = "accent" | "neutral" | "danger" | "success" | "warn" | "info";

/** The twelve named hues — the `--color-{hue}-*` token families. */
export type Hue =
	| "red"
	| "orange"
	| "yellow"
	| "green"
	| "blue"
	| "purple"
	| "brown"
	| "pink"
	| "cyan"
	| "gray"
	| "white"
	| "black";

/** The accent ramp's secondary stops, each a tone in its own right. */
export type AccentVariant = "accent-2" | "accent-3" | "accent-4";

/**
 * Every tone a component can render: the semantic roles, the three accent-ramp
 * variants, and the twelve named hues. Each one resolves to the same four-token
 * family — `--{tone}`, `--{tone}-bg`, `--{tone}-fg`, `--{tone}-text` — so any
 * component can take any tone through one code path.
 */
export type FullTone = Tone | AccentVariant | Hue;

/** Badge accepts any tone in the open vocabulary — semantic role, accent variant, or named hue. */
export type BadgeTone = FullTone;

export const TONES: readonly Tone[] = ["accent", "neutral", "danger", "success", "warn", "info"];
export const ACCENT_VARIANTS: readonly AccentVariant[] = ["accent-2", "accent-3", "accent-4"];
export const HUES: readonly Hue[] = [
	"red",
	"orange",
	"yellow",
	"green",
	"blue",
	"purple",
	"brown",
	"pink",
	"cyan",
	"gray",
	"white",
	"black",
];

/** Every tone in render order: semantic roles, then accent variants, then named hues. */
export const FULL_TONES: readonly FullTone[] = [...TONES, ...ACCENT_VARIANTS, ...HUES];

/** The shared size scale. */
export type Size = "sm" | "md" | "lg";

/** The button's variant set. */
export type ButtonVariant = "solid" | "outline" | "ghost" | "subtle" | "link";

/** How a button justifies its content when it is wider than that content. */
export type ButtonAlign = "start" | "center" | "end";

/** The heading level — maps to the `<h1>`–`<h6>` semantic tag. */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** The heading's typographic size, decoupled from its semantic level. */
export type HeadingSize = "xs" | "sm" | "md" | "body" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";

const HEADING_LEVEL_SIZE: Record<HeadingLevel, HeadingSize> = {
	1: "3xl",
	2: "2xl",
	3: "xl",
	4: "lg",
	5: "body",
	6: "sm",
};

/**
 * The default visual size for a heading level, used when `size` is not set.
 * Keeps `<Heading level={1}>` reading as a hero without forcing every call to
 * restate the size, while leaving `size` a free override.
 */
export function headingSizeForLevel(level: HeadingLevel): HeadingSize {
	return HEADING_LEVEL_SIZE[level] ?? "body";
}

/** The heading's ink: the `default`/`muted`/`subtle` emphasis ramp, or any tone in the full roster. */
export type HeadingTone = "default" | "muted" | "subtle" | FullTone;
