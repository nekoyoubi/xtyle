<script lang="ts">
	import type { Algorithm, TokenLineageNode, TokenRegister } from "@xtyle/core";
	import { auditRegister, clampToGamut, coverComponents, toOklchColor } from "@xtyle/core";
	import { isColorToken } from "./tokens.js";
	import type { BenchState } from "./state.js";
	import { anchorsToConstraints, toDeriveKnobs } from "./state.js";

	interface Props {
		register: TokenRegister;
		algorithm: Algorithm;
		bench: BenchState;
		/** Which inspector to show — `contrast` | `coverage` | `gamut` | `graph` (driven by the report sub-bar). */
		panel: string;
	}

	let { register, algorithm, bench, panel }: Props = $props();

	const audit = $derived(auditRegister(register));
	const contrastRows = $derived(
		audit.entries.map((e) => ({
			label: `${e.fg.replace(/^--/, "")} on ${e.bg.replace(/^--/, "")}`,
			ratio: e.ratio,
			aa: e.tier !== "fail",
			aaa: e.tier === "AAA",
			fg: e.fgValue,
			bg: e.bgValue,
		})),
	);

	const coverage = $derived(coverComponents(register));
	const coveredCount = $derived(coverage.filter((c) => c.covered).length);

	/** Clamp pressure: a color whose chroma already sits at the sRGB ceiling for
	 * its lightness and hue is one the algorithm wanted more saturated than the
	 * gamut allows. The emitted hex is honest; this flags where it was capped. */
	function clampPressure(value: string): number {
		try {
			const o = toOklchColor(value);
			if (o.c < 0.02) return 0;
			const maxC = clampToGamut({ l: o.l, c: 1, h: o.h, alpha: 1 }).c;
			return o.c >= maxC - 0.004 ? maxC : 0;
		} catch {
			return 0;
		}
	}

	const gamutWarnings = $derived(
		Object.entries(register)
			.filter(([name]) => isColorToken(name))
			.map(([name, value]) => ({ name, value, ceiling: clampPressure(value) }))
			.filter((w) => w.ceiling > 0),
	);

	const lineage = $derived<TokenLineageNode[]>(safeLineage());

	function safeLineage(): TokenLineageNode[] {
		try {
			return algorithm.lineage({
				knobs: toDeriveKnobs(bench.knobs),
				constraints: { ...anchorsToConstraints(bench.anchors), ...bench.overrides },
			});
		} catch {
			return [];
		}
	}

	let graphFilter = $state("");
	const graphRows = $derived(
		lineage
			.filter((n) => n.refs && n.refs.length)
			.filter((n) => !graphFilter || n.name.includes(graphFilter))
			.slice(0, 200),
	);
</script>

