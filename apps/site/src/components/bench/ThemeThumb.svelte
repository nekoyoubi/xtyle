<script lang="ts">
	import type { Algorithm } from "@xtyle/core";
	import { deriveRegister } from "../../lib/theme-store/recipe.js";
	import { renderThumbnailSvg } from "../../lib/theme-store/thumbnail.js";
	import type { ThemeDoc } from "../../lib/theme-store/types.js";

	interface Props {
		doc: ThemeDoc;
		algos?: Map<string, Algorithm> | null;
	}

	let { doc, algos = null }: Props = $props();

	const PLACEHOLDER: Record<string, string> = {
		"--body-bg": "#1a1c22",
		"--bg-0": "#22242b",
		"--bg-1": "#2c2f37",
		"--bg-2": "#383b44",
		"--line": "#3f424c",
		"--fg-0": "#9aa0ab",
		"--fg-2": "#6b7078",
		"--accent": "#5a5f6b",
		"--accent-2": "#6b7078",
		"--accent-fg": "#22242b",
		"--success": "#566",
		"--warn": "#665",
		"--danger": "#655",
		"--info": "#556",
	};

	const svg = $derived.by<string>(() => {
		const { register, error } = deriveRegister(doc.recipe, algos);
		return renderThumbnailSvg(error ? PLACEHOLDER : register);
	});
</script>

<div class="thumb" aria-hidden="true">
	{@html svg}
</div>

<style>
	.thumb {
		width: 100%;
		aspect-ratio: 16 / 10;
		border-radius: var(--radius-md);
		overflow: hidden;
		line-height: 0;
	}

	.thumb :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
