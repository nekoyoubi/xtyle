import type { ComponentManifest } from "./types.js";
import {
	FULL_TONES,
	NUMBER_CURRENCY_DISPLAYS,
	NUMBER_FORMATS,
	NUMBER_SIGNS,
	NUMBER_UNIT_DISPLAYS,
} from "../vocab.js";

const htmlExample = `<xtyle-number-format value="1234567.891"></xtyle-number-format>
<xtyle-number-format value="1299.5" format="currency" currency="USD"></xtyle-number-format>
<xtyle-number-format value="0.4237" format="percent" decimals="1"></xtyle-number-format>
<xtyle-number-format value="2450000" format="compact"></xtyle-number-format>
<xtyle-number-format value="512" format="unit" unit="kilobyte" unit-display="long"></xtyle-number-format>
<xtyle-number-format value="1299.5" format="currency" currency="EUR" locale="de-DE"></xtyle-number-format>`;

const svelteExample = `<script lang="ts">
	import { NumberFormat } from "@xtyle/svelte";

	let revenue = $state(1299.5);
</script>

<NumberFormat value={1234567.891} />
<NumberFormat value={revenue} format="currency" currency="USD" />
<NumberFormat value={0.4237} format="percent" decimals={1} />
<NumberFormat value={2450000} format="compact" />
<NumberFormat value={512} format="unit" unit="kilobyte" unitDisplay="long" />
<NumberFormat value={revenue} format="currency" currency="EUR" locale="de-DE" />`;

const astroExample = `---
import NumberFormat from "@xtyle/astro/NumberFormat.astro";
---

<NumberFormat value={1234567.891} />
<NumberFormat value={1299.5} format="currency" currency="USD" />
<NumberFormat value={0.4237} format="percent" decimals={1} />
<NumberFormat value={2450000} format="compact" />
<NumberFormat value={512} format="unit" unit="kilobyte" unitDisplay="long" />
<NumberFormat value={1299.5} format="currency" currency="EUR" locale="de-DE" />`;

const deltaHtmlExample = `<xtyle-number-format value="0.042" format="percent" decimals="1" sign="exceptZero" tone="success"></xtyle-number-format>
<xtyle-number-format value="-0.018" format="percent" decimals="1" sign="exceptZero" tone="danger"></xtyle-number-format>
<xtyle-number-format value="" fallback="n/a"></xtyle-number-format>`;

const deltaSvelteExample = `<script lang="ts">
	import { NumberFormat } from "@xtyle/svelte";
</script>

<NumberFormat value={0.042} format="percent" decimals={1} sign="exceptZero" tone="success" />
<NumberFormat value={-0.018} format="percent" decimals={1} sign="exceptZero" tone="danger" />
<NumberFormat value={null} fallback="n/a" />`;

const deltaAstroExample = `---
import NumberFormat from "@xtyle/astro/NumberFormat.astro";
---

<NumberFormat value={0.042} format="percent" decimals={1} sign="exceptZero" tone="success" />
<NumberFormat value={-0.018} format="percent" decimals={1} sign="exceptZero" tone="danger" />
<NumberFormat value={null} fallback="n/a" />`;

const partsExample = `<!-- a mod's number-format fill reads bindings.parts and wraps each piece, so the currency symbol and the cents style on their own -->
<xtyle-number-format value="1234.5" format="currency" currency="EUR"></xtyle-number-format>

<script type="module">
	import { formatNumberParts } from "@xtyle/core";
	const parts = formatNumberParts(1234.5, { format: "currency", currency: "EUR", locale: "en-US" });
	console.log(parts.map((part) => part.type).join(" "));
</script>`;

