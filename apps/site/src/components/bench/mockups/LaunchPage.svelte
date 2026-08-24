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
		NinePatch,
		Parallax,
		Separator,
		Stack,
		Stat,
		Text,
	} from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	const svg = (body: string): string =>
		"data:image/svg+xml," +
		encodeURIComponent(
			`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice">${body}</svg>`,
		);

	const far = svg(
		'<rect width="640" height="360" fill="#11131a"/><g fill="#ffffff" opacity="0.35">' +
			'<circle cx="90" cy="70" r="2"/><circle cx="220" cy="40" r="1.5"/><circle cx="360" cy="95" r="2"/>' +
			'<circle cx="500" cy="55" r="1.5"/><circle cx="600" cy="120" r="2"/><circle cx="150" cy="150" r="1.5"/></g>',
	);
	const mid = svg(
		'<g fill="#ffffff" opacity="0.10"><ellipse cx="160" cy="250" rx="200" ry="70"/>' +
			'<ellipse cx="520" cy="230" rx="170" ry="60"/></g>',
	);
	const near = svg(
		'<path d="M0 250 L140 175 L280 255 L420 165 L540 240 L640 195 L640 360 L0 360 Z" fill="#000000" opacity="0.55"/>',
	);

	const frame = svg(
		'<rect x="6" y="6" width="628" height="348" rx="26" fill="none" stroke="#ffffff" stroke-width="12"/>' +
			'<rect x="26" y="26" width="588" height="308" rx="14" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.6"/>',
	);
</script>

<MockFrame {register} title="Meridian — launch">
	<div class="launch">
		<Parallax minHeight="20rem" amplitude={90}>
			<img data-speed="0.3" src={far} alt="" />
			<img data-speed="0.6" data-direction="e" src={mid} alt="" />
			<img data-speed="0.9" src={near} alt="" />
			<Stack gap={3} align="center" style="text-align: center;">
				<Eyebrow>Now in open beta</Eyebrow>
				<Heading level={1} size="2xl">Ship the whole set, not the swatch</Heading>
				<Text size="lg">One algorithm, every surface, no drift.</Text>
				<Cluster gap={2}>
					<Button variant="solid">Start free</Button>
					<Button variant="outline">Read the docs</Button>
				</Cluster>
			</Stack>
		</Parallax>

		<div class="launch__body">
			<Stack gap={5}>
				<Grid minColWidth="12rem" gap={4}>
					<Stat label="Tokens derived" trend="flat" delta="per theme">310</Stat>
					<Stat label="Components" trend="up" delta="+7">92</Stat>
					<Stat label="Algorithms" trend="flat" delta="blessed">5</Stat>
				</Grid>

				<Separator />

				<Grid sidebar="20rem" minColWidth="20rem" gap={5}>
					<Stack gap={3}>
						<Cluster gap={2} align="center">
							<Heading level={2} size="lg">Framed, not stretched</Heading>
							<Badge tone="info" variant="soft">nine-patch</Badge>
						</Cluster>
						<Text tone="muted">
							The border is artwork sliced into nine regions, so the corners keep their radius at any size
							and only the edges repeat. The tint comes from the theme.
						</Text>
						<NinePatch src={frame} slice="12%" tint="var(--accent)" fill>
							<div class="launch__framed">
								<Stack gap={2}>
									<Heading level={3} size="sm">Release 0.12</Heading>
									<Text size="sm" tone="muted">
										A carved frame a token cannot describe, scaled without smearing.
									</Text>
								</Stack>
							</div>
						</NinePatch>
					</Stack>

					<aside>
						<Card compact>
							<Stack gap={3}>
								<Text size="xs" tone="subtle" mono>What ships</Text>
								<Stack gap={2}>
									<Text size="sm">Derived tokens, emitted as plain custom properties.</Text>
									<Text size="sm">A component set co-designed against them.</Text>
									<Text size="sm">An effect layer that honours reduced motion.</Text>
								</Stack>
								<Separator />
								<Button variant="subtle" block>See the changelog</Button>
							</Stack>
						</Card>
					</aside>
				</Grid>
			</Stack>
		</div>
	</div>
</MockFrame>

<style>
	.launch {
		background: var(--bg-0);
	}

	.launch__body {
		padding: var(--space-5);
	}

	.launch__framed {
		padding: var(--space-6);
	}
</style>
