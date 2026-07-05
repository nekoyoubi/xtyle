import { describe, expect, it } from "vitest";
import { clampNumber } from "../src/markup/index.js";

const stepped = (grid: number, extra: { min?: number; max?: number } = {}) => ({
	grid,
	unstepped: false,
	...extra,
});
const free = (extra: { min?: number; max?: number } = {}) => ({ grid: 1, unstepped: true, ...extra });

describe("clampNumber (stepped)", () => {
	it("snaps a typed value to the grid on commit", () => {
		expect(clampNumber(3.14, stepped(1))).toBe(3);
		expect(clampNumber(3.6, stepped(1))).toBe(4);
		expect(clampNumber(12, stepped(5))).toBe(10);
	});

	it("snaps relative to min so the grid aligns with the low bound", () => {
		expect(clampNumber(7, stepped(5, { min: 1 }))).toBe(6);
	});

	it("clamps into [min, max] after snapping", () => {
		expect(clampNumber(200, stepped(1, { min: 0, max: 99 }))).toBe(99);
		expect(clampNumber(-4, stepped(1, { min: 0 }))).toBe(0);
	});

	it("caps a snapped value to six decimals", () => {
		expect(clampNumber(9.99, stepped(0.01))).toBe(9.99);
	});

	it("falls back to min (or 0) for NaN", () => {
		expect(clampNumber(Number.NaN, stepped(1))).toBe(0);
		expect(clampNumber(Number.NaN, stepped(1, { min: 5 }))).toBe(5);
	});
});

describe("clampNumber (unstepped, step=any)", () => {
	it("keeps an arbitrary decimal verbatim, no grid snap", () => {
		expect(clampNumber(3.14159, free())).toBe(3.14159);
		expect(clampNumber(0.001, free())).toBe(0.001);
		expect(clampNumber(2.718281828, free())).toBe(2.718281828);
	});

	it("does not cap precision beyond six decimals", () => {
		expect(clampNumber(0.1234567, free())).toBe(0.1234567);
	});

	it("leaves an unbounded value unclamped", () => {
		expect(clampNumber(1e9, free())).toBe(1e9);
		expect(clampNumber(-1e9, free())).toBe(-1e9);
	});

	it("still clamps when a bound is set, without snapping", () => {
		expect(clampNumber(3.14159, free({ min: 0, max: 2 }))).toBe(2);
		expect(clampNumber(-0.5, free({ min: 0 }))).toBe(0);
		expect(clampNumber(1.5, free({ min: 0, max: 10 }))).toBe(1.5);
	});
});
