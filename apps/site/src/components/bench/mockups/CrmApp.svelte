<script lang="ts">
	import type { TokenRegister } from "@xtyle/core";
	import { tableParts } from "@xtyle/core";
	import {
		Avatar,
		AvatarGroup,
		Badge,
		Button,
		Card,
		Eyebrow,
		Heading,
		Icon,
		Progress,
		Segmented,
		Select,
		Stat,
		Table,
		Text,
		Tooltip,
	} from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	const nav = [
		{ name: "Pipeline", icon: "arrow-up", active: true, count: 0 },
		{ name: "Deals", icon: "folder", active: false, count: 9 },
		{ name: "Contacts", icon: "bookmark", active: false, count: 0 },
		{ name: "Reports", icon: "eye", active: false, count: 0 },
		{ name: "Settings", icon: "gear", active: false, count: 0 },
	] as const;

	// Stage is a categorical axis, not a semantic one: a deal in Qualified is not "warning" and one in
	// Won is not "success", it is only further along. The stages therefore wear the accent family, and
	// their order is carried by column position and the "Stage N" ordinal, never by hue.
	const stages = [
		{ name: "Lead", tone: "accent", blurb: "Unworked inbound" },
		{ name: "Qualified", tone: "accent-2", blurb: "Budget confirmed" },
		{ name: "Proposal", tone: "accent-3", blurb: "Terms in review" },
		{ name: "Won", tone: "accent-4", blurb: "Signed this quarter" },
	] as const;

	// Owners stay neutral: the accent family is spent on stages, and initials plus a presence dot
	// separate people without borrowing a second color axis.
	const owners = {
		ada: { name: "Ada Lovelace", status: "success", presence: "Online" },
		grace: { name: "Grace Hopper", status: "warn", presence: "Away" },
		alan: { name: "Alan Turing", status: "neutral", presence: "Offline" },
		katherine: { name: "Katherine Johnson", status: "success", presence: "Online" },
		radia: { name: "Radia Perlman", status: "success", presence: "Online" },
	} as const;

	type OwnerKey = keyof typeof owners;

	const deals = [
		{ name: "Northwind Traders", sector: "Logistics", owner: "ada", stage: 2, value: 84000, confidence: 72, close: "Sep 28", closeAt: "2026-09-28", stalled: 0 },
		{ name: "Globex Corp", sector: "Manufacturing", owner: "grace", stage: 1, value: 120000, confidence: 45, close: "Oct 12", closeAt: "2026-10-12", stalled: 0 },
		{ name: "Initech", sector: "Software", owner: "alan", stage: 3, value: 32500, confidence: 100, close: "Sep 02", closeAt: "2026-09-02", stalled: 0 },
		{ name: "Soylent Inc", sector: "Food science", owner: "katherine", stage: 0, value: 58000, confidence: 20, close: "Nov 04", closeAt: "2026-11-04", stalled: 21 },
		{ name: "Umbrella Health", sector: "Biotech", owner: "radia", stage: 2, value: 210000, confidence: 64, close: "Oct 01", closeAt: "2026-10-01", stalled: 0 },
		{ name: "Hooli", sector: "Platform", owner: "ada", stage: 1, value: 96000, confidence: 38, close: "Oct 22", closeAt: "2026-10-22", stalled: 34 },
		{ name: "Stark Industries", sector: "Defense", owner: "grace", stage: 3, value: 175000, confidence: 100, close: "Aug 29", closeAt: "2026-08-29", stalled: 0 },
		{ name: "Cyberdyne Systems", sector: "Robotics", owner: "alan", stage: 0, value: 44000, confidence: 15, close: "Nov 18", closeAt: "2026-11-18", stalled: 17 },
		{ name: "Vandelay Industries", sector: "Import/export", owner: "ada", stage: 2, value: 66000, confidence: 55, close: "Oct 09", closeAt: "2026-10-09", stalled: 0 },
	] as const;

	type Deal = (typeof deals)[number];

	const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
	const usd = (n: number) => money.format(n);

	const pipelineTotal = deals.reduce((sum, d) => sum + d.value, 0);

	const board = stages.map((stage, index) => {
		const held = deals.filter((d) => d.stage === index);
		const value = held.reduce((sum, d) => sum + d.value, 0);
		const crew = [...new Set(held.map((d) => d.owner))] as OwnerKey[];
		return {
			...stage,
			index,
			count: held.length,
			value,
			share: Math.round((value / pipelineTotal) * 100),
			crew: crew.slice(0, 3),
			extra: Math.max(0, crew.length - 3),
		};
	});

	const views = [
		{ value: "all", label: "All deals" },
		{ value: "mine", label: "My deals" },
		{ value: "risk", label: "At risk" },
	];

	const sorters: Record<string, (a: Deal, b: Deal) => number> = {
		value: (a, b) => b.value - a.value,
		close: (a, b) => a.closeAt.localeCompare(b.closeAt),
		confidence: (a, b) => b.confidence - a.confidence,
	};

	let view = $state("all");
	let sort = $state("value");

	const rows = $derived(
		[...deals]
			.filter((d) => (view === "mine" ? d.owner === "ada" : view === "risk" ? d.stalled > 0 : true))
			.sort(sorters[sort] ?? sorters.value),
	);

	const rowsTotal = $derived(rows.reduce((sum, d) => sum + d.value, 0));
