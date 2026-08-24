<script lang="ts">
	import type { TokenRegister } from "@xtyle/core";
	import {
		AppShell,
		Avatar,
		AvatarGroup,
		Badge,
		Button,
		Calendar,
		Card,
		Chart,
		Checkbox,
		Cluster,
		Dock,
		Grid,
		Heading,
		Icon,
		Kbd,
		Menu,
		Popover,
		Progress,
		Separator,
		Splitter,
		Stack,
		Statusbar,
		Switch,
		Text,
		Toast,
		Toolbar,
	} from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	const boardMenu = [
		{ heading: "Board" },
		{ label: "New task", value: "new", hint: "N" },
		{ label: "Import from CSV", value: "import" },
		{ label: "Group by assignee", value: "group" },
		{ separator: true },
		{ label: "Archive sprint", value: "archive", intent: "danger" },
	];

	const columns = [
		{
			label: "In progress",
			tone: "accent",
			cards: [
				{ id: "ATL-214", title: "Re-derive the ramp when an anchor moves", owner: "Rin Okabe", points: 5, tag: "engine" },
				{ id: "ATL-221", title: "Dock rail remembers its width per project", owner: "Dana Ruiz", points: 3, tag: "shell" },
			],
		},
		{
			label: "In review",
			tone: "warn",
			cards: [
				{ id: "ATL-207", title: "Calendar announces its decorated days", owner: "Priya Nayar", points: 2, tag: "a11y" },
				{ id: "ATL-219", title: "Burndown reads its series off the register", owner: "Rin Okabe", points: 8, tag: "charts" },
			],
		},
		{
			label: "Done",
			tone: "success",
			cards: [
				{ id: "ATL-198", title: "Statusbar collapses instead of clipping", owner: "Dana Ruiz", points: 3, tag: "shell" },
				{ id: "ATL-203", title: "Splitter settles off the motion tokens", owner: "Ilya Bakhtin", points: 5, tag: "gesture" },
			],
		},
	] as const;

	const burndown = [
		{ name: "Remaining", points: [64, 61, 55, 55, 48, 40, 37, 28, 22, 12].map((value, at) => ({ at, value })) },
		{ name: "Ideal", points: [64, 57, 50, 43, 36, 29, 22, 15, 8, 0].map((value, at) => ({ at, value })) },
	];

	const sprintDays = {
		"2026-03-02": { dots: ["accent"], label: "sprint opens" },
		"2026-03-05": { dots: ["accent-2", "success"], label: "2 reviews due" },
		"2026-03-09": { busy: true, label: "release freeze" },
		"2026-03-11": { dots: ["warn"], label: "demo" },
		"2026-03-13": { dots: ["danger"], label: "sprint closes" },
	};

	const activity = [
		{ who: "Priya Nayar", what: "moved ATL-207 to In review", when: "11m" },
		{ who: "Ilya Bakhtin", what: "closed ATL-203", when: "40m" },
		{ who: "Dana Ruiz", what: "left a comment on ATL-221", when: "1h" },
		{ who: "Rin Okabe", what: "opened ATL-219", when: "3h" },
	];
</script>

