<script lang="ts">
	import type { TokenRegister } from "@xtyle/core";
	import {
		Avatar,
		AvatarGroup,
		Badge,
		Button,
		Card,
		CardLink,
		Cluster,
		Dot,
		Eyebrow,
		Grid,
		Heading,
		Hero,
		Icon,
		Link,
		Progress,
		Rating,
		Ribbon,
		Section,
		Separator,
		Sparkline,
		Stack,
		Stat,
		Text,
	} from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	const nav = ["Product", "Pricing", "Docs", "Changelog"] as const;

	// The accent family is the brand axis here, not a semantic one: `accent` is the primary voice and
	// `accent-2` the secondary. Under `duo` that reads as two brands; under `shade` it collapses to one
	// hue in two depths — so every place a second accent appears it also carries a label, an icon, a
	// ribbon, or a different variant, and nothing is told apart by hue alone.
	const features = [
		{
			icon: "palette",
			tone: "accent",
			title: "Derive, don't decide",
			body: "Three anchors in, a whole token set out. Every surface, state, and pairing settles together.",
			cta: "See the engine",
		},
		{
			icon: "copy",
			tone: "accent-2",
			title: "One contract, every binding",
			body: "The same components in HTML, Svelte, and Astro, all reading the same register.",
			cta: "Browse bindings",
		},
		{
			icon: "eye",
			tone: "accent-3",
			title: "Contrast, guaranteed",
			body: "Text and fill pairs are graded at build. A theme that fails the audit never ships.",
			cta: "Read the audit",
		},
		{
			icon: "gear",
			tone: "accent-4",
			title: "Knobs all the way down",
			body: "Casual pickers on the surface, full token overrides underneath. No escape hatch needed.",
			cta: "Open the bench",
		},
		{
			icon: "maximize",
			tone: "accent-2",
			title: "Preview every pull request",
			body: "Each branch gets a live library at its own URL. Review the design, not the diff.",
			cta: "Wire up CI",
		},
		{
			icon: "download",
			tone: "accent",
			title: "Ship as plain CSS",
			body: "A finished theme is custom properties and the cascade. Nothing has to be running.",
			cta: "Export a theme",
		},
	] as const;

	const logos = [
		{ name: "Northwind", icon: "volume" },
		{ name: "Halcyon", icon: "bookmark" },
		{ name: "Fathom", icon: "search" },
		{ name: "Kiln", icon: "play" },
		{ name: "Meridian", icon: "maximize" },
	] as const;

	const numbers = [
		{ label: "Teams", value: "4,200", delta: "+18%", trend: "up", sentiment: "positive", caption: "shipping weekly" },
		{ label: "Themes derived", value: "126k", delta: "+9%", trend: "up", sentiment: "positive", caption: "this quarter" },
		{ label: "Token coverage", value: "100%", delta: "0", trend: "flat", sentiment: "neutral", caption: "across the set" },
		{ label: "Median build", value: "1.4s", delta: "-31%", trend: "down", sentiment: "positive", caption: "cold cache" },
	] as const;

	const tiers = [
		{
			name: "Starter",
			tone: "accent",
			price: "$0",
			per: "/ forever",
			blurb: "One project, the whole engine.",
			cta: "Start free",
			featured: false,
			perks: ["1 project, 3 themes", "Every component", "CSS + JSON export", "Community support"],
		},
		{
			name: "Studio",
			tone: "accent-2",
			price: "$24",
			per: "/ seat · mo",
			blurb: "For a team with a design system to hold.",
			cta: "Start 14-day trial",
			featured: true,
			perks: ["Unlimited projects", "Preview on every PR", "Contrast audits in CI", "Shared algorithm registry"],
		},
		{
			name: "Scale",
			tone: "accent-4",
			price: "$79",
			per: "/ seat · mo",
			blurb: "For many brands under one roof.",
			cta: "Talk to sales",
			featured: false,
			perks: ["Multi-brand registers", "SSO and audit log", "Private algorithm packs", "Named support engineer"],
		},
	] as const;

	const quotes = [
		{
			stars: 5,
			quote: "We swapped a 4,000-line stylesheet for four anchors and a knob. The redesign took an afternoon.",
			name: "Ada Lovelace",
			role: "Design systems lead, Northwind",
			tone: "accent",
		},
		{
			stars: 5,
			quote: "Every pull request now ships a live library. Our reviewers stopped arguing about hex codes.",
			name: "Grace Hopper",
			role: "Staff engineer, Halcyon",
			tone: "accent-3",
		},
		{
			stars: 4.5,
			quote: "Two brands, one component set, zero forks. The second accent carries the whole sub-brand.",
			name: "Katherine Johnson",
			role: "Head of brand, Fathom",
			tone: "accent-2",
		},
	] as const;

	const installs = [12, 18, 15, 24, 22, 31, 28, 37, 34, 46, 52, 49, 61, 74];

	const footerLinks = ["Privacy", "Terms", "Status", "Careers"] as const;
