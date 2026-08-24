<script lang="ts">
	import type { TokenRegister } from "@xtyle/core";
	import {
		Badge,
		Button,
		Card,
		Cluster,
		Combobox,
		DatePicker,
		Dropzone,
		Empty,
		Field,
		Grid,
		Heading,
		Icon,
		Separator,
		Skeleton,
		Spinner,
		SplitButton,
		Stack,
		Switch,
		Text,
	} from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	const publishActions = [
		{ label: "Publish now", value: "now" },
		{ label: "Schedule for later", value: "later", hint: "Ctrl+L" },
		{ label: "Save as draft", value: "draft" },
		{ separator: true },
		{ label: "Discard", value: "discard", intent: "danger" },
	];

	const tags = ["derivation", "tokens", "algorithms", "components", "accessibility"];
</script>

<MockFrame {register} title="New post — Composer">
	<div class="composer">
		<Grid sidebar="17rem" minColWidth="22rem" gap={5}>
			<Stack gap={5}>
				<Card>
					<Stack gap={4}>
						<Field label="Title" value="Deriving a theme from three anchors" />
						<Field label="Summary" value="What the algorithm does with a background, an ink, and an accent." />
						<Combobox
							label="Tags"
							multiple
							options={tags}
							values={["tokens", "algorithms"]}
							placeholder="Add a tag…"
						/>
					</Stack>
				</Card>

				<Card>
					<Stack gap={3}>
						<Heading level={3} size="md">Cover image</Heading>
						<Dropzone accept="image/*" maxFiles={1} maxSize="4mb" />
					</Stack>
				</Card>

				<Card>
					<Stack gap={3}>
						<Cluster gap={2} align="center">
							<Heading level={3} size="md">Related posts</Heading>
							<Spinner size="sm" ariaLabel="Finding related posts" />
							<Text size="sm" tone="subtle">searching…</Text>
						</Cluster>
						<Stack gap={2}>
							<Skeleton shape="text" />
							<Skeleton shape="text" style="width: 82%" />
							<Skeleton shape="text" style="width: 64%" />
							<Skeleton shape="line" />
						</Stack>
					</Stack>
				</Card>

				<Card>
					<Stack gap={3}>
						<Heading level={3} size="md">Comments</Heading>
						<Empty>
							<div class="xtyle-empty__media"><Icon name="info" /></div>
							<h3>Nothing here yet</h3>
							<p>Comments open once the post is published.</p>
						</Empty>
					</Stack>
				</Card>
			</Stack>

			<Stack gap={4}>
				<Card compact>
					<Stack gap={3}>
						<Cluster gap={2} align="center">
							<Text size="xs" tone="subtle" mono>Status</Text>
							<Badge tone="warn" variant="soft">draft</Badge>
						</Cluster>
						<Separator />
						<DatePicker label="Publish at" value="2026-03-04" />
						<Switch label="Notify subscribers" checked />
						<Switch label="Allow comments" />
					</Stack>
				</Card>

				<Card compact>
					<Stack gap={3}>
						<Text size="xs" tone="subtle" mono>Ready to go</Text>
						<SplitButton items={publishActions} menuLabel="Publishing options" block>
							Publish
						</SplitButton>
						<Button variant="ghost" size="sm" block>Preview</Button>
					</Stack>
				</Card>
			</Stack>
		</Grid>
	</div>
</MockFrame>

<style>
	.composer {
		padding: var(--space-5);
		background: var(--bg-0);
	}
</style>
