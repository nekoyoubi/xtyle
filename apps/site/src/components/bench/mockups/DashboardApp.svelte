<script lang="ts">
	import type { BarSeries, PieDatum, TokenRegister } from "@xtyle/core";
	import { tableParts } from "@xtyle/core";
	import { Badge, Bar, Button, Heading, Heatmap, Icon, Panel, Pie, Progress, Segmented, Separator, Sparkline, Stat, Table, Text } from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	let range = $state("30d");

	// The channel axis is categorical, not semantic: a channel has no outcome, it is just one of four
	// things that want to be told apart. That is exactly what the accent family is for. The order here
	// is load-bearing — the `accents` scheme hands series colors out by index (accent, accent-2,
	// accent-3, accent-4), so a badge painted with `tone` matches its bar only while the two stay
	// parallel. Every chip carries its channel's name, so the pairing survives a `shade` strategy where
	// all four are one hue.
	const channels = [
		{ name: "Direct", tone: "accent" },
		{ name: "Search", tone: "accent-2" },
		{ name: "Social", tone: "accent-3" },
		{ name: "Referral", tone: "accent-4" },
	] as const;

	const months = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];

	const traffic: BarSeries[] = [
		{ name: "Direct", values: [18, 21, 20, 24, 26, 29] },
		{ name: "Search", values: [14, 15, 19, 18, 22, 25] },
		{ name: "Social", values: [7, 9, 8, 12, 11, 15] },
		{ name: "Referral", values: [4, 5, 6, 6, 8, 9] },
	];

	const kpis = [
		{ label: "Revenue", value: "$48.2k", delta: "+12.4%", trend: "up", sentiment: "positive", tone: "accent", spark: [18, 22, 20, 27, 25, 31, 34] },
		{ label: "Active users", value: "3,910", delta: "+3.1%", trend: "up", sentiment: "positive", tone: "accent-2", spark: [30, 31, 29, 33, 34, 33, 36] },
		{ label: "Churn", value: "1.8%", delta: "-0.4%", trend: "down", sentiment: "positive", tone: "accent-3", spark: [4, 3.5, 3.2, 2.9, 2.4, 2.1, 1.8] },
		{ label: "p95 latency", value: "212ms", delta: "+18ms", trend: "up", sentiment: "negative", tone: "accent-4", spark: [180, 190, 188, 201, 205, 208, 212] },
	] as const;

	const plans: PieDatum[] = [
		{ label: "Free", value: 12 },
		{ label: "Pro", value: 34 },
		{ label: "Team", value: 29 },
		{ label: "Enterprise", value: 25 },
	];

	// Deploy outcomes are semantic, so they take the `statuses` scheme and pin by name — a week with no
	// failures must not shift "skipped" onto the danger tone.
	const deploys: PieDatum[] = [
		{ label: "Passed", value: 128, tone: "success" },
		{ label: "Warned", value: 17, tone: "warn" },
		{ label: "Failed", value: 9, tone: "failed" },
		{ label: "Skipped", value: 22, tone: "skipped" },
	];

	const campaigns = [
		{ name: "Spring launch", channel: 0, sessions: [22, 26, 24, 31, 29, 38, 41], conv: 74 },
		{ name: "Docs refresh", channel: 1, sessions: [12, 14, 15, 14, 18, 19, 21], conv: 58 },
		{ name: "Community AMA", channel: 2, sessions: [9, 8, 14, 11, 16, 13, 18], conv: 41 },
		{ name: "Partner mailer", channel: 3, sessions: [6, 7, 6, 9, 8, 10, 12], conv: 27 },
	] as const;

	const capacity = [
		{ label: "Seats", value: 82, caption: "82 of 100" },
		{ label: "Storage", value: 61, caption: "305 GB of 500 GB" },
		{ label: "API quota", value: 94, caption: "9.4M of 10M calls" },
	] as const;

	const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
	const hours = ["12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p"];
	const requests = days.map((_, d) =>
		hours.map((_, h) => {
			const peak = Math.max(0, 5 - Math.abs(h - 4));
			const weekday = d < 5 ? 1 : 0.4;
			return Math.round(peak * weekday * (2 + ((d * 5 + h) % 3)) * 4);
		}),
	);
</script>

