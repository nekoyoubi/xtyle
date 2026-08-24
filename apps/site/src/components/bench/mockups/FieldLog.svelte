<script lang="ts">
	import type { TokenRegister } from "@xtyle/core";
	import {
		Avatar,
		Badge,
		BottomNav,
		Button,
		Card,
		Cluster,
		Dialog,
		Field,
		Heading,
		Icon,
		MobileShell,
		Reveal,
		Select,
		Separator,
		Sheet,
		Stack,
		Text,
	} from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	let addOpen = $state(false);
	let discarding = $state<string | null>(null);
	let section = $state("log");

	const tabs = [
		{ value: "log", label: "Log", icon: "bookmark", badge: 4 },
		{ value: "map", label: "Map", icon: "search" },
		{ value: "species", label: "Species", icon: "folder" },
		{ value: "you", label: "You", icon: "gear" },
	];

	const observations = [
		{ id: "obs-1", name: "Common redpoll", where: "Alder stand, north bank", when: "06:41", count: 3, tone: "success", status: "confirmed" },
		{ id: "obs-2", name: "Sharp-shinned hawk", where: "Ridge, above the scree", when: "07:05", count: 1, tone: "warn", status: "review" },
		{ id: "obs-3", name: "Boreal chickadee", where: "Spruce edge, by the culvert", when: "07:38", count: 6, tone: "success", status: "confirmed" },
		{ id: "obs-4", name: "Unidentified vireo", where: "Willow thicket", when: "08:02", count: 1, tone: "neutral", status: "unsure" },
	] as const;
</script>

<MockFrame {register} title="Field Notes — a phone-shaped app">
	<div class="fn">
		<div class="fn__device">
			<MobileShell heading="Field Notes" mainId="fn-main">
				{#snippet brand()}
					<Icon name="bookmark" tone="accent" />
				{/snippet}
				{#snippet actions()}
					<Button variant="ghost" size="sm" iconOnly aria-label="Search the log">
						{#snippet iconStart()}<Icon name="search" />{/snippet}
					</Button>
					<Avatar userName="Wren Osei" size="sm" tone="accent-2" status="success" />
				{/snippet}

				<Stack gap={3} class="fn__body">
					<Cluster gap={2} align="center">
						<Heading level={2} size="sm">Today</Heading>
						<Badge size="sm" tone="neutral" variant="soft">{observations.length}</Badge>
						<Text size="xs" tone="subtle">swipe a row</Text>
					</Cluster>

					<Stack gap={2}>
						{#each observations as entry (entry.id)}
							<Reveal
								name="fn-log"
								label={`${entry.name}, ${entry.where}`}
								startTone="success"
								startGrip="check"
								startBehavior="latch"
								endTone="danger"
								endGrip="trash"
								endBehavior="commit"
								travel="0.4"
								latchAt="35%"
								endCommitAt="0.7"
								oncommit={(event) => { if (event.detail.direction === "end") discarding = entry.name; }}
							>
								{#snippet start()}
									<Text as="span" size="sm">Confirm</Text>
								{/snippet}
								{#snippet end()}
									<Text as="span" size="sm">Discard</Text>
								{/snippet}
								<Card compact>
									<Cluster gap={3} align="center">
										<Stack gap={0}>
											<Text size="sm" weight="semibold">{entry.name}</Text>
											<Text size="xs" tone="subtle">{entry.where}</Text>
										</Stack>
										<Stack gap={0} class="fn__meta">
											<Text size="xs" tone="subtle" mono>{entry.when}</Text>
											<Badge size="sm" tone={entry.tone} variant="soft">{entry.count}</Badge>
										</Stack>
									</Cluster>
								</Card>
							</Reveal>
						{/each}
					</Stack>

					<Button variant="solid" tone="accent" block onclick={() => (addOpen = true)}>
						{#snippet iconStart()}<Icon name="plus" />{/snippet}
						Log an observation
					</Button>
				</Stack>

				{#snippet nav()}
					<BottomNav {tabs} bind:value={section} label="Field Notes sections" />
				{/snippet}
			</MobileShell>
		</div>

		<Stack gap={3} class="fn__aside">
			<Heading level={2} size="sm">What a phone asks of the set</Heading>
			<Text size="sm" tone="muted">
				The shell absorbs the notch and the home indicator itself, so the scrolling column between
				the bar and the nav never slides under hardware. Every row is a <code>reveal</code>: drag one
				right to latch a confirmation, or left past 70% to commit a discard.
			</Text>
			<Separator />
			<Text size="sm" tone="muted">
				<code>Log an observation</code> opens a bottom sheet, which is the modal a phone reaches for
				instead of a dialog. It pins to the viewport edge rather than to this frame, so it covers the
				page while it is up.
			</Text>
			<Cluster gap={2} align="center">
				<Text size="xs" tone="subtle" mono>section</Text>
				<Badge size="sm" tone="accent" variant="soft">{section}</Badge>
			</Cluster>
		</Stack>
	</div>
</MockFrame>

<Sheet
	bind:open={addOpen}
	side="bottom"
	size="md"
	heading="Log an observation"
	closeLabel="Close the form"
>
	<Stack gap={4}>
		<Field label="Species" value="Boreal chickadee" />
		<Select label="Certainty" value="confident">
			<option value="confident">Confident</option>
			<option value="probable">Probable</option>
			<option value="unsure">Unsure</option>
		</Select>
		<Field label="Where" value="Spruce edge, by the culvert" />
	</Stack>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => (addOpen = false)}>Cancel</Button>
		<Button variant="solid" tone="accent" onclick={() => (addOpen = false)}>Save</Button>
	{/snippet}
</Sheet>

<Dialog open={discarding !== null} heading="Discard this observation?" onclose={() => (discarding = null)}>
	<Text size="sm" tone="muted">
		{discarding ?? "This record"} leaves the day's log. Nothing is written to the species list.
	</Text>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => (discarding = null)}>Keep it</Button>
		<Button variant="solid" tone="danger" onclick={() => (discarding = null)}>Discard</Button>
	{/snippet}
</Dialog>

<style>
	.fn {
		display: grid;
		grid-template-columns: 22rem minmax(0, 26rem);
		justify-content: center;
		gap: var(--space-6);
		padding: var(--space-5);
		background: var(--bg-0);
		align-items: start;
	}

	.fn__device {
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-xl);
		overflow: hidden;
		box-shadow: var(--elevation-3);
	}

	.fn__device :global(xtyle-mobile-shell::part(shell)) {
		height: 34rem;
	}

	.fn :global(.fn__body) {
		padding: var(--space-4);
	}

	.fn :global(.fn__meta) {
		margin-inline-start: auto;
		align-items: flex-end;
	}

	@media (max-width: 720px) {
		.fn {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
