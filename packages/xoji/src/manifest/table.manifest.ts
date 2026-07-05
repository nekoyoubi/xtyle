import type { ComponentManifest } from "./types.js";

const htmlExample = `<xoji-table variant="striped" hover sticky aria-label="Recent orders">
	<table>
		<caption class="xoji-table__caption">Recent orders</caption>
		<thead class="xoji-table__head">
			<tr class="xoji-table__row">
				<th class="xoji-table__header-cell xoji-table__header-cell--sortable" scope="col" aria-sort="ascending">
					<span class="xoji-table__header-content">Order
						<span class="xoji-table__sort" aria-hidden="true">
							<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 8l5 6H7l5-6Z" /></svg>
						</span>
					</span>
				</th>
				<th class="xoji-table__header-cell" scope="col">Customer</th>
				<th class="xoji-table__header-cell" scope="col">Total</th>
			</tr>
		</thead>
		<tbody class="xoji-table__body">
			<tr class="xoji-table__row">
				<td class="xoji-table__cell">#1024</td>
				<td class="xoji-table__cell">Ada Lovelace</td>
				<td class="xoji-table__cell">$42.00</td>
			</tr>
			<tr class="xoji-table__row">
				<td class="xoji-table__cell">#1025</td>
				<td class="xoji-table__cell">Alan Turing</td>
				<td class="xoji-table__cell">$17.50</td>
			</tr>
		</tbody>
	</table>
</xoji-table>`;

const svelteExample = `<script lang="ts">
	import { Table } from "@xoji/svelte";

	let sort: "ascending" | "descending" = $state("ascending");
</script>

<Table variant="striped" hover sticky ariaLabel="Recent orders">
	<table>
		<caption class="xoji-table__caption">Recent orders</caption>
		<thead class="xoji-table__head">
			<tr class="xoji-table__row">
				<th
					class="xoji-table__header-cell xoji-table__header-cell--sortable"
					scope="col"
					aria-sort={sort}
					tabindex="0"
					onclick={() => (sort = sort === "ascending" ? "descending" : "ascending")}
				>
					<span class="xoji-table__header-content">Order
						<span class="xoji-table__sort" aria-hidden="true">
							<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 8l5 6H7l5-6Z" /></svg>
						</span>
					</span>
				</th>
				<th class="xoji-table__header-cell" scope="col">Customer</th>
				<th class="xoji-table__header-cell" scope="col">Total</th>
			</tr>
		</thead>
		<tbody class="xoji-table__body">
			<tr class="xoji-table__row">
				<td class="xoji-table__cell">#1024</td>
				<td class="xoji-table__cell">Ada Lovelace</td>
				<td class="xoji-table__cell">$42.00</td>
			</tr>
		</tbody>
	</table>
</Table>`;

const astroExample = `---
import { Table } from "@xoji/astro";
---

<Table variant="bordered" size="compact" aria-label="Pricing">
	<table>
		<thead class="xoji-table__head">
			<tr class="xoji-table__row">
				<th class="xoji-table__header-cell" scope="col">Plan</th>
				<th class="xoji-table__header-cell" scope="col">Price</th>
			</tr>
		</thead>
		<tbody class="xoji-table__body">
			<tr class="xoji-table__row">
				<th class="xoji-table__header-cell" scope="row">Starter</th>
				<td class="xoji-table__cell">$0</td>
			</tr>
			<tr class="xoji-table__row">
				<th class="xoji-table__header-cell" scope="row">Pro</th>
				<td class="xoji-table__cell">$12</td>
			</tr>
		</tbody>
	</table>
</Table>`;

