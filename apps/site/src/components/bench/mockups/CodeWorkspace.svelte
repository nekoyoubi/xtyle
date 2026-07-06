<script lang="ts">
	import type { TokenRegister } from "@xtyle/core";
	import { Badge, Button, Code, Kbd, Tree } from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	const files = [
		{
			label: "src",
			value: "src",
			expanded: true,
			children: [
				{ label: "theme.ts", value: "theme.ts", selected: true },
				{ label: "tokens.ts", value: "tokens.ts" },
				{ label: "emit.ts", value: "emit.ts" },
			],
		},
		{
			label: "algorithms",
			value: "algorithms",
			children: [{ label: "brand.mod.ts", value: "brand.mod.ts" }],
		},
		{ label: "package.json", value: "package.json" },
	];

	const tabs = [
		{ id: "theme", name: "theme.ts" },
		{ id: "tokens", name: "tokens.ts" },
	];
	let active = $state("theme");

	const sources: Record<string, string> = {
		theme: `import { derive, emitCss } from "@xtyle/core";

const theme = derive("xtyle-default", {
  anchors: { bg: "#0b0d12", accent: "#5b8def" },
  knobs: { vibrancy: "loud", density: "compact" },
});

export const css = emitCss(theme);`,
		tokens: `export const seed = {
  bg: "#0b0d12",
  accent: "#5b8def",
} as const;

// every other token is derived from these two
// anchors, so a brand change re-threads the set.`,
	};
</script>

<MockFrame {register} title="xtyle Studio">
	<div class="ide">
		<aside class="ide__rail" aria-label="Explorer">
			<span class="ide__rail-head">Explorer</span>
			<Tree items={files} label="Project files" />
		</aside>

		<div class="ide__main">
			<div class="ide__tabs" role="tablist" aria-label="Open files">
				{#each tabs as t (t.id)}
					<button
						class="ide__tab"
						class:ide__tab--active={active === t.id}
						role="tab"
						aria-selected={active === t.id}
						onclick={() => (active = t.id)}>{t.name}</button
					>
				{/each}
				<span class="ide__tabs-spacer"></span>
				<Button variant="solid" size="xs">Run</Button>
			</div>

			<div class="ide__editor">
				<Code lang="ts" code={sources[active]} lineNumbers highlight={active === "theme" ? "3-6" : undefined} />
			</div>

			<footer class="ide__status">
				<Badge size="sm" tone="success" dot>main</Badge>
				<span class="ide__status-item">Ln 4, Col 18</span>
				<span class="ide__status-item">Spaces: 2</span>
				<span class="ide__status-item">UTF-8</span>
				<span class="ide__status-spacer"></span>
				<span class="ide__hint">Search <Kbd size="sm">Ctrl</Kbd><Kbd size="sm">K</Kbd></span>
			</footer>
		</div>
	</div>
</MockFrame>

<style>
	.ide {
		display: grid;
		grid-template-columns: minmax(0, 12rem) minmax(0, 1fr);
		width: 100%;
		min-height: 22rem;
	}

	.ide__rail {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-3);
		background: var(--bg-1);
		border-right: var(--border-thin) solid var(--line);
	}

	.ide__rail-head {
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--fg-2);
	}

	.ide__main {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.ide__tabs {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-2) var(--space-3);
		border-bottom: var(--border-thin) solid var(--line);
		background: var(--surface-overlay);
	}

	.ide__tab {
		appearance: none;
		border: none;
		background: transparent;
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--fg-2);
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-sm);
		cursor: pointer;
	}

	.ide__tab--active {
		color: var(--fg-0);
		background: var(--bg-1);
	}

	.ide__tabs-spacer {
		flex: 1;
	}

	.ide__editor {
		flex: 1;
		min-height: 0;
		padding: var(--space-3);
		overflow: auto;
	}

	.ide__status {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2) var(--space-3);
		border-top: var(--border-thin) solid var(--line);
		background: var(--bg-1);
		font-size: var(--text-xs);
		color: var(--fg-2);
	}

	.ide__status-item {
		font-variant-numeric: tabular-nums;
	}

	.ide__status-spacer {
		flex: 1;
	}

	.ide__hint {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
	}
</style>
