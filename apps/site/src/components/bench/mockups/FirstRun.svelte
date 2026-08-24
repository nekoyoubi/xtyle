<script lang="ts">
	import type { TokenRegister } from "@xtyle/core";
	import {
		Badge,
		Button,
		Card,
		Cluster,
		Eyebrow,
		Grid,
		Heading,
		List,
		Panel,
		Separator,
		Stack,
		Stat,
		Text,
		Toolbar,
		Tour,
	} from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	let drawerOpen = $state(false);
	let prepared = $state(0);
	let outcome = $state<string | null>(null);
	let taken = $state(false);

	const walkthrough = {
		id: "first-run",
		title: "Getting started",
		summary: "Three stops around the workspace.",
		steps: [
			{
				target: "[data-tour='new']",
				heading: "Start here",
				body: "Every board begins as an empty project. This is the only button you need on day one.",
				placement: "bottom",
			},
			{
				target: "[data-tour='archived']",
				heading: "Nothing is ever lost",
				body: "Archived work lives in this drawer. The tour opened it for you — a step can make what it points at.",
				placement: "top",
			},
			{
				target: "[data-tour='budget']",
				heading: "Watch the burn",
				body: "Spend against the month is the number most teams check first, so it sits above the fold.",
				placement: "left",
			},
		],
	};

	async function beforeStep(index: number) {
		prepared += 1;
		drawerOpen = index === 1;
		await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
	}

	const projects = [
		{ value: "p1", label: "Harbour rebuild", trail: "4 open" },
		{ value: "p2", label: "Signup funnel", trail: "1 open" },
		{ value: "p3", label: "Docs refresh", trail: "9 open" },
	];

	const archived = [
		{ value: "a1", label: "Q1 pricing test", trail: "Mar" },
		{ value: "a2", label: "Old marketing site", trail: "Jan" },
	];
</script>

<MockFrame {register} title="Meridian — first run">
	<div class="firstrun">
		<Stack gap={4}>
			<Toolbar>
				<Cluster gap={3} align="center">
					<Eyebrow>Workspace</Eyebrow>
					<Heading level={2} size="lg">Meridian</Heading>
					<Badge tone="accent" variant="soft">trial</Badge>
					<span class="firstrun__spacer"></span>
					<Button variant="solid" size="sm" data-tour="new">New project</Button>
					<Button variant="subtle" size="sm" data-tour-start onclick={() => (taken = false)}>Take the tour</Button>
				</Cluster>
			</Toolbar>

			<Grid sidebar="16rem" minColWidth="22rem" gap={4}>
				<Stack gap={4}>
					<Card>
						<Stack gap={3}>
							<Text size="sm" weight="semibold">Active projects</Text>
							<List items={projects} label="Active projects" interaction="selectable" selection="single" />
						</Stack>
					</Card>

					<Panel heading="Archived" open={drawerOpen}>
						<div data-tour="archived">
							<List items={archived} label="Archived projects" />
						</div>
					</Panel>
				</Stack>

				<aside>
					<Stack gap={3}>
						<Card compact>
							<Stack gap={2}>
								<div data-tour="budget">
									<Stat label="Spend this month" trend="up" delta="+12%">$4,180</Stat>
								</div>
								<Separator />
								<Text size="xs" tone="subtle">Budget resets on the 1st.</Text>
							</Stack>
						</Card>

						<Card compact>
							<Stack gap={1}>
								<Text size="xs" tone="subtle" mono>Tour</Text>
								<Text size="sm">prepared {prepared} {prepared === 1 ? "step" : "steps"}</Text>
								{#if outcome}
									<Text size="sm" tone="muted">{outcome}</Text>
								{/if}
							</Stack>
						</Card>
					</Stack>
				</aside>
			</Grid>
		</Stack>

		<Tour
			open={!taken}
			spec={walkthrough}
			{taken}
			{beforeStep}
			progress="dots"
			oncomplete={() => {
				taken = true;
				outcome = "finished";
			}}
			onskip={() => {
				taken = true;
				outcome = "skipped";
			}}
			ontargetmissing={(event) => (outcome = `no target for step ${event.detail.index + 1}`)}
		/>
	</div>
</MockFrame>

<style>
	.firstrun {
		padding: var(--space-5);
		background: var(--bg-0);
	}

	.firstrun__spacer {
		flex: 1;
	}
</style>