export const tableManifest: ComponentManifest = {
	id: "table",
	name: "Table",
	category: "content",
	summary: "A styled data table around native `<table>`: zebra, bordered, hover, sticky header, and a sortable-header affordance.",
	description:
		"Table dresses a native `<table>` in xoji styling without taking over its markup. The binding is a thin wrapper that relays consumer-authored rows: you write the real `<thead>`/`<tbody>`/`<tr>`/`<th>`/`<td>` and tag them with the `xoji-table__*` part classes, and the wrapper supplies the scroll container, variant, size, hover, and sticky behavior. Variants `default`/`striped`/`bordered` set the row and cell chrome; `compact`/`normal` sizes set the cell padding. The sortable-header affordance renders a sort glyph and exposes an `aria-sort` hook on the header cell; the engine is presentation-only, so the consumer wires the actual sort and toggles `aria-sort` (`ascending`/`descending`/`none`), and the glyph rotates to match. `scope` belongs on every header cell so screen readers associate it with its row or column.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "wrap",
			description: "The horizontal-scroll container that clips the table to its width and rounds the corners.",
			selector: ".xoji-table-wrap",
			tokens: ["--radius-lg"],
		},
		{
			name: "table",
			description: "The `<table>` itself: collapsed borders, surface background, base typography.",
			selector: ".xoji-table",
			tokens: ["--font-sans", "--text-body", "--leading-normal", "--fg-0", "--bg-1"],
		},
		{
			name: "caption",
			description: "An optional `<caption>` rendered above the table as a muted label.",
			selector: ".xoji-table__caption",
			tokens: ["--space-2", "--space-4", "--text-sm", "--fg-2"],
		},
		{
			name: "head",
			description: "The `<thead>` group; its last header row carries the heavier under-rule.",
			selector: ".xoji-table__head",
			tokens: ["--border-normal", "--line-2"],
		},
		{
			name: "body",
			description: "The `<tbody>` group that zebra striping and hover target.",
			selector: ".xoji-table__body",
		},
		{
			name: "row",
			description: "A `<tr>`: the unit zebra striping and row hover apply to.",
			selector: ".xoji-table__row",
		},
		{
			name: "header-cell",
			description: "A `<th>`: semibold ink on a tint, with `scope` and an optional sortable affordance.",
			selector: ".xoji-table__header-cell",
			tokens: ["--space-3", "--space-4", "--weight-semibold", "--fg-1", "--bg-2", "--line"],
		},
		{
			name: "cell",
			description: "A `<td>`: the standard data cell with a row-separating bottom rule.",
			selector: ".xoji-table__cell",
			tokens: ["--space-3", "--space-4", "--line"],
		},
		{
			name: "sort",
			description: "The decorative sort glyph inside a sortable header; rotates and colors per `aria-sort`.",
			selector: ".xoji-table__sort",
			tokens: ["--fg-3", "--accent-text", "--duration-fast", "--ease-standard"],
		},
		{
			name: "footer-cell",
			description: "A `<td>`/`<th>` in `<tfoot>`: a summary cell on a tint above a heavy top rule.",
			selector: ".xoji-table__footer-cell",
			tokens: ["--space-3", "--space-4", "--weight-medium", "--fg-1", "--bg-2", "--border-normal", "--line-2"],
		},
	],
	props: [
		{
			name: "variant",
			type: "TableVariant",
			default: "default",
			description: "Row and cell chrome. `striped` zebra-stripes body rows; `bordered` outlines every cell.",
			bindings: ["html", "svelte", "astro"],
			options: ["default", "striped", "bordered"],
		},
		{
			name: "size",
			type: "TableSize",
			default: "normal",
			description: "Cell density. `compact` tightens the cell padding.",
			bindings: ["html", "svelte", "astro"],
			options: ["normal", "compact"],
		},
		{
			name: "hover",
			type: "boolean",
			default: "false",
			description: "Highlights the body row under the pointer with the hover state tint.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "sticky",
			type: "boolean",
			default: "false",
			description: "Pins the header cells to the top of the scroll container while the body scrolls.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "ariaLabel",
			type: "string",
			description: "Accessible name for the table. Required when there is no `<caption>`; the binding warns when both are missing.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [
		{
			name: "default",
			description: "Plain rows separated by a bottom rule; no class needed.",
			className: "xoji-table",
		},
		{
			name: "striped",
			description: "Alternating body-row backgrounds for scannability.",
			className: "xoji-table--striped",
			tokens: ["--bg-1", "--bg-2"],
		},
		{
			name: "bordered",
			description: "A full grid; every cell gets a border.",
			className: "xoji-table--bordered",
			tokens: ["--line", "--border-thin", "--line-2", "--border-normal"],
		},
	],
	sizes: [
		{ name: "normal", description: "Default density.", className: "xoji-table", isDefault: true },
		{ name: "compact", description: "Tighter cell padding.", className: "xoji-table--compact" },
	],
	states: [
		{
			name: "hover",
			description: "Pointer over a body row (with `hover`); the row paints the hover tint.",
			selector: ".xoji-table--hover .xoji-table__body .xoji-table__row:hover",
			tokens: ["--state-hover"],
		},
		{
			name: "sortable",
			description: "A sortable header cell: pointer cursor and a hover tint behind the label.",
			selector: ".xoji-table__header-cell--sortable",
			tokens: ["--state-hover", "--duration-fast", "--ease-standard"],
		},
		{
			name: "sorted",
			description: "A header cell with `aria-sort` set; the glyph colors and points up (asc) or down (desc).",
			selector: '.xoji-table__header-cell[aria-sort="ascending"]',
			tokens: ["--accent-text"],
		},
		{
			name: "focus-visible",
			description: "Keyboard focus on a sortable header: an inset token ring, plus a transparent outline that becomes real in forced-colors mode.",
			selector: ".xoji-table__header-cell--sortable:focus-visible",
			tokens: ["--border-normal", "--border-thick", "--ring"],
		},
	],
	slots: [
		{
			name: "default",
			description: "The consumer-authored `<table>` (with `xoji-table__*` part classes on its rows and cells).",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--radius-lg",
		"--font-sans",
		"--text-body",
		"--text-sm",
		"--leading-normal",
		"--fg-0",
		"--fg-1",
		"--fg-2",
		"--fg-3",
		"--bg-1",
		"--bg-2",
		"--space-1",
		"--space-2",
		"--space-3",
		"--space-4",
		"--weight-medium",
		"--weight-semibold",
		"--border-thin",
		"--border-normal",
		"--border-thick",
		"--line",
		"--line-2",
		"--accent-text",
		"--ring",
		"--state-hover",
		"--duration-fast",
		"--ease-standard",
	],
	composition: [
		"Pair header cells with the sortable affordance and wire sorting yourself: toggle `aria-sort` between `ascending`/`descending`/`none`; the glyph follows.",
		"Drop a Badge or Avatar into any cell for status pills and row identities.",
		"Wrap the table in a Card for an elevated, contained data surface.",
	],
	a11y: [
		"Built on a native `<table>` with `<thead>`/`<tbody>`/`<tfoot>`, `<th scope>`, and an optional `<caption>`. Row/column semantics come for free.",
		"Every header cell SHOULD carry `scope` (`col` or `row`) so assistive tech associates data cells correctly.",
		"A table with no `<caption>` needs an `aria-label`; the binding warns at runtime when both are missing.",
		"Sortable headers expose state via `aria-sort` (`ascending`/`descending`/`none`), not via the glyph, which is `aria-hidden`.",
		"The sortable header is keyboard-focusable; focus shows a token ring plus a transparent outline the forced-colors base rule promotes to a real system outline.",
	],
	examples: [
		{
			id: "variants-and-sorting",
			title: "Variants, sticky header, and a sortable column",
			description: "Striped rows with hover and a sticky, sortable header; the consumer supplies rows and owns the sort.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};