<MockFrame {register} title="Atlas — Sprint 24">
	<div class="ws">
		<AppShell
			class="ws__shell"
			skipLink
			mainId="ws-board"
			leftSize={164}
			leftResizable
			leftMin={140}
			leftMax={240}
			rightSize={236}
			rightResizable
			rightMin={200}
			rightMax={320}
		>
			{#snippet toolbar()}
				<Toolbar size="sm" landmark>
					{#snippet start()}
						<span class="ws__brand">
							<Icon name="palette" size="sm" tone="accent" />
							<Text as="span" size="sm" weight="semibold">Atlas</Text>
							<Badge size="sm" tone="neutral" variant="outline">Sprint 24</Badge>
						</span>
					{/snippet}
					{#snippet center()}
						<Menu label="Board" items={boardMenu} />
					{/snippet}
					{#snippet end()}
						<span class="ws__actions">
							<Popover placement="bottom" align="end" arrow label="Filter tasks">
								{#snippet trigger()}
									<Button variant="outline" size="sm">
										{#snippet iconStart()}<Icon name="search" />{/snippet}
										Filter
									</Button>
								{/snippet}
								<Stack gap={3} class="ws__filter">
									<Text size="xs" tone="subtle" mono>Showing</Text>
									<Checkbox checked>Assigned to me</Checkbox>
									<Checkbox>Blocked</Checkbox>
									<Checkbox checked>Carried over</Checkbox>
									<Separator />
									<Switch label="Hide done" size="sm" />
								</Stack>
							</Popover>
							<AvatarGroup size="sm" overflow={3} label="Sprint 24 team">
								<Avatar userName="Rin Okabe" size="sm" tone="accent" />
								<Avatar userName="Dana Ruiz" size="sm" tone="accent-2" />
								<Avatar userName="Priya Nayar" size="sm" tone="accent-3" status="success" />
							</AvatarGroup>
						</span>
					{/snippet}
				</Toolbar>
			{/snippet}

			{#snippet left()}
				<Dock nav label="Projects" size="sm">
					<Stack gap={4}>
						<Stack gap={1}>
							<Button variant="subtle" tone="accent" block size="sm">Board</Button>
							<Button variant="ghost" tone="neutral" block size="sm">Backlog</Button>
							<Button variant="ghost" tone="neutral" block size="sm">Roadmap</Button>
							<Button variant="ghost" tone="neutral" block size="sm">Releases</Button>
						</Stack>
						<Separator />
						<Progress
							label="Sprint"
							value={62}
							size="sm"
							tone="accent"
							reading="26/42"
						/>
					</Stack>
				</Dock>
			{/snippet}

			<Stack gap={4}>
				<Grid minColWidth="8.5rem" gap={2}>
					{#each columns as column (column.label)}
						<Stack gap={2}>
							<Cluster gap={2} align="center">
								<Heading level={2} size="xs">{column.label}</Heading>
								<Badge size="sm" tone={column.tone} variant="soft">{column.cards.length}</Badge>
							</Cluster>
							{#each column.cards as card (card.id)}
								<Card compact>
									<Stack gap={2}>
										<Text size="xs" tone="subtle" mono>{card.id}</Text>
										<Text size="sm">{card.title}</Text>
										<Cluster gap={2} align="center">
											<Avatar userName={card.owner} size="sm" tone="neutral" />
											<Badge size="sm" tone="neutral" variant="outline">{card.tag}</Badge>
											<Text size="xs" tone="subtle">{card.points} pts</Text>
										</Cluster>
									</Stack>
								</Card>
							{/each}
						</Stack>
					{/each}
				</Grid>

				<Card>
					{#snippet header()}
						<Cluster gap={2} align="center">
							<Heading level={2} size="sm">Burndown</Heading>
							<Badge size="sm" tone="success" variant="soft">on track</Badge>
						</Cluster>
					{/snippet}
					<Chart
						series={burndown}
						xScale="linear"
						variant="area"
						curve="smooth"
						scheme="accents"
						label="Points remaining by working day"
						xLabel="Day"
						yLabel="Points"
						height={180}
					/>
				</Card>
			</Stack>

			{#snippet right()}
				<Dock label="Sprint" size="sm">
					<div class="ws__aside">
						<div class="ws__aside-top">
							<Calendar
								month="2026-03"
								value="2026-03-09"
								size="sm"
								hideOutsideDays
								decorations={sprintDays}
								label="Sprint 24 calendar"
							/>
						</div>
						<Splitter
							orientation="horizontal"
							var="--ws-aside"
							value={248}
							min={190}
							max={320}
							step={8}
							line
							label="Resize the sprint calendar"
						/>
						<div class="ws__aside-bottom">
							<Stack gap={3}>
								<Text size="xs" tone="subtle" mono>Activity</Text>
								<Stack gap={3}>
									{#each activity as entry (entry.what)}
										<Cluster gap={2} align="start">
											<Avatar userName={entry.who} size="sm" tone="neutral" />
											<Stack gap={0}>
												<Text size="xs">{entry.what}</Text>
												<Text size="xs" tone="subtle">{entry.when} ago</Text>
											</Stack>
										</Cluster>
									{/each}
								</Stack>
							</Stack>
						</div>
					</div>
				</Dock>
			{/snippet}

			{#snippet statusbar()}
				<Statusbar separated label="Workspace status">
					<span class="xtyle-statusbar__item xtyle-statusbar__item--strong">Sprint 24</span>
					<span class="xtyle-statusbar__item">6 open</span>
					<span class="xtyle-statusbar__item">2 in review</span>
					<span class="xtyle-statusbar__spacer"></span>
					<span class="xtyle-statusbar__item">4 days left</span>
					<span class="xtyle-statusbar__item ws__status-kbd">
						<Kbd size="sm">Ctrl</Kbd><Kbd size="sm">K</Kbd>
					</span>
				</Statusbar>
			{/snippet}
		</AppShell>

		<div class="ws__toasts">
			<Toast tone="success" severity="success" closable>ATL-203 is done.</Toast>
			<Toast tone="info" severity="info" actionLabel="Review">Rin Okabe wants a review.</Toast>
		</div>
	</div>
</MockFrame>

<style>
	.ws {
		position: relative;
		background: var(--bg-0);
	}

	.ws :global(xtyle-app-shell::part(app)) {
		height: 36rem;
	}

	.ws__brand,
	.ws__actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.ws :global(.ws__filter) {
		min-width: 12rem;
	}

	.ws__aside {
		display: grid;
		grid-template-rows: var(--ws-aside, 248px) auto minmax(0, 1fr);
		height: 100%;
		min-height: 0;
	}

	.ws__aside-top,
	.ws__aside-bottom {
		min-height: 0;
		overflow: auto;
	}

	.ws__aside-bottom {
		padding-top: var(--space-3);
	}

	.ws__status-kbd {
		display: inline-flex;
		gap: var(--space-1);
	}

	.ws__toasts {
		position: absolute;
		right: var(--space-4);
		bottom: var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		width: min(13rem, 42%);
		z-index: var(--layer-toast, 60);
	}
</style>
