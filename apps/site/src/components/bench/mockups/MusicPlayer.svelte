<script lang="ts">
	import type { TokenRegister } from "@xtyle/core";
	import {
		Avatar,
		AvatarGroup,
		Badge,
		Button,
		Card,
		Carousel,
		Dot,
		Eyebrow,
		Heading,
		Icon,
		Image,
		Progress,
		Rating,
		Ribbon,
		Segmented,
		Separator,
		Slider,
		Sparkline,
		Text,
	} from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	// Cover art is content, not chrome: it is the record sleeve, so it carries its own palette the way a
	// photograph would, and nothing in the UI depends on it for contrast.
	const cover = (a: string, b: string, ink: string) =>
		"data:image/svg+xml," +
		encodeURIComponent(
			`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="300" height="300" fill="${ink}"/><rect width="300" height="300" fill="url(#g)" opacity="0.92"/><circle cx="150" cy="132" r="82" fill="${ink}" opacity="0.28"/><circle cx="150" cy="132" r="34" fill="${ink}" opacity="0.5"/><circle cx="150" cy="132" r="9" fill="${a}"/><path d="M0 236 L78 182 L158 230 L232 172 L300 214 L300 300 L0 300 Z" fill="${ink}" opacity="0.42"/></svg>`,
		);

	const art = {
		nocturne: cover("#8ec5ff", "#4b3fd6", "#0b0d12"),
		lantern: cover("#ffc978", "#e0553f", "#241009"),
		glasshouse: cover("#7ee7d0", "#1f7f8c", "#08201f"),
		velvet: cover("#f0a6ff", "#6b2fb5", "#150723"),
		coastline: cover("#a7f3d0", "#2563eb", "#071528"),
		emberline: cover("#fda4af", "#9f1239", "#1c0710"),
	} as const;

	// Moods are the categorical axis, so they are exactly what the accent family is for. Each one always
	// arrives with its name attached; the color is a second signal, never the only one.
	const moods = [
		{ name: "Late Night", tone: "accent", tracks: 42 },
		{ name: "Deep Focus", tone: "accent-2", tracks: 128 },
		{ name: "Warmup", tone: "accent-3", tracks: 31 },
		{ name: "Throwback", tone: "accent-4", tracks: 87 },
	] as const;

	const shelves = [
		[
			{ title: "Nocturne Drive", by: "Built from your late plays", art: art.nocturne, mood: 0, fresh: true },
			{ title: "Paper Lanterns", by: "Slow, warm, unhurried", art: art.lantern, mood: 2 },
			{ title: "The Glasshouse", by: "Instrumental, no vocals", art: art.glasshouse, mood: 1 },
		],
		[
			{ title: "Velvet Static", by: "Because you played Kite Season", art: art.velvet, mood: 3 },
			{ title: "Coastline Radio", by: "Fresh every Friday", art: art.coastline, mood: 1 },
			{ title: "Emberline", by: "Your 2019 on repeat", art: art.emberline, mood: 3 },
		],
	] as const;

	const queue = [
		{ title: "Harbour Lights", artist: "Sable Moth", len: "3:58", mood: 0, art: art.nocturne, playing: true },
		{ title: "Slow Ferry", artist: "Junia Vale", len: "4:12", mood: 2, art: art.lantern },
		{ title: "Paper Kites", artist: "The Long Quiet", len: "2:47", mood: 1, art: art.glasshouse },
		{ title: "Neon Winter", artist: "Corvid & Co.", len: "5:03", mood: 3, art: art.velvet },
		{ title: "Tidewater", artist: "Sable Moth", len: "3:21", mood: 1, art: art.coastline },
		{ title: "Emberline", artist: "Halcyon Pool", len: "4:40", mood: 3, art: art.emberline },
	] as const;

	const friends = [
		{ name: "Ada Vance", tone: "accent-2" },
		{ name: "Miro Kell", tone: "accent-3" },
		{ name: "Juno Park", tone: "accent-4" },
		{ name: "Rae Okonjo", tone: "accent" },
	] as const;

	const waveform = Array.from({ length: 56 }, (_, i) => {
		const swell = Math.sin(i / 4) * 0.4 + Math.sin(i / 1.7) * 0.3 + Math.sin(i / 11) * 0.3;
		return Math.round(28 + Math.abs(swell) * 62);
	});

	const duration = 238;

	let elapsed = $state(84);
	let volume = $state(68);
	let playing = $state(true);
	let muted = $state(false);
	let shelf = $state("mixes");

	const clock = (seconds: number) =>
		`${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
</script>

<MockFrame {register} title="Cadence">
	<div class="mp">
		<aside class="mp__rail">
			<div class="mp__brand">
				<Icon name="play" tone="accent" />
				<Text size="sm" weight="bold">Cadence</Text>
			</div>

			<nav class="mp__nav" aria-label="Library">
				<button type="button" class="mp__link mp__link--active" aria-current="page">
					<Icon name="play" size="sm" />
					<span class="mp__link-name">Listen now</span>
				</button>
				<button type="button" class="mp__link">
					<Icon name="search" size="sm" />
					<span class="mp__link-name">Search</span>
				</button>
				<button type="button" class="mp__link">
					<Icon name="folder" size="sm" />
					<span class="mp__link-name">Your library</span>
				</button>
				<button type="button" class="mp__link">
					<Icon name="bookmark" size="sm" />
					<span class="mp__link-name">Saved</span>
					<Badge size="sm" tone="neutral" variant="soft">214</Badge>
				</button>
				<button type="button" class="mp__link">
					<Icon name="download" size="sm" />
					<span class="mp__link-name">Downloads</span>
				</button>
			</nav>

			<Separator />

			<div class="mp__playlists">
				<Eyebrow tone="subtle">Your moods</Eyebrow>
				{#each moods as m (m.name)}
					<button type="button" class="mp__playlist">
						<Dot tone={m.tone} size="sm" />
						<span class="mp__link-name">{m.name}</span>
						<Text size="xs" tone="subtle" mono>{m.tracks}</Text>
					</button>
				{/each}
				<Button variant="ghost" size="sm" block>
					{#snippet iconStart()}<Icon name="plus" />{/snippet}
					New playlist
				</Button>
			</div>
		</aside>

		<main class="mp__main">
			<header class="mp__head">
				<div class="mp__head-title">
					<Eyebrow tone="accent">Friday, 9:14 PM</Eyebrow>
					<Heading level={2} size="lg">Made for you</Heading>
				</div>
				<Segmented
					bind:value={shelf}
					size="sm"
					label="Shelf"
					options={[
						{ value: "mixes", label: "Mixes" },
						{ value: "shows", label: "Shows" },
					]}
				/>
			</header>

			<Carousel label="Made for you" loop dots>
				{#each shelves as row, i (i)}
					<div class="mp__shelf">
						{#each row as mix (mix.title)}
							<div class="mp__tile">
								{#if mix.fresh}<Ribbon tone="accent" size="sm" label="New" />{/if}
								<Card interactive compact>
									<Image src={mix.art} alt={`${mix.title} cover art`} ratio="1/1" radius="md" />
									<div class="mp__tile-meta">
										<Text size="sm" weight="semibold">{mix.title}</Text>
										<Text size="xs" tone="muted">{mix.by}</Text>
										<Badge size="sm" tone={moods[mix.mood].tone} variant="soft">{moods[mix.mood].name}</Badge>
									</div>
								</Card>
							</div>
						{/each}
					</div>
				{/each}
			</Carousel>

			<section class="mp__queue" aria-label="Up next">
				<div class="mp__queue-head">
					<Heading level={3} size="sm">Up next</Heading>
					<Button variant="ghost" size="sm">
						{#snippet iconStart()}<Icon name="more-horizontal" />{/snippet}
						Queue
					</Button>
				</div>

				{#each queue as t (t.title)}
					<article class="mp__track" class:mp__track--playing={t.playing}>
						<div class="mp__track-art">
							<Image src={t.art} alt="" ratio="1/1" radius="sm" />
						</div>
						<div class="mp__track-body">
							<Text size="sm" weight={t.playing ? "semibold" : "medium"}>{t.title}</Text>
							<Text size="xs" tone="muted">{t.artist}</Text>
						</div>
						<div class="mp__track-mood">
							<Dot tone={moods[t.mood].tone} size="sm" pulse={t.playing ? "slow" : undefined} />
							<Text size="xs" tone="subtle">{moods[t.mood].name}</Text>
						</div>
						{#if t.playing}
							<Badge size="sm" tone="accent" variant="soft">Playing</Badge>
						{/if}
						<Text size="xs" tone="subtle" mono>{t.len}</Text>
						<Button variant="ghost" size="sm" iconOnly aria-label={`Save ${t.title}`}>
							{#snippet iconStart()}<Icon name="bookmark" />{/snippet}
						</Button>
					</article>
				{/each}
			</section>
		</main>

		<aside class="mp__now" aria-label="Now playing">
			<Image src={art.nocturne} alt="Harbour Lights cover art" ratio="1/1" radius="lg" />

			<div class="mp__now-meta">
				<Heading level={3} size="md">Harbour Lights</Heading>
				<Text size="sm" tone="muted">Sable Moth · Nocturne Drive</Text>
				<div class="mp__now-tags">
					<Badge size="sm" tone={moods[0].tone} variant="soft">{moods[0].name}</Badge>
					<Badge size="sm" tone="neutral" variant="outline">Lossless</Badge>
				</div>
			</div>

			<Rating value={4} max={5} size="sm" tone="accent" label="Rate this track" allowHalf />

			<div class="mp__wave">
				<Sparkline values={waveform} variant="bar" tone="accent" label="Waveform" style="height: 3rem" />
			</div>

			<Separator />

			<div class="mp__artist">
				<Avatar size="md" userName="Sable Moth" tone="accent" status="success" statusLabel="Live tonight" pulse />
				<div class="mp__artist-name">
					<Text size="sm" weight="medium">Sable Moth</Text>
					<Text size="xs" tone="subtle">1.2M listeners</Text>
				</div>
				<Button variant="outline" size="sm">Follow</Button>
			</div>

			<div class="mp__friends">
				<Text size="xs" tone="subtle" weight="semibold">Friends listening</Text>
				<AvatarGroup overflow={3} label="Friends listening now">
					{#each friends as f (f.name)}
						<Avatar size="sm" userName={f.name} tone={f.tone} />
					{/each}
				</AvatarGroup>
			</div>

			<div class="mp__offline">
				<Text size="xs" tone="subtle">Saving “Late Night” for offline</Text>
				<Progress value={62} tone="info" size="sm" showValue ariaLabel="Offline download" />
			</div>
		</aside>

		<footer class="mp__bar">
			<div class="mp__bar-track">
				<div class="mp__bar-art">
					<Image src={art.nocturne} alt="" ratio="1/1" radius="sm" />
				</div>
				<div class="mp__track-body">
					<Text size="sm" weight="medium">Harbour Lights</Text>
					<Text size="xs" tone="muted">Sable Moth</Text>
				</div>
				<Button variant="ghost" size="sm" iconOnly aria-label="Save this track">
					{#snippet iconStart()}<Icon name="bookmark" />{/snippet}
				</Button>
			</div>

			<div class="mp__bar-transport">
				<div class="mp__transport-keys">
					<Button variant="ghost" size="sm" iconOnly aria-label="Previous track">
						{#snippet iconStart()}<Icon name="skip-back" />{/snippet}
					</Button>
					<Button
						variant="solid"
						size="md"
						iconOnly
						pressed={playing}
						aria-label={playing ? "Pause" : "Play"}
						onclick={() => (playing = !playing)}
					>
						{#snippet iconStart()}<Icon name={playing ? "pause" : "play"} />{/snippet}
					</Button>
					<Button variant="ghost" size="sm" iconOnly aria-label="Next track">
						{#snippet iconStart()}<Icon name="skip-forward" />{/snippet}
					</Button>
					<Button variant="ghost" size="sm" iconOnly aria-label="Stop">
						{#snippet iconStart()}<Icon name="stop" />{/snippet}
					</Button>
				</div>
				<div class="mp__scrub">
					<Text size="xs" tone="subtle" mono>{clock(elapsed)}</Text>
					<Slider
						bind:value={elapsed}
						min={0}
						max={duration}
						step={1}
						size="sm"
						tone="accent"
						label="Seek"
						hideLabel
						format={clock}
					/>
					<Text size="xs" tone="subtle" mono>{clock(duration)}</Text>
				</div>
			</div>

			<div class="mp__bar-volume">
				<Button
					variant="ghost"
					size="sm"
					iconOnly
					pressed={muted}
					aria-label={muted ? "Unmute" : "Mute"}
					onclick={() => (muted = !muted)}
				>
					{#snippet iconStart()}<Icon name={muted ? "volume-off" : "volume"} />{/snippet}
				</Button>
				<Slider
					bind:value={volume}
					min={0}
					max={100}
					size="sm"
					tone="accent"
					label="Volume"
					hideLabel
					disabled={muted}
				/>
				<Button variant="ghost" size="sm" iconOnly aria-label="Open queue">
					{#snippet iconStart()}<Icon name="menu" />{/snippet}
				</Button>
			</div>
		</footer>
	</div>
</MockFrame>

<style>
	.mp {
		display: grid;
		grid-template-columns: minmax(0, 12.5rem) minmax(0, 1fr) minmax(0, 17rem);
		grid-template-rows: minmax(0, 1fr) auto;
		min-height: 28rem;
	}

	.mp__rail {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-4);
		background: var(--bg-2);
		border-right: var(--border-thin) solid var(--line);
	}

	.mp__brand {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.mp__nav,
	.mp__playlists {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.mp__playlists {
		gap: var(--space-2);
	}

	.mp__link,
	.mp__playlist {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-2) var(--space-3);
		background: transparent;
		border: none;
		border-radius: var(--radius-full);
		color: var(--fg-2);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		text-align: left;
		cursor: pointer;
	}

	.mp__link:hover,
	.mp__playlist:hover {
		background: var(--state-hover);
	}

	.mp__link--active {
		background: var(--accent-bg);
		color: var(--accent-text);
		font-weight: var(--weight-semibold);
	}

	.mp__link-name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.mp__main {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		padding: var(--space-5);
		min-width: 0;
	}

	.mp__head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.mp__head-title {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.mp__shelf {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-3);
		padding-inline: var(--space-1);
	}

	.mp__tile {
		position: relative;
		border-radius: var(--radius-lg);
	}

	.mp__tile-meta {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-1);
		padding-top: var(--space-3);
	}

	.mp__queue {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		min-width: 0;
	}

	.mp__queue-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		padding-bottom: var(--space-2);
	}

	.mp__track {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-lg);
		min-width: 0;
	}

	.mp__track:hover {
		background: var(--state-hover);
	}

	.mp__track--playing {
		background: var(--accent-bg);
	}

	.mp__track-art,
	.mp__bar-art {
		width: 2.5rem;
		flex: none;
	}

	.mp__track-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		flex: 1;
		min-width: 0;
	}

	.mp__track-mood {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex: none;
	}

	.mp__now {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-5);
		background: var(--bg-2);
		border-left: var(--border-thin) solid var(--line);
		min-width: 0;
	}

	.mp__now-meta {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.mp__now-tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		padding-top: var(--space-1);
	}

	.mp__wave {
		padding: var(--space-3);
		background: var(--bg-1);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-md);
	}

	.mp__artist {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.mp__artist-name {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		flex: 1;
		min-width: 0;
	}

	.mp__friends,
	.mp__offline {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.mp__bar {
		grid-column: 1 / -1;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr);
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-4);
		background: var(--surface-overlay);
		border-top: var(--border-thin) solid var(--line);
	}

	.mp__bar-track {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-width: 0;
	}

	.mp__bar-transport {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		min-width: 0;
	}

	.mp__transport-keys {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.mp__scrub {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
	}

	.mp__scrub :global(xtyle-slider) {
		flex: 1;
		min-width: 0;
	}

	.mp__bar-volume {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--space-2);
		min-width: 0;
	}

	.mp__bar-volume :global(xtyle-slider) {
		flex: 1;
		min-width: 0;
		max-width: 7rem;
	}
</style>
