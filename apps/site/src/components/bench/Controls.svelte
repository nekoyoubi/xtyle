<script lang="ts">
	import type { Algorithm, TokenRegister } from "@xtyle/core";
	import { HUES, schemeOf } from "@xtyle/core";
	import type { BenchState, KnobControl, SchemeKnob } from "./state.js";
	import {
		ALGORITHMS,
		CUSTOM_ALGORITHM,
		CUSTOM_CODE_ALGORITHM,
		CUSTOM_CODE_SEED,
		CUSTOM_SPEC_SEED,
		knobControls,
	} from "./state.js";
	import { Accordion, ColorPicker } from "@xtyle/svelte";
	import { isColorToken, allGroups, contrastRefFor, tokenSearchTerms, tokenMeta } from "./tokens.js";

	interface Props {
		bench: BenchState;
		algorithm: Algorithm;
		register: TokenRegister;
		influence: Record<string, number>;
		onchange: (next: BenchState) => void;
	}

	let { bench, algorithm, register, influence, onchange }: Props = $props();

	/** The scheme the theme *actually* derives under, read off the resolved register rather than
	 * reconstructed from the inputs — so it holds whether the scheme came from the knob, a `--bg-0`
	 * override, or the algorithm's own default. A range knob seeds from this, which is what keeps
	 * switching `surfaceRamp` to "custom" from inverting the surface stack on a light theme. */
	const derivedScheme = $derived<SchemeKnob>(register["--bg-0"] ? schemeOf(register["--bg-0"]) : "dark");

	/** The rail's controls, built from the algorithm's own knob domains merged with site cosmetics — it
	 * never shows a dial the algorithm doesn't read (so `hour` stays with nxi-nite), and a novel
	 * algorithm's knob self-renders from its declared spec rather than vanishing for want of a UI entry. */
	const knobSpecs = $derived<KnobControl[]>(knobControls(algorithm, derivedScheme));

	let tokenFilter = $state("");

	function patch(mut: (s: BenchState) => void): void {
		const next: BenchState = {
			algorithm: bench.algorithm,
			anchors: { ...bench.anchors },
			knobs: { ...bench.knobs },
			overrides: { ...bench.overrides },
		};
		mut(next);
		onchange(next);
	}

	function isHex(value: string): boolean {
		return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
	}

	function setAlgorithm(id: string): void {
		patch((s) => {
			s.algorithm = id;
			if (id === CUSTOM_ALGORITHM && s.customSpec === undefined) s.customSpec = CUSTOM_SPEC_SEED;
			if (id === CUSTOM_CODE_ALGORITHM && s.customCode === undefined) s.customCode = CUSTOM_CODE_SEED;
		});
	}

	function setCustomSpec(text: string): void {
		patch((s) => (s.customSpec = text));
	}

	function setCustomCode(text: string): void {
		patch((s) => (s.customCode = text));
	}

	const bgScheme = $derived(
		bench.overrides["--bg-0"] && isHex(bench.overrides["--bg-0"])
			? schemeOf(bench.overrides["--bg-0"])
			: null,
	);
	const schemeConflict = $derived(
		bench.knobs.scheme != null && bgScheme !== null && bench.knobs.scheme !== bgScheme,
	);

	// A knob field is a `BenchKnobs` key for the blessed set; a novel algorithm's knob writes under its
	// own name through the same `Record<string, unknown>` channel, so the field is typed as a string.
	type KnobField = string;

	// `BenchKnobs` has no index signature, so reads and writes through a runtime field name need one
	// assertion — kept here rather than repeated at every call site.
	function knobsOf(s: BenchState): Record<string, unknown> {
		return s.knobs as Record<string, unknown>;
	}

	function knobValue(field: KnobField): string | number | undefined {
		return knobsOf(bench)[field] as string | number | undefined;
	}

	function setKnobNumber(field: KnobField, value: number): void {
		patch((s) => (knobsOf(s)[field] = value));
	}

	function toggleKnobNumber(field: KnobField, on: boolean, seed?: number): void {
		patch((s) => {
			if (on) knobsOf(s)[field] = seed ?? 0;
			else delete knobsOf(s)[field];
		});
	}

	function setKnobSelect(field: KnobField, value: string): void {
		patch((s) => {
			if (value) knobsOf(s)[field] = value;
			else delete knobsOf(s)[field];
		});
	}

	function setKnobText(field: KnobField, value: string): void {
		patch((s) => {
			if (value.trim()) knobsOf(s)[field] = value;
			else delete knobsOf(s)[field];
		});
	}

	function setOverride(name: string, value: string): void {
		patch((s) => (s.overrides[name] = value));
	}

	function clearOverride(name: string): void {
		patch((s) => delete s.overrides[name]);
	}

	function clearAllOverrides(): void {
		patch((s) => (s.overrides = {}));
	}

	const ACHROMATIC_HUES = new Set(["gray", "white", "black"]);
	const PALETTE_HUES = HUES.filter((hue) => !ACHROMATIC_HUES.has(hue));
	const PALETTE_STOPS = ["-subtle", "-muted", "-base", "-strong", "-contrast"];
	const paletteToken = (hue: string): string => `--color-${hue}`;
	const rampStop = (hue: string, stop: string): string =>
		register[`--color-${hue}${stop}`] ?? "transparent";

	const paletteCount = $derived(
		PALETTE_HUES.filter((hue) => bench.overrides[paletteToken(hue)] !== undefined).length,
	);

	function clearPalette(): void {
		patch((s) => {
			for (const hue of PALETTE_HUES) delete s.overrides[paletteToken(hue)];
		});
	}

	const groups = $derived(allGroups(register));
	const filteredGroups = $derived.by(() => {
		const query = tokenFilter.trim().toLowerCase();
		if (!query) return groups;
		return groups
			.map((g) =>
				// A query that matches the group's title keeps the whole group; otherwise each token is
				// matched against its full search text (name + category + synonyms).
				g.title.toLowerCase().includes(query)
					? g
					: { title: g.title, tokens: g.tokens.filter((t) => tokenSearchTerms(t, g.title).includes(query)) },
			)
			.filter((g) => g.tokens.length);
	});
	// Token groups are collapsed by default; the user expands what they want, and a live search
	// force-expands everything so matches are never hidden behind a closed section.
	let expandedGroups = $state<Set<string>>(new Set());
	const searching = $derived(tokenFilter.trim().length > 0);
	function toggleGroup(title: string): void {
		const next = new Set(expandedGroups);
		if (next.has(title)) next.delete(title);
		else next.add(title);
		expandedGroups = next;
	}

	// Non-color tokens hide their value behind a swatch the same way colors do; clicking it expands a
	// text editor as a second row, instead of cramming a textbox onto every line.
	let editingTokens = $state<Set<string>>(new Set());
	function toggleEditor(name: string): void {
		const next = new Set(editingTokens);
		if (next.has(name)) next.delete(name);
		else next.add(name);
		editingTokens = next;
	}

	/** Which kind of rendered preview a non-color token's swatch shows. */
	function nonColorKind(name: string): string {
		if (/^--border-/.test(name)) return "border";
		if (/^--radius-/.test(name)) return "radius";
		if (name === "--shadow" || /^--elevation-/.test(name)) return "shadow";
		if (/^--space-/.test(name)) return "space";
		if (/^--(text|font|weight|leading)-/.test(name)) return "type";
		return "other";
	}

	/** The inline style that renders a type token's "Aa" preview (size capped so it stays in the swatch). */
	function typeStyle(name: string): string {
		if (/^--text-/.test(name)) return `font-size: min(var(${name}), 0.95rem)`;
		if (/^--weight-/.test(name)) return `font-weight: var(${name}); font-size: 0.85rem`;
		if (/^--font-/.test(name)) return `font-family: var(${name}); font-size: 0.8rem`;
		return "font-size: 0.85rem";
	}
	const knobCount = $derived(Object.keys(bench.knobs).length);
	const overrideCount = $derived(Object.keys(bench.overrides).length);

	const ACC_SECTIONS = [
		{ value: "knobs", header: "Knobs", open: true },
		{ value: "palette", header: "Palette" },
		{ value: "tokens", header: "Tokens", open: true },
	];
