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

/**
 * The emphasis words a component accepts *alongside* the tone roster. Declared once and consumed by
 * both the element accessor and the framework wrapper: the two used to restate the list, and a wrapper
 * that fell a word short silently repainted every server-rendered instance of it.
 */
export const EMPHASIS_TONES = ["default", "muted", "subtle"] as const;
export const EYEBROW_EMPHASIS = ["muted", "subtle"] as const;
export const SECTION_SURFACES = ["plain", "quiet"] as const;

/** Stat's delta arrow, and the color reading applied to it. Both land in a class name. */
export const STAT_TRENDS = ["up", "down", "flat"] as const;
export const STAT_SENTIMENTS = ["positive", "negative", "neutral"] as const;

/** The native `loading` values an Image may forward; anything else is not a browser hint. */
export const IMAGE_LOADING = ["lazy", "eager"] as const;

/**
 * Narrow an author value to a member of a component-local vocabulary, warning and falling back when
 * it is not one. The tone roster has {@link resolveTone}; this is the same guarantee for the smaller
 * per-component vocabularies, and it exists for the same reason: these values are interpolated into
 * class names, where an unrecognized one matches no rule and the component renders with no chrome at
 * all — a plausible-looking, entirely unstyled box. Escaping such a value makes it safe and leaves it
 * just as broken, so structural values are validated rather than encoded.
 */
export function resolveVocab<T extends string>(
	value: string | null | undefined,
	allowed: readonly T[],
	fallback: T,
	label: string,
): T {
	if (value === null || value === undefined || value === "") return fallback;
	if ((allowed as readonly string[]).includes(value)) return value as T;
	if (typeof console !== "undefined") {
		console.warn(
			`xtyle: "${value}" is not a valid ${label}. Valid values are ${allowed.join(", ")}. Falling back to "${fallback}".`,
		);
	}
	return fallback;
}

/**
 * The same narrowing for a component-local vocabulary whose value is genuinely optional — an unset
 * `severity` on an Alert, an unset `pulse` on a Dot. An unrecognized value resolves to unset rather
 * than to a member the author never asked for, mirroring {@link resolveOptionalTone}.
 */
export function resolveOptionalVocab<T extends string>(
	value: string | null | undefined,
	allowed: readonly T[],
	label: string,
): T | null {
	if (value === null || value === undefined || value === "") return null;
	if ((allowed as readonly string[]).includes(value)) return value as T;
	if (typeof console !== "undefined") {
		console.warn(
			`xtyle: "${value}" is not a valid ${label}. Valid values are ${allowed.join(", ")}. Rendering with none.`,
		);
	}
	return null;
}

export function isFullTone(value: unknown): value is FullTone {
	return typeof value === "string" && (FULL_TONES as readonly string[]).includes(value);
}

/**
 * Narrow an author-supplied tone to one the token graph can actually resolve, falling back when it
 * cannot. Components interpolate the tone straight into a class (`xtyle-alert--{tone}`), so an
 * unrecognized value matches no rule and the component renders with *no* chrome at all — a plausible
 * looking but entirely unstyled box. Falling back is visibly wrong where silence is invisibly wrong.
 *
 * `extra` carries the emphasis words a component accepts alongside the roster (`muted`, `plain`, …).
 */
export function resolveTone<T extends string>(
	value: string | null | undefined,
	fallback: T,
	extra: readonly string[] = [],
): T {
	if (value === null || value === undefined || value === "") return fallback;
	if (isFullTone(value) || extra.includes(value)) return value as T;
	if (typeof console !== "undefined") {
		console.warn(
			`xtyle: "${value}" is not a tone. Valid tones are ${[...extra, ...FULL_TONES].join(", ")}. Falling back to "${fallback}".`,
		);
	}
	return fallback;
}

/**
 * The same narrowing for components whose tone is genuinely optional — an unset tone means something
 * (a severity-colored `Alert`, an inheriting `Icon`), so an unrecognized one resolves to unset rather
 * than to a roster member the author never asked for.
 */
export function resolveOptionalTone<T extends string>(
	value: string | null | undefined,
	extra: readonly string[] = [],
): T | null {
	if (value === null || value === undefined || value === "") return null;
	if (isFullTone(value) || extra.includes(value)) return value as T;
	if (typeof console !== "undefined") {
		console.warn(
			`xtyle: "${value}" is not a tone. Valid tones are ${[...extra, ...FULL_TONES].join(", ")}. Rendering with no tone.`,
		);
	}
	return null;
}

