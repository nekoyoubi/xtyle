import type { ComponentManifest } from "./types.js";
import { RAMP_SCHEMES } from "../series.js";

const htmlExample = `<xtyle-heatmap
	rows='["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]'
	scale
	label="Activity by day and hour"></xtyle-heatmap>
<script>
	const grid = document.querySelector("xtyle-heatmap");
	grid.cols = Array.from({ length: 24 }, (_, h) => String(h));
	grid.values = weekByHour; // number[7][24]
</script>`;

const svelteExample = `<script lang="ts">
	import { Heatmap } from "@xtyle/svelte";

	const rows = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
	const cols = Array.from({ length: 24 }, (_, h) => String(h));
	const values = weekByHour; // number[7][24]
</script>

<Heatmap {rows} {cols} {values} scale label="Activity by day and hour" />`;

const astroExample = `---
import { Heatmap } from "@xtyle/astro";
const rows = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const cols = Array.from({ length: 24 }, (_, h) => String(h));
const values = weekByHour; // number[7][24]
---

<Heatmap rows={rows} cols={cols} values={values} scale label="Activity by day and hour" />`;

const schemeHtmlExample = `<xtyle-heatmap
	scheme="thermal"
	show-values
	label="Load by host and resource"></xtyle-heatmap>
<script>
	const grid = document.querySelector("xtyle-heatmap");
	grid.rows = ["web-1", "web-2", "db-1"];
	grid.cols = ["CPU", "Mem", "Net", "Disk"];
	grid.values = [[42, 30, 18, 9], [26, 55, 22, 14], [12, 40, 8, 61]];
</script>`;

const schemeSvelteExample = `<script lang="ts">
	import { Heatmap } from "@xtyle/svelte";

	const rows = ["web-1", "web-2", "db-1"];
	const cols = ["CPU", "Mem", "Net", "Disk"];
	const values = [[42, 30, 18, 9], [26, 55, 22, 14], [12, 40, 8, 61]];
</script>

<Heatmap {rows} {cols} {values} scheme="thermal" showValues label="Load by host and resource" />`;

const schemeAstroExample = `---
import { Heatmap } from "@xtyle/astro";
const rows = ["web-1", "web-2", "db-1"];
const cols = ["CPU", "Mem", "Net", "Disk"];
const values = [[42, 30, 18, 9], [26, 55, 22, 14], [12, 40, 8, 61]];
---

<Heatmap rows={rows} cols={cols} values={values} scheme="thermal" showValues label="Load by host and resource" />`;

const actionableHtmlExample = `<xtyle-heatmap
	scheme="accent"
	selectable
	label="Runs per hour"></xtyle-heatmap>
<script>
	const grid = document.querySelector("xtyle-heatmap");
	grid.rows = ["Mon", "Tue", "Wed"];
	grid.cols = ["AM", "PM", "Night"];
	grid.values = [[3, 8, 1], [5, 2, 0], [0, 6, 4]];
	grid.addEventListener("select", (e) => {
		// { row, col, value, rowIndex, colIndex }
		openRuns(e.detail.row, e.detail.col);
	});
</script>`;

const actionableSvelteExample = `<script lang="ts">
	import { Heatmap } from "@xtyle/svelte";

	const rows = ["Mon", "Tue", "Wed"];
	const cols = ["AM", "PM", "Night"];
	const values = [[3, 8, 1], [5, 2, 0], [0, 6, 4]];
</script>

<Heatmap
	{rows}
	{cols}
	{values}
	scheme="accent"
	selectable
	label="Runs per hour"
	onselect={(e) => openRuns(e.detail.row, e.detail.col)}
/>`;

const actionableAstroExample = `---
import { Heatmap } from "@xtyle/astro";
const rows = ["Mon", "Tue", "Wed"];
const cols = ["AM", "PM", "Night"];
const values = [[3, 8, 1], [5, 2, 0], [0, 6, 4]];
---

<Heatmap rows={rows} cols={cols} values={values} scheme="accent" selectable label="Runs per hour" />
<script>
	document.querySelector("xtyle-heatmap").addEventListener("select", (e) => {
		openRuns(e.detail.row, e.detail.col);
	});
</script>`;

