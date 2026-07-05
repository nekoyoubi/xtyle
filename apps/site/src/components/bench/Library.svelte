<script lang="ts">
	import type { Algorithm } from "@xtyle/core";
	import { themeStore } from "../../lib/theme-store/store.svelte.js";
	import {
		readDroppedFiles,
		type ImportResult,
	} from "../../lib/theme-store/io.js";
	import type { ThemeDoc } from "../../lib/theme-store/types.js";
	import { algorithmLabel } from "./state.js";
	import ThemeThumb from "./ThemeThumb.svelte";

	interface Props {
		open: boolean;
		editingId: string | null;
		algos?: Map<string, Algorithm> | null;
		onclose: () => void;
		onopendoc: (doc: ThemeDoc) => void;
		onnew: () => void;
	}

	let { open, editingId, algos = null, onclose, onopendoc, onnew }: Props =
		$props();

	let drawerEl = $state<HTMLElement>();
	let lastFocused: HTMLElement | null = null;
	const FOCUSABLE =
		'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

	$effect(() => {
		if (!open || !drawerEl) return;
		lastFocused = document.activeElement as HTMLElement | null;
		const first = drawerEl.querySelector<HTMLElement>(FOCUSABLE);
		(first ?? drawerEl).focus();
		return () => lastFocused?.focus?.();
	});

	function openDoc(doc: ThemeDoc): void {
		onopendoc(doc);
		onclose();
	}

	function newTheme(): void {
		onnew();
		onclose();
	}

	let fileInput = $state<HTMLInputElement | undefined>();
	let dragActive = $state(false);
	let importNotice = $state<string | null>(null);
	let noticeTimer: ReturnType<typeof setTimeout> | undefined;

	function noticeFor(result: ImportResult): string {
		const added = result.docs.length;
		if (added === 0) return "No themes imported — file was empty or invalid.";
		const plural = added === 1 ? "theme" : "themes";
		if (result.rejected === 0) return `Imported ${added} ${plural}.`;
		return `Imported ${added} ${plural}, skipped ${result.rejected}.`;
	}

	function showNotice(text: string): void {
		importNotice = text;
		if (noticeTimer) clearTimeout(noticeTimer);
		noticeTimer = setTimeout(() => (importNotice = null), 4000);
	}

	async function ingest(files: FileList | null): Promise<void> {
		if (!files || files.length === 0) return;
		const result = await readDroppedFiles(files);
		if (result.docs.length > 0) {
			const added = themeStore.importDocs(result.docs);
			const last = added[added.length - 1];
			if (last) onopendoc(last);
		}
		showNotice(noticeFor(result));
	}

	function pickFiles(): void {
		fileInput?.click();
	}

	async function onFilePicked(e: Event): Promise<void> {
		const input = e.currentTarget as HTMLInputElement;
		await ingest(input.files);
		input.value = "";
	}

	function onDragOver(e: DragEvent): void {
		e.preventDefault();
		dragActive = true;
	}

	function onDragLeave(): void {
		dragActive = false;
	}

	async function onDrop(e: DragEvent): Promise<void> {
		e.preventDefault();
		dragActive = false;
		await ingest(e.dataTransfer?.files ?? null);
	}

	function onKeydown(e: KeyboardEvent): void {
		if (e.key === "Escape") {
			onclose();
			return;
		}
		if (e.key === "Tab" && drawerEl) {
			const items = Array.from(
				drawerEl.querySelectorAll<HTMLElement>(FOCUSABLE),
			).filter((el) => el.offsetParent !== null);
			if (items.length === 0) return;
			const first = items[0];
			const last = items[items.length - 1];
			const active = document.activeElement;
			if (e.shiftKey && active === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && active === last) {
				e.preventDefault();
				first.focus();
			}
		}
	}
</script>

<svelte:window onkeydown={open ? onKeydown : undefined} />

