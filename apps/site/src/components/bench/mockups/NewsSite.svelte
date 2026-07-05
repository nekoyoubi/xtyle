<script lang="ts">
	import type { TokenRegister } from "@xtyle/core";
	import { Badge, Button } from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	const sections = ["Top", "World", "Tech", "Science", "Culture", "Opinion"];

	const stories = [
		{ kicker: "Science", title: "A perceptual color space quietly reshapes the web", read: "6 min", tone: "info" as const },
		{ kicker: "Tech", title: "Design tokens grow up: the derivation era", read: "4 min", tone: "success" as const },
		{ kicker: "Opinion", title: "Stop hand-tuning every variable", read: "3 min", tone: "warn" as const },
		{ kicker: "Culture", title: "The quiet return of the single-purpose tool", read: "8 min", tone: "neutral" as const },
	];
</script>

<MockFrame {register} title="The Register">
	<div class="news">
		<header class="news__masthead">
			<span class="news__brand">The Register</span>
			<nav class="news__nav" aria-label="Sections">
				{#each sections as s, i (s)}
					<span class="news__nav-item" class:news__nav-item--active={i === 0}>{s}</span>
				{/each}
			</nav>
			<Button variant="solid" size="sm">Subscribe</Button>
		</header>

		<div class="news__grid">
			<article class="news__lead">
				<div class="news__lead-art" aria-hidden="true"></div>
				<div class="news__lead-body">
					<Badge tone="danger" size="sm">Breaking</Badge>
					<h2 class="news__lead-title">OKLCH derivation lands in production, and nothing looks the same</h2>
					<p class="news__lead-deck">A single algorithm now maps three anchors into a full, contrast-safe token set — and the components were built to honor it.</p>
					<span class="news__byline">By A. Reporter · 12 min read</span>
				</div>
			</article>

			<aside class="news__rail">
				<span class="news__rail-head">Latest</span>
				{#each stories as story (story.title)}
					<article class="news__story">
						<Badge tone={story.tone} size="sm">{story.kicker}</Badge>
						<h3 class="news__story-title">{story.title}</h3>
						<span class="news__story-meta">{story.read} read</span>
					</article>
				{/each}
			</aside>
		</div>
	</div>
</MockFrame>

<style>
	.news {
		background: var(--bg-1);
	}

	.news__masthead {
		display: flex;
		align-items: center;
		gap: var(--space-5);
		padding: var(--space-4) var(--space-5);
		background: var(--bg-0);
		border-bottom: var(--border-thick, 2px) solid var(--fg-0);
	}

	.news__brand {
		font-family: var(--font-display, var(--font-sans));
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
		color: var(--fg-0);
		letter-spacing: -0.01em;
	}

	.news__nav {
		display: flex;
		gap: var(--space-3);
		flex: 1;
		flex-wrap: wrap;
	}

	.news__nav-item {
		font-size: var(--text-sm);
		color: var(--fg-2);
		padding-bottom: 0.1rem;
		border-bottom: var(--border-thick, 2px) solid transparent;
	}

	.news__nav-item--active {
		color: var(--accent-text);
		border-bottom-color: var(--accent);
		font-weight: var(--weight-medium);
	}

	.news__grid {
		display: grid;
		grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr);
		gap: var(--space-6);
		padding: var(--space-6) var(--space-5);
	}

	.news__lead-art {
		height: 11rem;
		border-radius: var(--radius-md);
		background:
			radial-gradient(circle at 30% 30%, var(--accent), transparent 60%),
			linear-gradient(140deg, var(--color-violet-base, var(--accent-2)), var(--color-cyan-base, var(--accent)));
		margin-bottom: var(--space-4);
	}

	.news__lead-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		align-items: flex-start;
	}

	.news__lead-title {
		margin: 0;
		font-family: var(--font-display, var(--font-sans));
		font-size: var(--text-2xl);
		line-height: var(--leading-tight, 1.15);
		color: var(--fg-0);
	}

	.news__lead-deck {
		margin: 0;
		font-size: var(--text-md, var(--text-base));
		color: var(--fg-1);
		line-height: var(--leading-relaxed, 1.6);
	}

	.news__byline {
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--fg-3);
	}

	.news__rail {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		border-left: var(--border-thin) solid var(--line);
		padding-left: var(--space-5);
	}

	.news__rail-head {
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--fg-2);
	}

	.news__story {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		align-items: flex-start;
		padding-bottom: var(--space-4);
		border-bottom: var(--border-thin) solid var(--line);
	}

	.news__story-title {
		margin: 0;
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--fg-0);
		line-height: var(--leading-snug, 1.3);
	}

	.news__story-meta {
		font-size: var(--text-xs);
		color: var(--fg-3);
	}
</style>
