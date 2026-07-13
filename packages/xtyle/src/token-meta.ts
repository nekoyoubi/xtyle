/**
 * The descriptive catalog for the core token vocabulary: a human description and a set of search
 * tags (synonyms / intent words) for each token the blessed algorithms produce. This is the
 * canonical home for that data — the engine owns its tokens, so it owns what they mean — and any
 * surface (the bench's token editor, docs, a future inspector) reads from here rather than
 * re-describing tokens locally. Author-declared tokens (the open register) fall back to a derived
 * description; an authored algorithm can ship its own metadata the same shape.
 */

export interface TokenMeta {
	/** A one-line, human description of what the token is for. */
	description: string;
	/** Synonyms and intent words so a search matches on meaning, not just the literal name. */
	tags: string[];
}

interface MetaRule {
	test: RegExp;
	describe: (name: string) => string;
	tags: string[];
}

/** Resolved most-specific-first: the first rule whose pattern matches wins. */
const RULES: MetaRule[] = [
	{ test: /^--body-bg$/, describe: () => "The page's own background — the canvas everything else sits on.", tags: ["background", "surface", "page", "canvas", "body"] },
	{ test: /^--bg-sunken$/, describe: () => "A recessed surface that reads below the page — wells, insets, code blocks.", tags: ["background", "surface", "sunken", "inset", "well", "recessed"] },
	{ test: /^--bg-0$/, describe: () => "The base surface — the default panel color and the seed the whole surface ladder steps from.", tags: ["background", "surface", "base", "panel"] },
	{ test: /^--bg-([1-3])$/, describe: (n) => `Surface elevation ${n.match(/(\d)/)?.[1]} — a panel raised this many steps above the base.`, tags: ["background", "surface", "panel", "elevation", "raised", "card"] },
	{ test: /^--surface-overlay-border$/, describe: () => "The hairline around a floating overlay (menu, popover, tooltip).", tags: ["background", "surface", "overlay", "border", "popover", "menu"] },
	{ test: /^--surface-overlay$/, describe: () => "The surface of a floating overlay — menus, popovers, tooltips.", tags: ["background", "surface", "overlay", "popover", "menu", "tooltip"] },
	{ test: /^--scrim$/, describe: () => "The dimming wash behind a modal — darkens the page while a dialog is open.", tags: ["background", "scrim", "overlay", "modal", "backdrop", "dim"] },

	{ test: /^--fg-0$/, describe: () => "Primary text — the most legible ink, for body copy and headings.", tags: ["foreground", "text", "ink", "content", "body", "primary"] },
	{ test: /^--fg-([1-3])$/, describe: (n) => `Secondary text, tier ${n.match(/(\d)/)?.[1]} — progressively quieter than primary, still readable.`, tags: ["foreground", "text", "ink", "secondary", "muted", "subtle"] },
	{ test: /^--fg-disabled$/, describe: () => "Disabled text — dimmed to read as inactive while staying perceptible.", tags: ["foreground", "text", "disabled", "inactive", "dim"] },
	{ test: /^--placeholder$/, describe: () => "Placeholder text in an empty field — a hint, lighter than real input.", tags: ["foreground", "text", "placeholder", "hint", "field", "input"] },

	{ test: /^--line-2$/, describe: () => "A stronger divider — section breaks and emphasized rules.", tags: ["border", "divider", "line", "rule", "separator", "stroke"] },
	{ test: /^--line$/, describe: () => "The default divider — hairlines, card edges, table rules.", tags: ["border", "divider", "line", "rule", "separator", "stroke", "edge"] },
	{ test: /^--scrollbar-thumb-hover$/, describe: () => "The scrollbar thumb on hover — a touch stronger so the grab target lifts under the pointer.", tags: ["scrollbar", "scroll", "thumb", "hover", "chrome", "overflow"] },
	{ test: /^--scrollbar-thumb$/, describe: () => "The scrollbar thumb — the draggable bar, a neutral that reads as part of the theme instead of the browser default.", tags: ["scrollbar", "scroll", "thumb", "bar", "chrome", "overflow"] },
	{ test: /^--scrollbar-track$/, describe: () => "The scrollbar track — the groove behind the thumb; transparent by default so it blends into the surface.", tags: ["scrollbar", "scroll", "track", "groove", "chrome", "overflow"] },
	{ test: /^--ring-bg$/, describe: () => "The soft halo behind a focus ring — a faint accent wash around the crisp ring.", tags: ["focus", "ring", "outline", "halo", "accent"] },
	{ test: /^--ring$/, describe: () => "The focus ring — the accent outline on a keyboard-focused control.", tags: ["focus", "ring", "outline", "accent", "keyboard"] },
	{ test: /^--field-border$/, describe: () => "The border of an input field — separates the field from its surface.", tags: ["border", "field", "input", "form", "edge"] },
	{ test: /^--field-bg$/, describe: () => "The interior of an input field — the surface text is typed onto.", tags: ["background", "surface", "field", "input", "form"] },

	{ test: /^--accent-2-vivid$|^--accent-[234]-vivid$/, describe: () => "A secondary accent's vivid on-surface ink — punchy text/icons on a panel.", tags: ["accent", "vivid", "ink", "secondary", "harmony"] },
	{ test: /^--accent-([234])(-(bg|fg|text|vivid))?$/, describe: (n) => { const i = n.match(/accent-([234])/)?.[1]; const role = n.match(/-(bg|fg|text|vivid)$/)?.[1]; return role ? `Secondary accent ${i} — its ${{ bg: "soft tint", fg: "on-solid ink", text: "on-surface ink", vivid: "vivid ink" }[role]}.` : `Secondary accent ${i} — part of the accent harmony fanned off the brand color.`; }, tags: ["accent", "harmony", "secondary", "brand"] },
	{ test: /^--accent-(hover|active)$/, describe: (n) => `The accent on ${n.includes("hover") ? "hover" : "press"} — a small shift for interaction feedback.`, tags: ["accent", "hover", "active", "press", "interaction", "state"] },
	{ test: /^--accent-bg$/, describe: () => "The soft accent tint — a faint accent wash for selected/subtle accent surfaces.", tags: ["accent", "tint", "background", "soft", "subtle"] },
	{ test: /^--accent-fg$/, describe: () => "Text/icons on a solid accent fill — reads against a filled accent button.", tags: ["accent", "foreground", "ink", "on-accent", "button"] },
	{ test: /^--accent-text$/, describe: () => "Accent-colored text on the page — emphasis ink that still clears contrast.", tags: ["accent", "text", "ink", "emphasis", "link"] },
	{ test: /^--accent-shift-step$/, describe: () => "The hue step (degrees) the accent harmony fans by — a tuning value, not a color.", tags: ["accent", "harmony", "hue", "step", "tuning"] },
	{ test: /^--accent$/, describe: () => "The brand color — primary buttons, focus, links, the theme's signature.", tags: ["accent", "brand", "primary", "highlight"] },

	{ test: /^--neutral(-(bg|fg|text|vivid))?$/, describe: (n) => { const role = n.match(/-(bg|fg|text|vivid)$/)?.[1]; return role ? `The neutral tone — its ${{ bg: "soft tint", fg: "on-solid ink", text: "on-surface ink", vivid: "vivid ink" }[role]}.` : "A near-gray tone for secondary fills — quiet chips, muted buttons."; }, tags: ["neutral", "gray", "grey", "muted", "subtle", "secondary"] },

	{ test: /^--(success|warn|danger|info)(-(bg|fg|text|vivid))?$/, describe: (n) => { const role = n.match(/-(success|warn|danger|info)/)?.[1]; const part = n.match(/-(bg|fg|text|vivid)$/)?.[1]; const word = { success: "success / positive", warn: "warning / caution", danger: "error / destructive", info: "informational" }[role!]; return part ? `The ${word} status — its ${{ bg: "soft tint", fg: "on-solid ink", text: "on-surface ink", vivid: "vivid ink" }[part]}.` : `The ${word} status fill.`; }, tags: ["status", "semantic"] },

	{ test: /^--state-/, describe: (n) => `The ${n.replace("--state-", "")} state overlay — a translucent wash layered on a control while it is ${n.replace("--state-", "")}.`, tags: ["state", "overlay", "hover", "press", "selected", "disabled", "drag", "interaction"] },
	{ test: /^--link-hover$/, describe: () => "A link on hover.", tags: ["link", "hover", "anchor", "href", "interaction"] },
	{ test: /^--link$/, describe: () => "Hyperlink text.", tags: ["link", "anchor", "href"] },
	{ test: /^--selection$/, describe: () => "The highlight behind selected text.", tags: ["selection", "highlight", "select", "mark"] },
	{ test: /^--highlight$/, describe: () => "A marker highlight — the wash behind emphasized/searched text.", tags: ["highlight", "mark", "marker", "search"] },
	{ test: /^--selection-cue$/, describe: () => "How a selection is signalled (tint vs marker) — an intent value, not a color.", tags: ["selection", "cue", "intent", "accessibility"] },

	{ test: /^--color-([a-z]+)-(subtle|muted|base|strong|contrast)$/, describe: (n) => { const m = n.match(/^--color-([a-z]+)-([a-z]+)$/); return `The ${m?.[2]} stop of the ${m?.[1]} ramp — a named-color swatch step.`; }, tags: ["palette", "named", "crayola", "color", "hue", "ramp", "swatch"] },
	{ test: /^--color-([a-z]+)$/, describe: (n) => `The ${n.replace("--color-", "")} swatch — the base of its named-color ramp.`, tags: ["palette", "named", "crayola", "color", "hue", "swatch"] },
	{ test: /^--(red|orange|yellow|green|blue|purple|brown|pink|cyan|gray|white|black)(-(bg|fg|text|vivid))?$/, describe: (n) => { const hue = n.match(/^--([a-z]+)/)?.[1]; const role = n.match(/-(bg|fg|text|vivid)$/)?.[1]; return role ? `The ${hue} tone — its ${{ bg: "soft tint", fg: "on-solid ink", text: "on-surface ink", vivid: "vivid ink" }[role]}.` : `The ${hue} tone — a named color usable anywhere a tone is.`; }, tags: ["palette", "named", "crayola", "color", "hue", "tone"] },

	{ test: /^--code-/, describe: (n) => `Syntax color for the \`${n.replace("--code-", "")}\` scope in highlighted code.`, tags: ["code", "syntax", "highlight", "editor"] },

	{ test: /^--terminal-(bg|fg|cursor|cursor-accent)$/, describe: (n) => { const r = n.replace("--terminal-", ""); return { bg: "The terminal background — the panel a terminal draws onto.", fg: "The terminal foreground — the default text color in a terminal.", cursor: "The terminal cursor block.", "cursor-accent": "The glyph under the terminal cursor — the character the cursor block sits over." }[r] ?? ""; }, tags: ["terminal", "ansi", "console", "shell", "xterm"] },
	{ test: /^--terminal-bright-([a-z]+)$/, describe: (n) => `The bright ANSI ${n.replace("--terminal-bright-", "")} — a terminal's bold / high-intensity variant.`, tags: ["terminal", "ansi", "console", "shell", "xterm", "bright", "bold"] },
	{ test: /^--terminal-([a-z]+)$/, describe: (n) => `The ANSI ${n.replace("--terminal-", "")} — a terminal's standard 16-color slot.`, tags: ["terminal", "ansi", "console", "shell", "xterm", "color"] },

	{ test: /^--font-/, describe: (n) => `The ${n.replace("--font-", "")} font stack.`, tags: ["type", "font", "typography", "family"] },
	{ test: /^--text-/, describe: (n) => `The ${n.replace("--text-", "")} font size on the type scale.`, tags: ["type", "text", "size", "scale", "typography"] },
	{ test: /^--leading-/, describe: (n) => `${n.replace("--leading-", "")} line height.`, tags: ["type", "leading", "line-height", "typography"] },
	{ test: /^--weight-/, describe: (n) => `The ${n.replace("--weight-", "")} font weight.`, tags: ["type", "weight", "bold", "typography"] },
	{ test: /^--radius-/, describe: (n) => `The ${n.replace("--radius-", "")} corner radius.`, tags: ["geometry", "radius", "corner", "rounding"] },
	{ test: /^--border-/, describe: (n) => `The ${n.replace("--border-", "")} border width.`, tags: ["geometry", "border", "width", "stroke"] },
	{ test: /^--duration-/, describe: (n) => `The ${n.replace("--duration-", "")} animation duration.`, tags: ["motion", "duration", "animation", "transition", "timing"] },
	{ test: /^--ease-/, describe: (n) => `The ${n.replace("--ease-", "")} easing curve.`, tags: ["motion", "ease", "easing", "curve", "timing"] },
	{ test: /^--elevation-/, describe: (n) => `Elevation ${n.replace("--elevation-", "")} — the shadow for a surface raised this far.`, tags: ["elevation", "shadow", "depth", "raised"] },
	{ test: /^--shadow$/, describe: () => "The default drop shadow.", tags: ["shadow", "elevation", "depth"] },
	{ test: /^--space-/, describe: (n) => `Spacing step ${n.replace("--space-", "")} on the spacing scale.`, tags: ["spacing", "space", "gap", "padding", "margin"] },
	{ test: /^--scheme$/, describe: () => "Whether the theme is light or dark — an intent value, not a color.", tags: ["scheme", "light", "dark", "mode"] },
];

/** The description + tags for a token. Unknown (author-declared) tokens get a name-derived fallback. */
export function tokenMeta(name: string): TokenMeta {
	for (const rule of RULES) {
		if (rule.test.test(name)) return { description: rule.describe(name), tags: rule.tags };
	}
	return { description: "", tags: name.replace(/^--/, "").split("-").filter(Boolean) };
}

/** The full lowercase searchable text for a token: its name, group title, description, and tags. */
export function tokenSearchText(name: string, groupTitle: string): string {
	const meta = tokenMeta(name);
	return `${name} ${groupTitle} ${meta.description} ${meta.tags.join(" ")}`.toLowerCase();
}
