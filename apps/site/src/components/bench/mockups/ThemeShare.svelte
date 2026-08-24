<script lang="ts">
	import type { TokenRegister } from "@xtyle/core";
	import {
		Accordion,
		Badge,
		Button,
		Card,
		Cluster,
		ColorPicker,
		Eyebrow,
		Grid,
		Heading,
		QrCode,
		SchemeToggle,
		Separator,
		Stack,
		Text,
		ThemeSwatch,
	} from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	const shareUrl = "https://xtyle.dev/bench/themes?a=xtyle-default&bg=0b0d12&ac=6ea8fe";

	const advanced = [
		{
			value: "knobs",
			header: "Advanced",
			body: "Knobs and token overrides ride along in the link, so a shared theme reproduces exactly rather than approximately.",
		},
		{
			value: "travels",
			header: "What travels",
			body: "The algorithm id, the anchors, every knob you turned, and any token you pinned. Nothing else is needed to re-derive.",
		},
	];

	const surfaces = ["--bg-0", "--bg-1", "--bg-2", "--bg-3"];
	const roles = ["--accent", "--success", "--warn", "--danger", "--info"];
</script>

<MockFrame {register} title="Share theme — Studio">
	<div class="share">
		<Grid sidebar="18rem" minColWidth="22rem" gap={5}>
			<Stack gap={5}>
				<Card>
					<Stack gap={4}>
						<Stack gap={2}>
							<Eyebrow>Handoff</Eyebrow>
							<Heading level={2} size="xl">Share this theme</Heading>
							<Text tone="muted">
								A theme is three anchors and a named algorithm, so the whole thing fits
								in a link. Scan it to open the same derivation on a phone.
							</Text>
						</Stack>

						<Separator />

						<Stack gap={3}>
							<Text size="xs" tone="subtle" mono>Surfaces</Text>
							<ThemeSwatch tokens={surfaces} labels size="md" />
							<Text size="xs" tone="subtle" mono>Roles</Text>
							<ThemeSwatch tokens={roles} labels size="md" />
						</Stack>
					</Stack>
				</Card>

				<Card>
					<Stack gap={3}>
						<Heading level={3} size="md">Adjust before you send</Heading>
						<Cluster gap={4} align="center">
							<ColorPicker value="#6ea8fe" trigger label="Accent colour" />
							<SchemeToggle scheme="dark" label="Scheme" />
						</Cluster>
						<Accordion sections={advanced}>
							{#snippet panel(value)}
								{advanced.find((s) => s.value === value)?.body}
							{/snippet}
						</Accordion>
					</Stack>
				</Card>
			</Stack>

			<Stack gap={4}>
				<Card compact>
					<Stack gap={3} align="center">
						<Text size="xs" tone="subtle" mono>Scan to open</Text>
						<QrCode data={shareUrl} ecLevel="M" />
						<Badge tone="success" variant="soft">link is live</Badge>
					</Stack>
				</Card>
				<Card compact>
					<Stack gap={2}>
						<Text size="xs" tone="subtle" mono>Or copy</Text>
						<Button variant="subtle" size="sm" block>Copy share link</Button>
						<Button variant="ghost" size="sm" block>Export CSS</Button>
					</Stack>
				</Card>
			</Stack>
		</Grid>
	</div>
</MockFrame>

<style>
	.share {
		padding: var(--space-5);
		background: var(--bg-0);
	}
</style>