</script>

<MockFrame {register} title="Relay CRM">
	<div class="crm">
		<aside class="crm__rail">
			<div class="crm__brand">
				<Icon name="palette" size="sm" tone="accent" />
				<Heading level={2} size="sm">Relay</Heading>
			</div>

			<nav class="crm__nav" aria-label="Sections">
				{#each nav as item (item.name)}
					<button
						type="button"
						class="crm__nav-item"
						class:crm__nav-item--active={item.active}
						aria-current={item.active ? "page" : undefined}
					>
						<Icon name={item.icon} size="sm" />
						<span class="crm__nav-name">{item.name}</span>
						{#if item.count}<Badge size="sm" tone="neutral" variant="soft">{item.count}</Badge>{/if}
					</button>
				{/each}
			</nav>

			<div class="crm__quota">
				<Progress variant="circular" value={68} tone="accent" showValue ariaLabel="Quota attainment" />
				<div>
					<Text size="sm" weight="medium">Quota</Text>
					<Text size="xs" tone="muted">$1.8M target</Text>
				</div>
			</div>
		</aside>

		<div class="crm__main">
			<header class="crm__head">
				<div>
					<Heading level={2} size="md">Pipeline</Heading>
					<Text size="sm" tone="subtle">Q3 forecast, closing September 30</Text>
				</div>
				<div class="crm__head-actions">
					<Select label="Sort by" size="sm" bind:value={sort}>
						<option value="value">Deal value</option>
						<option value="close">Close date</option>
						<option value="confidence">Confidence</option>
					</Select>
					<Tooltip text="Pipeline settings" placement="bottom">
						<Button variant="ghost" size="sm" iconOnly aria-label="Pipeline settings">
							{#snippet iconStart()}<Icon name="gear" />{/snippet}
						</Button>
					</Tooltip>
					<Button variant="solid" size="sm">
						{#snippet iconStart()}<Icon name="plus" />{/snippet}
						New deal
					</Button>
				</div>
			</header>

			<div class="crm__stats">
				<Stat label="Pipeline" delta="+8%" trend="up" caption="vs. last quarter">{usd(pipelineTotal)}</Stat>
				<Stat label="Won this quarter" delta="+12%" trend="up" caption="2 deals">{usd(207500)}</Stat>
				<Stat label="Win rate" delta="-4 pts" trend="down" caption="rolling 90 days">38%</Stat>
				<Stat label="Avg. cycle" delta="-6 days" trend="down" sentiment="positive" caption="faster to close">24d</Stat>
			</div>

			<section class="crm__board" aria-label="Pipeline stages">
				{#each board as stage (stage.name)}
					<Card tone={stage.tone} compact>
						{#snippet header()}
							<div class="crm__stage-head">
								<Eyebrow as="span" tone="subtle" tracking="wide">Stage {stage.index + 1}</Eyebrow>
								<div class="crm__stage-title">
									<Heading level={3} size="sm">{stage.name}</Heading>
									<Badge tone={stage.tone} variant="soft" size="sm">{stage.count}</Badge>
								</div>
							</div>
						{/snippet}
						<div class="crm__stage-body">
							<Text size="lg" weight="semibold" mono>{usd(stage.value)}</Text>
							<Progress
								tone={stage.tone}
								size="sm"
								value={stage.share}
								showValue
								ariaLabel="{stage.name} share of pipeline"
							/>
							<Text size="xs" tone="muted">{stage.blurb}</Text>
							<AvatarGroup size="sm" overflow={stage.extra} label="{stage.name} owners">
								{#each stage.crew as key (key)}
									<Avatar size="sm" userName={owners[key].name} />
								{/each}
							</AvatarGroup>
						</div>
					</Card>
				{/each}
			</section>

			<section class="crm__deals" aria-label="Deals">
				<div class="crm__deals-head">
					<Segmented label="Deal view" options={views} bind:value={view} />
					<Text size="sm" tone="muted">{rows.length} deals, {usd(rowsTotal)} in play</Text>
				</div>

				<Table variant="striped" size="compact" hover ariaLabel="Deals">
					<table>
						<thead class={tableParts.head}>
							<tr class={tableParts.row}>
								<th class={tableParts.headerCell} scope="col">Deal</th>
								<th class={tableParts.headerCell} scope="col">Owner</th>
								<th class={tableParts.headerCell} scope="col">Stage</th>
								<th class="{tableParts.headerCell} crm__num" scope="col">Value</th>
								<th class={tableParts.headerCell} scope="col">Confidence</th>
								<th class={tableParts.headerCell} scope="col">Close</th>
								<th class={tableParts.headerCell} scope="col"><span class="crm__sr">Actions</span></th>
							</tr>
						</thead>
						<tbody class={tableParts.body}>
							{#each rows as deal (deal.name)}
								<tr class={tableParts.row}>
									<th class={tableParts.headerCell} scope="row">
										<div class="crm__deal">
											<div class="crm__deal-name">
												<Text size="sm" weight="medium">{deal.name}</Text>
												{#if deal.stalled}
													<Tooltip text="No activity in {deal.stalled} days" placement="right">
														<Badge tone="warn" variant="soft" size="sm" dot>Stalled</Badge>
													</Tooltip>
												{/if}
											</div>
											<Text size="xs" tone="subtle">{deal.sector}</Text>
										</div>
									</th>
									<td class={tableParts.cell}>
										<div class="crm__owner">
											<Avatar
												size="sm"
												userName={owners[deal.owner].name}
												status={owners[deal.owner].status}
												statusLabel={owners[deal.owner].presence}
											/>
											<Text size="sm">{owners[deal.owner].name}</Text>
										</div>
									</td>
									<td class={tableParts.cell}>
										<Badge tone={stages[deal.stage].tone} variant="soft" size="sm">
											{deal.stage + 1}. {stages[deal.stage].name}
										</Badge>
									</td>
									<td class="{tableParts.cell} crm__num">
										<Text size="sm" weight="medium" mono>{usd(deal.value)}</Text>
									</td>
									<td class={tableParts.cell}>
										<div class="crm__meter">
											<Progress
												size="sm"
												tone="neutral"
												value={deal.confidence}
												showValue
												ariaLabel="{deal.name} confidence"
											/>
										</div>
									</td>
									<td class={tableParts.cell}>
										<Text size="sm" tone="muted">{deal.close}</Text>
									</td>
									<td class="{tableParts.cell} crm__num">
										<Button variant="ghost" size="sm" iconOnly aria-label="Actions for {deal.name}">
											{#snippet iconStart()}<Icon name="more-vertical" />{/snippet}
										</Button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</Table>
			</section>
		</div>
	</div>
</MockFrame>

<style>
	.crm {
		display: grid;
		grid-template-columns: minmax(0, 13rem) minmax(0, 1fr);
		min-height: 28rem;
	}

	.crm__rail {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-4);
		background: var(--bg-2);
		border-right: var(--border-thin) solid var(--line);
	}

	.crm__brand {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.crm__nav {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		flex: 1;
	}

	.crm__nav-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-2) var(--space-3);
		background: transparent;
		border: none;
		border-radius: var(--radius-md);
		color: var(--fg-2);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		text-align: left;
		cursor: pointer;
	}

	.crm__nav-item:hover {
		background: var(--state-hover);
	}

	.crm__nav-item--active {
		background: var(--accent-bg);
		color: var(--accent-text);
		font-weight: var(--weight-medium);
	}

	.crm__nav-name {
		flex: 1;
	}

	.crm__quota {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		background: var(--bg-1);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-md);
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
		gap: var(--space-4);
		flex-wrap: wrap;
	}

	.crm__head-actions {
		display: flex;
		align-items: flex-end;
		gap: var(--space-2);
	}

	.crm__stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
		gap: var(--space-4);
		padding: var(--space-4);
		background: var(--bg-1);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-md);
	}

	.crm__board {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		gap: var(--space-3);
	}

	.crm__stage-head {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.crm__stage-title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
	}

	.crm__stage-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		align-items: flex-start;
	}

	.crm__deals {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		min-width: 0;
	}

	.crm__deals-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.crm__deal {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		align-items: flex-start;
	}

	.crm__deal-name {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.crm__owner {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.crm__meter {
		min-width: 7rem;
	}

	.crm__num {
		text-align: right;
	}

	.crm__sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
