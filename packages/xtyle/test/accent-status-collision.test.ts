import { describe, expect, it } from "vitest";
import { derive, formatCss, clampToGamut, hueDelta, oklabDistance, toOklchColor } from "../src/index.js";
import { xtyleDefault } from "../src/batteries.js";

const BG = "#0b0d12";
const accentAt = (h: number): string => formatCss(clampToGamut({ l: 0.6, c: 0.14, h, alpha: 1 }));
const themeFor = (accent: string, extra: Record<string, string> = {}) =>
	derive(xtyleDefault, { constraints: { "--bg-0": BG, "--accent": accent, ...extra } });
const danger = (accent: string): string => themeFor(accent)["--danger"] as string;

describe("a status role holds off a colliding accent", () => {
	it("separates danger from a crimson brand accent that used to read as the same button", () => {
		const accent = "#d1495b";
		expect(oklabDistance(accent, danger(accent))).toBeGreaterThan(0.06);
	});

	it("leaves danger's hue alone when the accent is nowhere near it", () => {
		const natural = toOklchColor(danger("#509a54")).h;
		for (const accent of ["#3ad6f8", "#2389e2", "#b88cff"]) {
			expect(Math.abs(hueDelta(toOklchColor(danger(accent)).h, natural)), accent).toBeLessThan(1);
		}
	});

	it("holds every accent through the collision arc clear of danger", () => {
		for (let h = 0; h < 360; h += 5) {
			const accent = accentAt(h);
			expect(oklabDistance(accent, danger(accent)), `accent at ${h}deg`).toBeGreaterThan(0.03);
		}
	});

	it("jumps exactly once as an accent sweeps through the arc", () => {
		let previous: number | null = null;
		const jumps: number[] = [];
		for (let h = -20; h <= 80; h += 2) {
			const hue = toOklchColor(danger(accentAt(h))).h;
			if (previous !== null && Math.abs(hueDelta(previous, hue)) > 12) jumps.push(h);
			previous = hue;
		}
		expect(jumps.length, `jumped at ${jumps.join(", ")}`).toBe(1);
	});

	it("keeps danger distinguishable from warn while it is being pushed", () => {
		for (let h = -10; h <= 60; h += 5) {
			const theme = themeFor(accentAt(h));
			const d = theme["--danger"] as string;
			const w = theme["--warn"] as string;
			expect(oklabDistance(d, w), `accent at ${h}deg`).toBeGreaterThan(0.02);
		}
	});

	it("lets a direct pin on the role win over the guard", () => {
		const pinned = "#ff0044";
		const theme = themeFor("#d1495b", { "--danger": pinned });
		expect(theme["--danger"]).toBe(pinned);
	});

	it("leaves an achromatic accent alone, having no hue to collide with", () => {
		const natural = toOklchColor(danger("#509a54")).h;
		expect(Math.abs(hueDelta(toOklchColor(danger("#8a8a8a")).h, natural))).toBeLessThan(1);
	});

	it("does not move info, which reads as blue by definition", () => {
		const onBlue = toOklchColor(themeFor("#2389e2")["--info"] as string).h;
		const away = toOklchColor(themeFor("#509a54")["--info"] as string).h;
		expect(Math.abs(hueDelta(onBlue, away)), "info keeps its hue even under a blue accent").toBeLessThan(1);
	});
});
