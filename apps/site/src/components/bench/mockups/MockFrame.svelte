<script lang="ts">
	import type { TokenRegister } from "@xtyle/core";
	import { apply } from "@xtyle/core/dom";
	import { Badge } from "@xtyle/svelte";
	import type { Snippet } from "svelte";

	interface Props {
		register: TokenRegister;
		title: string;
		children: Snippet;
	}

	let { register, title, children }: Props = $props();

	let root: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (root) apply(register, { target: root });
	});
</script>

<div class="mock" bind:this={root}>
	<header class="mock__bar">
		<span class="mock__dot" aria-hidden="true"></span>
		<span class="mock__dot" aria-hidden="true"></span>
		<span class="mock__dot" aria-hidden="true"></span>
		<span class="mock__title">{title}</span>
		<span class="mock__spacer"></span>
		<Badge tone="info">live</Badge>
	</header>
	<div class="mock__body">
		{@render children()}
	</div>
</div>

<style>
	.mock {
		background: var(--bg-0);
		color: var(--fg-0);
		font-family: var(--font-sans);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow: var(--elevation-3);
	}

	.mock__bar {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		background: var(--surface-overlay);
		border-bottom: var(--border-thin) solid var(--line);
	}

	.mock__dot {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: var(--radius-full);
		background: var(--line-2);
	}

	.mock__title {
		margin-left: var(--space-2);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--fg-1);
	}

	.mock__spacer {
		flex: 1;
	}

	.mock__body {
		min-height: 0;
	}
</style>
