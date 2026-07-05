import type { TokenCategories } from "../types.js";

export interface UtilityOptions {
	/** Class-name prefix. Defaults to `xtyle-`. */
	prefix?: string;
}

const rule = (selector: string, body: string): string => `.${selector}{${body}}`;

/** Color tokens fan out to background, text, and border utilities. */
const colorUtilities = (name: string, token: string, p: string): string[] => [
	rule(`${p}bg-${name}`, `background-color:var(${token})`),
	rule(`${p}text-${name}`, `color:var(${token})`),
	rule(`${p}border-${name}`, `border-color:var(${token})`),
];

/** Space tokens fan out to padding, margin, and gap (all sides + axes). */
const spaceUtilities = (suffix: string, token: string, p: string): string[] => {
	const v = `var(${token})`;
	const box = (abbr: string, prop: string): string[] => [
		rule(`${p}${abbr}-${suffix}`, `${prop}:${v}`),
		rule(`${p}${abbr}x-${suffix}`, `${prop}-left:${v};${prop}-right:${v}`),
		rule(`${p}${abbr}y-${suffix}`, `${prop}-top:${v};${prop}-bottom:${v}`),
		rule(`${p}${abbr}t-${suffix}`, `${prop}-top:${v}`),
		rule(`${p}${abbr}r-${suffix}`, `${prop}-right:${v}`),
		rule(`${p}${abbr}b-${suffix}`, `${prop}-bottom:${v}`),
		rule(`${p}${abbr}l-${suffix}`, `${prop}-left:${v}`),
	];
	return [...box("p", "padding"), ...box("m", "margin"), rule(`${p}gap-${suffix}`, `gap:${v}`)];
};

/** A single `var()`-backed declaration utility keyed by the token's suffix. */
const scaleUtility = (cls: string, property: string, token: string): string =>
	rule(cls, `${property}:var(${token})`);

const after = (name: string, lead: string): string | null =>
	name.startsWith(lead) ? name.slice(lead.length) : null;

/**
 * Generate the Tailwind-like utility layer from a token register's keys. Every
 * utility resolves to `var(--token)` rather than a baked value, so one emitted
 * sheet stays correct across every theme — swap the `:root` register and all
 * utilities (and components) restyle live.
 *
 * Pure: pass the token names and their categories (an algorithm's `produces` /
 * `categories`) and get a stylesheet string back — no derivation runs.
 */
export function utilitiesCss(
	tokens: string[],
	categories: TokenCategories,
	options: UtilityOptions = {},
): string {
	const p = options.prefix ?? "xtyle-";
	const out: string[] = [];

	for (const token of tokens) {
		const name = token.replace(/^--/, "");
		const category = categories[token];

		if (category === "color") {
			out.push(...colorUtilities(name, token, p));
			continue;
		}
		if (category === "length") {
			const space = after(name, "space-");
			if (space !== null) {
				out.push(...spaceUtilities(space, token, p));
				continue;
			}
			const radius = after(name, "radius-");
			if (radius !== null) {
				out.push(scaleUtility(`${p}rounded-${radius}`, "border-radius", token));
				continue;
			}
			const text = after(name, "text-");
			if (text !== null) {
				out.push(scaleUtility(`${p}text-${text}`, "font-size", token));
				continue;
			}
			const border = after(name, "border-");
			if (border !== null) {
				out.push(scaleUtility(`${p}border-${border}`, "border-width", token));
				continue;
			}
			continue;
		}
		if (category === "shadow") {
			const elevation = after(name, "elevation-");
			if (elevation !== null) {
				out.push(scaleUtility(`${p}elevation-${elevation}`, "box-shadow", token));
				continue;
			}
			out.push(scaleUtility(`${p}${name}`, "box-shadow", token));
			continue;
		}
		if (category === "font") {
			const font = after(name, "font-");
			if (font !== null) out.push(scaleUtility(`${p}font-${font}`, "font-family", token));
			continue;
		}
		if (category === "number") {
			const leading = after(name, "leading-");
			if (leading !== null) {
				out.push(scaleUtility(`${p}leading-${leading}`, "line-height", token));
				continue;
			}
			const weight = after(name, "weight-");
			if (weight !== null) out.push(scaleUtility(`${p}weight-${weight}`, "font-weight", token));
			continue;
		}
		if (category === "duration") {
			const duration = after(name, "duration-");
			if (duration !== null)
				out.push(scaleUtility(`${p}duration-${duration}`, "transition-duration", token));
			continue;
		}
		if (category === "easing") {
			const ease = after(name, "ease-");
			if (ease !== null)
				out.push(scaleUtility(`${p}ease-${ease}`, "transition-timing-function", token));
			continue;
		}
	}

	return out.join("\n");
}
