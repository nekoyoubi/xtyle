import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const componentsDir = fileURLToPath(new URL("../src/css/components", import.meta.url));

/**
 * A foreground `color` or `fill` must never be a `--bg-*` surface token. Surface tokens sit close to
 * their own theme's background, so a foreground painted with one collapses to ~1.5:1 and vanishes on a
 * light theme (this bit `Rating`, whose empty stars used `--bg-3` and disappeared on a light page).
 * Foreground content belongs on an `--fg-*` / `--fg-disabled` / accent / status token; only borders and
 * backgrounds take surface tokens. `border-*-color` is excluded on purpose: blending a border into a
 * neighbouring surface (the enclosed `tabs` variant does this) is a legitimate technique.
 */
describe("no foreground painted with a surface token", () => {
	it("keeps every component's color / fill off the --bg-* tokens (they vanish on light themes)", () => {
		const files = readdirSync(componentsDir).filter((f) => f.endsWith(".ts"));
		const surfaceForeground = /(?:^|[\s;{])(?:color|fill):\s*var\(--bg-\d/;
		const offenders: string[] = [];
		for (const file of files) {
			const css = readFileSync(join(componentsDir, file), "utf8");
			for (const line of css.split("\n")) {
				const trimmed = line.trim();
				if (surfaceForeground.test(trimmed)) offenders.push(`${file}: ${trimmed}`);
			}
		}
		expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([]);
	});
});
