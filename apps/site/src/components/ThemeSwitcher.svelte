<script lang="ts">
	import {
		listThemeDocs,
		activeThemeId,
		setActiveTheme,
		ACTIVE_CHANGED_EVENT,
	} from "../lib/theme-active.js";
	import { ThemePicker } from "@xtyle/svelte";
	import type { PickerTheme } from "@xtyle/core/elements";

	const SHIPPED = "Default";

	let docs = $state(listThemeDocs());
	let activeId = $state<string | null>(null);

	function refresh(): void {
		docs = listThemeDocs();
		activeId = activeThemeId();
	}

	$effect(() => {
		refresh();
		const onChange = (): void => refresh();
		window.addEventListener(ACTIVE_CHANGED_EVENT, onChange);
		return () => window.removeEventListener(ACTIVE_CHANGED_EVENT, onChange);
	});

	/** The shipped theme leads the list, then everything built in the bench. A doc's recipe *is* an
	 * invocation, so it maps straight onto what the picker takes. */
	const themes = $derived<PickerTheme[]>([
		{ name: SHIPPED },
		...docs.map((doc) => ({
			name: doc.meta.name,
			algorithm: doc.recipe.algorithm,
			knobs: doc.recipe.knobs,
			constraints: doc.recipe.overrides,
		})),
	]);

	const value = $derived(docs.find((doc) => doc.id === activeId)?.meta.name ?? SHIPPED);

	function pick(detail: { value: string }): void {
		const doc = docs.find((d) => d.meta.name === detail.value);
		setActiveTheme(doc?.id ?? null);
		activeId = doc?.id ?? null;
	}
</script>

<ThemePicker
	{themes}
	{value}
	layout="menu"
	label="Active theme"
	minColWidth="8rem"
	empty="Build a theme in the Bench and it shows up here."
	onpick={pick}
/>