const glowHtmlExample = `<xtyle-heatmap
	scheme="accent"
	glow-label="runtime"
	label="Runs (fill) and total runtime (glow) by day and bucket"></xtyle-heatmap>
<script>
	const grid = document.querySelector("xtyle-heatmap");
	grid.rows = ["Mon", "Tue", "Wed"];
	grid.cols = ["AM", "PM", "Night"];
	grid.values = [[3, 8, 1], [5, 2, 0], [0, 6, 4]];
	grid.glow = [[40, 12, 90], [8, 30, 0], [0, 15, 70]];
</script>`;

const glowSvelteExample = `<script lang="ts">
	import { Heatmap } from "@xtyle/svelte";

	const rows = ["Mon", "Tue", "Wed"];
	const cols = ["AM", "PM", "Night"];
	const values = [[3, 8, 1], [5, 2, 0], [0, 6, 4]];
	const glow = [[40, 12, 90], [8, 30, 0], [0, 15, 70]];
</script>

<Heatmap {rows} {cols} {values} {glow} glowLabel="runtime" scheme="accent" label="Runs (fill) and total runtime (glow)" />`;

const glowAstroExample = `---
import { Heatmap } from "@xtyle/astro";
const rows = ["Mon", "Tue", "Wed"];
const cols = ["AM", "PM", "Night"];
const values = [[3, 8, 1], [5, 2, 0], [0, 6, 4]];
const glow = [[40, 12, 90], [8, 30, 0], [0, 15, 70]];
---

<Heatmap rows={rows} cols={cols} values={values} glow={glow} glowLabel="runtime" scheme="accent" label="Runs (fill) and total runtime (glow)" />`;

const nowHtmlExample = `<xtyle-heatmap
	rows='["Mon","Tue","Wed"]'
	current-pulse
	label="Runs per bucket, this week"></xtyle-heatmap>
<script>
	const grid = document.querySelector("xtyle-heatmap");
	grid.cols = ["AM", "PM", "Night"];
	grid.values = [[3, 8, 1], [5, 2, 0], [0, 6, 4]];
	// ring + pulse the live cell (Wed / PM), and give it a fuller hover readout
	grid.current = [[2, 1]];
	grid.titles = [[], [], [, "Wed PM: 6 runs · 2 failed · click to view"]];
</script>`;

const nowSvelteExample = `<script lang="ts">
	import { Heatmap } from "@xtyle/svelte";

	const rows = ["Mon", "Tue", "Wed"];
	const cols = ["AM", "PM", "Night"];
	const values = [[3, 8, 1], [5, 2, 0], [0, 6, 4]];
	const current = [[2, 1]];
	const titles = [[], [], [, "Wed PM: 6 runs · 2 failed · click to view"]];
</script>

<Heatmap {rows} {cols} {values} {current} {titles} currentPulse label="Runs per bucket, this week" />`;

const nowAstroExample = `---
import { Heatmap } from "@xtyle/astro";
const rows = ["Mon", "Tue", "Wed"];
const cols = ["AM", "PM", "Night"];
const values = [[3, 8, 1], [5, 2, 0], [0, 6, 4]];
const current = [[2, 1]];
const titles = [[], [], [, "Wed PM: 6 runs · 2 failed · click to view"]];
---

<Heatmap rows={rows} cols={cols} values={values} current={current} titles={titles} currentPulse label="Runs per bucket, this week" />`;

