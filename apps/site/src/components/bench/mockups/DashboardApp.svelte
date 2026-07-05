<script lang="ts">
	import type { TokenRegister } from "@xoji/core";
	import { Badge, Bar, Heatmap, Pie, Sparkline, Stat } from "@xoji/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	const kpis = [
		{ label: "Revenue", value: "$48.2k", delta: "+12.4%", trend: "up" as const, spark: [18, 22, 20, 27, 25, 31, 34], tone: "success" as const },
		{ label: "Active users", value: "3,910", delta: "+3.1%", trend: "up" as const, spark: [30, 31, 29, 33, 34, 33, 36], tone: "accent" as const },
		{ label: "Churn", value: "1.8%", delta: "-0.4%", trend: "down" as const, spark: [4, 3.5, 3.2, 2.9, 2.4, 2.1, 1.8], tone: "success" as const },
		{ label: "Latency", value: "212ms", delta: "+18ms", trend: "up" as const, spark: [180, 190, 188, 201, 205, 208, 212], tone: "warn" as const },
	];

	const revenue = [
		{ name: "This year", values: [31, 38, 35, 44, 40, 48] },
		{ name: "Last year", values: [24, 27, 29, 30, 33, 35] },
	];
	const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

	const sources = [
		{ label: "Direct", value: 38 },
		{ label: "Search", value: 31 },
		{ label: "Social", value: 18 },
		{ label: "Referral", value: 13 },
	];

	const recent = [
		{ what: "Deploy succeeded", when: "2m ago", tone: "success" as const, tag: "ci" },
		{ what: "Payment refunded", when: "18m ago", tone: "warn" as const, tag: "billing" },
		{ what: "New enterprise trial", when: "1h ago", tone: "accent" as const, tag: "sales" },
		{ what: "Error rate spiked", when: "3h ago", tone: "danger" as const, tag: "ops" },
	];

	const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
	const hours = ["", "3a", "", "6a", "", "9a", "", "12p", "", "3p", "", "6p"];
	const activity = days.map((_, d) =>
		hours.map((_, h) => {
			const peak = Math.max(0, 6 - Math.abs(h - 7));
			const weekday = d < 5 ? 1 : 0.4;
			return Math.round(peak * weekday * (1 + ((d * 7 + h) % 3)));
		}),
	);
</script>

<MockFrame {register} title="Analytics">
	<div class="dash">
		<div class="dash__kpis">
			{#each kpis as k (k.label)}
				<article class="dash__card dash__kpi">
					<Stat label={k.label} delta={k.delta} trend={k.trend} size="sm">{k.value}</Stat>
					<div class="dash__spark">
						<Sparkline values={k.spark} tone={k.tone} variant="area" showEnd label={`${k.label} trend`} />
					</div>
				</article>
			{/each}
		</div>

		<div class="dash__charts">
			<article class="dash__card dash__wide">
				<header class="dash__head">
					<span class="dash__title">Revenue</span>
					<Badge size="sm" tone="success">on track</Badge>
				</header>
				<Bar series={revenue} categories={months} legend height={168} label="Monthly revenue" />
			</article>

			<article class="dash__card">
				<header class="dash__head">
					<span class="dash__title">Traffic</span>
				</header>
				<Pie data={sources} variant="donut" legend size={168} label="Traffic sources" />
			</article>
		</div>

		<article class="dash__card">
			<header class="dash__head">
				<span class="dash__title">Activity</span>
				<span class="dash__muted">requests per hour, last week</span>
			</header>
			<Heatmap values={activity} rows={days} cols={hours} scheme="thermal" scale label="Activity by hour" />
		</article>

		<article class="dash__card">
			<header class="dash__head">
				<span class="dash__title">Recent</span>
			</header>
			<ul class="dash__feed">
				{#each recent as r (r.what)}
					<li class="dash__event">
						<Badge size="sm" tone={r.tone} dot>{r.tag}</Badge>
						<span class="dash__event-what">{r.what}</span>
						<span class="dash__event-when">{r.when}</span>
					</li>
				{/each}
			</ul>
		</article>
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

	.dash__card {
		background: var(--bg-0);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-lg);
		padding: var(--space-4);
		box-shadow: var(--elevation-1);
	}

	.dash__kpis {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
		gap: var(--space-4);
	}

	.dash__kpi {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.dash__spark {
		height: 2.5rem;
	}

	.dash__charts {
		display: grid;
		grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
		gap: var(--space-4);
	}

	.dash__wide {
		min-width: 0;
	}

	.dash__head {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-3);
	}

	.dash__title {
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--fg-1);
	}

	.dash__muted {
		font-size: var(--text-xs);
		color: var(--fg-3);
		margin-left: auto;
	}

	.dash__feed {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	.dash__event {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2) 0;
		border-top: var(--border-thin) solid var(--line);
		font-size: var(--text-sm);
	}

	.dash__event:first-child {
		border-top: none;
	}

	.dash__event-what {
		color: var(--fg-1);
	}

	.dash__event-when {
		margin-left: auto;
		font-size: var(--text-xs);
		color: var(--fg-3);
	}
</style>