<div class="bench-inspectors">
	<div class="bench-insp__body">
		{#if panel === "contrast"}
			<p class="bench-insp__lead x-caption">
				<code>auditRegister()</code> grades xtyle's canonical text/fill pairs:
				<strong class:xtyle-text-success-text={audit.passes} class:xtyle-text-warn-text={!audit.passes}>{audit.tallies.AAA} AAA · {audit.tallies.AA} AA · {audit.tallies.fail} fail</strong>,
				weakest {audit.worst.toFixed(2)}.
			</p>
			<ul class="bench-contrast">
				{#each contrastRows as row (row.label)}
					<li class="bench-contrast__row">
						<span class="bench-contrast__chip" style={`background:${row.bg};color:${row.fg};`}>Aa</span>
						<span class="bench-contrast__label">{row.label}</span>
						<span class="bench-contrast__ratio">{row.ratio.toFixed(2)}</span>
						<span class="bench-tag" class:bench-tag--ok={row.aa} class:bench-tag--bad={!row.aa}>AA</span>
						<span class="bench-tag" class:bench-tag--ok={row.aaa} class:bench-tag--muted={!row.aaa}>AAA</span>
					</li>
				{/each}
			</ul>
		{:else if panel === "coverage"}
			<p class="bench-insp__lead x-caption">
				<strong class:xtyle-text-success-text={coveredCount === coverage.length} class:xtyle-text-warn-text={coveredCount !== coverage.length}>{coveredCount}/{coverage.length}</strong>
				components fully covered by this register.
			</p>
			<ul class="bench-coverage">
				{#each coverage as comp (comp.id)}
					<li class="bench-coverage__row">
						<span class="bench-dot" class:bench-dot--ok={comp.covered} class:bench-dot--bad={!comp.covered}></span>
						<span class="bench-coverage__id">{comp.id}</span>
						{#if !comp.covered}
							<span class="bench-coverage__missing">missing {comp.missing.join(", ")}</span>
						{/if}
					</li>
				{/each}
			</ul>
		{:else if panel === "gamut"}
			<p class="bench-insp__lead x-caption">
				{#if gamutWarnings.length === 0}
					No token is clamped against the sRGB chroma ceiling — there's saturation headroom everywhere.
				{:else}
					{gamutWarnings.length} token{gamutWarnings.length === 1 ? "" : "s"} sit at the sRGB chroma ceiling; the algorithm asked for more saturation than the gamut allows, so these were clamped.
				{/if}
			</p>
			{#if gamutWarnings.length}
				<ul class="bench-gamut">
					{#each gamutWarnings as w (w.name)}
						<li class="bench-gamut__row">
							<span class="bench-gamut__chip" style={`background:${w.value};`}></span>
							<span class="bench-gamut__name">{w.name}</span>
							<span class="bench-gamut__value">{w.value}</span>
						</li>
					{/each}
				</ul>
			{/if}
		{:else}
			<p class="bench-insp__lead x-caption">The honest derivation graph — each token names what it derives from.</p>
			<input
				class="bench-graph__filter"
				type="search"
				placeholder="Filter tokens…"
				bind:value={graphFilter}
				aria-label="Filter token graph" />
			<ul class="bench-graph">
				{#each graphRows as node (node.name)}
					<li class="bench-graph__row">
						<span class="bench-graph__name">{node.name}</span>
						<span class="bench-graph__arrow" aria-hidden="true">←</span>
						<span class="bench-graph__refs">{node.refs?.join(", ")}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style>
	.bench-inspectors {
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow: hidden;
	}

	.bench-insp__body {
		overflow-y: auto;
	}

	.bench-insp__lead {
		margin: 0 0 var(--space-3);
	}

	.bench-contrast,
	.bench-coverage,
	.bench-gamut,
	.bench-graph {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.bench-contrast__row {
		display: grid;
		grid-template-columns: 2rem minmax(0, 1fr) auto auto auto;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
	}

	.bench-contrast__chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 1.6rem;
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		border: var(--border-thin) solid var(--line);
	}

	.bench-contrast__label {
		color: var(--fg-1);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.bench-contrast__ratio {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--fg-2);
	}

	.bench-tag {
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		padding: 0 var(--space-2);
		border-radius: var(--radius-full);
		background: var(--neutral-bg);
		color: var(--neutral-text);
	}

	.bench-tag--ok {
		background: var(--success-bg);
		color: var(--success-text);
	}

	.bench-tag--bad {
		background: var(--danger-bg);
		color: var(--danger-text);
	}

	.bench-tag--muted {
		opacity: 0.55;
	}

	.bench-coverage__row,
	.bench-gamut__row,
	.bench-graph__row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
	}

	.bench-dot {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: var(--radius-full);
		flex: none;
	}

	.bench-dot--ok {
		background: var(--success);
	}

	.bench-dot--bad {
		background: var(--danger);
	}

	.bench-coverage__id {
		color: var(--fg-1);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
	}

	.bench-coverage__missing {
		color: var(--warn-text);
		font-size: var(--text-xs);
	}

	.bench-gamut__chip {
		width: 1.6rem;
		height: 1.6rem;
		border-radius: var(--radius-sm);
		border: var(--border-thin) solid var(--line);
		flex: none;
	}

	.bench-gamut__name,
	.bench-graph__name,
	.bench-graph__refs {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
	}

	.bench-gamut__name {
		color: var(--fg-1);
	}

	.bench-gamut__value {
		color: var(--fg-3);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
	}

	.bench-graph__filter {
		width: 100%;
		margin-bottom: var(--space-3);
		background: var(--field-bg);
		color: var(--fg-0);
		border: var(--border-thin) solid var(--field-border);
		border-radius: var(--radius-md);
		padding: var(--space-2) var(--space-3);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
	}

	.bench-graph__row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1.4fr);
		gap: var(--space-2);
	}

	.bench-graph__name {
		color: var(--accent-text);
	}

	.bench-graph__arrow {
		color: var(--fg-3);
	}

	.bench-graph__refs {
		color: var(--fg-2);
		word-break: break-all;
	}
</style>