<MockFrame {register} title="Pulse">
	<div class="dash">
		<header class="dash__bar">
			<div class="dash__bar-title">
				<Heading level={2} size="md">Overview</Heading>
				<Text size="xs" tone="subtle">All workspaces</Text>
			</div>
			<div class="dash__bar-tools">
				<Segmented bind:value={range} options={["24h", "7d", "30d", "1y"]} size="sm" aria-label="Time range" />
				<Button variant="outline" size="sm">
					{#snippet iconStart()}<Icon name="download" />{/snippet}
					Export
				</Button>
				<Button variant="ghost" size="sm" iconOnly aria-label="Dashboard settings">
					{#snippet iconStart()}<Icon name="gear" />{/snippet}
				</Button>
			</div>
		</header>

		<div class="dash__kpis">
			{#each kpis as k (k.label)}
				<article class="dash__kpi">
					<Stat label={k.label} delta={k.delta} trend={k.trend} sentiment={k.sentiment} size="sm">{k.value}</Stat>
					<div class="dash__spark">
						<Sparkline values={[...k.spark]} tone={k.tone} variant="area" showEnd label={`${k.label}, last 7 days`} />
					</div>
				</article>
			{/each}
		</div>

		<div class="dash__row dash__row--split">
			<Panel title="Sessions by channel">
				{#snippet actions()}
					<Text size="xs" tone="subtle">thousands / month</Text>
					<Badge size="sm" tone="success" variant="soft">+18% QoQ</Badge>
				{/snippet}
				<Bar series={traffic} categories={months} scheme="accents" stacked legend height={190} label="Sessions by channel, by month" />
			</Panel>

			<Panel title="Revenue by plan">
				{#snippet actions()}
					<Text size="xs" tone="subtle">$48.2k</Text>
				{/snippet}
				<Pie data={plans} scheme="accents" variant="donut" legend showValues size={168} label="Revenue share by plan tier" />
			</Panel>
		</div>

		<div class="dash__row dash__row--split">
			<Panel title="Requests by hour">
				{#snippet actions()}
					<Text size="xs" tone="subtle">last 7 days</Text>
				{/snippet}
				<Heatmap
					values={requests}
					rows={days}
					cols={hours}
					scheme="thermal"
					current={[[4, 5]]}
					currentPulse
					scale
					label="Requests per hour, by day"
				/>
			</Panel>

			<Panel title="Deploys">
				{#snippet actions()}
					<Badge size="sm" tone="neutral" variant="soft">176 runs</Badge>
				{/snippet}
				<Pie data={deploys} scheme="statuses" legend size={148} label="Deploy outcomes this week" />
				<Separator />
				<div class="dash__meta">
					<Text size="xs" tone="muted">Median run</Text>
					<Text size="xs" weight="medium">4m 12s</Text>
				</div>
			</Panel>
		</div>

		<div class="dash__row dash__row--wide">
			<Panel title="Top campaigns">
				{#snippet actions()}
					<Button variant="link" size="sm">
						View all
						{#snippet iconEnd()}<Icon name="chevron-right" />{/snippet}
					</Button>
				{/snippet}
				<Table variant="striped" size="compact" hover ariaLabel="Top campaigns by conversion">
					<table>
						<thead class={tableParts.head}>
							<tr class={tableParts.row}>
								<th class={tableParts.headerCell} scope="col">Campaign</th>
								<th class={tableParts.headerCell} scope="col">Channel</th>
								<th class={tableParts.headerCell} scope="col">Sessions</th>
								<th class={tableParts.headerCell} scope="col">Conversion</th>
							</tr>
						</thead>
						<tbody class={tableParts.body}>
							{#each campaigns as c (c.name)}
								<tr class={tableParts.row}>
									<td class={tableParts.cell}>{c.name}</td>
									<td class={tableParts.cell}>
										<Badge size="sm" tone={channels[c.channel].tone} variant="soft">{channels[c.channel].name}</Badge>
									</td>
									<td class={tableParts.cell}>
										<div class="dash__cell-spark">
											<Sparkline values={[...c.sessions]} tone={channels[c.channel].tone} variant="bar" label={`${c.name} sessions`} />
										</div>
									</td>
									<td class={tableParts.cell}>
										<div class="dash__cell-meter">
											<Progress value={c.conv} tone="accent" size="sm" showValue ariaLabel={`${c.name} conversion`} />
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</Table>
			</Panel>

			<Panel title="Capacity">
				{#snippet actions()}
					<Badge size="sm" tone="warn" variant="soft" dot>1 near limit</Badge>
				{/snippet}
				{#each capacity as c (c.label)}
					<div class="dash__quota">
						<div class="dash__quota-head">
							<Text size="sm" weight="medium">{c.label}</Text>
							<Text size="xs" tone="subtle">{c.caption}</Text>
						</div>
						<Progress value={c.value} ramp="severity" rampMode="gradient" meter showValue size="sm" ariaLabel={`${c.label} used`} />
					</div>
				{/each}
			</Panel>
		</div>
	</div>
</MockFrame>

<style>
	.dash {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-5);
		background: var(--bg-1);
	}

	.dash__bar {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: var(--space-4);
		flex-wrap: wrap;
	}

	.dash__bar-title {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.dash__bar-tools {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.dash__kpis {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		gap: var(--space-4);
	}

	.dash__kpi {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-4);
		background: var(--bg-0);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-lg);
		box-shadow: var(--elevation-1);
	}

	.dash__spark {
		height: 2.5rem;
	}

	.dash__row {
		display: grid;
		gap: var(--space-4);
		align-items: start;
	}

	.dash__row--split {
		grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
	}

	.dash__row--wide {
		grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
	}

	.dash__meta {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-2);
	}

	.dash__cell-spark {
		width: 6rem;
		height: 1.75rem;
	}

	.dash__cell-meter {
		width: 7rem;
	}

	.dash__quota {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.dash__quota-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-2);
	}
</style>
