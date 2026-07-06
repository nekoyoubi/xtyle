<script lang="ts">
	import type { TokenRegister } from "@xtyle/core";
	import { Badge, Button, Rating, Steps, Timeline } from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();
</script>

<MockFrame {register} title="Order #4815-1623">
	<div class="order">
		<header class="order__head">
			<div>
				<h3 class="order__title">Order #4815-1623</h3>
				<span class="order__sub">Placed Jul 3 · arriving Jul 8</span>
			</div>
			<Badge tone="info" dot>In transit</Badge>
		</header>

		<Steps current={2}>
			<ol>
				<li>Placed</li>
				<li>Packed</li>
				<li>Shipped</li>
				<li>Delivered</li>
			</ol>
		</Steps>

		<div class="order__item">
			<div class="order__thumb" aria-hidden="true"></div>
			<div class="order__item-main">
				<span class="order__item-name">Aurora Desk Lamp</span>
				<Rating value={4.5} size="sm" label="4.5 out of 5 stars" />
				<span class="order__item-meta">Qty 1 · $89.00</span>
			</div>
			<Button variant="subtle" size="sm">Track</Button>
		</div>

		<div class="order__history">
			<span class="order__history-label">Shipment history</span>
			<Timeline>
				<ol>
					<li><strong>Out for delivery</strong><time>Today, 8:02 AM</time></li>
					<li><strong>Arrived at local facility</strong><time>Yesterday, 11:40 PM</time></li>
					<li>
						<strong>Shipped</strong>
						<time>Jul 5</time>
						<p>Left the warehouse via GroundExpress.</p>
					</li>
					<li><strong>Packed</strong><time>Jul 4</time></li>
					<li><strong>Order placed</strong><time>Jul 3</time></li>
				</ol>
			</Timeline>
		</div>
	</div>
</MockFrame>

<style>
	.order {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		padding: var(--space-5);
	}

	.order__head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.order__title {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		color: var(--fg-0);
	}

	.order__sub {
		font-size: var(--text-sm);
		color: var(--fg-2);
	}

	.order__item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		background: var(--bg-1);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-md);
	}

	.order__thumb {
		width: 3rem;
		height: 3rem;
		flex: none;
		border-radius: var(--radius-md);
		background: linear-gradient(135deg, var(--accent), var(--accent-3));
	}

	.order__item-main {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		flex: 1;
		min-width: 0;
	}

	.order__item-name {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--fg-0);
	}

	.order__item-meta {
		font-size: var(--text-xs);
		color: var(--fg-2);
	}

	.order__history-label {
		display: block;
		margin-bottom: var(--space-3);
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--fg-2);
	}
</style>
