<script lang="ts">
	import "@xtyle/core/elements/number-format.js";
	import type { FullTone, NumberCurrencyDisplay, NumberFormatStyle, NumberSign, NumberUnitDisplay } from "@xtyle/core";

	interface Props {
		value?: number | string | null;
		format?: NumberFormatStyle;
		currency?: string;
		currencyDisplay?: NumberCurrencyDisplay;
		unit?: string;
		unitDisplay?: NumberUnitDisplay;
		decimals?: number;
		minDecimals?: number;
		maxDecimals?: number;
		sign?: NumberSign;
		grouping?: boolean;
		locale?: string;
		fallback?: string;
		tone?: FullTone;
		tabular?: boolean;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		value,
		format = "decimal",
		currency,
		currencyDisplay,
		unit,
		unitDisplay,
		decimals,
		minDecimals,
		maxDecimals,
		sign,
		grouping = true,
		locale,
		fallback,
		tone,
		tabular = true,
		...rest
	}: Props = $props();
</script>

<xtyle-number-format
	{...rest}
	value={value == null ? undefined : String(value)}
	{format}
	{currency}
	currency-display={currencyDisplay}
	{unit}
	unit-display={unitDisplay}
	decimals={decimals}
	min-decimals={minDecimals}
	max-decimals={maxDecimals}
	{sign}
	grouping={grouping ? undefined : "false"}
	{locale}
	{fallback}
	{tone}
	tabular={tabular ? undefined : "false"}
></xtyle-number-format>
