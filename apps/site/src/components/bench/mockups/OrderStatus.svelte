<script lang="ts">
	import type { TokenRegister } from "@xtyle/core";
	import { tableParts } from "@xtyle/core";
	import {
		Alert,
		Badge,
		Button,
		Card,
		Cluster,
		Eyebrow,
		Grid,
		Heading,
		Icon,
		Image,
		Progress,
		Rating,
		Separator,
		Stack,
		Stat,
		Steps,
		Table,
		Text,
		Timeline,
	} from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	const art = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;

	const lampArt = art(
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#e8e3da"/><path d="M48 20 L70 46 L26 46 Z" fill="#3b4252"/><rect x="45" y="46" width="6" height="26" fill="#5e6b7d"/><rect x="30" y="72" width="36" height="6" rx="3" fill="#3b4252"/><circle cx="48" cy="52" r="4" fill="#f2c14e"/></svg>',
	);
	const throwArt = art(
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#2f3b45"/><rect x="14" y="22" width="68" height="52" rx="6" fill="#8fa6a1"/><rect x="14" y="36" width="68" height="6" fill="#c9d6cf"/><rect x="14" y="54" width="68" height="6" fill="#c9d6cf"/><rect x="44" y="22" width="8" height="52" fill="#6d8480"/></svg>',
	);
	const mugArt = art(
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#efe7dd"/><path d="M28 32 h34 v30 a10 10 0 0 1 -10 10 h-14 a10 10 0 0 1 -10 -10 z" fill="#b6543f"/><path d="M62 40 h8 a8 8 0 0 1 0 16 h-8 z" fill="none" stroke="#b6543f" stroke-width="5"/><rect x="26" y="72" width="38" height="5" rx="2" fill="#cbbdae"/></svg>',
	);
	const cushionArt = art(
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#1f2430"/><rect x="18" y="18" width="60" height="60" rx="10" fill="#9aa7c7"/><rect x="30" y="30" width="36" height="36" rx="4" fill="none" stroke="#5c6786" stroke-width="4"/><circle cx="48" cy="48" r="6" fill="#5c6786"/></svg>',
	);

	// The one categorical axis on this page: one parcel is not better or worse than another, it is merely
	// a different one, so the accent family is the honest palette for it. Progression and health stay
	// semantic (success / info / warn). Every parcel also carries its letter, so hue is never the signal.
	const parcels = [
		{
			id: "A",
			label: "Parcel A",
			tone: "accent-2",
			carrier: "GroundExpress",
			tracking: "1Z-4815-A",
			status: "Delivered",
			statusTone: "success",
			statusIcon: "check",
			note: "delivered Sat, Jul 5",
			count: "3 units",
		},
		{
			id: "B",
			label: "Parcel B",
			tone: "accent-3",
			carrier: "GroundExpress",
			tracking: "1Z-1623-B",
			status: "Out for delivery",
			statusTone: "info",
			statusIcon: "arrow-right",
			note: "on the van since 8:02 AM",
			count: "1 unit",
		},
		{
			id: "C",
			label: "Parcel C",
			tone: "accent-4",
			carrier: "NorthAir",
			tracking: "NA-9042-C",
			status: "Delayed",
			statusTone: "warn",
			statusIcon: "warning",
			note: "weather hold in Denver",
			count: "2 units",
		},
	] as const;

	const items = [
		{ name: "Aurora Desk Lamp", spec: "Brass · warm white", parcel: 0, qty: 1, price: "$89.00", rating: 4.5, art: lampArt },
		{ name: "Meridian Wool Throw", spec: "Sage · 50×70 in", parcel: 0, qty: 2, price: "$118.00", rating: 4, art: throwArt },
		{ name: "Kestrel Ceramic Mugs", spec: "Set of four · terracotta", parcel: 1, qty: 1, price: "$42.00", rating: 5, art: mugArt },
		{ name: "Halcyon Linen Cushion", spec: "Indigo · 18 in", parcel: 2, qty: 2, price: "$63.00", rating: 3.5, art: cushionArt },
	] as const;

	const events = [
		{ title: "Out for delivery", when: "Today, 8:02 AM", parcel: 1, detail: "Stop 14 of 31 on the morning route." },
		{ title: "Held at regional hub", when: "Yesterday, 9:40 PM", parcel: 2, detail: "NorthAir grounded the leg out of Denver." },
		{ title: "Delivered", when: "Sat, Jul 5, 1:12 PM", parcel: 0, detail: "Left at the front desk, signed for by M. Okonkwo." },
		{ title: "Handed to carriers", when: "Fri, Jul 4, 6:20 AM", parcel: null, detail: "All three parcels left the fulfillment center." },
		{ title: "Order placed", when: "Thu, Jul 3, 11:58 AM", parcel: null, detail: "Payment authorized on Visa ending 4815." },
	] as const;

	const receipt = [
		{ label: "Subtotal", value: "$312.00", free: false },
		{ label: "Shipping", value: "$0.00", free: true },
		{ label: "Estimated tax", value: "$24.96", free: false },
	] as const;
