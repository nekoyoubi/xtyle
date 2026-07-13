<script lang="ts">
	import type { TokenRegister } from "@xtyle/core";
	import { Avatar, Badge, Button, Dot, Heading, Icon, Separator, Text } from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	const folders = [
		{ name: "Inbox", icon: "folder", count: 12, active: true },
		{ name: "Starred", icon: "bookmark", count: 3 },
		{ name: "Sent", icon: "arrow-right" },
		{ name: "Drafts", icon: "pencil", count: 1 },
		{ name: "Archive", icon: "download" },
		{ name: "Spam", icon: "warning" },
		{ name: "Trash", icon: "trash" },
	] as const;

	// Labels are the honest home for the accent family: a set of user-defined categories that want to
	// be distinguishable from each other and from the primary accent. Whatever `accentStrategy` builds
	// — flanks, a hue walk, one hue in depths, two brands — is what these chips wear.
	const labels = [
		{ name: "Engineering", tone: "accent-2" },
		{ name: "Design", tone: "accent-3" },
		{ name: "Ops", tone: "accent-4" },
	] as const;

	const threads = [
		{ from: "Ada Lovelace", subject: "Re: derivation pipeline", preview: "The settle pass looks clean, shipping it.", time: "9:14", unread: true, status: "success", label: 0 },
		{ from: "Grace Hopper", subject: "Contrast audit results", preview: "Two pairs land just under AA on the warm tones.", time: "8:02", unread: true, status: "warn", label: 1 },
		{ from: "Alan Turing", subject: "Token graph export", preview: "Can we get the lineage as JSON?", time: "Yesterday", active: true, label: 0 },
		{ from: "Katherine Johnson", subject: "Launch checklist", preview: "Trajectory looks nominal. One open item.", time: "Yesterday", label: 2 },
		{ from: "Radia Perlman", subject: "Spanning the mesh", preview: "The bridge protocol settles in under a second.", time: "Mon", label: 2 },
		{ from: "Edsger Dijkstra", subject: "On naming", preview: "The rail should be called what it is.", time: "Mon", label: 1 },
	] as const;
</script>

<MockFrame {register} title="Postbox">
	<div class="mail">
		<aside class="mail__rail">
			<Button variant="solid" size="sm">
				{#snippet iconStart()}<Icon name="pencil" />{/snippet}
				Compose
			</Button>

			<nav class="mail__nav" aria-label="Folders">
				{#each folders as f (f.name)}
					<button type="button" class="mail__folder" class:mail__folder--active={f.active} aria-current={f.active ? "page" : undefined}>
						<Icon name={f.icon} size="sm" />
						<span class="mail__folder-name">{f.name}</span>
						{#if f.count}<Badge size="sm" tone={f.active ? "accent" : "neutral"} variant="soft">{f.count}</Badge>{/if}
					</button>
				{/each}
			</nav>

			<Separator />

			<div class="mail__labels">
				<Text size="xs" tone="subtle" weight="semibold">Labels</Text>
				<div class="mail__label-chips">
					{#each labels as l (l.name)}
						<Badge tone={l.tone} variant="soft" size="sm">{l.name}</Badge>
					{/each}
				</div>
			</div>
		</aside>

		<section class="mail__list" aria-label="Inbox">
			<div class="mail__search">
				<Icon name="search" size="sm" tone="neutral" />
				<Text size="sm" tone="subtle">Search mail</Text>
			</div>
			{#each threads as t (t.subject)}
				<article class="mail__row" class:mail__row--active={t.active} class:mail__row--unread={t.unread}>
					<Avatar size="sm" userName={t.from} tone={labels[t.label].tone} />
					<div class="mail__row-body">
						<div class="mail__row-top">
							<Text size="sm" weight={t.unread ? "semibold" : "normal"}>{t.from}</Text>
							<Text size="xs" tone="subtle">{t.time}</Text>
						</div>
						<Text size="sm" weight={t.unread ? "medium" : "normal"}>{t.subject}</Text>
						<Text size="xs" tone="muted">{t.preview}</Text>
						<Badge size="sm" tone={labels[t.label].tone} variant="soft">{labels[t.label].name}</Badge>
					</div>
					{#if t.status}<Dot tone={t.status} size="sm" pulse={t.unread ? "slow" : undefined} />{/if}
				</article>
			{/each}
		</section>

		<section class="mail__read" aria-label="Message">
			<header class="mail__read-head">
				<div class="mail__read-title">
					<Heading level={3} size="sm">Token graph export</Heading>
					<Badge size="sm" tone="accent-2" variant="soft">Engineering</Badge>
				</div>
				<div class="mail__read-actions">
					<Button variant="outline" size="sm">
						{#snippet iconStart()}<Icon name="arrow-left" />{/snippet}
						Reply
					</Button>
					<Button variant="ghost" size="sm">
						{#snippet iconStart()}<Icon name="arrow-right" />{/snippet}
						Forward
					</Button>
					<Button variant="ghost" size="sm" iconOnly aria-label="Archive">
						{#snippet iconStart()}<Icon name="download" />{/snippet}
					</Button>
					<Button variant="ghost" size="sm" iconOnly aria-label="More">
						{#snippet iconStart()}<Icon name="more-vertical" />{/snippet}
					</Button>
				</div>
			</header>

			<div class="mail__read-from">
				<Avatar size="md" userName="Alan Turing" tone="accent-2" status="success" statusLabel="Online" />
				<div>
					<Text size="sm" weight="medium">Alan Turing</Text>
					<Text size="xs" tone="subtle">to Workbench team</Text>
				</div>
			</div>

			<Separator />

			<div class="mail__read-body">
				<Text>
					Could we get the token lineage exported as JSON alongside the CSS? The graph view is
					great for spot-checks, but the build wants the raw edges.
				</Text>
				<Text>
					Happy to take a swing at the emitter if you point me at where the dependency graph
					lives.
				</Text>
				<Text size="sm" tone="muted">— Alan</Text>
			</div>
		</section>
	</div>
</MockFrame>

<style>
	.mail {
		display: grid;
		grid-template-columns: minmax(0, 13rem) minmax(0, 20rem) minmax(0, 1fr);
		min-height: 28rem;
	}

	.mail__rail {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-4);
		background: var(--bg-2);
		border-right: var(--border-thin) solid var(--line);
	}

	.mail__nav {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.mail__folder {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-2) var(--space-3);
		background: transparent;
		border: none;
		border-radius: var(--radius-md);
		color: var(--fg-2);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		text-align: left;
		cursor: pointer;
	}

	.mail__folder:hover {
		background: var(--state-hover);
	}

	.mail__folder--active {
		background: var(--accent-bg);
		color: var(--accent-text);
		font-weight: var(--weight-medium);
	}

	.mail__folder-name {
		flex: 1;
	}

	.mail__labels {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.mail__label-chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.mail__list {
		display: flex;
		flex-direction: column;
		border-right: var(--border-thin) solid var(--line);
		overflow: hidden;
	}

	.mail__search {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		border-bottom: var(--border-thin) solid var(--line);
		background: var(--bg-1);
	}

	.mail__row {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		border-bottom: var(--border-thin) solid var(--line);
	}

	.mail__row--active {
		background: var(--accent-bg);
	}

	.mail__row--unread {
		background: var(--bg-1);
	}

	.mail__row-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		align-items: flex-start;
		min-width: 0;
		flex: 1;
	}

	.mail__row-top {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-2);
		width: 100%;
	}

	.mail__read {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-5);
		min-width: 0;
	}

	.mail__read-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.mail__read-title {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.mail__read-actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.mail__read-from {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.mail__read-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
</style>