/** The shared size scale. */
export const SIZES = ["sm", "md", "lg"] as const;
export type Size = (typeof SIZES)[number];

/** The button's variant set. */
export const BUTTON_VARIANTS = ["solid", "outline", "ghost", "subtle", "link"] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

/** How a Carousel changes slides: a sliding scroll-snap track, or a stacked cross-fade / zoom / turn. */
export const CAROUSEL_TRANSITIONS = ["slide", "fade", "scale", "flip"] as const;
export type CarouselTransition = (typeof CAROUSEL_TRANSITIONS)[number];

/** Which way a `slide`-transition Carousel advances: the cardinal sets both the axis (horizontal vs
 * vertical) and the sense (`left` / `up` reverse the default `right` / `down`). */
export const CAROUSEL_DIRECTIONS = ["right", "left", "up", "down"] as const;
export type CarouselDirection = (typeof CAROUSEL_DIRECTIONS)[number];

/** How a button justifies its content when it is wider than that content. */
export const BUTTON_ALIGNS = ["start", "center", "end"] as const;
export type ButtonAlign = (typeof BUTTON_ALIGNS)[number];

/** The heading level — maps to the `<h1>`–`<h6>` semantic tag. */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** The heading's typographic size, decoupled from its semantic level. */
export const HEADING_SIZES = ["xs", "sm", "md", "body", "lg", "xl", "2xl", "3xl", "4xl", "5xl"] as const;
export type HeadingSize = (typeof HEADING_SIZES)[number];

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

/**
 * The per-component vocabularies, each declared exactly once. Every value below is interpolated into
 * a class name somewhere, so each is a structural position rather than a free string: an unrecognized
 * one matches no rule and renders an unstyled box. The element accessor, the `markup/` type, and the
 * framework wrappers all read these same consts, and derive their unions from them — a wrapper that
 * restated a list and fell a word short is what silently repainted every server-rendered
 * `<Text tone="muted">` on the site.
 */

export const ORIENTATIONS = ["horizontal", "vertical"] as const;

export const ALERT_SEVERITIES = ["success", "warn", "danger", "info"] as const;
export const ALERT_VARIANTS = ["soft", "solid"] as const;

export const AVATAR_SIZES = ["sm", "md", "lg", "xl"] as const;
export const AVATAR_SHAPES = ["circle", "square"] as const;

export const BADGE_VARIANTS = ["solid", "soft", "outline"] as const;

export const BUTTON_SIZES = ["xs", "sm", "md", "lg"] as const;

export const COMBOBOX_FILTERS = ["contains", "starts", "none"] as const;

export const DIALOG_SIZES = ["sm", "md", "lg", "xl", "full"] as const;

export const DOCK_SIDES = ["left", "right"] as const;
export const DOCK_EDGE_WIDTHS = ["thin", "thick", "bold"] as const;

export const DOT_SIZES = ["sm", "md", "lg"] as const;
export const DOT_PULSES = ["slow", "fast"] as const;

export const EYEBROW_TAGS = ["p", "span", "div"] as const;
export const EYEBROW_TRACKINGS = ["normal", "wide"] as const;

export const HERO_ALIGNS = ["center", "start"] as const;

export const ICON_SIZES = ["sm", "md", "lg", "xl"] as const;

export const IMAGE_FITS = ["cover", "contain"] as const;
export const IMAGE_RADII = ["none", "sm", "md", "lg"] as const;

export const KBD_SIZES = ["sm", "md", "lg"] as const;

export const LINK_VARIANTS = ["default", "muted", "quiet"] as const;

export const LIST_INTERACTIONS = ["static", "navigational", "selectable", "actionable"] as const;
export const LIST_SELECTIONS = ["none", "single", "multi", "range"] as const;

export const PANEL_VARIANTS = ["default", "collapsible"] as const;

export const POPOVER_PLACEMENTS = ["top", "bottom", "left", "right"] as const;
export const POPOVER_ALIGNS = ["start", "center", "end"] as const;
export const POPOVER_FOCUS = ["first", "panel", "none"] as const;
export const POPOVER_PANEL_ROLES = ["dialog", "listbox", "menu", "grid", "tree", "none"] as const;

export const PROGRESS_VARIANTS = ["linear", "circular"] as const;
export const PROGRESS_SIZES = ["sm", "md", "lg"] as const;

export const RIBBON_CORNERS = ["top-right", "top-left", "bottom-right", "bottom-left"] as const;
export const RIBBON_SIZES = ["sm", "md", "lg"] as const;
export const RIBBON_VARIANTS = ["solid", "soft"] as const;

