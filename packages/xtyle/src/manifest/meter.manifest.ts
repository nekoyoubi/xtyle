import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-meter value="72" low="50" high="85" optimum="0" unit="%">Disk usage</xtyle-meter>`;

const svelteExample = `<script lang="ts">
	import { Meter } from "@xtyle/svelte";
</script>

<Meter value={72} low={50} high={85} optimum={0} unit="%" label="Disk usage" />`;

const astroExample = `---
import Meter from "@xtyle/astro/Meter.astro";
---

<Meter value={72} low={50} high={85} optimum={0} unit="%" label="Disk usage" />`;

export const meterManifest: ComponentManifest = {
	id: "meter",
	name: "Meter",
	since: "0.6.0",
	category: "metrics",
	summary: "A scalar gauge with semantic zones: the fill shifts good, okay, or bad by where the value falls.",
	description:
		"Meter is the display for a measurement within a known range: disk usage, a password strength, a score, a budget consumed. It mirrors the native `<meter>` element, not `<progress>`: `<progress>` tracks a task advancing to completion, while a Meter reads a standing value and judges it. Give it `low`, `high`, and `optimum` thresholds and the fill colors itself, drawing success when the value sits in the preferred region, a warning one region away, and danger at the wrong extreme, so a 90%-full disk reads red without any per-value wiring. With no thresholds it is a plain accent gauge. An optional label row shows the label and the value; the element's own text is the no-JS fallback and its accessible name, and it exposes `role=\"meter\"` with `aria-valuenow` / `min` / `max`.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "label",
			description: "The optional row above the track: the label on the left, the value on the right.",
			selector: ".xtyle-meter__label",
			tokens: ["--space-2", "--space-1", "--text-sm", "--fg-1", "--fg-2"],
		},
		{
			name: "track",
			description: "The rounded groove the fill sits in.",
			selector: ".xtyle-meter__track",
			tokens: ["--bg-2", "--radius-full"],
		},
		{
			name: "fill",
			description: "The value bar, sized to `value / max` and colored by the zone.",
			selector: ".xtyle-meter__fill",
			tokens: ["--accent", "--success", "--warn", "--danger"],
		},
	],
	props: [
		{
			name: "value",
			type: "number",
			default: "0",
			description: "The measured value; clamped to `0..max`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "max",
			type: "number",
			default: "100",
			description: "The top of the range. Defaults to 100 for the common percentage case (the native `<meter>` defaults to 1).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "low",
			type: "number",
			description: "The upper bound of the low region.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "high",
			type: "number",
			description: "The lower bound of the high region.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "optimum",
			type: "number",
			description:
				"Where the ideal value sits. In the low region → low is best (a disk should stay empty: `optimum=\"0\"`); in the high region → high is best (a battery should stay full); in between → the middle is best.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "unit",
			type: "string",
			description: "Appended to the value in the label row (e.g. `%`).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description: "The label text and accessible name. Defaults to the element's text content.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [
		{
			name: "good",
			description: "The value sits in the preferred region; the fill takes success.",
			selector: ".xtyle-meter--good",
			tokens: ["--success"],
		},
		{
			name: "okay",
			description: "The value is one region off ideal; the fill takes the warning tone.",
			selector: ".xtyle-meter--okay",
			tokens: ["--warn"],
		},
		{
			name: "bad",
			description: "The value is at the wrong extreme; the fill takes danger.",
			selector: ".xtyle-meter--bad",
			tokens: ["--danger"],
		},
	],
	slots: [
		{
			name: "default",
			description: "The label text, adopted as the label row and the accessible name. Omit it for a bare gauge.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--space-1",
		"--space-2",
		"--text-sm",
		"--fg-1",
		"--fg-2",
		"--bg-2",
		"--radius-full",
		"--accent",
		"--success",
		"--warn",
		"--danger",
	],
	composition: [
		"Set `low` / `high` / `optimum` for a judged gauge (disk, memory, quota); leave them off for a neutral accent bar.",
		"Point `optimum` at the good end: `optimum=\"0\"` when less is better (usage), or `optimum={max}` when more is better (battery, score).",
		"Stack a few in a `Stack` for a system-health panel, each with its own label and unit.",
	],
	a11y: [
		"It exposes `role=\"meter\"` with `aria-valuenow` / `aria-valuemin` / `aria-valuemax`, so assistive tech announces the reading and its range.",
		"The judgment is carried by the value and label, not by color alone, so a color-deficient user gets the same reading whether the fill is green or red.",
		"With no JavaScript the fallback text stays visible, so the value is never lost behind the enhancement.",
	],
	examples: [
		{
			id: "usage",
			title: "Disk usage",
			description: "A usage gauge where less is better: 72% lands in the warning zone, and it would go red past 85%.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