</script>

<MockFrame {register} title="Lumen">
	<div class="brand">
		<header class="brand__nav">
			<div class="brand__mark">
				<Avatar size="sm" shape="square" tone="accent" alt="Lumen">
					{#snippet icon()}<Icon name="palette" size="sm" />{/snippet}
				</Avatar>
				<Text as="span" weight="semibold">Lumen</Text>
				<Badge size="sm" tone="accent-2" variant="soft">v3</Badge>
			</div>
			<nav class="brand__links" aria-label="Primary">
				{#each nav as item (item)}
					<Link href="#brand" variant="quiet">{item}</Link>
				{/each}
			</nav>
			<div class="brand__nav-actions">
				<Button variant="ghost" tone="neutral" size="sm">Sign in</Button>
				<Button variant="solid" size="sm">Start free</Button>
			</div>
		</header>
		<div class="brand__rule" aria-hidden="true"></div>

		<div class="brand__hero" id="brand">
			<Hero split align="start">
				<div class="brand__hero-copy">
					<Stack gap={5}>
						<Cluster gap={2} align="center">
							<Badge tone="accent-2" variant="soft" dot>Prism engine is live</Badge>
							<Link href="#brand" variant="quiet">Read the release</Link>
						</Cluster>
						<Heading level={1} size="4xl">Ship a design system your team will actually use.</Heading>
						<Text size="lg" tone="muted">
							Lumen derives the whole token set from a handful of anchors, then renders your
							component library against it — on every branch, in every framework, before anyone
							ships a hex code.
						</Text>
						<Cluster gap={3}>
							<Button size="lg">
								Start free
								{#snippet iconEnd()}<Icon name="arrow-right" />{/snippet}
							</Button>
							<Button size="lg" variant="outline" tone="accent-2">
								{#snippet iconStart()}<Icon name="play" />{/snippet}
								Watch the tour
							</Button>
						</Cluster>
						<Cluster gap={3} align="center">
							<AvatarGroup size="sm" overflow={12} label="Teams using Lumen">
								<Avatar size="sm" userName="Ada Lovelace" tone="accent" />
								<Avatar size="sm" userName="Grace Hopper" tone="accent-3" />
								<Avatar size="sm" userName="Alan Turing" tone="accent-2" />
								<Avatar size="sm" userName="Radia Perlman" tone="accent-4" />
							</AvatarGroup>
							<Rating value={4.9} max={5} readonly size="sm" label="Rated 4.9 out of 5" />
							<Text as="span" size="sm" tone="muted">4,200 teams, 900 reviews</Text>
						</Cluster>
					</Stack>
				</div>

				<div class="brand__hero-panel">
					<Card overlay>
						{#snippet header()}
							<div class="panel__head">
								<Cluster gap={2} align="center">
									<Dot tone="success" pulse="slow" label="Live" />
									<Text as="span" size="sm" weight="semibold" mono>release/42</Text>
								</Cluster>
								<Badge size="sm" tone="neutral" variant="outline">preview</Badge>
							</div>
						{/snippet}

						<Stack gap={4}>
							<Grid minColWidth="7rem" gap={3}>
								<Stat size="sm" label="Adoption" delta="+18%" trend="up" caption="of components">92%</Stat>
								<Stat size="sm" label="Drift" delta="-31" trend="down" sentiment="positive" caption="off-system values">14</Stat>
							</Grid>
							<Sparkline values={installs} variant="area" tone="accent" label="Component installs, 14 weeks" />
							<Stack gap={2}>
								<div class="panel__meter">
									<Text as="span" size="xs" tone="muted">Theme rollout</Text>
									<Text as="span" size="xs" tone="subtle" mono>78 / 100 apps</Text>
								</div>
								<Progress value={78} tone="accent-2" ariaLabel="Theme rollout" />
							</Stack>
						</Stack>

						{#snippet footer()}
							<Cluster gap={2}>
								<Badge size="sm" tone="success" variant="soft">contrast AA</Badge>
								<Badge size="sm" tone="accent-3" variant="soft">12 themes</Badge>
								<Badge size="sm" tone="neutral" variant="soft">3 bindings</Badge>
							</Cluster>
						{/snippet}
					</Card>
				</div>
			</Hero>
		</div>

		<Section as="section" tone="quiet" bordered padding="md" label="Customers">
			<Stack gap={5}>
				<Cluster gap={5} justify="between" align="center">
					{#each logos as l (l.name)}
						<Cluster gap={2} align="center">
							<Avatar size="sm" shape="square" tone="neutral" alt={l.name}>
								{#snippet icon()}<Icon name={l.icon} size="sm" />{/snippet}
							</Avatar>
							<Text as="span" size="sm" weight="semibold" tone="muted">{l.name}</Text>
						</Cluster>
					{/each}
				</Cluster>
				<Separator />
				<Grid minColWidth="9rem" gap={4}>
					{#each numbers as n (n.label)}
						<Stat
							align="center"
							label={n.label}
							delta={n.delta}
							trend={n.trend}
							sentiment={n.sentiment}
							caption={n.caption}
						>
							{n.value}
						</Stat>
					{/each}
				</Grid>
			</Stack>
		</Section>

		<section class="brand__band" aria-label="Features">
			<Stack gap={6}>
				<div class="brand__head">
					<Stack gap={2}>
						<Eyebrow>Why Lumen</Eyebrow>
						<Heading level={2} size="2xl">Everything downstream of the tokens.</Heading>
						<Text tone="muted">
							The algorithm is the asset. The theme is just what falls out of it, and the library
							was built to honor whatever falls.
						</Text>
					</Stack>
				</div>
				<Grid minColWidth="15rem" gap={4}>
					{#each features as f (f.title)}
						<CardLink href="#brand">
							{#snippet header()}
								<div class="feature__head">
									<Icon name={f.icon} size="md" tone={f.tone} />
									<Heading level={3} size="sm">{f.title}</Heading>
								</div>
							{/snippet}
							<Text size="sm" tone="muted">{f.body}</Text>
							{#snippet footer()}
								<div class="feature__more">
									<Text as="span" size="xs" weight="medium" tone={f.tone}>{f.cta}</Text>
									<Icon name="arrow-right" size="sm" tone={f.tone} />
								</div>
							{/snippet}
						</CardLink>
					{/each}
				</Grid>
			</Stack>
		</section>

		<section class="brand__band brand__band--quiet" aria-label="Pricing">
			<Stack gap={6}>
				<div class="brand__head">
					<Stack gap={2}>
						<Eyebrow tone="accent-2">Pricing</Eyebrow>
						<Heading level={2} size="2xl">Priced per seat, not per brand.</Heading>
						<Text tone="muted">Every plan ships the full component contract. The bigger plans just hold more of it.</Text>
					</Stack>
				</div>
				<Grid minColWidth="14rem" gap={4} align="stretch">
					{#each tiers as t (t.name)}
						<div class="tier" class:tier--featured={t.featured}>
							<Card tone={t.tone}>
								{#snippet header()}
									<div class="tier__head">
										<Eyebrow as="span" tone={t.tone}>{t.name}</Eyebrow>
										<div class="tier__price">
											<Heading level={3} size="3xl">{t.price}</Heading>
											<Text as="span" size="sm" tone="subtle">{t.per}</Text>
										</div>
										<Text size="sm" tone="muted">{t.blurb}</Text>
									</div>
								{/snippet}

								<ul class="tier__list">
									{#each t.perks as perk (perk)}
										<li class="tier__item">
											<Icon name="check" size="sm" tone="success" />
											<Text as="span" size="sm">{perk}</Text>
										</li>
									{/each}
								</ul>

								{#snippet footer()}
									<Button block variant={t.featured ? "solid" : "outline"} tone={t.featured ? "accent-2" : "accent"}>
										{t.cta}
									</Button>
								{/snippet}
							</Card>
							{#if t.featured}
								<Ribbon tone="accent-2" variant="solid" size="sm" corner="top-right" label="Most popular" />
							{/if}
						</div>
					{/each}
				</Grid>
			</Stack>
		</section>

		<section class="brand__band" aria-label="Testimonials">
			<Stack gap={6}>
				<div class="brand__head">
					<Stack gap={2}>
						<Eyebrow tone="accent-3">Field notes</Eyebrow>
						<Heading level={2} size="2xl">Teams that stopped arguing about color.</Heading>
					</Stack>
				</div>
				<Grid minColWidth="15rem" gap={4}>
					{#each quotes as q (q.name)}
						<Card>
							<Stack gap={3}>
								<Rating value={q.stars} max={5} readonly size="sm" label={`Rated ${q.stars} out of 5`} />
								<Text size="sm">“{q.quote}”</Text>
							</Stack>
							{#snippet footer()}
								<div class="quote__by">
									<Avatar size="sm" userName={q.name} tone={q.tone} />
									<div>
										<Text size="sm" weight="medium">{q.name}</Text>
										<Text size="xs" tone="subtle">{q.role}</Text>
									</div>
								</div>
							{/snippet}
						</Card>
					{/each}
				</Grid>
			</Stack>
		</section>

		<section class="brand__closer" aria-label="Get started">
			<Stack gap={4} align="center">
				<Eyebrow tone="accent-2">Two anchors away</Eyebrow>
				<Heading level={2} size="2xl">Point Lumen at your brand. Watch the system fall out.</Heading>
				<Text tone="muted">Free for a first project. Bring the org along whenever you are ready.</Text>
				<Cluster gap={3} justify="center">
					<Button size="lg">
						Start free
						{#snippet iconEnd()}<Icon name="arrow-right" />{/snippet}
					</Button>
					<Button size="lg" variant="outline" tone="accent-2">Book a walkthrough</Button>
				</Cluster>
				<Text size="xs" tone="subtle">No card required · 14-day trial on paid plans</Text>
			</Stack>
		</section>

		<footer class="brand__foot">
			<Text size="xs" tone="subtle">© 2026 Lumen Labs</Text>
			<div class="brand__foot-links">
				{#each footerLinks as l (l)}
					<Link href="#brand" variant="muted">{l}</Link>
				{/each}
			</div>
		</footer>
	</div>
</MockFrame>

<style>
	.brand {
		display: flex;
		flex-direction: column;
	}

	.brand__nav {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-5);
		background: var(--bg-1);
	}

	.brand__mark {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.brand__links {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
		margin-inline-start: var(--space-3);
		font-size: var(--text-sm);
	}

	.brand__nav-actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-inline-start: auto;
	}

	.brand__rule {
		height: var(--border-thick);
		background: linear-gradient(90deg, var(--accent), var(--accent-2));
	}

	.brand__hero {
		background: linear-gradient(140deg, var(--accent-bg), var(--bg-0) 55%, var(--accent-2-bg));
	}

	.brand__hero-copy,
	.brand__hero-panel {
		min-width: 0;
	}

	.panel__head,
	.panel__meter {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.brand__band {
		padding: var(--space-7) var(--space-6);
	}

	.brand__band--quiet {
		background: var(--bg-1);
		border-block: var(--border-thin) solid var(--line);
	}

	.brand__head {
		max-width: 52ch;
		margin-inline: auto;
		text-align: center;
	}

	.feature__head {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.feature__more {
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}

	.tier {
		position: relative;
		display: grid;
		border-radius: var(--radius-lg);
	}

	.tier--featured {
		box-shadow: 0 0 0 var(--border-normal) var(--accent-2);
	}

	.tier__head {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.tier__price {
		display: flex;
		align-items: baseline;
		gap: var(--space-1);
	}

	.tier__list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.tier__item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.quote__by {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.brand__closer {
		margin: var(--space-6);
		padding: var(--space-7) var(--space-6);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-lg);
		background: linear-gradient(105deg, var(--accent-2-bg), var(--accent-bg));
		text-align: center;
	}

	.brand__foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-4) var(--space-5);
		background: var(--bg-1);
		border-top: var(--border-thin) solid var(--line);
	}

	.brand__foot-links {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
		font-size: var(--text-xs);
	}
</style>