export const heatmapManifest: ComponentManifest = {
	id: "heatmap",
	name: "Heatmap",
	since: "0.4.0",
	category: "metrics",
	summary: "A 2D intensity grid (the activity-calendar / punch-card shape), colored on a theme-derived ramp, with a per-cell readout and opt-in clickable cells.",
	description:
		"Heatmap renders a matrix of values as a grid of colored cells, each cell's fill scaled by its value on an intensity ramp resolved off the live theme, the activity-calendar / punch-card shape (runs per hour over a week, load by host and resource, a GitHub-style contribution grid). Feed it a dense `values` matrix (row-major) plus optional `rows` and `cols` labels; the default `accent` ramp washes from a faint surface up to the accent, and `thermal` or `status` (or an explicit color array) swap the scale. Every cell's intensity is normalized against the data's own maximum, or an explicit `max` so several grids share one scale. It's interactive: hovering or focusing a cell floats a value readout, and the whole grid is mirrored into a visually-hidden data table so assistive tech reads the numbers, not the pixels. Set `selectable` to make cells a drill-in surface, each firing a `select` event with its row, column, and value. `showValues` prints the number in each cell. Feed an optional second `glow` matrix (the same shape as `values`) to carry a second signal in one grid: the fill reads one metric while a per-cell halo reads another (run count vs total runtime, requests vs error rate). An empty matrix shows a muted `No data` message in place of the grid.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "chart",
			description: "The `<figure>` root holding the SVG grid, tooltip, and the accessible data table.",
			selector: ".xtyle-heatmap",
			tokens: ["--font-sans"],
		},
		{
			name: "cell",
			description: "A single grid cell, filled by its value's intensity color; the focus/hover target.",
			selector: ".xtyle-heatmap__cell",
			tokens: ["--bg-0", "--ring", "--border-thick", "--duration-fast", "--ease-standard"],
		},
		{
			name: "current-cell",
			description: "A cell marked as the current / \"now\" position: ringed in the accent (or a chosen tone), optionally pulsing.",
			selector: ".xtyle-heatmap__cell--current",
			tokens: ["--accent", "--success", "--danger", "--warn", "--info", "--neutral", "--ease-standard"],
		},
		{
			name: "tooltip",
			description: "The floating value readout shown on hover or focus of a cell.",
			selector: ".xtyle-heatmap__tooltip",
			tokens: ["--surface-overlay", "--surface-overlay-border", "--elevation-3", "--radius-md", "--fg-0"],
		},
		{
			name: "scale",
			description: "The optional color-scale key below the grid: five ramp swatches between the low and high value endpoints.",
			selector: ".xtyle-heatmap__scale",
			tokens: ["--space-2", "--text-xs", "--fg-3", "--bg-0", "--border-thin"],
		},
	],
	props: [
		{
			name: "values",
			type: "number[][]",
			description: "The data as a dense row-major matrix: `values[row][col]`. JS property in html/svelte, JSON attribute or prop in astro.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "rows",
			type: "string[]",
			description: "Row (y-axis) labels, one per matrix row; omit for an unlabeled grid.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "cols",
			type: "string[]",
			description: "Column (x-axis) labels, one per matrix column; omit for an unlabeled grid.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "scheme",
			type: "RampScheme | string[]",
			default: "accent",
			description: "The intensity ramp: `accent` (a faint-surface-to-accent wash), `thermal` (cool to hot), `status` (success to danger), or an explicit array of stop colors interpolated in OKLCH.",
			bindings: ["html", "svelte", "astro"],
			options: [...RAMP_SCHEMES],
		},
		{
			name: "reverse",
			type: "boolean",
			default: "false",
			description: "Flips the ramp end for end (a high value takes the low color and vice versa).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "max",
			type: "number",
			description: "The intensity ceiling a full-strength cell maps to; defaults to the data's own maximum. Set it so several heatmaps share one scale.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "glow",
			type: "number[][]",
			description:
				"An optional second intensity matrix (same shape as `values`) driving a per-cell glow halo, so one grid carries two signals: the fill reads one metric and the halo strength reads another (run count vs total runtime, requests vs error rate). Each cell's glow normalizes against the glow data's own maximum (or `glowMax`); a cell with zero glow gets no halo. The halo takes the ramp's hot-end color off the live theme. JS property in html/svelte, JSON attribute or prop in astro.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "glowMax",
			type: "number",
			description: "The glow-channel ceiling a full-strength halo maps to; defaults to the glow data's own maximum. Set it so several grids share one glow scale. Kebab `glow-max` on the element.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "glowBlur",
			type: "number",
			default: "7",
			description: "The px blur a full-strength glow halo reaches. The default suits a roomy grid; lower it on a dense (contribution-graph) grid so neighboring halos don't merge, raise it on a sparse one. Kebab `glow-blur` on the element.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "glowLabel",
			type: "string",
			default: '"glow"',
			description: "Names the glow metric so its value reaches each cell's accessible name and its hover readout (e.g. `glowLabel=\"runtime\"` reads \"Mon, Midday: 8, runtime 42\"), keeping the second channel from being visual-only. Kebab `glow-label` on the element.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "current",
			type: "[number, number][]",
			description:
				"Cells to ring as the current / \"now\" marker, each a `[rowIndex, colIndex]` pair, the \"you are here\" on a time grid (the live hour on an activity strip, today on a contribution graph). JS property in html/svelte, JSON attribute or prop in astro.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "currentTone",
			type: '"success" | "danger" | "warn" | "info" | "neutral"',
			description:
				"Tints the current-cell ring with a semantic tone; defaults to the accent. Kebab `current-tone` on the element.",
			bindings: ["html", "svelte", "astro"],
			options: ["success", "danger", "warn", "info", "neutral"],
		},
		{
			name: "currentPulse",
			type: "boolean",
			default: "false",
			description:
				"Pulses the current-cell ring so \"now\" reads as live, not just marked; honors `prefers-reduced-motion`. Kebab `current-pulse` on the element.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "titles",
			type: "string[][]",
			description:
				"Per-cell hover text, the same shape as `values`: a non-empty `titles[row][col]` becomes that cell's floating readout and its accessible name, so a cell can carry richer detail (a full timestamp, a breakdown) than its bare value. Cells left empty fall back to the default row/column/value readout. JS property in html/svelte, JSON attribute or prop in astro.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "scale",
			type: "boolean",
			default: "false",
			description:
				"Shows a color-scale key below the grid: five swatches sampled from the ramp between the low (`0`) and high (`max`) value endpoints, so a viewer reads a cell's shade as a magnitude without hovering. The swatches derive off the same ramp as the cells, so the key always matches them.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "showValues",
			type: "boolean",
			default: "false",
			description: "Prints each cell's value inside it. Kebab `show-values` on the element.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "selectable",
			type: "boolean",
			default: "false",
			description:
				"Makes cells actionable: each cell becomes a `role=\"button\"` with a pointer cursor, and clicking one (or pressing Enter/Space while it's focused) fires a `select` `CustomEvent` whose `detail` carries `{ row, col, value, rowIndex, colIndex }`. `@xtyle/svelte` surfaces it as an `onselect` callback. Leave it off for a read-only grid.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "label",
			type: "string",
			description: "An accessible name for the grid, used as the data table's caption.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [
		{
			name: "cell-hover",
			description: "Pointer over or keyboard focus on a cell: its border brightens (the rest are never dimmed, so a dense grid never strobes) and a value readout floats above it.",
			selector: ".xtyle-heatmap--hovering .xtyle-heatmap__cell.is-active",
			tokens: ["--duration-fast", "--ease-standard", "--fg-0"],
		},
		{
			name: "cell-focus",
			description: "Keyboard focus on a cell draws a token ring; each cell is a tab stop that announces its row, column, and value.",
			selector: ".xtyle-heatmap__cell:focus-visible",
			tokens: ["--ring", "--border-thick"],
		},
		{
			name: "current",
			description: "A cell flagged via `current`: a thicker accent (or toned) ring marks it as \"now\", pulsing when `currentPulse` is set (and reduced-motion is not requested).",
			selector: ".xtyle-heatmap__cell--current",
			tokens: ["--accent", "--ease-standard"],
		},
	],
	slots: [],
	consumedTokens: [
		"--font-sans",
		"--text-xs",
		"--text-sm",
		"--fg-0",
		"--fg-2",
		"--fg-3",
		"--bg-0",
		"--space-1",
		"--space-2",
		"--radius-md",
		"--surface-overlay",
		"--surface-overlay-border",
		"--elevation-3",
		"--duration-fast",
		"--ease-standard",
		"--ring",
		"--border-thin",
		"--border-thick",
		"--weight-semibold",
		"--leading-normal",
		"--accent",
		"--success",
		"--danger",
		"--warn",
		"--info",
		"--neutral",
	],
	composition: [
		"The cell colors derive off the same register as the rest of the UI, so a grid matches its surrounding chrome without hand-picking a scale. `accent` is the neutral default (the contribution-graph wash); reach for `thermal` when the data is a true low-to-high magnitude and the extra hue helps read it.",
		"Pin `max` when two grids should be read against each other, so a cell of the same value takes the same color in both.",
		"Turn on `scale` for a color-scale key so a cell's shade reads as a magnitude at a glance, not only on hover, the way a contribution graph carries its own low-to-high legend. The swatches sample the same ramp as the cells, so the key can't drift from what the grid shows.",
		"Carry two metrics in one grid with `glow`: the fill reads the primary metric (say, run count) while a per-cell halo reads a second (total runtime), so a cell can be dim-but-glowing (few long runs) or bright-but-quiet (many short ones). The halo takes the ramp's hot-end color, so it stays theme-coherent; pin `glowMax` to share one glow scale across grids.",
		"Make a grid a drill-in with `selectable` and a `select` listener: click a cell to open that bucket's detail (an hour's runs, a region's orders). The event's `detail` names the exact row, column, and value clicked, so the handler needs no lookup. It composes with the same `select` seam `Bar` carries.",
		"Mark \"now\" on a time grid with `current`: a `[rowIndex, colIndex]` list rings those cells (the live hour, today's column), `currentTone` tints the ring, and `currentPulse` breathes it so a live position reads as live. It's a decorative overlay on top of the value fill, so it composes with any scheme, `glow`, or `selectable`.",
		"Give cells richer hover detail with `titles`, a matrix parallel to `values`: a `titles[row][col]` becomes that cell's readout and accessible name, so a cell can spell out a full timestamp and breakdown (\"Wed PM: 6 runs, 2 failed\") instead of a bare number, without a bespoke tooltip layer.",
	],
	a11y: [
		"The SVG is decorative (`aria-hidden`); the grid's data is mirrored into a visually-hidden `<table>` so assistive tech reads the actual numbers. `label` becomes the table's caption.",
		"Each cell is a focusable tab stop with an `aria-label` naming its row, column, and value, so the grid is navigable by keyboard and the value readout appears on focus as well as hover.",
		"With `selectable`, each cell becomes a `role=\"button\"` (announced as actionable) and activates on Enter/Space as well as click; a read-only grid keeps its cells as `role=\"img\"` data points.",
		"Color is never the only channel: the value readout, the optional in-cell `showValues`, the optional `scale` key's numeric endpoints, and the data table all repeat the number.",
		"A `titles[row][col]` becomes that cell's `aria-label`, so the richer hover text is the cell's accessible name too, never a mouse-only affordance; the current-cell ring is decorative, so it never carries meaning on its own.",
		"The `glow` halo is a visual channel, so it never carries its metric alone: when a `glow` matrix is present, each cell's glow value folds into its accessible name and its hover readout (named by `glowLabel`), so the second metric has a text path for assistive tech even though the halo itself is decorative. The summary data table still lists the primary (fill) metric.",
	],
	examples: [
		{
			id: "activity",
			title: "Activity grid",
			description: "A week-by-hour activity grid on the default `accent` ramp, the contribution-graph shape.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "scheme",
			title: "Thermal scale with values",
			description: "`scheme=\"thermal\"` runs the cells cool to hot, and `showValues` prints each number in its cell.",
			source: { html: schemeHtmlExample, svelte: schemeSvelteExample, astro: schemeAstroExample },
		},
		{
			id: "actionable",
			title: "Selectable cells",
			description: "`selectable` makes each cell a button that fires `select` on click or Enter/Space, so a grid can drive a drill-in. The `detail` carries the row, column, value, and both indices.",
			source: { html: actionableHtmlExample, svelte: actionableSvelteExample, astro: actionableAstroExample },
		},
		{
			id: "glow",
			title: "Two-channel glow",
			description: "A second `glow` matrix carries a second metric as a per-cell halo, so the fill reads run count while the glow reads total runtime, two signals in one grid.",
			source: { html: glowHtmlExample, svelte: glowSvelteExample, astro: glowAstroExample },
		},
		{
			id: "now",
			title: "Current-cell marker and per-cell titles",
			description: "`current` rings the live cell (with `currentPulse` to breathe it and `currentTone` to tint it), the \"you are here\" on a time grid, and `titles` gives a cell a fuller hover readout that doubles as its accessible name.",
			source: { html: nowHtmlExample, svelte: nowSvelteExample, astro: nowAstroExample },
		},
	],
};
