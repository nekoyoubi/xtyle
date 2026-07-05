<script lang="ts">
	import type { TokenRegister } from "@xtyle/core";
	import { Avatar, Badge, Button, Progress, Stat } from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	const nav = ["Dashboard", "Deals", "Contacts", "Reports", "Settings"];

	const stats = [
		{ label: "Pipeline", value: "$1.2M", delta: "+8%", trend: "up" as const },
		{ label: "Won (Q3)", value: "$340K", delta: "+12%", trend: "up" as const },
		{ label: "Open deals", value: "47", delta: "-3", trend: "down" as const },
	];

	const deals = [
		{ name: "Northwind Traders", owner: "Ada L.", value: "$84,000", stage: "Negotiation", pct: 75, tone: "warn" as const },
		{ name: "Globex Corp", owner: "Grace H.", value: "$120,000", stage: "Proposal", pct: 50, tone: "info" as const },
		{ name: "Initech", owner: "Alan T.", value: "$32,500", stage: "Closed won", pct: 100, tone: "success" as const },
		{ name: "Soylent Inc", owner: "Katherine J.", value: "$58,000", stage: "Discovery", pct: 25, tone: "neutral" as const },
	];
</script>

<MockFrame {register} title="Relay CRM">
	<div class="crm">
		<aside class="crm__nav">
			<span class="crm__logo">Relay</span>
			<nav class="crm__nav-list" aria-label="Sections">
				{#each nav as item, i (item)}
					<span class="crm__nav-item" class:crm__nav-item--active={i === 1}>{item}</span>
				{/each}
			</nav>
		</aside>

		<div class="crm__main">
			<header class="crm__head">
				<div>
					<h3 class="crm__title">Deals</h3>
					<span class="crm__sub">Pipeline overview · Q3</span>
				</div>
				<Button variant="solid" size="sm">New deal</Button>
			</header>

			<div class="crm__stats">
				{#each stats as s (s.label)}
					<div class="crm__stat">
						<Stat label={s.label} delta={s.delta} trend={s.trend}>{s.value}</Stat>
					</div>
				{/each}
			</div>

			<div class="crm__table" role="table" aria-label="Deals">
				<div class="crm__tr crm__tr--head" role="row">
					<span role="columnheader">Account</span>
					<span role="columnheader">Owner</span>
					<span role="columnheader">Value</span>
					<span role="columnheader">Stage</span>
					<span role="columnheader">Progress</span>
				</div>
				{#each deals as d (d.name)}
					<div class="crm__tr" role="row">
						<span class="crm__account" role="cell">{d.name}</span>
						<span class="crm__owner" role="cell"><Avatar size="xs" name={d.owner} /> {d.owner}</span>
						<span class="crm__value" role="cell">{d.value}</span>
						<span role="cell"><Badge size="sm" tone={d.tone}>{d.stage}</Badge></span>
						<span class="crm__prog" role="cell"><Progress value={d.pct} ariaLabel={`${d.name} progress`} /></span>
					</div>
				{/each}
			</div>
		</div>
	</div>
</MockFrame>

<style>
	.crm {
		display: grid;
		grid-template-columns: minmax(0, 11rem) minmax(0, 1fr);
		min-height: 26rem;
	}

	.crm__nav {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		padding: var(--space-4);
		background: var(--bg-2);
		border-right: var(--border-thin) solid var(--line);
	}

	.crm__logo {
		font-family: var(--font-display, var(--font-sans));
		font-size: var(--text-lg);
		font-weight: var(--weight-bold);
		color: var(--accent-text);
	}

	.crm__nav-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.crm__nav-item {
		font-size: var(--text-sm);
		color: var(--fg-2);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
	}

	.crm__nav-item--active {
		background: var(--accent-bg);
		color: var(--accent-text);
		font-weight: var(--weight-medium);
	}

	.crm__main {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		padding: var(--space-5);
		min-width: 0;
	}

	.crm__head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.crm__title {
		margin: 0 0 var(--space-1);
		font-size: var(--text-lg);
		color: var(--fg-0);
	}

	.crm__sub {
		font-size: var(--text-sm);
		color: var(--fg-2);
	}

	.crm__stats {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-3);
	}

	.crm__stat {
		padding: var(--space-4);
		background: var(--bg-1);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-md);
	}

	.crm__table {
		display: flex;
		flex-direction: column;
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.crm__tr {
		display: grid;
		grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 0.9fr) minmax(0, 1fr) minmax(0, 1.2fr);
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		border-bottom: var(--border-thin) solid var(--line);
		font-size: var(--text-sm);
		color: var(--fg-1);
	}

	.crm__tr:last-child {
		border-bottom: none;
	}

	.crm__tr--head {
		background: var(--bg-2);
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--fg-3);
		font-weight: var(--weight-semibold);
	}

	.crm__account {
		font-weight: var(--weight-semibold);
		color: var(--fg-0);
	}

	.crm__owner {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	.crm__value {
		font-variant-numeric: tabular-nums;
	}
</style>
