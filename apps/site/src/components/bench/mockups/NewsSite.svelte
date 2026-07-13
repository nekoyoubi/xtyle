<script lang="ts">
	import type { TokenRegister } from "@xtyle/core";
	import { Avatar, AvatarGroup, Badge, Breadcrumb, Button, Card, CardLink, Dot, Eyebrow, Grid, Heading, Icon, Image, Link, Separator, Text, Toolbar } from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	// Sections are the categorical axis, so they wear the accent family — whatever `accentStrategy`
	// builds (flanks, a hue walk, one hue in four depths, two brands) is a valid section palette.
	// Each section carries an icon and a name alongside its color, so `shade` (where all four accents
	// share a hue) still tells World from Tech from Culture.
	const sections = {
		world: { name: "World", tone: "accent-2", icon: "external-link", stories: 24 },
		tech: { name: "Tech", tone: "accent-3", icon: "gear", stories: 18 },
		culture: { name: "Culture", tone: "accent-4", icon: "palette", stories: 11 },
	} as const;

	const nav = [
		{ label: "Front page", tone: undefined, active: true },
		{ label: sections.world.name, tone: sections.world.tone, active: false },
		{ label: sections.tech.name, tone: sections.tech.tone, active: false },
		{ label: sections.culture.name, tone: sections.culture.tone, active: false },
		{ label: "Opinion", tone: undefined, active: false },
	] as const;

	// The art is content, not chrome: a data-URI SVG cannot read the theme's custom properties, so
	// these stand-ins keep a fixed photographic palette the way real press photography would.
	const art = (body: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">${body}</svg>`)}`;

	const leadArt = art(
		'<defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a2748"/><stop offset="0.5" stop-color="#b96a4d"/><stop offset="1" stop-color="#efbb83"/></linearGradient></defs><rect width="640" height="360" fill="url(#a)"/><circle cx="452" cy="196" r="48" fill="#ffe6bd" opacity="0.92"/><path d="M0 236 L118 202 L246 240 L382 196 L516 236 L640 200 L640 360 L0 360Z" fill="#15223b"/><path d="M0 292 L196 268 L414 304 L640 272 L640 360 L0 360Z" fill="#0b1322"/>',
	);

	const worldArt = art(
		'<rect width="640" height="360" fill="#123642"/><path d="M0 214 C120 176 232 250 356 210 C458 178 552 224 640 196 L640 360 L0 360Z" fill="#1c5a67"/><path d="M0 268 C140 240 268 302 400 268 C512 240 570 286 640 264 L640 360 L0 360Z" fill="#0d2731"/><circle cx="112" cy="94" r="34" fill="#8fd3d0" opacity="0.7"/>',
	);

	const techArt = art(
		'<rect width="640" height="360" fill="#131826"/><g stroke="#2c3a5c" stroke-width="2"><path d="M80 0 V360 M200 0 V360 M320 0 V360 M440 0 V360 M560 0 V360 M0 90 H640 M0 180 H640 M0 270 H640"/></g><rect x="200" y="120" width="240" height="120" rx="10" fill="#3f6fd8"/><rect x="236" y="156" width="168" height="48" rx="6" fill="#9fc0ff"/>',
	);

	const cultureArt = art(
		'<rect width="640" height="360" fill="#3a1f2b"/><circle cx="240" cy="200" r="150" fill="#c8613f"/><circle cx="240" cy="200" r="88" fill="#e6a15c"/><path d="M400 360 C400 208 500 132 640 116 L640 360Z" fill="#7c2f45"/>',
	);

	const lead = {
		crumbs: [
			{ label: sections.world.name, href: "#" },
			{ label: "Climate", href: "#" },
			{ label: "The Delta", current: true },
		],
		title: "The river moved, and the maps have not caught up",
		deck: "Three seasons of silt redrew a coastline that four governments still argue over. A dispatch from the last village on the old bank.",
		author: "Ada Okonkwo",
		role: "Senior correspondent",
		read: "12 min read",
	};

	const secondary = [
		{
			section: sections.tech,
			art: techArt,
			title: "The derivation era: design tokens finally grew up",
			blurb: "One algorithm, three anchors, a whole contrast-safe register. Studios are quietly firing their spreadsheets.",
			author: "Grace Vandermeer",
			read: "6 min",
		},
		{
			section: sections.culture,
			art: cultureArt,
			title: "The slow return of the single-purpose tool",
			blurb: "A generation raised on everything-apps is paying real money for objects that do exactly one thing.",
			author: "Idris Lang",
			read: "8 min",
		},
		{
			section: sections.world,
			art: worldArt,
			title: "A port city bets its future on the tide",
			blurb: "The seawall was supposed to be the answer. Its engineers now say the harbor was the answer all along.",
			author: "Marta Ilves",
			read: "9 min",
		},
	] as const;

	const mostRead = [
		{ rank: "01", title: "What the color of a warning light says about the people who chose it", section: sections.tech, read: "5 min" },
		{ rank: "02", title: "Border towns are learning to publish their own weather", section: sections.world, read: "7 min" },
		{ rank: "03", title: "The typeface that outlived three empires", section: sections.culture, read: "4 min" },
		{ rank: "04", title: "Why nobody can agree on what a 'unit' is", section: sections.tech, read: "6 min" },
	] as const;

	const briefs = [
		{ section: sections.tech, title: "Standards body adopts perceptual color for the web", time: "1h ago" },
		{ section: sections.world, title: "Delta accord returns to the table after four years", time: "3h ago" },
		{ section: sections.culture, title: "The national archive opens its typography vault", time: "5h ago" },
	] as const;

	const contributors = ["Ada Okonkwo", "Grace Vandermeer", "Idris Lang", "Marta Ilves"] as const;
	const contributorsBeyond = 5;
	const sectionList = [sections.world, sections.tech, sections.culture] as const;
</script>

<MockFrame {register} title="The Register">
	<div class="news">
		<header class="news__masthead">
			<div class="news__brand">
				<Heading level={1} size="2xl">The Register</Heading>
				<Text size="xs" tone="subtle">Friday, late edition · No. 4,182</Text>
			</div>
			<div class="news__masthead-actions">
				<Button variant="ghost" size="sm" iconOnly aria-label="Search the archive">
					{#snippet iconStart()}<Icon name="search" />{/snippet}
				</Button>
				<Button variant="ghost" size="sm" iconOnly aria-label="Saved stories">
					{#snippet iconStart()}<Icon name="bookmark" />{/snippet}
				</Button>
				<Button variant="solid" size="sm">Subscribe</Button>
			</div>
		</header>

		<Toolbar size="sm" bare>
			{#snippet start()}
				<nav class="news__nav" aria-label="Sections">
					{#each nav as item (item.label)}
						<span class="news__nav-item" class:news__nav-item--active={item.active}>
							{#if item.tone}<Dot tone={item.tone} size="sm" />{/if}
							<Link href="#" variant={item.active ? "default" : "muted"}>{item.label}</Link>
						</span>
					{/each}
				</nav>
			{/snippet}
			{#snippet end()}
				<div class="news__ticker">
					<Badge tone="danger" variant="solid" size="sm" dot>Live</Badge>
					<Text size="xs" tone="muted">Delta accord talks resume</Text>
				</div>
			{/snippet}
		</Toolbar>

		<div class="news__grid">
			<main class="news__main">
				<article class="news__lead">
					<Breadcrumb size="sm" tone={sections.world.tone} items={lead.crumbs} />
					<Image src={leadArt} alt="Dusk over a shifting river delta" ratio="16/9" radius="md" loading="eager" />
					<div class="news__lead-body">
						<div class="news__kicker">
							<Icon name={sections.world.icon} size="sm" tone={sections.world.tone} />
							<Eyebrow as="span" tone={sections.world.tone} tracking="wide">{sections.world.name}</Eyebrow>
							<Badge tone="warn" variant="soft" size="sm">Developing</Badge>
						</div>
						<Heading level={2} size="3xl">{lead.title}</Heading>
						<Text size="lg" tone="muted" leading="snug">{lead.deck}</Text>
						<div class="news__byline">
							<Avatar size="sm" userName={lead.author} tone={sections.world.tone} />
							<div class="news__byline-who">
								<Text size="sm" weight="medium">{lead.author}</Text>
								<Text size="xs" tone="subtle">{lead.role}</Text>
							</div>
							<span class="news__vrule"><Separator orientation="vertical" /></span>
							<Badge variant="outline" tone="neutral" size="sm">{lead.read}</Badge>
						</div>
					</div>
				</article>

				<Separator variant="with-label">More from today</Separator>

				<Grid minColWidth="13rem" gap={4}>
					{#each secondary as story (story.title)}
						<CardLink href="#" compact>
							{#snippet header()}
								<Image src={story.art} alt={story.title} ratio="16/9" radius="sm" />
							{/snippet}
							<div class="news__card-body">
								<div class="news__kicker">
									<Icon name={story.section.icon} size="sm" tone={story.section.tone} />
									<Eyebrow as="span" tone={story.section.tone} tracking="wide">{story.section.name}</Eyebrow>
								</div>
								<Heading level={3} size="sm">{story.title}</Heading>
								<Text size="sm" tone="muted">{story.blurb}</Text>
							</div>
							{#snippet footer()}
								<div class="news__card-foot">
									<Avatar size="sm" userName={story.author} tone={story.section.tone} />
									<Text size="xs" tone="subtle">{story.author}</Text>
									<span class="news__spacer"></span>
									<Badge variant="outline" tone="neutral" size="sm">{story.read}</Badge>
								</div>
							{/snippet}
						</CardLink>
					{/each}
				</Grid>

				<Separator variant="with-label">Briefs</Separator>

				<ul class="news__briefs">
					{#each briefs as brief (brief.title)}
						<li class="news__brief">
							<Dot tone={brief.section.tone} size="sm" />
							<Text size="xs" weight="semibold" tone={brief.section.tone}>{brief.section.name}</Text>
							<Link href="#" variant="quiet">{brief.title}</Link>
							<span class="news__spacer"></span>
							<Text size="xs" tone="subtle">{brief.time}</Text>
						</li>
					{/each}
				</ul>
			</main>

			<aside class="news__rail" aria-label="More from The Register">
				<section class="news__rail-block">
					<div class="news__rail-head">
						<Icon name="eye" size="sm" tone="neutral" />
						<Heading level={2} size="xs">Most read</Heading>
					</div>
					<Separator size="thin" />
					<ol class="news__ranked">
						{#each mostRead as item (item.rank)}
							<li class="news__ranked-item">
								<Text size="lg" weight="bold" tone="subtle" mono>{item.rank}</Text>
								<div class="news__ranked-body">
									<Link href="#" variant="quiet">{item.title}</Link>
									<div class="news__ranked-meta">
										<Text size="xs" tone={item.section.tone} weight="medium">{item.section.name}</Text>
										<Text size="xs" tone="subtle">{item.read}</Text>
									</div>
								</div>
							</li>
						{/each}
					</ol>
				</section>

				<section class="news__rail-block">
					<div class="news__rail-head">
						<Icon name="folder" size="sm" tone="neutral" />
						<Heading level={2} size="xs">Sections</Heading>
					</div>
					<Separator size="thin" />
					<ul class="news__sections">
						{#each sectionList as section (section.name)}
							<li class="news__section-row">
								<Icon name={section.icon} size="sm" tone={section.tone} />
								<Text size="sm" weight="medium">{section.name}</Text>
								<span class="news__spacer"></span>
								<Badge tone={section.tone} variant="soft" size="sm">{section.stories}</Badge>
							</li>
						{/each}
					</ul>
				</section>

				<Card tone="accent">
					{#snippet header()}
						<Heading level={2} size="sm">The Morning Register</Heading>
					{/snippet}
					<Text size="sm" tone="muted">One dispatch, three briefs, and the day's best sentence. Weekdays at six.</Text>
					<div class="news__signup">
						<Button variant="solid" size="sm" block>
							{#snippet iconStart()}<Icon name="download" />{/snippet}
							Join 41,000 readers
						</Button>
					</div>
				</Card>

				<section class="news__rail-block">
					<div class="news__rail-head">
						<Icon name="pencil" size="sm" tone="neutral" />
						<Heading level={2} size="xs">Today's desk</Heading>
					</div>
					<AvatarGroup size="sm" overflow={contributorsBeyond} label="Contributors today">
						{#each contributors as person (person)}
							<Avatar size="sm" userName={person} tone="neutral" />
						{/each}
					</AvatarGroup>
				</section>
			</aside>
		</div>

		<footer class="news__foot">
			<Text size="xs" tone="subtle">Printed on derived tokens since the first cascade.</Text>
			<span class="news__spacer"></span>
			<Link href="#" variant="muted">Masthead</Link>
			<Link href="#" variant="muted">Ethics</Link>
			<Link href="#" variant="muted">Corrections</Link>
		</footer>
	</div>
</MockFrame>

<style>
	.news {
		background: var(--bg-1);
	}

	.news__masthead {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-5) var(--space-5) var(--space-4);
		background: var(--bg-0);
	}

	.news__brand {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		flex: 1;
		min-width: 0;
	}

	.news__masthead-actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.news__nav {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		flex-wrap: wrap;
	}

	.news__nav-item {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding-bottom: var(--space-1);
		border-bottom: var(--border-thick) solid transparent;
	}

	.news__nav-item--active {
		border-bottom-color: var(--accent);
		font-weight: var(--weight-semibold);
	}

	.news__ticker {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		min-width: 0;
	}

	.news__grid {
		display: grid;
		grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr);
		gap: var(--space-6);
		padding: var(--space-6) var(--space-5);
	}

	.news__main {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		min-width: 0;
	}

	.news__lead {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.news__lead-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		align-items: flex-start;
	}

	.news__kicker {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.news__byline {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.news__byline-who {
		display: flex;
		flex-direction: column;
	}

	.news__vrule {
		display: inline-flex;
		height: var(--space-6);
	}

	.news__card-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		align-items: flex-start;
		padding-top: var(--space-2);
	}

	.news__card-foot {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.news__spacer {
		flex: 1;
	}

	.news__briefs {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.news__brief {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding-bottom: var(--space-3);
		border-bottom: var(--border-thin) solid var(--line);
	}

	.news__rail {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		padding-left: var(--space-5);
		border-left: var(--border-thin) solid var(--line);
		min-width: 0;
	}

	.news__rail-block {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.news__rail-head {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.news__ranked {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.news__ranked-item {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
	}

	.news__ranked-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		min-width: 0;
	}

	.news__ranked-meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.news__sections {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.news__section-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.news__signup {
		margin-top: var(--space-3);
	}

	.news__foot {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-4) var(--space-5);
		background: var(--bg-0);
		border-top: var(--border-thin) solid var(--line);
	}
</style>
