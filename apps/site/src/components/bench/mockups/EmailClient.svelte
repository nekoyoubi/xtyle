<script lang="ts">
	import type { TokenRegister } from "@xtyle/core";
	import { Avatar, Badge, Button } from "@xtyle/svelte";
	import MockFrame from "./MockFrame.svelte";

	interface Props {
		register: TokenRegister;
	}

	let { register }: Props = $props();

	const folders = [
		{ name: "Inbox", count: 12, active: true },
		{ name: "Starred", count: 3 },
		{ name: "Sent" },
		{ name: "Drafts", count: 1 },
		{ name: "Archive" },
		{ name: "Spam" },
	];

	const threads = [
		{ from: "Ada Lovelace", subject: "Re: derivation pipeline", preview: "The settle pass looks clean — shipping it.", time: "9:14", unread: true, tone: "success" as const },
		{ from: "Grace Hopper", subject: "Contrast audit results", preview: "Two pairs land just under AA on the warm…", time: "8:02", unread: true, tone: "warn" as const },
		{ from: "Alan Turing", subject: "Token graph export", preview: "Can we get the lineage as JSON?", time: "Yesterday", active: true },
		{ from: "Katherine Johnson", subject: "Launch checklist", preview: "Trajectory looks nominal. One open item.", time: "Yesterday" },
		{ from: "Edsger Dijkstra", subject: "On naming", preview: "The rail should be called what it is.", time: "Mon" },
	];
</script>

<MockFrame {register} title="Postbox">
	<div class="mail">
		<aside class="mail__folders">
			<Button variant="solid" size="sm">Compose</Button>
			<nav class="mail__folder-list" aria-label="Folders">
				{#each folders as f (f.name)}
					<span class="mail__folder" class:mail__folder--active={f.active}>
						<span>{f.name}</span>
						{#if f.count}<Badge size="sm" tone={f.active ? "info" : "neutral"}>{f.count}</Badge>{/if}
					</span>
				{/each}
			</nav>
		</aside>

		<section class="mail__list" aria-label="Inbox">
			{#each threads as t (t.subject)}
				<article class="mail__row" class:mail__row--active={t.active} class:mail__row--unread={t.unread}>
					<Avatar size="sm" name={t.from} />
					<div class="mail__row-body">
						<div class="mail__row-top">
							<span class="mail__from">{t.from}</span>
							<span class="mail__time">{t.time}</span>
						</div>
						<span class="mail__subject">{t.subject}</span>
						<span class="mail__preview">{t.preview}</span>
					</div>
					{#if t.tone}<span class="mail__flag"><Badge size="sm" tone={t.tone}>•</Badge></span>{/if}
				</article>
			{/each}
		</section>

		<section class="mail__read" aria-label="Message">
			<header class="mail__read-head">
				<div>
					<h3 class="mail__read-subject">Token graph export</h3>
					<span class="mail__read-meta">Alan Turing · to Workbench team</span>
				</div>
				<div class="mail__read-actions">
					<Button variant="outline" size="sm">Reply</Button>
					<Button variant="ghost" size="sm">Forward</Button>
				</div>
			</header>
			<div class="mail__read-body">
				<p>Could we get the token lineage exported as JSON alongside the CSS? The graph view is great for spot-checks, but the build wants the raw edges.</p>
				<p>Happy to take a swing at the emitter if you point me at where the dependency graph lives.</p>
				<p class="mail__sig">— Alan</p>
			</div>
		</section>
	</div>
</MockFrame>

<style>
	.mail {
		display: grid;
		grid-template-columns: minmax(0, 12rem) minmax(0, 18rem) minmax(0, 1fr);
		min-height: 26rem;
	}

	.mail__folders {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-4);
		background: var(--bg-2);
		border-right: var(--border-thin) solid var(--line);
	}

	.mail__folder-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.mail__folder {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		color: var(--fg-2);
	}

	.mail__folder--active {
		background: var(--accent-bg);
		color: var(--accent-text);
		font-weight: var(--weight-medium);
	}

	.mail__list {
		display: flex;
		flex-direction: column;
		border-right: var(--border-thin) solid var(--line);
		overflow: hidden;
	}

	.mail__row {
		display: flex;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		border-bottom: var(--border-thin) solid var(--line);
		cursor: default;
	}

	.mail__row--active {
		background: var(--accent-bg);
	}

	.mail__row-body {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
		flex: 1;
	}

	.mail__row-top {
		display: flex;
		justify-content: space-between;
		gap: var(--space-2);
	}

	.mail__from {
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--fg-1);
	}

	.mail__row--unread .mail__from {
		color: var(--fg-0);
	}

	.mail__time {
		font-size: var(--text-xs);
		color: var(--fg-3);
		white-space: nowrap;
	}

	.mail__subject {
		font-size: var(--text-sm);
		color: var(--fg-1);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.mail__row--unread .mail__subject {
		font-weight: var(--weight-medium);
	}

	.mail__preview {
		font-size: var(--text-xs);
		color: var(--fg-3);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.mail__read {
		display: flex;
		flex-direction: column;
		padding: var(--space-5);
		gap: var(--space-4);
	}

	.mail__read-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.mail__read-subject {
		margin: 0 0 var(--space-1);
		font-size: var(--text-lg);
		color: var(--fg-0);
	}

	.mail__read-meta {
		font-size: var(--text-sm);
		color: var(--fg-2);
	}

	.mail__read-actions {
		display: flex;
		gap: var(--space-2);
	}

	.mail__read-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		font-size: var(--text-sm);
		line-height: var(--leading-relaxed, 1.7);
		color: var(--fg-1);
	}

	.mail__read-body p {
		margin: 0;
	}

	.mail__sig {
		color: var(--fg-2);
	}
</style>
