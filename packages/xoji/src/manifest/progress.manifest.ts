import type { ComponentManifest } from "./types.js";
import { FULL_TONES } from "../vocab.js";

const htmlExample = `<xoji-progress value="42" aria-label="Upload progress"></xoji-progress>

<xoji-progress value="80" tone="success" show-value aria-label="Storage used"></xoji-progress>

<xoji-progress variant="circular" value="65" tone="info" show-value aria-label="Sync"></xoji-progress>

<xoji-progress variant="circular" indeterminate aria-label="Loading"></xoji-progress>`;

const svelteExample = `<script lang="ts">
	import { Progress } from "@xoji/svelte";

	let value = $state(42);
</script>

<Progress {value} ariaLabel="Upload progress" />

<Progress value={80} tone="success" showValue ariaLabel="Storage used" />

<Progress variant="circular" value={65} tone="info" showValue ariaLabel="Sync" />

<Progress variant="circular" indeterminate ariaLabel="Loading" />`;

const astroExample = `---
import { Progress } from "@xoji/astro";
---

<Progress value={42} aria-label="Upload progress" />

<Progress value={80} tone="success" showValue aria-label="Storage used" />

<Progress variant="circular" value={65} tone="info" showValue aria-label="Sync" />

<Progress variant="circular" indeterminate aria-label="Loading" />`;

const meterHtmlExample = `<xoji-progress meter value="910" max="1000" show-value colorize-value aria-label="System capacity">
	<threshold below="75" tone="success"></threshold>
	<threshold below="90" tone="warn"></threshold>
	<threshold below="101" tone="danger" pulse="fast"></threshold>
</xoji-progress>`;

const meterSvelteExample = `<Progress meter value={910} max={1000} showValue colorizeValue ariaLabel="System capacity">
	<threshold below="75" tone="success" />
	<threshold below="90" tone="warn" />
	<threshold below="101" tone="danger" pulse="fast" />
</Progress>`;

const meterAstroExample = `<Progress meter value={910} max={1000} showValue colorizeValue aria-label="System capacity">
	<threshold below="75" tone="success" />
	<threshold below="90" tone="warn" />
	<threshold below="101" tone="danger" pulse="fast" />
</Progress>`;

