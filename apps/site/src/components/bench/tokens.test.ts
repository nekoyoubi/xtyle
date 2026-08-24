import { describe, expect, it } from "vitest";
import { allGroups, colorGroups } from "./tokens";

const HUES = ["red", "orange", "yellow", "green", "blue", "purple", "brown", "pink", "cyan"];

const register: Record<string, string> = {
	"--bg-0": "#101014",
	"--fg-0": "#ffffff",
	"--accent": "#7c5cff",
	"--danger": "#ed353b",
	"--radius-md": "8px",
	"--space-3": "0.75rem",
};
for (const hue of HUES) {
	register[`--${hue}`] = "#808080";
	register[`--${hue}-bg`] = "#202020";
	register[`--${hue}-fg`] = "#000000";
	register[`--${hue}-text`] = "#c0c0c0";
	register[`--${hue}-vivid`] = "#909090";
	register[`--color-${hue}`] = "#808080";
	register[`--color-${hue}-base`] = "#808080";
}

const groupNamed = (groups: { title: string; tokens: string[] }[], title: string): string[] =>
	groups.find((g) => g.title === title)?.tokens ?? [];

describe("the palette groups as one thing", () => {
	it("puts every hue's own family under Named colors, not only the ramp", () => {
		const named = new Set(groupNamed(colorGroups(register), "Named colors"));
		const missing = HUES.flatMap((hue) => [`--${hue}`, `--${hue}-bg`, `--${hue}-fg`, `--${hue}-text`, `--${hue}-vivid`]).filter(
			(token) => !named.has(token),
		);
		expect(missing).toEqual([]);
	});

	it("keeps the ramp there too", () => {
		const named = new Set(groupNamed(colorGroups(register), "Named colors"));
		expect(HUES.filter((hue) => !named.has(`--color-${hue}`))).toEqual([]);
	});

	it("leaves no palette token in the leftover bin, where a drifting hue goes unread", () => {
		const other = new Set(groupNamed(allGroups(register), "Other"));
		const stranded = Object.keys(register).filter((token) => other.has(token) && /^--(color-|red|orange|yellow|green|blue|purple|brown|pink|cyan)/.test(token));
		expect(stranded).toEqual([]);
	});

	it("claims each token once, so a hue cannot render in two groups", () => {
		const seen = new Map<string, string>();
		const duplicated: string[] = [];
		for (const group of allGroups(register)) {
			for (const token of group.tokens) {
				const first = seen.get(token);
				if (first) duplicated.push(`${token} in ${first} and ${group.title}`);
				else seen.set(token, group.title);
			}
		}
		expect(duplicated).toEqual([]);
	});
});