export const numberFormatManifest: ComponentManifest = {
	id: "number-format",
	name: "Number Format",
	category: "content",
	since: "0.13.0",
	keywords: ["number", "currency", "money", "percent", "percentage", "compact", "unit", "locale", "intl", "format"],
	seeAlso: ["stat", "table", "text"],
	summary: "A number formatted for its locale: decimal, currency, percent, compact, or a unit.",
	description:
		"NumberFormat displays one number through `Intl.NumberFormat`, so the grouping, the decimal mark, the currency symbol, and the unit all follow the reader's locale rather than whatever the source wrote. `format` picks the shape: `decimal` (the default), `currency` (with an ISO 4217 `currency`), `percent`, `compact` (`2.5M`), or `unit` (any unit Intl sanctions, such as `kilobyte`, `celsius`, or `kilometer-per-hour`). `percent` follows Intl's semantics, so `0.42` reads `42%`; pass the fraction, not the percentage. `decimals` fixes the fraction digits, and `min-decimals` / `max-decimals` override it on either side. `sign` controls when a sign shows, which is what a delta wants (`exceptZero`). The locale comes from `locale`, then the nearest `lang` attribute up the tree, then the runtime default. Figures are tabular by default so a column of them aligns, and an optional `tone` inks the number for a gain or a loss. It exists as an element, not only the `formatNumber` helper, because a fill or a j5ml fragment can place a component but cannot call a function. An empty or non-numeric `value` renders `fallback`, and an invalid currency, unit, or locale warns once and falls back to plain decimal formatting rather than throwing. A fill receives the result twice: `formatted`, the whole string, and `parts`, the same output split by `formatToParts` into typed pieces (`currency`, `minusSign`, `integer`, `fraction`, `unit`, …), so a mod can style the currency symbol or the cents on their own. `formatNumberParts` returns those pieces outside the element.",
	bindings: ["html", "svelte", "astro"],
	render: "auto",
	exposedParts: ["number"],
	anatomy: [
		{
			name: "number",
			description: "The formatted figure: a `<data>` element whose `value` carries the raw number and whose text is the formatted string.",
			selector: ".xtyle-number-format",
			tokens: FULL_TONES.map((t) => `--${t}-vivid`),
		},
	],
	props: [
		{
			name: "value",
			type: "number | string",
			description: "The number to display. A string is parsed with `Number`; an empty or non-numeric value renders `fallback`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "format",
			type: "NumberFormatStyle",
			default: "decimal",
			description:
				"The shape of the output: `decimal`, `percent` (Intl semantics, so `0.42` reads `42%`), `currency`, `compact` (Intl's compact notation, `2.5M`), or `unit`.",
			bindings: ["html", "svelte", "astro"],
			options: [...NUMBER_FORMATS],
		},
		{
			name: "currency",
			type: "string",
			default: "USD",
			description: "An ISO 4217 currency code, read when `format` is `currency`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "currencyDisplay",
			type: "NumberCurrencyDisplay",
			default: "symbol",
			description: "How the currency is named: `symbol` (`$`), `narrowSymbol`, `code` (`USD`), or `name` (`US dollars`).",
			bindings: ["html", "svelte", "astro"],
			options: [...NUMBER_CURRENCY_DISPLAYS],
		},
		{
			name: "unit",
			type: "string",
			description: "A unit identifier Intl sanctions (`kilobyte`, `celsius`, `kilometer-per-hour`), read when `format` is `unit`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "unitDisplay",
			type: "NumberUnitDisplay",
			default: "short",
			description: "How the unit is written: `short` (`512 kB`), `long` (`512 kilobytes`), or `narrow` (`512kB`).",
			bindings: ["html", "svelte", "astro"],
			options: [...NUMBER_UNIT_DISPLAYS],
		},
		{
			name: "decimals",
			type: "number",
			description: "Fixes both the minimum and maximum fraction digits, 0 to 20.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "minDecimals",
			type: "number",
			description: "The minimum fraction digits. Wins over `decimals`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "maxDecimals",
			type: "number",
			description: "The maximum fraction digits. Wins over `decimals`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "sign",
			type: "NumberSign",
			default: "auto",
			description: "When the sign shows: `auto` (negatives only), `always`, `exceptZero` (the delta reading), or `never`.",
			bindings: ["html", "svelte", "astro"],
			options: [...NUMBER_SIGNS],
		},
		{
			name: "grouping",
			type: "boolean",
			default: "true",
			description: "Whether digit-group separators show. `grouping=\"false\"` turns them off, for an ID or a year.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "locale",
			type: "string",
			description: "A BCP 47 locale tag. When absent, the nearest `lang` attribute up the tree, then the runtime default.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "fallback",
			type: "string",
			default: '""',
			description: "The text shown when `value` is empty or not a number.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "tone",
			type: "NumberFormatTone",
			description: "Inks the number in a semantic role or named hue, the way a toned `Text` is inked. Omit to inherit the surrounding color.",
			bindings: ["html", "svelte", "astro"],
			options: [...FULL_TONES],
		},
		{
			name: "tabular",
			type: "boolean",
			default: "true",
			description: "Tabular figures, so a column of numbers aligns digit for digit. `tabular=\"false\"` switches to proportional figures.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "formatted",
			type: "string",
			readonly: true,
			description: "Read-only: the display string as it renders right now, the formatted number or the fallback text.",
			bindings: ["html"],
		},
		{
			name: "static",
			type: "boolean",
			default: "false",
			description: "Astro only: render the formatted number server-side and never load the runtime to hydrate it.",
			bindings: ["astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [],
	slots: [],
	consumedTokens: FULL_TONES.map((t) => `--${t}-vivid`),
	composition: [
		"Put figures in a `Table` column: tabular figures line the digits up without any extra styling.",
		"Pair a value with a toned `sign=\"exceptZero\"` percent for a delta, the shape `Stat` reads as a trend.",
		"Set `lang` once on a section and every NumberFormat inside it formats for that locale.",
	],
	a11y: [
		"Renders a `<data>` element: its `value` attribute carries the raw machine-readable number, and its text is what screen readers announce.",
		"The formatted text is a real string in the DOM, not a pseudo-element, so it is read, selected, and copied as written.",
		"A tone is color only; when a gain or a loss matters, let the sign carry it too (`sign=\"exceptZero\"`).",
	],
	examples: [
		{
			id: "formats",
			title: "Formats",
			description: "Decimal, currency, percent, compact, a unit, and a `de-DE` locale override on the same currency value.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "deltas-and-fallback",
			title: "Deltas and fallback",
			description: "`sign=\"exceptZero\"` and a tone for a change, and `fallback` for a missing value.",
			source: { html: deltaHtmlExample, svelte: deltaSvelteExample, astro: deltaAstroExample },
		},
		{
			id: "parts",
			title: "Parts for a mod",
			description: "A fill receives `parts` beside `formatted`, the same output split into typed pieces; `formatNumberParts` gives the same split outside the element.",
			source: { html: partsExample },
		},
	],
};
