import type { ComponentManifest } from "./types.js";
import { FULL_TONES, PROGRESS_SIZES } from "../vocab.js";
import { PALETTES } from "../series.js";

const htmlExample = `<xtyle-progress value="42" aria-label="Upload progress"></xtyle-progress>

<xtyle-progress value="80" tone="success" show-value aria-label="Storage used"></xtyle-progress>

<xtyle-progress variant="circular" value="65" tone="info" show-value aria-label="Sync"></xtyle-progress>

<xtyle-progress variant="circular" indeterminate aria-label="Loading"></xtyle-progress>`;

const svelteExample = `<script lang="ts">
	import { Progress } from "@xtyle/svelte";

	let value = $state(42);
</script>

<Progress {value} ariaLabel="Upload progress" />

<Progress value={80} tone="success" showValue ariaLabel="Storage used" />

<Progress variant="circular" value={65} tone="info" showValue ariaLabel="Sync" />

<Progress variant="circular" indeterminate ariaLabel="Loading" />`;

const astroExample = `---
import { Progress } from "@xtyle/astro";
---

<Progress value={42} aria-label="Upload progress" />

<Progress value={80} tone="success" showValue aria-label="Storage used" />

<Progress variant="circular" value={65} tone="info" showValue aria-label="Sync" />

<Progress variant="circular" indeterminate aria-label="Loading" />`;

const meterHtmlExample = `<xtyle-progress meter value="910" max="1000" show-value value-format="value-max" unit=" GB" colorize-value aria-label="Disk usage">
	<threshold below="75" tone="success"></threshold>
	<threshold below="90" tone="warn"></threshold>
	<threshold below="101" tone="danger" pulse="fast"></threshold>
</xtyle-progress>`;

const meterSvelteExample = `<Progress meter value={910} max={1000} showValue valueFormat="value-max" unit=" GB" colorizeValue ariaLabel="Disk usage">
	<threshold below="75" tone="success" />
	<threshold below="90" tone="warn" />
	<threshold below="101" tone="danger" pulse="fast" />
</Progress>`;

const meterAstroExample = `<Progress meter value={910} max={1000} showValue valueFormat="value-max" unit=" GB" colorizeValue aria-label="Disk usage">
	<threshold below="75" tone="success" />
	<threshold below="90" tone="warn" />
	<threshold below="101" tone="danger" pulse="fast" />
</Progress>`;

const rampHtmlExample = `<xtyle-progress ramp="thermal" value="30" aria-label="Load, cool"></xtyle-progress>
<xtyle-progress ramp="thermal" value="70" aria-label="Load, warm"></xtyle-progress>
<xtyle-progress ramp="thermal" value="95" aria-label="Load, hot"></xtyle-progress>

<xtyle-progress ramp="thermal" ramp-mode="gradient" value="80" aria-label="Capacity sweep"></xtyle-progress>`;

const rampSvelteExample = `<Progress ramp="thermal" value={30} ariaLabel="Load, cool" />
<Progress ramp="thermal" value={70} ariaLabel="Load, warm" />
<Progress ramp="thermal" value={95} ariaLabel="Load, hot" />

<Progress ramp="thermal" rampMode="gradient" value={80} ariaLabel="Capacity sweep" />`;

const rampAstroExample = `<Progress ramp="thermal" value={30} aria-label="Load, cool" />
<Progress ramp="thermal" value={70} aria-label="Load, warm" />
<Progress ramp="thermal" value={95} aria-label="Load, hot" />

<Progress ramp="thermal" rampMode="gradient" value={80} aria-label="Capacity sweep" />`;

const frameHtmlExample = `<style>
	.portrait { position: relative; width: 96px; height: 96px; }
	.portrait xtyle-progress { display: block; position: absolute; inset: 0; --xtyle-progress-size: 100%; }
</style>

<div class="portrait">
	<xtyle-avatar src="/portrait.jpg" alt="Ada" size="lg"></xtyle-avatar>
	<xtyle-progress variant="circular" value="72" track="none" thickness="4px" tone="success" aria-label="Profile complete"></xtyle-progress>
</div>

<xtyle-progress variant="circular" value="40" track="info" thickness="1.5" aria-label="A toned groove, thin band"></xtyle-progress>`;

const frameSvelteExample = `<script lang="ts">
	import { Avatar, Progress } from "@xtyle/svelte";
</script>

<div class="portrait">
	<Avatar src="/portrait.jpg" alt="Ada" size="lg" />
	<Progress variant="circular" value={72} track={false} thickness="4px" tone="success" ariaLabel="Profile complete" />
</div>

<Progress variant="circular" value={40} track="info" thickness={1.5} ariaLabel="A toned groove, thin band" />

<Progress variant="circular" value={72} showValue ariaLabel="Sync">
	{#snippet readout()}<strong>72 of 100</strong>{/snippet}
</Progress>

<style>
	.portrait { position: relative; width: 96px; height: 96px; }
	.portrait :global(xtyle-progress) { display: block; position: absolute; inset: 0; --xtyle-progress-size: 100%; }
</style>`;

