<script lang="ts">
	import type { TokenRegister } from "@xtyle/core";
	import {
		Avatar,
		Badge,
		Button,
		Card,
		Cluster,
		Eyebrow,
		Grid,
		Heading,
		List,
		Markdown,
		Pagination,
		Redact,
		Separator,
		Stack,
		Text,
	} from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	const queue = [
		{ value: "4812", label: "Contrast fails on a pinned surface", trail: "2m" },
		{ value: "4809", label: "Grid sidebar squeezes on mobile", trail: "18m" },
		{ value: "4801", label: "Toc renders no rows in Svelte", trail: "1h" },
		{ value: "4796", label: "Which algorithm for a print theme?", trail: "3h" },
		{ value: "4788", label: "Emitting Monaco from a pack", trail: "yesterday" },
	];

	const reply = `Confirmed on \`xtyle-hc\` and \`xtyle-loud\`. The cause is that **the inks are polarized once**, by the page,
and never reconsidered against a surface that moved to the other pole.

- pin \`--bg-1\` to a mid-gray and \`--bg-2\` follows it correctly
- the four \`--fg-*\` tokens do not re-thread
- the audit reports it, loudly, as twelve failing pairs

The theme is genuinely over-constrained: one ink cannot read on surfaces that straddle
the light/dark line. \`surfacePolarity\` now names that cause in the summary.`;
</script>

<MockFrame {register} title="Support — inbox">
	<div class="inbox">
		<Grid sidebar="19rem" side="start" minColWidth="24rem" gap={5}>
			<aside>
				<Card compact>
					<Stack gap={3}>
						<Cluster gap={2} align="center">
							<Text size="xs" tone="subtle" mono>Queue</Text>
							<Badge tone="accent" variant="soft">5 open</Badge>
						</Cluster>
						<List items={queue} label="Open tickets" selection="single" interaction="selectable" />
						<Separator />
						<Pagination page={1} total={4} size="sm" label="Queue pages" />
					</Stack>
				</Card>
			</aside>

			<Stack gap={4}>
				<Card>
					<Stack gap={4}>
						<Stack gap={2}>
							<Eyebrow>Ticket 4812</Eyebrow>
							<Heading level={2} size="xl">Contrast fails on a pinned surface</Heading>
							<Cluster gap={2} align="center">
								<Avatar userName="Ada Lovelace" size="sm" />
								<Text size="sm" tone="muted">opened by Ada Lovelace</Text>
								<Badge tone="warn" variant="soft">needs reply</Badge>
							</Cluster>
						</Stack>

						<Separator />

						<Stack gap={2}>
							<Text size="xs" tone="subtle" mono>Reporter contact</Text>
							<Cluster gap={2} align="center">
								<Redact label="Reveal email" mode="blur">ada@analytical-engine.example</Redact>
								<Redact label="Reveal account id" mode="block" revealed>acct_8842-QX</Redact>
							</Cluster>
						</Stack>

						<Separator />

						<Markdown source={reply} />

						<Cluster gap={2}>
							<Button variant="solid">Reply</Button>
							<Button variant="subtle">Resolve</Button>
						</Cluster>
					</Stack>
				</Card>
			</Stack>
		</Grid>
	</div>
</MockFrame>

<style>
	.inbox {
		padding: var(--space-5);
		background: var(--bg-0);
	}
</style>