</script>

<MockFrame {register} title="Nimbus — Orders">
	<div class="order">
		<div class="order__main">
			<header class="order__head">
				<div class="order__head-main">
					<Eyebrow tracking="wide">Order #4815-1623</Eyebrow>
					<Heading level={2} size="lg">Arriving Tuesday, July 8</Heading>
					<Cluster gap={2} align="center">
						<Badge tone="info" variant="soft" dot>In transit</Badge>
						<Text size="sm" tone="muted">Placed Jul 3 · 6 units · 3 parcels</Text>
					</Cluster>
				</div>
				<div class="order__head-actions">
					<Button variant="solid" size="sm">
						{#snippet iconStart()}<Icon name="arrow-right" />{/snippet}
						Track order
					</Button>
					<Button variant="outline" size="sm">Return items</Button>
					<Button variant="ghost" size="sm" iconOnly aria-label="More order actions">
						{#snippet iconStart()}<Icon name="more-vertical" />{/snippet}
					</Button>
				</div>
			</header>

			<div class="order__steps">
				<Steps current={2}>
					<ol>
						<li>Order placed</li>
						<li>Shipped</li>
						<li>Out for delivery</li>
						<li>Delivered</li>
					</ol>
				</Steps>
			</div>

			<Alert severity="warn" variant="soft" dismissible dismissLabel="Dismiss delay notice">
				{#snippet title()}Parcel C is running a day behind{/snippet}
				NorthAir is holding the linen cushions overnight in Denver. Parcels A and B are unaffected and
				still land on Tuesday.
				{#snippet actions()}
					<Button variant="outline" size="sm" tone="warn">Reschedule delivery</Button>
				{/snippet}
			</Alert>

			<section class="order__block" aria-label="Parcels">
				<div class="order__block-head">
					<Heading level={3} size="sm">Parcels</Heading>
					<Text size="xs" tone="muted">This order shipped in three</Text>
				</div>
				<Grid minColWidth="11rem" gap={3}>
					{#each parcels as p (p.id)}
						<Card tone={p.tone} compact>
							{#snippet header()}
								<div class="order__parcel-head">
									<Badge tone={p.tone} variant="solid" size="sm">{p.label}</Badge>
									<Badge tone={p.statusTone} variant="soft" size="sm">
										<Icon name={p.statusIcon} size="sm" />
										{p.status}
									</Badge>
								</div>
							{/snippet}
							<Stack gap={1}>
								<Text size="sm" weight="medium">{p.carrier}</Text>
								<Text size="xs" tone="muted" mono>{p.tracking}</Text>
								<Text size="xs" tone="subtle">{p.count} · {p.note}</Text>
							</Stack>
						</Card>
					{/each}
				</Grid>
			</section>

			<section class="order__block" aria-label="Items">
				<div class="order__block-head">
					<Heading level={3} size="sm">Items</Heading>
					<Text size="xs" tone="muted">4 products · 6 units</Text>
				</div>
				<Table hover ariaLabel="Items in order 4815-1623">
					<table>
						<thead class={tableParts.head}>
							<tr class={tableParts.row}>
								<th class={tableParts.headerCell} scope="col">Product</th>
								<th class={tableParts.headerCell} scope="col">Parcel</th>
								<th class={tableParts.headerCell} scope="col">Qty</th>
								<th class={tableParts.headerCell} scope="col">Price</th>
							</tr>
						</thead>
						<tbody class={tableParts.body}>
							{#each items as it (it.name)}
								<tr class={tableParts.row}>
									<td class={tableParts.cell}>
										<div class="order__product">
											<div class="order__thumb">
												<Image src={it.art} alt={it.name} ratio="1/1" radius="md" />
											</div>
											<div class="order__product-text">
												<Text size="sm" weight="medium">{it.name}</Text>
												<Text size="xs" tone="muted">{it.spec}</Text>
												<Rating value={it.rating} max={5} size="sm" readonly label={`Rated ${it.rating} out of 5`} />
											</div>
										</div>
									</td>
									<td class={tableParts.cell}>
										<Badge tone={parcels[it.parcel].tone} variant="soft" size="sm">
											{parcels[it.parcel].label}
										</Badge>
									</td>
									<td class={tableParts.cell}><Text size="sm" mono>{it.qty}</Text></td>
									<td class={tableParts.cell}><Text size="sm" mono weight="medium">{it.price}</Text></td>
								</tr>
							{/each}
						</tbody>
					</table>
				</Table>
			</section>

			<section class="order__block" aria-label="Shipment history">
				<div class="order__block-head">
					<Heading level={3} size="sm">Shipment history</Heading>
					<Text size="xs" tone="muted">Newest first</Text>
				</div>
				<Timeline>
					<ol>
						{#each events as e (e.title)}
							<li>
								<strong>{e.title}</strong>
								<time>{e.when}</time>
								<p class="order__event">
									{#if e.parcel !== null}
										<Badge tone={parcels[e.parcel].tone} variant="soft" size="sm">
											{parcels[e.parcel].label}
										</Badge>
									{/if}
									<span>{e.detail}</span>
								</p>
							</li>
						{/each}
					</ol>
				</Timeline>
			</section>
		</div>

		<aside class="order__rail" aria-label="Delivery and receipt">
			<Card>
				{#snippet header()}
					<Heading level={3} size="sm">Delivery</Heading>
				{/snippet}
				<Stack gap={4}>
					<Stat label="Estimated arrival" caption="2:00 – 6:00 PM · no signature needed">Tue, Jul 8</Stat>
					<div class="order__progress">
						<Progress
							tone="success"
							value={3}
							max={4}
							showValue
							valueFormat="value-max"
							ariaLabel="Delivery progress"
						/>
						<Text size="xs" tone="muted">Three of four stages complete</Text>
					</div>
					<Separator />
					<div class="order__address">
						<Text size="sm" weight="medium">Kestrel Yards, Unit 12</Text>
						<Text size="xs" tone="muted">4815 Marlowe Ave</Text>
						<Text size="xs" tone="muted">Portland, OR 97214</Text>
					</div>
				</Stack>
				{#snippet footer()}
					<Button variant="outline" size="sm" block>
						{#snippet iconStart()}<Icon name="copy" />{/snippet}
						Copy tracking numbers
					</Button>
				{/snippet}
			</Card>

			<Card>
				{#snippet header()}
					<Heading level={3} size="sm">Receipt</Heading>
				{/snippet}
				<div class="order__receipt">
					{#each receipt as line (line.label)}
						<div class="order__line">
							<Text size="sm" tone="muted">{line.label}</Text>
							<Cluster gap={2} align="center">
								{#if line.free}<Badge tone="success" variant="soft" size="sm">Free</Badge>{/if}
								<Text size="sm" mono>{line.value}</Text>
							</Cluster>
						</div>
					{/each}
					<Separator />
					<div class="order__line">
						<Text size="sm" weight="semibold">Total charged</Text>
						<Text size="lg" mono weight="semibold">$336.96</Text>
					</div>
					<Text size="xs" tone="subtle">Visa ending 4815 · charged Jul 3</Text>
				</div>
				{#snippet footer()}
					<div class="order__receipt-actions">
						<Button variant="subtle" size="sm">
							{#snippet iconStart()}<Icon name="download" />{/snippet}
							Invoice
						</Button>
						<Button variant="ghost" size="sm">
							{#snippet iconStart()}<Icon name="info" />{/snippet}
							Get help
						</Button>
					</div>
				{/snippet}
			</Card>

			<Card>
				{#snippet header()}
					<Heading level={3} size="sm">Rate what arrived</Heading>
				{/snippet}
				<Stack gap={3}>
					<Text size="sm" tone="muted">
						Parcel A landed on Saturday. How did the lamp and the throw hold up?
					</Text>
					<Rating value={4} max={5} allowHalf size="lg" label="Rate the items in parcel A" />
					<Button variant="outline" size="sm" block>Write a review</Button>
				</Stack>
			</Card>
		</aside>
	</div>
</MockFrame>

<style>
	.order {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 21rem);
		min-height: 28rem;
	}

	.order__main {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		padding: var(--space-5);
		min-width: 0;
	}

	.order__head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-4);
		flex-wrap: wrap;
	}

	.order__head-main {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		align-items: flex-start;
	}

	.order__head-actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.order__steps {
		padding: var(--space-4);
		background: var(--bg-1);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-lg);
	}

	.order__block {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		min-width: 0;
	}

	.order__block-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.order__parcel-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.order__product {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-width: 0;
	}

	.order__thumb {
		width: 3.25rem;
		flex: none;
	}

	.order__product-text {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		align-items: flex-start;
		min-width: 0;
	}

	.order__event {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.order__rail {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-5);
		background: var(--bg-2);
		border-left: var(--border-thin) solid var(--line);
	}

	.order__progress {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.order__address {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.order__receipt {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.order__line {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.order__receipt-actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
</style>