const frameAstroExample = `---
import { Avatar, Progress } from "@xtyle/astro";
---

<div class="portrait">
	<Avatar src="/portrait.jpg" alt="Ada" size="lg" />
	<Progress variant="circular" value={72} track={false} thickness="4px" tone="success" aria-label="Profile complete" />
</div>

<Progress variant="circular" value={40} track="info" thickness={1.5} aria-label="A toned groove, thin band" />

<Progress variant="circular" value={72} showValue aria-label="Sync">
	<strong slot="value">72 of 100</strong>
</Progress>

<style>
	.portrait { position: relative; width: 96px; height: 96px; }
	.portrait xtyle-progress { display: block; position: absolute; inset: 0; --xtyle-progress-size: 100%; }
</style>`;

export const progressManifest: ComponentManifest = {
	id: "progress",
	name: "Progress",
	category: "feedback",
	since: "0.1.0",
	seeAlso: ["spinner", "stat", "steps", "slider"],
	summary: "A progress bar or capacity meter: a linear bar or circular ring with value thresholds that recolor and pulse.",
	description:
		"Progress shows how far along a task is, or how full a capacity is. The `variant` axis picks the shape (a horizontal `linear` bar or a circular `svg` ring) and the `tone` axis picks the color from the full roster (the six semantic roles, the accent variants, the twelve named hues). A determinate bar fills to `value` between `min` and `max`; an `indeterminate` mode animates a moving sweep when the amount of work is unknown. Declarative `<threshold below tone pulse>` children turn it into a self-coloring meter: each band names a percentage ceiling, and the active band (the first the current value falls under) overrides the tone and can `pulse` the fill (`slow` or `fast`) to flag a critical level, the pulse routed through motion tokens so the reduced-motion base rule stills it. Set `meter` to report `role=\"meter\"` (a measurement against a capacity, like disk used) instead of the default `role=\"progressbar\"` (a task advancing); either way it carries `aria-valuenow`/`aria-valuemin`/`aria-valuemax`. An optional inline readout (`show-value`) shows the percentage, the raw value, or `value/max` (`value-format`), sits at the end or inset over the bar (`value-position`), and can take the active tone (`colorize-value`).",
	keywords: ["meter", "gauge", "capacity", "threshold", "disk", "battery", "usage", "quota", "score"],
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "progress",
			description: "The root element carrying the variant, tone, and size classes and the progressbar (or meter) role.",
			selector: ".xtyle-progress",
			tokens: ["--font-sans", "--fg-1", "--space-2"],
		},
		{
			name: "track",
			description: "The unfilled groove the indicator runs along: a bar rail (`.xtyle-progress__track`) or an SVG ring (`.xtyle-progress__track-ring`). Both variants expose it as `::part(track)`, and `track` can tone it or drop it entirely.",
			selector: ".xtyle-progress__track, .xtyle-progress__track-ring",
			tokens: ["--neutral-bg", "--radius-full", "--space-1", "--space-2"],
		},
		{
			name: "indicator",
			description: "The filled portion, colored by tone: a bar segment or a stroked arc.",
			selector: ".xtyle-progress__indicator",
			tokens: ["--accent", "--duration-base", "--ease-emphasized"],
		},
		{
			name: "value",
			description: "The optional inline readout shown when `show-value` is set.",
			selector: ".xtyle-progress__value",
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
			description: "Meter size; `sm` thins the bar or shrinks the ring, `lg` fattens it.",
			bindings: ["html", "svelte", "astro"],
			options: [...PROGRESS_SIZES],
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
			name: "unit",
			type: "string",
			description: "A unit appended to the `value` / `value-max` readout (e.g. ` GB`); the `percent` format ignores it (the `%` is the unit).",
			bindings: ["html", "svelte", "astro"],
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
			name: "ramp",
			type: "Palette | string[]",
			description: "Colors the fill by its own value along a ramp instead of the flat `tone`: a built-in palette (`intensity`, `thermal`, `severity`), a JSON array of stop colors (`[\"#00f\",\"#f00\"]`), or a comma-separated stop list. Reinforces magnitude with temperature, so a fuller bar also reads hotter.",
			bindings: ["html", "svelte", "astro"],
			options: [...PALETTES],
		},
		{
			name: "rampMode",
			type: "\"solid\" | \"gradient\"",
			default: "solid",
			description: "How a `ramp` paints: `solid` samples one color at the current value off the live cascade (needs the runtime); `gradient` paints the whole scale as a pure-CSS sweep clipped to the fill (zero-JS, SSR-safe, linear only, a circular ring falls back to `solid`).",
			bindings: ["html", "svelte", "astro"],
			options: ["solid", "gradient"],
		},
		{
			name: "reverse",
			type: "boolean",
			default: "false",
			description: "Flips a `ramp` end for end (hot-to-cold).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "threshold",
			type: "<threshold below tone pulse>",
			description: "Declarative config children, not a prop: each `<threshold below=\"<pct>\" tone=\"<tone>\" pulse=\"slow|fast\">` names a percentage ceiling; the active band (the first the current value falls under, bands sorted ascending) overrides `tone` and may `pulse` the fill; place them as direct children of the element.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "track",
			type: "boolean | FullTone",
			default: "true",
			description: "The unfilled groove behind the indicator: `true` keeps the default `--neutral-bg` rail, `false` (`track=\"none\"` in HTML) drops it entirely, and a tone paints it that tone's `-bg`. A ring reporting a window that may not exist reads better trackless, where an always-on groove reads as a border rather than an empty meter.",
			bindings: ["html", "svelte", "astro"],
			options: ["none", ...FULL_TONES],
		},
		{
			name: "thickness",
			type: "string | number",
			description: "How heavy a `circular` ring reads, independent of its diameter. A unitless number is in ring units (the ring is a 40-unit viewBox at `r=16`), so the weight scales with the ring; a CSS length (`6px`, `0.25rem`) is absolute and holds the same apparent weight at any size. Sets `--xtyle-progress-stroke`, which CSS can set directly instead. Circular only; a `linear` rail's height still follows `size`.",
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
			className: "xtyle-progress--linear",
			tokens: ["--neutral-bg", "--radius-full", "--accent"],
		},
		{
			name: "circular",
			description: "An SVG ring whose stroked arc sweeps clockwise from the top. Its diameter follows `size` unless `--xtyle-progress-size` overrides it, and its stroke weight follows `thickness` / `--xtyle-progress-stroke`, so a ring can be large and thin or small and heavy.",
			className: "xtyle-progress--circular",
			tokens: ["--space-8", "--space-6", "--neutral-bg", "--accent"],
		},
	],
	sizes: [
		{ name: "sm", description: "Thin bar / small ring.", className: "xtyle-progress--sm" },
		{ name: "md", description: "Default.", className: "xtyle-progress", isDefault: true },
	],
	states: [
		{
			name: "indeterminate",
			description: "Work of unknown duration; the indicator animates a continuous sweep.",
			selector: ".xtyle-progress--indeterminate",
			tokens: ["--ease-standard"],
		},
		{
			name: "pulse",
			description: "An active `<threshold pulse>` band; the fill breathes (`slow` or `fast`) to flag a critical level, stilled under reduced-motion.",
			selector: ".xtyle-progress--pulse-slow, .xtyle-progress--pulse-fast",
			tokens: ["--ease-standard"],
		},
		{
			name: "focus-visible",
			description: "Keyboard focus: a token-colored ring, plus a transparent outline that becomes real in forced-colors mode.",
			selector: ".xtyle-progress:focus-visible",
			tokens: ["--border-normal", "--border-thick", "--ring", "--radius-sm"],
		},
	],
	slots: [
		{
			name: "value",
			description: "Optional custom content for the readout, in place of the built-in `show-value` text (e.g. a formatted label). The Svelte binding fills it with the `readout` snippet, since `value` there is already the numeric prop.",
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
		...FULL_TONES.map((t) => `--${t}-bg`),
	],
	composition: [
		"Pair with a status Badge or text label to spell out the percentage in words when `show-value` alone is not enough.",
		"Drive `value` from an upload/download stream; flip to `indeterminate` for the indefinite handshake phase.",
		"Use the `success` tone on completion and `danger` on a stalled or failed transfer to reinforce state with color.",
		"Wrap a circular ring around an Avatar or Image to make it a frame: `track=\"none\"` drops the groove, `--xtyle-progress-size: 100%` sizes it to the container, and `thickness` sets the band weight independent of the diameter.",
		"Both variants expose `::part(progress)`, `::part(track)`, `::part(indicator)`, and `::part(value)`, which is the reach an app has into a shadow-rendered element alongside the inherited `--xtyle-progress-*` properties.",
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
			description: "Set `meter` for the measurement role and add `<threshold below tone pulse>` children: the bar greens under 75%, ambers past it, and reds and pulses once it crosses 90% full, the `value/max` readout carrying its `unit`. This is the gauge use once served by a separate Meter.",
			source: { html: meterHtmlExample, svelte: meterSvelteExample, astro: meterAstroExample },
		},
		{
			id: "value-ramp",
			title: "A fill that colors by its value",
			description: "Set `ramp` to color the fill along a scale by its own value instead of a flat tone: `solid` (the default) samples one color at the current value, so a busier bar reads hotter; `ramp-mode=\"gradient\"` sweeps the whole scale as pure CSS. Both track the theme's own hues, so the ramp restyles with the algorithm.",
			source: { html: rampHtmlExample, svelte: rampSvelteExample, astro: rampAstroExample },
		},
		{
			id: "ring-as-frame",
			title: "A ring as a frame",
			description: "A circular meter sized to its container reads as a frame rather than a widget. `track=\"none\"` drops the groove (an always-on rail around a portrait reads as a border, not an empty meter), `--xtyle-progress-size` takes the diameter off the `size` scale, and `thickness` sets the band weight independent of that diameter, so a large ring can stay thin. Both variants expose `::part(track)`, so a mod or an app can reach the groove either way.",
			source: { html: frameHtmlExample, svelte: frameSvelteExample, astro: frameAstroExample },
		},
	],
};
