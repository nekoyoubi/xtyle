<script lang="ts">
	import type { TokenRegister, TreeNode } from "@xtyle/core";
	import { Badge, Breadcrumb, Button, Code, Icon, Kbd, Progress, Separator, Statusbar, Tabs, Text, Toolbar, Tooltip, Tree } from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	// Git status is semantic, so it wears the semantic tones (and a letter, so the state survives a
	// hue-less `shade` accent strategy and a monochrome print alike). Language is *categorical* — a set
	// of peers with no ranking — which is exactly what the accent family is for.
	// Git status is semantic, not categorical, so it keeps the semantic tones and never borrows an
	// accent variant. The mark, the word, and the tone are always read together, so they travel together.
	const gitMeta = {
		modified: { tone: "warn", mark: "M", word: "Modified" },
		added: { tone: "success", mark: "A", word: "Added" },
		untracked: { tone: "info", mark: "U", word: "Untracked" },
	} as const;

	const languages = [
		{ label: "TypeScript", count: 18, tone: "accent-2" },
		{ label: "JSON", count: 4, tone: "accent-3" },
		{ label: "CSS", count: 6, tone: "accent-4" },
	] as const;

	const tree: TreeNode[] = [
		{
			label: "packages/xtyle",
			value: "pkg",
			locked: true,
			children: [
				{
					label: "src",
					value: "src",
					expanded: true,
					children: [
						{ label: "derive.ts", value: "derive", selected: true, badge: [{ text: "M", tone: "warn" }] },
						{ label: "register.ts", value: "register", badge: [{ text: "M", tone: "warn" }] },
						{ label: "invariants.ts", value: "invariants", badge: [{ text: "A", tone: "success" }] },
						{ label: "emit.ts", value: "emit" },
					],
				},
				{
					label: "test",
					value: "test",
					children: [
						{ label: "derive.test.ts", value: "derive-test", badge: [{ text: "M", tone: "warn" }] },
						{ label: "scratch.ts", value: "scratch", badge: [{ text: "U", tone: "info" }] },
					],
				},
			],
		},
		{
			label: "algorithms/xtyle-loud",
			value: "loud",
			children: [
				{ label: "mod-manifest.json", value: "manifest", badge: [{ text: "M", tone: "warn" }] },
				{ label: "tokens.css", value: "tokens", badge: [{ text: "U", tone: "info" }] },
			],
		},
		{ label: "CHANGELOG.md", value: "changelog", badge: [{ text: "M", tone: "warn" }] },
	];

	const files = [
		{
			value: "derive",
			name: "derive.ts",
			lang: "ts",
			langLabel: "TypeScript",
			langTone: "accent-2",
			crumbs: ["packages", "xtyle", "src", "derive.ts"],
			git: "modified",
			insertions: 42,
			deletions: 13,
			highlight: "9-13",
			code: `import { buildRegister, settle } from "./register.js";
import type { Anchors, Knobs, TokenRegister } from "./types.js";

export function derive(anchors: Anchors, knobs: Knobs): TokenRegister {
	const register = buildRegister(anchors, knobs);

	// the settle pass is what makes a bad anchor still land legibly
	return settle(register, {
		contrast: knobs.contrast ?? "AA",
		accentStrategy: knobs.accentStrategy ?? "fan",
		scheme: anchors.scheme,
	});
}`,
		},
		{
			value: "invariants",
			name: "invariants.ts",
			lang: "ts",
			langLabel: "TypeScript",
			langTone: "accent-2",
			crumbs: ["packages", "xtyle", "src", "invariants.ts"],
			git: "added",
			insertions: 64,
			deletions: 0,
			highlight: "5-8",
			code: `import type { TokenRegister } from "./types.js";

export function textPairsMeetAA(register: TokenRegister) {
	return TEXT_PAIRS.every((pair) => contrast(register, pair) >= 4.5);
}

export function accentsStayDistinct(register: TokenRegister) {
	return spread(register, ACCENT_VARIANTS) >= MIN_SEPARATION;
}`,
		},
		{
			value: "manifest",
			name: "mod-manifest.json",
			lang: "json",
			langLabel: "JSON",
			langTone: "accent-3",
			crumbs: ["algorithms", "xtyle-loud", "mod-manifest.json"],
			git: "modified",
			insertions: 9,
			deletions: 2,
			code: `{
	"name": "xtyle-loud",
	"version": "0.7.0",
	"family": "xtyle",
	"capabilities": ["color-math"],
	"knobs": {
		"vibrancy": { "type": "number", "min": 0, "max": 1, "default": 0.86 },
		"accentStrategy": { "type": "enum", "of": ["fan", "step", "shade", "duo"] }
	}
}`,
		},
		{
			value: "tokens",
			name: "tokens.css",
			lang: "css",
			langLabel: "CSS",
			langTone: "accent-4",
			crumbs: ["algorithms", "xtyle-loud", "tokens.css"],
			git: "untracked",
			insertions: 21,
			deletions: 0,
			code: `:root {
	--accent: oklch(0.68 0.19 262);
	--accent-2: oklch(0.72 0.17 214);
	--accent-3: oklch(0.7 0.2 318);
	--accent-4: oklch(0.76 0.16 96);
	--line: oklch(0.32 0.02 262);
}`,
		},
	] as const;

	const tabItems = files.map((f) => ({ value: f.value, label: f.name }));

	let active = $state("derive");
	const file = $derived(files.find((f) => f.value === active) ?? files[0]);
	const crumbs = $derived(file.crumbs.map((label, i) => ({ label, value: label, current: i === file.crumbs.length - 1 })));

	const dockTabs = [
		{ value: "terminal", label: "Terminal" },
		{ value: "problems", label: "Problems (4)" },
		{ value: "output", label: "Output" },
	];
	let dock = $state("terminal");

	const shell = [
		{ mark: "$", kind: "cmd", text: "npx xtyle gauntlet -a all --depth full" },
		{ mark: "PASS", kind: "pass", text: "xtyle-default   612 assertions   0 failures" },
		{ mark: "PASS", kind: "pass", text: "xtyle-hc        612 assertions   0 failures" },
		{ mark: "WARN", kind: "warn", text: "xtyle-loud      accent-4 sits 0.2 above the AA floor" },
		{ mark: "PASS", kind: "pass", text: "xtyle-quiet     612 assertions   0 failures" },
		{ mark: "", kind: "note", text: "5 algorithms · 40 themes · 2.1s" },
		{ mark: "$", kind: "cmd", text: "npx xtyle audit -a xtyle-loud --level AAA" },
		{ mark: "FAIL", kind: "fail", text: "2 of 34 text pairs miss AAA against --bg-2" },
	] as const;

	const problems = [
		{ icon: "error", tone: "danger", where: "src/derive.ts:118", text: "Type 'string' is not assignable to type 'FullTone'." },
		{ icon: "warning", tone: "warn", where: "src/register.ts:41", text: "'settleAccent' is declared but its value is never read." },
		{ icon: "warning", tone: "warn", where: "algorithms/xtyle-loud/mod.ts:88", text: "Invariant 'accent-4 contrast' is within 0.2 of the floor." },
		{ icon: "info", tone: "info", where: "src/invariants.ts:12", text: "Prefer 'satisfies' over an 'as' assertion." },
	] as const;

	const buildLog = [
		"emit  packages/xtyle → dist/index.js  (48.2 kB)",
		"emit  packages/svelte → dist/index.js  (12.9 kB)",
		"emit  algorithms/xtyle-loud → mod.js  (9.4 kB)",
		"watch  waiting for changes…",
	];
