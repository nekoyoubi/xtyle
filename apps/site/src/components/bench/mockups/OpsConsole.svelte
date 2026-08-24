<script lang="ts">
	import type { TokenRegister } from "@xtyle/core";
	import {
		Badge,
		Button,
		Card,
		Cluster,
		CommandPalette,
		DockZone,
		Eyebrow,
		Heading,
		Heatmap,
		Kbd,
		List,
		Separator,
		Stack,
		Stat,
		Swatch,
		Text,
	} from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
	const hours = ["00", "02", "04", "06", "08", "10", "12", "14", "16", "18", "20", "22"];

	const latency = days.map((_, d) =>
		hours.map((_, h) => {
			const workday = d < 5 ? 1 : 0.45;
			const peak = 1 - Math.abs(h - 6) / 8;
			const wobble = ((d * 7 + h * 13) % 11) / 26;
			return Math.max(0, Math.round((workday * peak + wobble) * 180));
		}),
	);

	const series = [
		{ token: "--accent", label: "p50", value: "38 ms" },
		{ token: "--info", label: "p90", value: "104 ms" },
		{ token: "--warn", label: "p99", value: "241 ms" },
		{ token: "--danger", label: "timeouts", value: "3" },
	];

	const alerts = [
		{ value: "a1", label: "checkout-api p99 over budget", trail: "4m" },
		{ value: "a2", label: "cache hit rate below 80%", trail: "22m" },
		{ value: "a3", label: "queue depth climbing", trail: "1h" },
		{ value: "a4", label: "cert expires in 9 days", trail: "3h" },
	];

	const commands = [
		{ id: "ack", label: "Acknowledge alert", group: "Alerts", hint: "checkout-api", shortcut: "A" },
		{ id: "silence", label: "Silence for 2 hours", group: "Alerts", keywords: ["mute", "snooze"] },
		{ id: "runbook", label: "Open runbook", group: "Alerts", hint: "checkout-api" },
		{ id: "roll", label: "Roll back last deploy", group: "Deploys", shortcut: "Ctrl+Shift+R" },
		{ id: "scale", label: "Scale replicas", group: "Deploys", hint: "currently 6" },
		{ id: "drain", label: "Drain node", group: "Fleet", disabled: true },
		{ id: "logs", label: "Tail logs", group: "Fleet", keywords: ["tail", "stream"] },
	];

	const layout = {
		tree: {
			kind: "split" as const,
			direction: "row" as const,
			sizes: [3, 2],
			children: [
				{ kind: "leaf" as const, id: "zone-0", panels: ["uptime"], active: 0 },
				{ kind: "leaf" as const, id: "zone-1", panels: ["alerts", "series"], active: 0 },
			],
		},
		floating: [],
	};

	let palette: CommandPalette | undefined = $state();
	let lastRun = $state<string | null>(null);
</script>

<MockFrame {register} title="Ops — service health">
	<div class="ops">
		<Stack gap={4}>
			<Cluster gap={3} align="center">
				<Stack gap={0}>
					<Eyebrow>Region / eu-west-1</Eyebrow>
					<Heading level={2} size="lg">checkout-api</Heading>
				</Stack>
				<Badge tone="warn" variant="soft">degraded</Badge>
				<span class="ops__spacer"></span>
				<Button variant="subtle" onclick={() => palette?.toggle()}>
					Commands <Kbd size="sm">⌘K</Kbd>
				</Button>
			</Cluster>

			<Cluster gap={4}>
				<Stat label="Requests / min" trend="up" delta="+4.1%">18.2k</Stat>
				<Stat label="Error rate" trend="up" delta="+0.9pp" sentiment="negative">0.42%</Stat>
				<Stat label="Apdex" trend="down" delta="-0.02" sentiment="negative">0.94</Stat>
			</Cluster>

			{#if lastRun}
				<Text size="sm" tone="muted">ran <strong>{lastRun}</strong></Text>
			{/if}

			<DockZone {layout} style="height: 380px">
				<section data-panel-id="uptime" data-title="Latency by hour">
					<div class="ops__panel">
						<Heatmap
							values={latency}
							rows={days}
							cols={hours}
							max={200}
							current={[[4, 6]]}
							currentTone="warn"
							scale
							label="Median latency by day and hour, in milliseconds"
						/>
					</div>
				</section>

				<section
					data-panel-id="alerts"
					data-title="Alerts"
					data-badge="4"
					data-menu={JSON.stringify([
						{ heading: "Alerts" },
						{ label: "Acknowledge all", value: "ack-all" },
						{ label: "Silence 2h", value: "silence" },
					])}
				>
					<div class="ops__panel">
						<List items={alerts} label="Firing alerts" interaction="selectable" selection="single" />
					</div>
				</section>

				<section data-panel-id="series" data-title="Series">
					<div class="ops__panel">
						<Stack gap={3}>
							<Text size="xs" tone="subtle" mono>Legend</Text>
							{#each series as s (s.token)}
								<Cluster gap={2} align="center">
									<Swatch color="var({s.token})" label={s.label} size="sm" />
									<Text size="sm">{s.label}</Text>
									<span class="ops__spacer"></span>
									<Text size="sm" mono tone="muted">{s.value}</Text>
								</Cluster>
							{/each}
							<Separator />
							<Text size="xs" tone="subtle">Sampled over the last 24 hours.</Text>
						</Stack>
					</div>
				</section>
			</DockZone>
		</Stack>

		<CommandPalette
			bind:this={palette}
			items={commands}
			hotkey="mod+k"
			label="Ops commands"
			placeholder="Run a command…"
			onselect={(e) => (lastRun = e.detail.label)}
		/>
	</div>
</MockFrame>

<style>
	.ops {
		padding: var(--space-5);
		background: var(--bg-0);
	}

	.ops__spacer {
		flex: 1;
	}

	.ops__panel {
		padding: var(--space-3);
		overflow: auto;
		height: 100%;
		box-sizing: border-box;
	}
</style>