export const progressManifest: ComponentManifest = {
	id: "progress",
	name: "Progress",
	category: "feedback",
	summary: "A progress bar or capacity meter: a linear bar or circular ring with value thresholds that recolor and pulse.",
	description:
		"Progress shows how far along a task is, or how full a capacity is. The `variant` axis picks the shape (a horizontal `linear` bar or a circular `svg` ring) and the `tone` axis picks the color from the full roster (the six semantic roles, the accent variants, the twelve named hues). A determinate bar fills to `value` between `min` and `max`; an `indeterminate` mode animates a moving sweep when the amount of work is unknown. Declarative `<threshold below tone pulse>` children turn it into a self-coloring meter: each band names a percentage ceiling, and the active band (the first the current value falls under) overrides the tone and can `pulse` the fill (`slow` or `fast`) to flag a critical level, the pulse routed through motion tokens so the reduced-motion base rule stills it. Set `meter` to report `role=\"meter\"` (a measurement against a capacity, like disk used) instead of the default `role=\"progressbar\"` (a task advancing); either way it carries `aria-valuenow`/`aria-valuemin`/`aria-valuemax`. An optional inline readout (`show-value`) shows the percentage, the raw value, or `value/max` (`value-format`), sits at the end or inset over the bar (`value-position`), and can take the active tone (`colorize-value`).",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "progress",
			description: "The root element carrying the variant, tone, and size classes and the progressbar (or meter) role.",
			selector: ".xoji-progress",
			tokens: ["--font-sans", "--fg-1", "--space-2"],
		},
		{
			name: "track",
			description: "The unfilled groove (a bar rail or an SVG ring) the indicator runs along.",
			selector: ".xoji-progress__track",
			tokens: ["--neutral-bg", "--radius-full", "--space-1", "--space-2"],
		},
		{
			name: "indicator",
			description: "The filled portion, colored by tone: a bar segment or a stroked arc.",
			selector: ".xoji-progress__indicator",
			tokens: ["--accent", "--duration-base", "--ease-emphasized"],
		},
		{
			name: "value",
			description: "The optional inline readout shown when `show-value` is set.",
			selector: ".xoji-progress__value",
			tokens: ["--text-sm", "--text-xs", "--fg-2", "--fg-1"],
		},
	],
	props: [
		{
			name: "variant",
			type: "ProgressVariant",
			default: "linear",
			description: "Shape of the meter: a horizontal bar or a circular ring.",
			bindings: ["html", "svelte", "astro"],
			options: ["linear", "circular"],
		},
		{
			name: "tone",
			type: "FullTone",
			default: "accent",
			description: "Semantic color of the filled indicator.",
			bindings: ["html", "svelte", "astro"],
			options: [...FULL_TONES],
		},
		{
			name: "size",
			type: "ProgressSize",
			default: "md",
			description: "Meter size; `sm` thins the bar or shrinks the ring.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md"],
		},
		{
			name: "value",
			type: "number",
			default: "0",
			description: "Current amount of work done, clamped between `min` and `max`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "min",
			type: "number",
			default: "0",
			description: "Lower bound of the range.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "max",
			type: "number",
			default: "100",
			description: "Upper bound of the range.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "indeterminate",
			type: "boolean",
			default: "false",
			description: "Animates a moving sweep instead of a fixed fill when progress is unknown; drops `aria-valuenow`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "showValue",
			type: "boolean",
			default: "false",
			description: "Renders an inline readout beside (or inside) the bar.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "valueFormat",
			type: "ProgressValueFormat",
			default: "percent",
			description: "How `show-value` reads: `percent` (`80%`), `value` (the raw number), or `value-max` (`80/100`).",
			bindings: ["html", "svelte", "astro"],
			options: ["percent", "value", "value-max"],
		},
		{
			name: "valuePosition",
			type: "\"end\" | \"inset\"",
			default: "end",
			description: "Where the `show-value` readout sits: after the bar (`end`) or laid over the fill (`inset`).",
			bindings: ["html", "svelte", "astro"],
			options: ["end", "inset"],
		},
		{
			name: "colorizeValue",
			type: "boolean",
			default: "false",
			description: "Tints the `show-value` readout with the active tone (the threshold tone when a band is active).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "meter",
			type: "boolean",
			default: "false",
			description: "Reports `role=\"meter\"` (a measurement against a capacity, e.g. disk used) instead of `role=\"progressbar\"` (a task advancing); the visual treatment is unchanged.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "threshold",
			type: "<threshold below tone pulse>",
			description: "Declarative config children, not a prop: each `<threshold below=\"<pct>\" tone=\"<tone>\" pulse=\"slow|fast\">` names a percentage ceiling; the active band (the first the current value falls under, bands sorted ascending) overrides `tone` and may `pulse` the fill; place them as direct children of the element.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "ariaLabel",
			type: "string",
			description: "Accessible name for the meter. Required. A progressbar with no name is not announced.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{
			name: "linear",
			description: "A horizontal bar that fills left-to-right.",
			className: "xoji-progress--linear",
			tokens: ["--neutral-bg", "--radius-full", "--accent"],
		},
		{
			name: "circular",
			description: "An SVG ring whose stroked arc sweeps clockwise from the top.",
			className: "xoji-progress--circular",
			tokens: ["--space-8", "--space-6", "--neutral-bg", "--accent"],
		},
	],
	sizes: [
		{ name: "sm", description: "Thin bar / small ring.", className: "xoji-progress--sm" },
		{ name: "md", description: "Default.", className: "xoji-progress", isDefault: true },
	],
	states: [
		{
			name: "indeterminate",
			description: "Work of unknown duration; the indicator animates a continuous sweep.",
			selector: ".xoji-progress--indeterminate",
			tokens: ["--ease-standard"],
		},
		{
			name: "pulse",
			description: "An active `<threshold pulse>` band; the fill breathes (`slow` or `fast`) to flag a critical level, stilled under reduced-motion.",
			selector: ".xoji-progress--pulse-slow, .xoji-progress--pulse-fast",
			tokens: ["--ease-standard"],
		},
		{
			name: "focus-visible",
			description: "Keyboard focus: a token-colored ring, plus a transparent outline that becomes real in forced-colors mode.",
			selector: ".xoji-progress:focus-visible",
			tokens: ["--border-normal", "--border-thick", "--ring", "--radius-sm"],
		},
	],
	slots: [
		{
			name: "value",
			description: "Optional custom content for the readout, in place of the built-in `show-value` text (e.g. a formatted label).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "default",
			description: "The `<threshold below tone pulse>` config children (hidden from view); the bar reads them to recolor and pulse by value.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--font-sans",
		"--bg-0",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--text-body",
		"--text-sm",
		"--text-xs",
		"--space-1",
		"--space-2",
		"--space-3",
		"--space-6",
		"--space-8",
		"--neutral-bg",
		"--radius-full",
		"--radius-sm",
		"--duration-base",
		"--ease-emphasized",
		"--ease-standard",
		"--border-normal",
		"--border-thick",
		"--ring",
		...FULL_TONES.map((t) => `--${t}`),
	],
	composition: [
		"Pair with a status Badge or text label to spell out the percentage in words when `show-value` alone is not enough.",
		"Drive `value` from an upload/download stream; flip to `indeterminate` for the indefinite handshake phase.",
		"Use the `success` tone on completion and `danger` on a stalled or failed transfer to reinforce state with color.",
	],
	a11y: [
		"Exposes `role=\"progressbar\"` (or `role=\"meter\"` with the `meter` attribute) carrying `aria-valuemin`, `aria-valuemax`, and `aria-valuenow` so assistive tech announces the current amount; pick `meter` for a capacity reading and `progressbar` for a task in motion.",
		"Threshold recoloring and the `pulse` animation are presentational; the value the screen reader announces is the same `aria-valuenow` either way, so a critical level never rides on color or motion alone (pair it with a `danger` tone word or a label if the level itself must be announced).",
		"`indeterminate` drops `aria-valuenow` (the value is unknown) while keeping the min/max bounds.",
		"Requires an accessible name via `aria-label`; the binding warns at runtime when one is missing.",
		"The visual fill is presentational; progress state lives in the ARIA value attributes, not the geometry.",
		"Focus is shown with a token ring and a transparent outline that the forced-colors base rule promotes to a real system outline.",
		"Motion (the indeterminate sweep) is routed through duration/easing tokens, so the reduced-motion base rule neutralizes it.",
	],
	examples: [
		{
			id: "linear-and-circular",
			title: "Linear and circular",
			description: "Both shapes carry any tone; add `show-value` for a readout or `indeterminate` for unknown work.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "capacity-meter",
			title: "A capacity meter with thresholds",
			description: "Set `meter` for the measurement role and add `<threshold below tone pulse>` children: the bar greens under 75%, ambers past it, and reds and pulses once it crosses 90% full.",
			source: { html: meterHtmlExample, svelte: meterSvelteExample, astro: meterAstroExample },
		},
	],
};
