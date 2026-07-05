import type { TokenRegister } from "@xtyle/core";
import { tokenMeta, tokenSearchText } from "@xtyle/core";

export { tokenMeta };

export interface TokenGroup {
	title: string;
	tokens: string[];
}

const EXPLICIT_GROUPS: TokenGroup[] = [
	{
		title: "Surfaces",
		tokens: [
			"--body-bg",
			"--bg-sunken",
			"--bg-0",
			"--bg-1",
			"--bg-2",
			"--bg-3",
			"--surface-overlay",
			"--surface-overlay-border",
			"--scrim",
		],
	},
	{
		title: "Content",
		tokens: [
			"--fg-0",
			"--fg-1",
			"--fg-2",
			"--fg-3",
			"--fg-disabled",
			"--placeholder",
		],
	},
	{
		title: "Lines & rings",
		tokens: ["--line", "--line-2", "--ring", "--ring-bg", "--field-bg", "--field-border"],
	},
	{
		title: "Accent",
		tokens: [
			"--accent",
			"--accent-hover",
			"--accent-active",
			"--accent-fg",
			"--accent-text",
			"--accent-bg",
			"--accent-2",
			"--accent-3",
			"--accent-4",
		],
	},
	{
		title: "Neutral",
		tokens: ["--neutral", "--neutral-bg", "--neutral-fg", "--neutral-text"],
	},
	{
		title: "Status",
		tokens: [
			"--success",
			"--success-bg",
			"--success-fg",
			"--success-text",
			"--warn",
			"--warn-bg",
			"--warn-fg",
			"--warn-text",
			"--danger",
			"--danger-bg",
			"--danger-fg",
			"--danger-text",
			"--info",
			"--info-bg",
			"--info-fg",
			"--info-text",
		],
	},
	{
		title: "Interaction & accents",
		tokens: [
			"--state-hover",
			"--state-press",
			"--state-selected",
			"--state-disabled",
			"--state-drag",
			"--link",
			"--link-hover",
			"--selection",
			"--highlight",
		],
	},
];

/** Color tokens, grouped for swatch display. The Palette group collects every
 * `--color-*` ramp under "Named colors"; everything left over lands in a catch-all so nothing hides. */
export function colorGroups(register: TokenRegister): TokenGroup[] {
	const claimed = new Set<string>();
	const groups: TokenGroup[] = [];
	for (const group of EXPLICIT_GROUPS) {
		const present = group.tokens.filter((t) => t in register);
		for (const t of present) claimed.add(t);
		if (present.length) groups.push({ title: group.title, tokens: present });
	}
	const palette = Object.keys(register).filter((k) => /^--color-/.test(k));
	for (const t of palette) claimed.add(t);
	if (palette.length) groups.push({ title: "Named colors", tokens: palette });
	return groups;
}

const NON_COLOR_FAMILIES: { title: string; test: RegExp }[] = [
	{ title: "Type", test: /(font|text-|leading|weight)/ },
	{ title: "Geometry", test: /(radius|border)/ },
	{ title: "Spacing", test: /space/ },
	{ title: "Motion", test: /(duration|ease)/ },
	{ title: "Elevation", test: /(shadow|elevation)/ },
];

/** Every token in the register, grouped: the color groups first, then the non-color
 * families, then a catch-all so nothing in the register can hide from the editor. */
export function allGroups(register: TokenRegister): TokenGroup[] {
	const groups = colorGroups(register);
	const claimed = new Set<string>();
	for (const group of groups) for (const token of group.tokens) claimed.add(token);
	const keys = Object.keys(register);
	for (const family of NON_COLOR_FAMILIES) {
		const present = keys.filter((k) => !claimed.has(k) && family.test.test(k)).sort();
		for (const token of present) claimed.add(token);
		if (present.length) groups.push({ title: family.title, tokens: present });
	}
	const rest = keys.filter((k) => !claimed.has(k)).sort();
	if (rest.length) groups.push({ title: "Other", tokens: rest });
	return groups;
}

const NON_COLOR = /(font|text-|leading|weight|radius|border|duration|ease|elevation|space|shadow|shift-step|scheme)/;

/** Heuristic: a token is a color if it isn't a known structural/scale family. */
export function isColorToken(name: string): boolean {
	if (name === "--shadow") return false;
	return !NON_COLOR.test(name);
}

const SURFACE_RE = /^--(body-bg|bg-|surface|scrim|field-bg)/;

/** The token a swatch's WCAG badge rates against — its most likely pairing (a deliberate guess): an
 * ink uses the surface it sits on from {@link CONTRAST_PAIRS}, a bare surface uses the primary text,
 * and any other solid uses a representative panel. Returns the reference's live value, or undefined
 * for non-color tokens (which carry no badge). */
export function contrastRefFor(token: string, register: TokenRegister): string | undefined {
	if (!isColorToken(token)) return undefined;
	const pair = CONTRAST_PAIRS.find((p) => p.fg === token);
	const refToken = pair ? pair.bg : SURFACE_RE.test(token) ? "--fg-0" : "--bg-1";
	return register[refToken];
}

/** The full searchable text for a token — name, group title, description, and tags — sourced from the
 * engine's token catalog (`@xtyle/core`), so the filter matches on meaning, not just the literal name. */
export function tokenSearchTerms(token: string, groupTitle: string): string {
	return tokenSearchText(token, groupTitle);
}

export interface GamutWarning {
	token: string;
	value: string;
}

export interface ContrastPair {
	label: string;
	fg: string;
	bg: string;
}

/** The pairings the contrast inspector checks — the contracts the algorithm
 * itself promises, surfaced as live AA/AAA readouts. */
export const CONTRAST_PAIRS: ContrastPair[] = [
	{ label: "fg-0 on bg-0", fg: "--fg-0", bg: "--bg-0" },
	{ label: "fg-1 on bg-0", fg: "--fg-1", bg: "--bg-0" },
	{ label: "fg-2 on bg-1", fg: "--fg-2", bg: "--bg-1" },
	{ label: "fg-3 on bg-2", fg: "--fg-3", bg: "--bg-2" },
	{ label: "placeholder on field-bg", fg: "--placeholder", bg: "--field-bg" },
	{ label: "accent-fg on accent", fg: "--accent-fg", bg: "--accent" },
	{ label: "accent-text on bg-0", fg: "--accent-text", bg: "--bg-0" },
	{ label: "link on bg-1", fg: "--link", bg: "--bg-1" },
	{ label: "neutral-fg on neutral", fg: "--neutral-fg", bg: "--neutral" },
	{ label: "neutral-text on bg-1", fg: "--neutral-text", bg: "--bg-1" },
	{ label: "success-fg on success", fg: "--success-fg", bg: "--success" },
	{ label: "success-text on success-bg", fg: "--success-text", bg: "--success-bg" },
	{ label: "warn-fg on warn", fg: "--warn-fg", bg: "--warn" },
	{ label: "warn-text on warn-bg", fg: "--warn-text", bg: "--warn-bg" },
	{ label: "danger-fg on danger", fg: "--danger-fg", bg: "--danger" },
	{ label: "danger-text on danger-bg", fg: "--danger-text", bg: "--danger-bg" },
	{ label: "info-fg on info", fg: "--info-fg", bg: "--info" },
	{ label: "info-text on info-bg", fg: "--info-text", bg: "--info-bg" },
];
