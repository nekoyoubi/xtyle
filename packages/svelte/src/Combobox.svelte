<script lang="ts">
	import "@xtyle/core/elements/combobox.js";
	import type { Size } from "@xtyle/core";
	import type { ComboboxFilter } from "@xtyle/core/elements";

	type FieldOption = { value: string; label?: string };

	interface Props {
		label?: string;
		name?: string;
		placeholder?: string;
		/** The selected value in the single-select posture. Bindable. */
		value?: string;
		/** Every selected value — the multi-select surface. Bindable. */
		values?: string[];
		/** The same option contract Field and Select speak: a `string[]` or a `{ value, label }[]`. */
		options?: ReadonlyArray<string | FieldOption>;
		/** Pick many: chips in the control, Backspace to take the last one back, a clear-all. */
		multiple?: boolean;
		/** How the typed query narrows the list. `none` hands the filtering to the consumer (the async path). */
		filter?: ComboboxFilter;
		/** Accept a value the list never offered: Enter commits whatever was typed. */
		allowCustom?: boolean;
		clearable?: boolean;
		/** Whether the listbox is open. Bindable — a light-dismiss or an Escape clears it back out. */
		open?: boolean;
		size?: Size;
		disabled?: boolean;
		readonly?: boolean;
		invalid?: boolean;
		required?: boolean;
		description?: string;
		error?: string;
		emptyText?: string;
		ariaLabel?: string;
		/** Fires on every keystroke. Read `query` off the element to drive an async fetch. */
		oninput?: (event: Event) => void;
		/** Fires when the selection changes. */
		onchange?: (event: Event) => void;
		/** Fires when a value is picked or unpicked, with `{ value, label, selected }`. */
		onselect?: (event: CustomEvent<{ value: string; label: string; selected: boolean }>) => void;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		label = "",
		name,
		placeholder = "",
		value = $bindable(""),
		values = $bindable([]),
		options,
		multiple = false,
		filter = "contains",
		allowCustom = false,
		clearable = false,
		open = $bindable(false),
		size = "md",
		disabled = false,
		readonly = false,
		invalid = false,
		required = false,
		description = "",
		error = "",
		emptyText,
		ariaLabel,
		oninput,
		onchange,
		onselect,
		...rest
	}: Props = $props();

	type ComboboxElement = HTMLElement & {
		options: ReadonlyArray<string | FieldOption>;
		value: string;
		values: string[];
		query: string;
		open: boolean;
	};

	let host: ComboboxElement | undefined = $state();

	// options is an array, not a string attribute: it goes on as a property, like Field's does
	$effect(() => {
		if (host) host.options = options ?? [];
	});

	function handleChange(event: Event): void {
		const el = event.currentTarget as ComboboxElement;
		values = [...el.values];
		value = el.value;
		onchange?.(event);
	}

	function handleOpen(): void {
		open = true;
	}

	function handleClose(): void {
		open = false;
	}
</script>

<xtyle-combobox
	bind:this={host}
	{...rest}
	{label}
	name={name || undefined}
	{placeholder}
	value={multiple ? undefined : value || undefined}
	values={multiple ? JSON.stringify(values) : undefined}
	{size}
	{filter}
	multiple={multiple || undefined}
	allow-custom={allowCustom || undefined}
	clearable={clearable || undefined}
	open={open || undefined}
	disabled={disabled || undefined}
	readonly={readonly || undefined}
	invalid={invalid || undefined}
	required={required || undefined}
	{description}
	{error}
	empty-text={emptyText}
	aria-label={ariaLabel ?? (rest["aria-label"] as string | undefined)}
	oninput={oninput}
	onchange={handleChange}
	onselect={onselect as (event: Event) => void}
	onopen={handleOpen}
	onclose={handleClose}
></xtyle-combobox>