export const SECTION_TAGS = ["section", "div", "header", "footer"] as const;
export const SECTION_VARIANTS = ["band", "stage"] as const;
export const SECTION_PADDINGS = ["none", "sm", "md", "lg"] as const;

export const SELECTION_MODES = ["none", "single", "multi", "range"] as const;

export const SEPARATOR_VARIANTS = ["default", "with-label"] as const;
export const SEPARATOR_SIZES = ["thin", "normal"] as const;

export const SHEET_SIDES = ["top", "right", "bottom", "left"] as const;
export const SHEET_SIZES = ["sm", "md", "lg", "full"] as const;

export const SKELETON_SHAPES = ["text", "line", "block", "circle"] as const;

export const SPARKLINE_VARIANTS = ["line", "area", "bar", "occupancy"] as const;

export const SPLITTER_SIZES = ["sm", "md", "lg"] as const;

export const SPOTLIGHT_SHAPES = ["auto", "rect", "circle"] as const;
export const SPOTLIGHT_ARROWS = ["none", "static", "bounce"] as const;

export const STAT_ALIGNS = ["start", "center"] as const;

export const STATUSBAR_OVERFLOWS = ["clip", "wrap", "scroll", "collapse"] as const;

export const SWATCH_SIZES = ["sm", "md", "lg"] as const;

export const TABLE_VARIANTS = ["default", "striped", "bordered"] as const;
export const TABLE_SIZES = ["normal", "compact"] as const;

export const TABS_VARIANTS = ["underline", "pill", "enclosed"] as const;

/** Tabs steps only two rungs — there is no `.xtyle-tabs--lg` rule for a third to land on. */
export const TABS_SIZES = ["sm", "md"] as const;

/** Checkbox and Switch style a compact rung and the default only; an `lg` would land on no rule. */
export const CHECKBOX_SIZES = ["sm", "md"] as const;
export const SWITCH_SIZES = ["sm", "md"] as const;

export const TEXT_TAGS = ["p", "span"] as const;
export const TEXT_SIZES = ["xs", "sm", "body", "lg"] as const;
export const TEXT_WEIGHTS = ["normal", "medium", "semibold", "bold"] as const;
export const TEXT_LEADINGS = ["tight", "snug", "loose"] as const;

export const TEXTAREA_RESIZES = ["none", "vertical", "horizontal", "both"] as const;

export const TOAST_SEVERITIES = ["success", "warn", "danger", "info"] as const;
export const TOAST_VARIANTS = ["soft", "solid"] as const;

export const TOOLTIP_PLACEMENTS = ["top", "bottom", "left", "right"] as const;

/**
 * A split button takes Button's treatments minus `link` — a link-styled half with a caret welded to
 * it is not a control anyone means to ask for. The manifest and the Astro binding already agreed on
 * these four; the element was the outlier, reusing {@link BUTTON_VARIANTS} and silently accepting a
 * fifth the manifest's own authoring diagnostic rejects.
 */
export const SPLIT_BUTTON_VARIANTS = ["solid", "outline", "subtle", "ghost"] as const;

export const AVATAR_GROUP_SIZES = ["sm", "md", "lg", "xl"] as const;
export const AVATAR_GROUP_SPACINGS = ["snug", "normal", "loose"] as const;

export const CLUSTER_ALIGNS = ["start", "center", "end", "stretch", "baseline"] as const;
export const CLUSTER_JUSTIFIES = ["start", "center", "end", "between", "around", "evenly"] as const;

export const STACK_ALIGNS = ["start", "center", "end", "stretch", "baseline"] as const;
export const STACK_JUSTIFIES = ["start", "center", "end", "between", "around", "evenly"] as const;

export const GRID_ALIGNS = ["start", "center", "end", "stretch"] as const;

export const IMAGE_TRIGGERS = ["frame", "button"] as const;
export const IMAGE_HOVER_AUDIO = ["on", "off"] as const;

export const PROGRESS_RAMP_MODES = ["solid", "gradient"] as const;

export const REDACT_MODES = ["blur", "block", "mask"] as const;
export const REDACT_REVEALS = ["hover", "click", "hold", "never"] as const;

export const TABS_ACTIVATIONS = ["automatic", "manual"] as const;

export const TOUR_PROGRESS = ["count", "dots", "none"] as const;
export const SPOTLIGHT_PULSES = ["none", "slow", "fast"] as const;