</script>

<MockFrame {register} title="xtyle studio">
	<div class="ide">
		<Toolbar size="sm">
			{#snippet start()}
				<span class="ide__brand">
					<Icon name="palette" size="sm" tone="accent" />
					<Text size="sm" weight="semibold">xtyle-engine</Text>
					<Badge size="sm" tone="neutral" variant="outline">feat/settle-pass</Badge>
				</span>
			{/snippet}
			{#snippet end()}
				<span class="ide__hint">
					<Kbd size="sm">Ctrl</Kbd><Kbd size="sm">K</Kbd>
					<Text size="xs" tone="subtle">Command palette</Text>
				</span>
				<Tooltip text="Run the gauntlet" placement="bottom">
					<Button variant="solid" size="sm">
						{#snippet iconStart()}<Icon name="play" />{/snippet}
						Run
					</Button>
				</Tooltip>
				<Tooltip text="Settings" placement="bottom">
					<Button variant="ghost" size="sm" iconOnly aria-label="Settings">
						{#snippet iconStart()}<Icon name="gear" />{/snippet}
					</Button>
				</Tooltip>
			{/snippet}
		</Toolbar>

		<div class="ide__body">
			<aside class="ide__rail">
				<div class="ide__rail-head">
					<Text size="xs" tone="subtle" weight="semibold">Explorer</Text>
					<Button variant="ghost" size="sm" iconOnly aria-label="New file">
						{#snippet iconStart()}<Icon name="plus" />{/snippet}
					</Button>
				</div>

				<Tree items={tree} size="sm" label="Project files" />

				<Separator />

				<div class="ide__rail-section">
					<Text size="xs" tone="subtle" weight="semibold">Source control</Text>
					<div class="ide__chips">
						<Badge size="sm" tone="warn" variant="soft">3 modified</Badge>
						<Badge size="sm" tone="success" variant="soft">1 added</Badge>
						<Badge size="sm" tone="info" variant="soft">2 untracked</Badge>
					</div>
					<Button variant="outline" size="sm" block>
						{#snippet iconStart()}<Icon name="check" />{/snippet}
						Commit 6 files
					</Button>
				</div>

				<Separator />

				<div class="ide__rail-section">
					<Text size="xs" tone="subtle" weight="semibold">Languages</Text>
					<div class="ide__chips">
						{#each languages as lang (lang.label)}
							<Badge size="sm" tone={lang.tone} variant="soft" count={lang.count}>{lang.label}</Badge>
						{/each}
					</div>
				</div>
			</aside>

			<div class="ide__main">
				<Tabs items={tabItems} bind:value={active} variant="enclosed" size="sm" label="Open files" />

				<div class="ide__meta">
					<Breadcrumb items={crumbs} size="sm" separator="/" label="File path" />
					<span class="ide__meta-tags">
						<Badge size="sm" tone={file.langTone} variant="soft">{file.langLabel}</Badge>
						<Badge size="sm" tone={gitMeta[file.git].tone} variant="solid">{gitMeta[file.git].mark}</Badge>
						<Badge size="sm" tone={gitMeta[file.git].tone} variant="soft">{gitMeta[file.git].word}</Badge>
						<Badge size="sm" tone="success" variant="outline">+{file.insertions}</Badge>
						<Badge size="sm" tone="danger" variant="outline">-{file.deletions}</Badge>
					</span>
				</div>

				<div class="ide__code">
					<Code lang={file.lang} code={file.code} lineNumbers highlight={file.highlight} />
				</div>

				<div class="ide__dock">
					<Tabs items={dockTabs} bind:value={dock} variant="pill" size="sm" label="Panel">
						{#snippet panel(key)}
							{#if key === "terminal"}
								<div class="term" aria-label="Terminal">
									{#each shell as line, i (i)}
										<div class="term__line">
											<span class="term__mark term__mark--{line.kind}">{line.mark}</span>
											<span class="term__text term__text--{line.kind}">{line.text}</span>
										</div>
									{/each}
									<div class="term__line">
										<span class="term__mark term__mark--cmd">$</span>
										<span class="term__cursor" aria-hidden="true"></span>
									</div>
								</div>
							{:else if key === "problems"}
								<div class="dock__list">
									{#each problems as p (p.where)}
										<div class="dock__row">
											<Icon name={p.icon} size="sm" tone={p.tone} />
											<Text size="sm" mono>{p.where}</Text>
											<Text size="sm" tone="muted">{p.text}</Text>
										</div>
									{/each}
								</div>
							{:else}
								<div class="dock__out">
									<Progress variant="linear" tone="accent" size="sm" value={72} showValue valueFormat="percent" ariaLabel="Build progress" />
									<div class="dock__list">
										{#each buildLog as line (line)}
											<Text size="sm" mono tone="muted">{line}</Text>
										{/each}
									</div>
								</div>
							{/if}
						{/snippet}
					</Tabs>
				</div>

				<Statusbar separated label="Editor status">
					<span class="xtyle-statusbar__item xtyle-statusbar__item--strong">feat/settle-pass</span>
					<span class="xtyle-statusbar__item ide__status-sync">
						<Icon name="arrow-up" size="sm" label="Ahead" />2
						<Icon name="arrow-down" size="sm" label="Behind" />0
					</span>
					<span class="xtyle-statusbar__item">4 problems</span>
					<span class="xtyle-statusbar__spacer"></span>
					<span class="xtyle-statusbar__item">Ln 42, Col 8</span>
					<span class="xtyle-statusbar__item">Spaces: 2</span>
					<span class="xtyle-statusbar__item">UTF-8</span>
					<span class="xtyle-statusbar__item">{file.langLabel}</span>
					<span class="xtyle-statusbar__item ide__status-kbd">
						<Kbd size="sm">Ctrl</Kbd><Kbd size="sm">`</Kbd>
					</span>
				</Statusbar>
			</div>
		</div>
	</div>
</MockFrame>

<style>
	.ide {
		display: flex;
		flex-direction: column;
		min-height: 32rem;
	}

	.ide__brand {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	.ide__hint {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		margin-right: var(--space-2);
	}

	.ide__body {
		display: grid;
		grid-template-columns: minmax(0, 16rem) minmax(0, 1fr);
		flex: 1;
		min-height: 0;
	}

	.ide__rail {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-3);
		background: var(--bg-2);
		border-right: var(--border-thin) solid var(--line);
	}

	.ide__rail-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
	}

	.ide__rail-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.ide__chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.ide__main {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.ide__meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		flex-wrap: wrap;
		padding: var(--space-2) var(--space-3);
		border-bottom: var(--border-thin) solid var(--line);
		background: var(--bg-1);
	}

	.ide__meta-tags {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	.ide__code {
		flex: 1;
		min-height: 0;
		padding: var(--space-3);
		overflow: auto;
	}

	.ide__dock {
		padding: var(--space-3);
		border-top: var(--border-thin) solid var(--line);
		background: var(--bg-1);
	}

	.ide__status-kbd,
	.ide__status-sync {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
	}

	.term {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		height: 11rem;
		overflow: auto;
		padding: var(--space-3);
		border-radius: var(--radius-md);
		background: var(--terminal-bg);
		color: var(--terminal-fg);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		line-height: var(--leading-snug);
	}

	.term__line {
		display: grid;
		grid-template-columns: 4ch minmax(0, 1fr);
		gap: var(--space-2);
		align-items: baseline;
	}

	.term__mark {
		font-weight: var(--weight-semibold);
	}

	.term__mark--cmd {
		color: var(--terminal-cyan);
	}
	.term__mark--pass {
		color: var(--terminal-green);
	}
	.term__mark--warn {
		color: var(--terminal-yellow);
	}
	.term__mark--fail {
		color: var(--terminal-red);
	}

	.term__text--cmd {
		color: var(--terminal-bright-white);
	}
	.term__text--note {
		color: var(--terminal-bright-black);
	}

	.term__cursor {
		display: inline-block;
		width: 0.55em;
		height: 1em;
		background: var(--terminal-cursor);
		transform: translateY(0.15em);
	}

	@media (prefers-reduced-motion: no-preference) {
		.term__cursor {
			animation: term-blink 1.2s steps(2, start) infinite;
		}
	}

	@keyframes term-blink {
		to {
			visibility: hidden;
		}
	}

	.dock__list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		height: 11rem;
		overflow: auto;
		padding: var(--space-2) 0;
	}

	.dock__row {
		display: grid;
		grid-template-columns: auto minmax(0, 14rem) minmax(0, 1fr);
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2) var(--space-2);
		border-radius: var(--radius-sm);
		background: var(--bg-2);
	}

	.dock__out {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding-top: var(--space-2);
	}

	.dock__out .dock__list {
		height: auto;
	}
</style>