</script>

<div class="bench-controls">
	<section class="bench-layer">
		<header class="bench-layer__head">
			<h3 class="bench-layer__title">Algorithm</h3>
			<span class="bench-layer__req">required</span>
		</header>
		<div class="bench-chips" role="group" aria-label="Algorithm">
			{#each ALGORITHMS as algo (algo.id)}
				<button
					type="button"
					class="bench-chip"
					class:bench-chip--active={bench.algorithm === algo.id}
					aria-pressed={bench.algorithm === algo.id}
					title={algo.blurb}
					onclick={() => setAlgorithm(algo.id)}>{algo.label}</button>
			{/each}
		</div>
		{#if bench.algorithm === CUSTOM_ALGORITHM}
			<div class="bench-spec">
				<label class="bench-field__label" for="bench-spec-editor">Algorithm spec</label>
				<p class="bench-layer__note x-caption">A <code>defineXtyleAlgorithm</code> spec; edit the JSON and the algorithm rebuilds live. Anchors and knobs below still layer on top.</p>
				<textarea
					id="bench-spec-editor"
					class="bench-spec__editor"
					spellcheck="false"
					autocapitalize="off"
					autocomplete="off"
					value={bench.customSpec ?? CUSTOM_SPEC_SEED}
					oninput={(e) => setCustomSpec((e.currentTarget as HTMLTextAreaElement).value)}
				></textarea>
			</div>
		{/if}
		{#if bench.algorithm === CUSTOM_CODE_ALGORITHM}
			<div class="bench-spec">
				<label class="bench-field__label" for="bench-code-editor">Algorithm code</label>
				<p class="bench-layer__note x-caption">Import-free <code>defineAlgorithm</code> / <code>defineXtyleAlgorithm</code> source; runs in the xript sandbox and rebuilds the theme a beat after you stop typing. Anchors and knobs below still layer on top.</p>
				<textarea
					id="bench-code-editor"
					class="bench-spec__editor bench-spec__editor--tall"
					spellcheck="false"
					autocapitalize="off"
					autocomplete="off"
					value={bench.customCode ?? CUSTOM_CODE_SEED}
					oninput={(e) => setCustomCode((e.currentTarget as HTMLTextAreaElement).value)}
				></textarea>
			</div>
		{/if}
		<p class="bench-layer__note x-caption">Everything below is optional — leave a layer untouched and the algorithm's own default fills in.</p>
	</section>

	<Accordion multiple sections={ACC_SECTIONS}>
	{#snippet panel(value)}
	{#if value === "knobs"}
	<div class="bench-acc__panel">
		{#if knobCount}<div class="bench-acc__status"><span class="bench-layer__count">{knobCount} set</span></div>{/if}

		{#each knobSpecs as spec (spec.field)}
			{#if spec.kind === "select"}
				<div class="bench-field">
					<label class="bench-field__label" for={`knob-${spec.field}`}>{spec.label}</label>
					<select id={`knob-${spec.field}`} class="bench-select" value={knobValue(spec.field) ?? ""} onchange={(e) => setKnobSelect(spec.field, (e.currentTarget as HTMLSelectElement).value)}>
						{#each spec.options ?? [] as opt (opt.value)}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
					{#if spec.field === "scheme" && schemeConflict}
						<p class="bench-field__conflict x-caption" role="alert">
							forcing {bench.knobs.scheme} over a {bgScheme} background — surfaces can't separate.
							<button type="button" class="bench-field__conflict-fix" onclick={() => patch((s) => delete s.knobs.scheme)}>use default</button>
						</p>
					{/if}
				</div>
			{:else if spec.kind === "range"}
				{@const value = knobValue(spec.field)}
				{@const set = value !== undefined}
				<div class="bench-field">
					<div class="bench-anchor__row">
						<label class="bench-field__label" for={`knob-${spec.field}`}>
							{spec.label}
							{#if set}<span class="bench-field__value">{(value as number).toFixed(spec.digits ?? 2)}{spec.unit ?? ""}</span>{:else}<span class="bench-default-tag">default</span>{/if}
						</label>
						<label class="bench-toggle">
							<input type="checkbox" checked={set} onchange={(e) => toggleKnobNumber(spec.field, (e.currentTarget as HTMLInputElement).checked, spec.seed)} />
							<span>custom</span>
						</label>
					</div>
					<input id={`knob-${spec.field}`} class="bench-range" type="range" min={spec.min} max={spec.max} step={spec.step} disabled={!set} value={value ?? spec.seed ?? 0} oninput={(e) => setKnobNumber(spec.field, Number((e.currentTarget as HTMLInputElement).value))} />
				</div>
			{:else}
				<div class="bench-field">
					<label class="bench-field__label" for={`knob-${spec.field}`}>
						{spec.label}
						{#if knobValue(spec.field) === undefined}<span class="bench-default-tag">default</span>{/if}
					</label>
					<input id={`knob-${spec.field}`} class="bench-text" type="text" spellcheck="false" placeholder={spec.placeholder} value={knobValue(spec.field) ?? ""} oninput={(e) => setKnobText(spec.field, (e.currentTarget as HTMLInputElement).value)} />
				</div>
			{/if}
		{/each}
	</div>
	{:else if value === "palette"}
	<div class="bench-acc__panel">
		{#if paletteCount}
			<div class="bench-acc__status">
				<span class="bench-layer__count">{paletteCount} set</span>
				<button type="button" class="bench-reset bench-layer__clear" onclick={clearPalette}>Clear all</button>
			</div>
		{/if}
		<p class="bench-layer__note x-caption">Re-hue a named color and its whole ramp follows — the soft tint and inks track the new hue.</p>
		<div class="bench-palette">
			{#each PALETTE_HUES as hue (hue)}
				{@const token = paletteToken(hue)}
				{@const set = bench.overrides[token] !== undefined}
				<div class="bench-palette__row" class:bench-palette__row--set={set}>
					<div class="bench-palette__head">
						<span class="bench-palette__name" id={`palette-label-${hue}`}>{hue}</span>
						{#if set}<button type="button" class="bench-reset" onclick={() => clearOverride(token)}>Reset</button>{/if}
					</div>
					<div class="bench-palette__edit">
						<ColorPicker
							labelledby={`palette-label-${hue}`}
							value={bench.overrides[token] ?? register[token] ?? "#000000"}
							trigger
							oninput={(e) => setOverride(token, (e.currentTarget as HTMLElement & { value: string }).value)} />
						<div class="bench-palette__ramp" aria-hidden="true">
							{#each PALETTE_STOPS as stop (stop)}
								<span class="bench-palette__stop" style={`background: ${rampStop(hue, stop)};`}></span>
							{/each}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
	{:else}
	<div class="bench-acc__panel">
		{#if overrideCount}
			<div class="bench-acc__status">
				<span class="bench-layer__count">{overrideCount} set</span>
				<button type="button" class="bench-reset bench-layer__clear" onclick={clearAllOverrides}>Clear all</button>
			</div>
		{/if}
		<p class="bench-layer__note x-caption">Every token, editable. Set one and the rest re-solve around it; a <span class="bench-token__legend-dot bench-token__legend-dot--set"></span> marks a value you've set, <span class="bench-token__legend-dot"></span> one the algorithm derives.</p>
		<div class="bench-token-search">
			<input class="bench-text bench-token-filter" type="text" placeholder="Search name, category, or meaning…" bind:value={tokenFilter} aria-label="Search tokens" />
			{#if tokenFilter}
				<button type="button" class="bench-token-search__clear" aria-label="Clear search" onclick={() => (tokenFilter = "")}>×</button>
			{/if}
		</div>
		<div class="bench-tokens">
			{#each filteredGroups as group (group.title)}
				{@const groupSet = group.tokens.filter((t) => bench.overrides[t] !== undefined).length}
				{@const open = searching || expandedGroups.has(group.title)}
				<section class="bench-tokens__group">
					<button type="button" class="bench-tokens__group-title" aria-expanded={open} onclick={() => toggleGroup(group.title)}>
						<span class="bench-tokens__group-caret" class:bench-tokens__group-caret--open={open} aria-hidden="true">▸</span>
						<span class="bench-tokens__group-name">{group.title}</span>
						<span class="bench-tokens__group-meta">
							{#if groupSet}<span class="bench-tokens__group-set">{groupSet} set</span>{/if}
							<span class="bench-tokens__group-count">{group.tokens.length}</span>
						</span>
					</button>
					{#if open}
						<div class="bench-tokens__rows">
							{#each group.tokens as name (name)}
								{@const overridden = bench.overrides[name] !== undefined}
								{@const inf = influence[name] ?? 0}
								<div class="bench-token" class:bench-token--set={overridden} class:bench-token--color={isColorToken(name)} class:bench-token--editing={editingTokens.has(name)}>
									<span class="bench-token__dot" class:bench-token__dot--set={overridden} title={overridden ? "Explicitly set" : "Derived by the algorithm"}></span>
									{#if isColorToken(name)}
										<ColorPicker
											labelledby={`tok-${name}`}
											value={bench.overrides[name] ?? register[name] ?? "#000000"}
											trigger
											contrastAgainst={contrastRefFor(name, register)}
											oninput={(e) => setOverride(name, (e.currentTarget as HTMLElement & { value: string }).value)} />
									{:else}
										{@const kind = nonColorKind(name)}
										<button type="button" class="bench-token__swatch" aria-expanded={editingTokens.has(name)} aria-label={`Edit ${name}`} title={overridden ? bench.overrides[name] : register[name]} onclick={() => toggleEditor(name)}>
											{#if kind === "border"}
												<span class="bench-sw bench-sw--border" style={`border-width: var(${name})`}></span>
											{:else if kind === "radius"}
												<span class="bench-sw bench-sw--radius" style={`border-radius: var(${name})`}></span>
											{:else if kind === "shadow"}
												<span class="bench-sw bench-sw--shadow" style={`box-shadow: var(${name})`}></span>
											{:else if kind === "space"}
												<span class="bench-sw bench-sw--space"><span style={`width: var(${name}); height: var(${name})`}></span></span>
											{:else if kind === "type"}
												<span class="bench-sw bench-sw--type" style={typeStyle(name)}>Aa</span>
											{:else}
												<span class="bench-sw bench-sw--other">{"{}"}</span>
											{/if}
										</button>
									{/if}
									<span class="bench-token__name" id={`tok-${name}`} title={tokenMeta(name).description || name}>{name}</span>
									{#if inf > 0}
										<span class="bench-token__influence" class:bench-token__influence--derived={!overridden} title={`${overridden ? "Feeds" : "Would feed"} ${inf} other token${inf === 1 ? "" : "s"} downstream`}>{inf}</span>
									{/if}
									{#if overridden}
										<button type="button" class="bench-token__reset" aria-label={`Reset ${name} to its derived value`} title="Reset to derived" onclick={() => clearOverride(name)}>↺</button>
									{:else}
										<span class="bench-token__reset bench-token__reset--ghost" aria-hidden="true"></span>
									{/if}
									{#if !isColorToken(name) && editingTokens.has(name)}
										<input
											class="bench-token__editor"
											type="text"
											spellcheck="false"
											value={overridden ? bench.overrides[name] : register[name]}
											aria-label={`${name} value`}
											oninput={(e) => setOverride(name, (e.currentTarget as HTMLInputElement).value)} />
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</section>
			{/each}
		</div>
	</div>
	{/if}
	{/snippet}
	</Accordion>
</div>

<style>
	.bench-controls {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.bench-acc__panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.bench-acc__status {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.bench-palette {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.bench-palette__row {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-2);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-md);
	}

	.bench-palette__row--set {
		background: var(--accent-bg, color-mix(in oklab, var(--accent) 12%, transparent));
		border-color: var(--accent);
	}

	.bench-palette__head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
	}

	.bench-palette__name {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--fg-1);
		text-transform: capitalize;
	}

	.bench-palette__edit {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.bench-palette__edit :global(xtyle-color-picker) {
		flex: none;
	}

	.bench-palette__edit :global(xtyle-color-picker::part(trigger)) {
		width: 2.2rem;
		height: 2.2rem;
	}

	.bench-palette__ramp {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		flex: 1;
		height: 1.6rem;
		border-radius: var(--radius-sm);
		overflow: hidden;
		border: var(--border-thin) solid var(--line);
	}

	.bench-palette__stop {
		display: block;
		height: 100%;
	}

	.bench-layer {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.bench-layer__head {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.bench-layer__title {
		margin: 0;
		font-family: var(--font-display, var(--font-sans));
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--fg-2);
	}

	.bench-layer__req {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--accent-text);
		background: var(--accent-bg, color-mix(in oklab, var(--accent) 14%, transparent));
		border-radius: var(--radius-pill, 999px);
		padding: 0 var(--space-2);
	}

	.bench-layer__count {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--accent-fg);
		background: var(--accent);
		border-radius: var(--radius-pill, 999px);
		padding: 0 var(--space-2);
	}

	.bench-layer__clear {
		margin-left: auto;
	}

	.bench-layer__note {
		margin: 0;
		color: var(--fg-3);
	}

	.bench-chips {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-2);
	}

	.bench-chip {
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--fg-1);
		background: var(--bg-2);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-md);
		padding: var(--space-2) var(--space-3);
		cursor: pointer;
	}

	.bench-chip--active {
		background: var(--accent);
		color: var(--accent-fg);
		border-color: var(--accent);
	}

	.bench-spec {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.bench-spec__editor {
		width: 100%;
		min-height: 9rem;
		background: var(--code-bg, var(--bg-0));
		color: var(--code-fg, var(--fg-0));
		border: var(--border-thin) solid var(--field-border);
		border-radius: var(--radius-md);
		padding: var(--space-3);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		line-height: var(--leading-normal);
		tab-size: 2;
		resize: vertical;
	}

	.bench-spec__editor--tall {
		min-height: 14rem;
	}

	.bench-spec__editor:focus {
		outline: none;
		border-color: var(--accent);
	}

	.bench-layer__note code {
		font-family: var(--font-mono);
	}

	.bench-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.bench-anchor__row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
	}

	.bench-field__label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--fg-2);
	}

	.bench-field__value {
		font-family: var(--font-mono);
		color: var(--accent-text);
	}

	.bench-default-tag {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--fg-3);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-pill, 999px);
		padding: 0 var(--space-2);
	}

	.bench-reset {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--accent-text);
		background: transparent;
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-sm);
		padding: 0 var(--space-2);
		cursor: pointer;
	}

	.bench-field__conflict {
		margin: var(--space-1) 0 0;
		color: var(--warn-text);
	}

	.bench-field__conflict-fix {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		color: var(--accent-text);
		text-decoration: underline;
		cursor: pointer;
	}

	.bench-text,
	.bench-select {
		flex: 1;
		width: 100%;
		background: var(--field-bg);
		color: var(--fg-0);
		border: var(--border-thin) solid var(--field-border);
		border-radius: var(--radius-md);
		padding: var(--space-2) var(--space-3);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
	}

	.bench-select {
		font-family: var(--font-sans);
	}

	.bench-range {
		accent-color: var(--accent);
		width: 100%;
	}

	.bench-range:disabled {
		opacity: 0.45;
	}

	.bench-toggle {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		font-size: var(--text-xs);
		color: var(--fg-2);
		cursor: pointer;
	}

	.bench-toggle input {
		accent-color: var(--accent);
	}

	.bench-token-filter {
		font-family: var(--font-sans);
	}

	.bench-tokens {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		max-height: 32rem;
		overflow-y: auto;
		padding-right: var(--space-1);
	}

	.bench-tokens__group {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.bench-tokens__group-title {
		position: sticky;
		top: 0;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		margin: 0 0 var(--space-1);
		padding: var(--space-1) var(--space-2);
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--fg-2);
		background: var(--bg-1);
		border: var(--border-thin) solid transparent;
		border-radius: var(--radius-sm);
		cursor: pointer;
		text-align: left;
	}

	.bench-tokens__group-title:hover {
		border-color: var(--line);
	}

	.bench-tokens__group-title:focus-visible {
		outline: none;
		box-shadow: 0 0 0 var(--border-thick) var(--ring);
	}

	.bench-tokens__group-caret {
		flex: none;
		font-size: var(--text-xs);
		color: var(--fg-3);
		transition: transform var(--duration-fast) var(--ease-standard);
	}

	.bench-tokens__group-caret--open {
		transform: rotate(90deg);
	}

	.bench-tokens__group-name {
		flex: 1;
	}

	.bench-tokens__group-meta {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	.bench-tokens__group-set {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--accent-fg);
		background: var(--accent);
		border-radius: 999px;
		padding: 0 var(--space-2);
	}

	.bench-tokens__group-count {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--fg-3);
	}

	.bench-tokens__rows {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.bench-token {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-1);
		border-radius: var(--radius-sm);
	}

	.bench-token--set {
		background: var(--accent-bg, color-mix(in oklab, var(--accent) 12%, transparent));
	}

	.bench-token :global(xtyle-color-picker) {
		flex: none;
		width: 1.5rem;
	}

	.bench-token :global(xtyle-color-picker::part(trigger)) {
		width: 1.5rem;
		height: 1.5rem;
		border-radius: var(--radius-sm);
	}

	.bench-token__swatch {
		flex: none;
		width: 1.5rem;
		height: 1.5rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		overflow: hidden;
		background: var(--bg-2);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-sm);
		color: var(--fg-2);
		cursor: pointer;
	}

	.bench-token__swatch[aria-expanded="true"] {
		border-color: var(--accent);
		box-shadow: 0 0 0 var(--border-thin) var(--accent);
	}

	.bench-sw {
		display: inline-block;
		width: 1rem;
		height: 1rem;
	}

	.bench-sw--border {
		border-style: solid;
		border-color: var(--fg-2);
		box-sizing: border-box;
	}

	.bench-sw--radius {
		background: var(--fg-3);
		border-top-left-radius: 0;
	}

	.bench-sw--shadow {
		width: 0.85rem;
		height: 0.85rem;
		background: var(--bg-0);
		border-radius: var(--radius-sm);
	}

	.bench-sw--space {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.bench-sw--space > span {
		display: block;
		max-width: 100%;
		max-height: 100%;
		background: var(--accent);
		border-radius: 1px;
	}

	.bench-sw--type {
		width: auto;
		height: auto;
		line-height: 1;
		color: var(--fg-1);
	}

	.bench-sw--other {
		width: auto;
		height: auto;
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--fg-3);
	}

	.bench-token__editor {
		flex-basis: 100%;
		order: 9;
		width: 100%;
		min-width: 0;
		margin-left: calc(0.5rem + 1.5rem + var(--space-2));
		background: var(--field-bg);
		color: var(--fg-0);
		border: var(--border-thin) solid var(--field-border);
		border-radius: var(--radius-sm);
		padding: var(--space-1) var(--space-2);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
	}

	.bench-token__name {
		flex: 1;
		min-width: 0;
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--fg-1);
		overflow-wrap: anywhere;
		line-height: 1.3;
	}

	.bench-token__reset {
		width: 1.5rem;
		height: 1.5rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		background: transparent;
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-sm);
		color: var(--fg-2);
		cursor: pointer;
		font-size: var(--text-sm);
	}

	.bench-token__reset--ghost {
		border-color: transparent;
		cursor: default;
	}

	.bench-token-search {
		position: relative;
		display: flex;
		align-items: center;
	}

	.bench-token-search .bench-token-filter {
		width: 100%;
		padding-right: 2rem;
	}

	.bench-token-search__clear {
		position: absolute;
		right: var(--space-2);
		width: 1.25rem;
		height: 1.25rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		border-radius: var(--radius-full, 999px);
		color: var(--fg-2);
		font-size: var(--text-md, 1rem);
		line-height: 1;
		cursor: pointer;
	}

	.bench-token-search__clear:hover {
		color: var(--fg-0);
		background: var(--state-hover);
	}

	.bench-token__dot {
		flex: none;
		width: 0.5rem;
		height: 0.5rem;
		border-radius: var(--radius-full, 999px);
		border: var(--border-thin) solid var(--line-2);
		background: transparent;
	}

	.bench-token__dot--set {
		border-color: var(--accent);
		background: var(--accent);
	}

	.bench-token__influence {
		flex: none;
		min-width: 1.25rem;
		height: 1.25rem;
		padding: 0 var(--space-1);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--accent-text);
		background: var(--accent-bg);
		border-radius: var(--radius-full, 999px);
		cursor: default;
	}

	.bench-token__influence--derived {
		color: var(--fg-3);
		background: var(--bg-2);
		opacity: 0.7;
	}

	.bench-token__legend-dot {
		display: inline-block;
		width: 0.5rem;
		height: 0.5rem;
		margin: 0 0.1rem;
		border-radius: var(--radius-full, 999px);
		border: var(--border-thin) solid var(--line-2);
		vertical-align: baseline;
	}

	.bench-token__legend-dot--set {
		border-color: var(--accent);
		background: var(--accent);
	}
</style>
