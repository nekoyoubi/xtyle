<script lang="ts">
	import type { TokenRegister } from "@xtyle/core";
	import {
		Alert,
		Badge,
		Breadcrumb,
		Button,
		Card,
		Cluster,
		Code,
		Eyebrow,
		Grid,
		Heading,
		Icon,
		Kbd,
		Link,
		Separator,
		Stack,
		Text,
		Toc,
	} from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	const crumbs = [
		{ label: "Docs", href: "#" },
		{ label: "Guides", href: "#" },
		{ label: "Deriving a theme" },
	];

	const outline = [
		{ id: "anchors", label: "Anchors", level: 1 },
		{ id: "knobs", label: "Knobs", level: 1 },
		{ id: "strategies", label: "Accent strategies", level: 2 },
		{ id: "density", label: "Density", level: 2 },
		{ id: "overrides", label: "Token overrides", level: 1 },
		{ id: "emit", label: "Emitting", level: 1 },
	];

	const sample = `import { derive, emitCss } from "@xtyle/core";
import { getAlgorithm } from "@xtyle/core/algorithms";

const register = derive(getAlgorithm("xtyle-default"), {
  anchors: { bg: "#0b0d12", accent: "#6ea8fe" },
  knobs: { density: "comfortable" },
});

document.head.append(
  Object.assign(document.createElement("style"), { textContent: emitCss(register) }),
);`;
</script>

<MockFrame {register} title="Deriving a theme — xtyle docs">
	<div class="docs">
		<Breadcrumb items={crumbs} />

		<Grid sidebar="15rem" minColWidth="24rem" gap={6}>
			<article class="docs__body">
				<Stack gap={5}>
					<Stack gap={2}>
						<Eyebrow>Guides</Eyebrow>
						<Heading level={1} size="3xl">Deriving a theme</Heading>
						<Text tone="muted">
							Three input tiers, each optional on top of the last. Pick an algorithm and
							you already have a working theme.
						</Text>
						<Cluster gap={2}>
							<Badge tone="accent" variant="soft">guide</Badge>
							<Badge tone="info" variant="soft">8 min read</Badge>
						</Cluster>
					</Stack>

					<Separator />

					<Stack gap={3}>
						<Heading level={2} size="xl" id="anchors">Anchors</Heading>
						<Text>
							An anchor is a colour you already know you want: the page background, the
							ink on it, and the accent that carries your brand. Everything else is
							derived from those three, so a theme is three decisions wide before it is
							three hundred tokens deep.
						</Text>
						<Alert severity="info">
							{#snippet title()}Anchors are optional too{/snippet}
							Omit them and the algorithm supplies its own. <Link href="#">xtyle-hc</Link>
							anchors darker than the rest on purpose.
						</Alert>
					</Stack>

					<Stack gap={3}>
						<Heading level={2} size="xl" id="knobs">Knobs</Heading>
						<Text>
							Knobs are the algorithm's own dials, declared in its manifest rather than
							fixed by the engine. Press <Kbd>?</Kbd> in the builder to list the ones the
							current algorithm accepts.
						</Text>
						<Code lang="ts" code={sample} lineNumbers caption="theme.ts" />
					</Stack>

					<Stack gap={3}>
						<Heading level={3} size="lg" id="strategies">Accent strategies</Heading>
						<Text>
							How many accents the ramp carries and how far apart they sit. A
							<Text as="span" mono>duo</Text> keeps one hue and splits it by lightness; a
							<Text as="span" mono>fan</Text> walks the wheel and separates by hue.
						</Text>
					</Stack>

					<Stack gap={3}>
						<Heading level={3} size="lg" id="density">Density</Heading>
						<Text>
							One dial over the whole spacing and radius scale. Every component reads the
							derived step, so the change lands everywhere at once rather than per-surface.
						</Text>
					</Stack>

					<Stack gap={3}>
						<Heading level={3} size="lg" id="overrides">Token overrides</Heading>
						<Text>
							The universal escape hatch: pin any token and it survives derivation
							verbatim, while everything downstream re-solves around it.
						</Text>
					</Stack>

					<Stack gap={3}>
						<Heading level={2} size="xl" id="emit">Emitting</Heading>
						<Text>
							A derived theme is CSS custom properties and nothing else, so emit it once
							and the browser cascade does the rest. No engine has to be running to use it.
						</Text>
					</Stack>
				</Stack>
			</article>

			<aside class="docs__rail">
				<Stack gap={4}>
					<Card compact>
						<Toc items={outline} label="On this page" />
					</Card>
					<Card compact>
						<Stack gap={2}>
							<Text size="xs" tone="subtle" mono>Was this useful?</Text>
							<Cluster gap={2}>
								<Button size="sm" variant="subtle"><Icon name="check" /> Yes</Button>
								<Button size="sm" variant="ghost">No</Button>
							</Cluster>
						</Stack>
					</Card>
				</Stack>
			</aside>
		</Grid>
	</div>
</MockFrame>

<style>
	.docs {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		padding: var(--space-5);
		background: var(--bg-0);
	}
	.docs__rail {
		align-self: start;
	}
</style>
