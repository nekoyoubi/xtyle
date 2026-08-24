<script lang="ts">
	import type { TokenRegister } from "@xtyle/core";
	import {
		Badge,
		Button,
		Card,
		Cluster,
		Eyebrow,
		Field,
		Grid,
		Heading,
		Progress,
		Separator,
		Stack,
		Text,
		ThemeCard,
		ThemePicker,
		ThemeScope,
	} from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	const candidates = [
		{ name: "House", algorithm: "xtyle-default", scheme: "dark" as const },
		{ name: "House / light", algorithm: "xtyle-default", scheme: "light" as const },
		{ name: "Quiet", algorithm: "xtyle-quiet", scheme: "dark" as const },
		{ name: "Loud", algorithm: "xtyle-loud", scheme: "dark" as const },
		{ name: "High contrast", algorithm: "xtyle-hc", scheme: "dark" as const },
		{ name: "Nite", algorithm: "nxi-nite", scheme: "dark" as const },
	];

	let picked = $state("Quiet");
	const chosen = $derived(candidates.find((c) => c.name === picked) ?? candidates[0]);
</script>

{#snippet sample()}
	<Card>
		<Stack gap={3}>
			<Cluster gap={2} align="center">
				<Heading level={3} size="sm">Invite a teammate</Heading>
				<Badge tone="info" variant="soft">beta</Badge>
			</Cluster>
			<Field label="Email" placeholder="ada@example.com" />
			<Progress value={62} label="Seats used" meter />
			<Cluster gap={2}>
				<Button variant="solid" size="sm">Send invite</Button>
				<Button variant="subtle" size="sm">Cancel</Button>
			</Cluster>
		</Stack>
	</Card>
{/snippet}

<MockFrame {register} title="Design review — candidate themes">
	<div class="review">
		<Stack gap={5}>
			<Stack gap={2}>
				<Eyebrow>Brand / handoff</Eyebrow>
				<Heading level={2} size="xl">Pick the one that survives the whole set</Heading>
				<Text tone="muted">
					Every panel below renders the same markup. Only the derivation differs.
				</Text>
			</Stack>

			<ThemePicker
				themes={candidates}
				value={picked}
				label="Candidate themes"
				swatches
				minColWidth="11rem"
				onpick={(detail) => (picked = detail.value)}
			/>

			<Separator />

			<Grid columns={2} gap={4}>
				<Stack gap={2}>
					<Text size="xs" tone="subtle" mono>xtyle-default · dark</Text>
					<ThemeScope algorithm="xtyle-default" scheme="dark" target="self">
						{@render sample()}
					</ThemeScope>
				</Stack>
				<Stack gap={2}>
					<Text size="xs" tone="subtle" mono>{chosen.algorithm} · {chosen.scheme}</Text>
					<ThemeScope algorithm={chosen.algorithm} scheme={chosen.scheme}>
						{@render sample()}
					</ThemeScope>
				</Stack>
			</Grid>

			<Separator />

			<Stack gap={3}>
				<Text size="sm" weight="semibold">The rest of the shortlist</Text>
				<Grid minColWidth="13rem" gap={3}>
					{#each candidates.slice(2) as c (c.name)}
						<ThemeCard
							algorithm={c.algorithm}
							scheme={c.scheme}
							name={c.name}
							interactive
							selected={picked === c.name}
							onselect={(detail) => (picked = detail.name ?? picked)}
						/>
					{/each}
				</Grid>
			</Stack>
		</Stack>
	</div>
</MockFrame>

<style>
	.review {
		padding: var(--space-5);
		background: var(--bg-0);
	}
</style>