{#if open}
	<button
		type="button"
		class="library__scrim"
		aria-label="Close library"
		tabindex="-1"
		onclick={onclose}
	></button>
{/if}

<div
	class="library"
	class:library--open={open}
	bind:this={drawerEl}
	role="dialog"
	aria-modal="true"
	inert={!open}
	aria-label="Theme library"
>
	<header class="library__head">
		<strong class="library__title">Library</strong>
		<div class="library__head-actions">
			<button type="button" class="library__import" onclick={pickFiles}>
				<span aria-hidden="true">⤓</span> Import theme
			</button>
			<button
				type="button"
				class="library__close"
				aria-label="Close library"
				onclick={onclose}
			>×</button>
		</div>
	</header>

	<div
		class="library__body"
		class:library__body--drag={dragActive}
		role="group"
		ondragover={onDragOver}
		ondragleave={onDragLeave}
		ondrop={onDrop}
	>
		<div class="library__grid">
			<button type="button" class="library__new" onclick={newTheme}>
				<span class="library__new-glyph" aria-hidden="true">+</span>
				<span class="library__new-label">New theme</span>
			</button>

			{#each themeStore.docs as doc (doc.id)}
				<article
					class="library-card"
					class:library-card--editing={doc.id === editingId}
				>
					<button
						type="button"
						class="library-card__open"
						onclick={() => openDoc(doc)}
						aria-label={`Open ${doc.meta.name}`}
					>
						<ThemeThumb {doc} {algos} />
					</button>

					<div class="library-card__meta">
						<span class="library-card__name" title={doc.meta.name}>{doc.meta.name}</span>
						<span class="library-card__badge">{algorithmLabel(doc.recipe.algorithm)}</span>
					</div>

					{#if themeStore.activeId === doc.id}
						<span class="library-card__pill">site theme</span>
					{/if}
				</article>
			{/each}
		</div>

		{#if themeStore.docs.length === 0}
			<p class="library__empty">Start with a new theme — your saved themes show up here.</p>
		{/if}

		{#if dragActive}
			<div class="library__dropzone" aria-hidden="true">Drop <code>.xtyle.json</code> to import</div>
		{/if}
	</div>

	<footer class="library__foot">
		<span class="library__foot-hint">Drop a <code>.xtyle.json</code> file here to import</span>
		{#if importNotice}
			<span class="library__notice" role="status">{importNotice}</span>
		{/if}
		<input
			bind:this={fileInput}
			type="file"
			accept=".xtyle.json,application/json"
			multiple
			class="library__file"
			onchange={onFilePicked}
			tabindex="-1"
			aria-hidden="true"
		/>
	</footer>
</div>

<style>
	.library__scrim {
		position: absolute;
		inset: 0;
		z-index: 4;
		border: none;
		padding: 0;
		background: var(--scrim, color-mix(in oklab, var(--bg-0) 60%, transparent));
		cursor: pointer;
		animation: library-fade var(--duration-fast, 160ms) var(--ease, ease) both;
	}

	@keyframes library-fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.library {
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		z-index: 5;
		width: min(28rem, 92%);
		max-width: 92%;
		background: var(--surface-overlay, var(--bg-1));
		border-right: var(--border-thin) solid var(--surface-overlay-border, var(--line));
		box-shadow: var(--shadow-lg, 0 1.5rem 3rem rgba(0, 0, 0, 0.35));
		display: flex;
		flex-direction: column;
		transform: translateX(-102%);
		transition: transform var(--duration, 280ms) var(--ease, cubic-bezier(0.22, 1, 0.36, 1));
		pointer-events: none;
	}

	.library--open {
		transform: translateX(0);
		pointer-events: auto;
	}

	.library__head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4);
		border-bottom: var(--border-thin) solid var(--line);
	}

	.library__title {
		font-family: var(--font-display, var(--font-sans));
		font-size: var(--text-lg);
		color: var(--fg-0);
	}

	.library__head-actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.library__close {
		font-size: var(--text-xl);
		line-height: 1;
		color: var(--fg-2);
		background: transparent;
		border: var(--border-thin) solid transparent;
		border-radius: var(--radius-sm);
		width: 2rem;
		height: 2rem;
		cursor: pointer;
	}

	.library__close:hover {
		color: var(--fg-0);
		border-color: var(--line);
	}

	.library__body {
		position: relative;
		flex: 1;
		overflow-y: auto;
		padding: var(--space-4);
	}

	.library__body--drag {
		outline: var(--border-thin) dashed var(--accent);
		outline-offset: calc(-1 * var(--space-2));
	}

	.library__dropzone {
		position: absolute;
		inset: var(--space-3);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-1);
		z-index: 2;
		border-radius: var(--radius-md);
		background: var(--state-drag, color-mix(in oklab, var(--accent) 16%, transparent));
		color: var(--fg-0);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		pointer-events: none;
	}

	.library__dropzone code {
		font-family: var(--font-mono);
	}

	.library__grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
		gap: var(--space-4);
	}

	.library__new {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		aspect-ratio: 16 / 10;
		border: var(--border-thin) dashed var(--line);
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--fg-2);
		cursor: pointer;
		transition:
			color var(--duration-fast, 160ms) var(--ease, ease),
			border-color var(--duration-fast, 160ms) var(--ease, ease);
	}

	.library__new:hover {
		color: var(--accent);
		border-color: var(--accent);
	}

	.library__new-glyph {
		font-size: var(--text-2xl, 1.75rem);
		line-height: 1;
	}

	.library__new-label {
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
	}

	.library-card {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.library-card__open {
		display: block;
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;
		border-radius: var(--radius-md);
	}

	.library-card--editing .library-card__open {
		box-shadow: 0 0 0 2px var(--ring, var(--accent));
	}

	.library-card__meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		min-width: 0;
	}

	.library-card__name {
		flex: 1;
		min-width: 0;
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--fg-0);
		text-align: left;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.library-card__badge {
		flex: none;
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		color: var(--accent-text, var(--accent));
		background: var(--accent-bg, color-mix(in oklab, var(--accent) 14%, transparent));
		border-radius: var(--radius-pill, 999px);
		padding: 0.05rem var(--space-2);
	}

	.library-card__pill {
		position: absolute;
		top: var(--space-2);
		right: var(--space-2);
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		color: var(--success-text, var(--success));
		background: var(--success-bg, color-mix(in oklab, var(--success) 16%, transparent));
		border-radius: var(--radius-pill, 999px);
		padding: 0.05rem var(--space-2);
	}

	.library__empty {
		margin-top: var(--space-5);
		color: var(--fg-2);
		font-size: var(--text-sm);
		text-align: center;
	}

	.library__foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		border-top: var(--border-thin) solid var(--line);
	}

	.library__import {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--fg-0);
		background: var(--bg-2);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-md);
		padding: var(--space-2) var(--space-3);
		cursor: pointer;
	}

	.library__import:hover {
		border-color: var(--accent);
	}

	.library__foot-hint {
		font-size: var(--text-xs);
		color: var(--fg-2);
	}

	.library__foot-hint code {
		font-family: var(--font-mono);
	}

	.library__notice {
		flex-basis: 100%;
		font-size: var(--text-xs);
		color: var(--accent-text, var(--accent));
	}

	.library__file {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		opacity: 0;
	}
</style>
