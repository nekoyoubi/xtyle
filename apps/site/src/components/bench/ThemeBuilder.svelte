<script lang="ts">
	import { untrack } from "svelte";
	import type { Algorithm, TokenLineageNode, TokenRegister } from "@xtyle/core";
	import { buildThemeFile, derive, emit, loadAuthoredAlgorithm, serializeThemeFile } from "@xtyle/core";
	import { getAlgorithm } from "@xtyle/core/algorithms";
	import { makeXtyleAlgorithm, toPreset, type XtyleAlgorithmSpec } from "@xtyle/core/authoring";
	import Controls from "./Controls.svelte";
	import BenchGallery from "./BenchGallery.svelte";
	import Inspectors from "./Inspectors.svelte";
	import Library from "./Library.svelte";
	import EmailClient from "./mockups/EmailClient.svelte";
	import NewsSite from "./mockups/NewsSite.svelte";
	import CrmApp from "./mockups/CrmApp.svelte";
	import SettingsPanel from "./mockups/SettingsPanel.svelte";
	import DashboardApp from "./mockups/DashboardApp.svelte";
	import CodeWorkspace from "./mockups/CodeWorkspace.svelte";
	import OrderStatus from "./mockups/OrderStatus.svelte";
	import { AppShell, Badge, Button, Switch, Tabs, Toolbar } from "@xtyle/svelte";
	import { loadHostedAlgorithms } from "./hosted.js";
	import type { BenchState } from "./state.js";
	import {
		CUSTOM_ALGORITHM,
		CUSTOM_CODE_ALGORITHM,
		algorithmLabel,
		anchorsToConstraints,
		decodeState,
		defaultState,
		encodeState,
		normalizeState,
		toDeriveKnobs,
		toInvocation,
	} from "./state.js";
	import { themeStore } from "../../lib/theme-store/store.svelte.js";
	import { exportDoc, parseImport } from "../../lib/theme-store/io.js";
	import type { ThemeDoc } from "../../lib/theme-store/types.js";
	import { reapplyActiveTheme, broadcastActiveTheme, ACTIVE_CHANGED_EVENT } from "../../lib/theme-active.js";

	let editingId = $state<string | null>(null);

	let state: BenchState = $state(readInitialState());

	function readInitialState(): BenchState {
		if (typeof window !== "undefined" && window.location.hash.length > 1) {
			const decoded = decodeState(window.location.hash.slice(1));
			if (decoded) {
				const imported = themeStore.create({
					name: "Shared theme",
					recipe: decoded,
				});
				editingId = imported.id;
				window.history.replaceState(null, "", window.location.pathname);
				return decoded;
			}
		}
		const selected = themeStore.selectedDoc;
		if (selected) {
			editingId = selected.id;
			return normalizeState($state.snapshot(selected.recipe));
		}
		const created = themeStore.create({ recipe: defaultState() });
		editingId = created.id;
		return $state.snapshot(created.recipe) as BenchState;
	}

	let hosted = $state<Map<string, Algorithm> | null>(null);

	$effect(() => {
		let live = true;
		loadHostedAlgorithms()
			.then((map) => {
				if (live) hosted = map;
			})
			.catch(() => {
				/* baked algorithms remain the fallback */
			});
		return () => {
			live = false;
		};
	});

	const baseAlgorithm = $derived<Algorithm>(
		state.algorithm === CUSTOM_ALGORITHM || state.algorithm === CUSTOM_CODE_ALGORITHM
			? getAlgorithm("xtyle-default")
			: (hosted?.get(state.algorithm) ?? getAlgorithm(state.algorithm)),
	);

	// The on-site authored *code* algorithm loads asynchronously through the hosted sandbox, so it
	// can't be built inline in the sync derive. This effect (re)loads it on every code edit, debounced
	// so a keystroke doesn't spin up a fresh QuickJS runtime, and parks the result for the derive to
	// pick up — the last good theme stays on screen until the new build resolves or its error surfaces.
	let authoredAlgorithm = $state<Algorithm | null>(null);
	let authoredError = $state<string | null>(null);

	$effect(() => {
		if (state.algorithm !== CUSTOM_CODE_ALGORITHM) {
			authoredError = null;
			return;
		}
		const code = state.customCode ?? "";
		if (!code.trim()) {
			authoredError = null;
			authoredAlgorithm = null;
			return;
		}
		let cancelled = false;
		const handle = setTimeout(() => {
			loadAuthoredAlgorithm(code, { name: "custom-code" })
				.then((algo) => {
					if (cancelled) return;
					authoredAlgorithm = algo;
					authoredError = null;
				})
				.catch((e) => {
					if (!cancelled) authoredError = (e as Error).message;
				});
		}, 400);
		return () => {
			cancelled = true;
			clearTimeout(handle);
		};
	});

	/**
	 * Build the on-site authored algorithm from its taste-vector spec (throws on invalid JSON).
	 * `customSpec` is a Tier-1 spec — pure data, no code body — so it derives in-process safely:
	 * the only consumer is `makeXtyleAlgorithm`, a data→tokens transform, never `eval`. A Tier-2
	 * authored algorithm (an arbitrary `derive` body) is foreign code even when self-authored and
	 * must arrive in its own field and run through the hosted sandbox (`loadAlgorithm`), never this
	 * baked path — so a shared link carrying code can't ride Tier-1's in-process assumption.
	 */
	function buildCustomAlgorithm(): Algorithm {
		const spec = JSON.parse(state.customSpec ?? "{}") as Record<string, unknown>;
		return makeXtyleAlgorithm(toPreset({ id: "custom", ...spec } as XtyleAlgorithmSpec));
	}

	const initialRegister: TokenRegister = derive(getAlgorithm("xtyle-default"), {
		knobs: toDeriveKnobs(defaultState().knobs),
		constraints: anchorsToConstraints(defaultState().anchors),
	});
	let lastGood = $state<TokenRegister>(initialRegister);
	let lastGoodAlgorithm = $state<Algorithm>(getAlgorithm("xtyle-default"));

	interface DeriveResult {
		algorithm: Algorithm;
		register: TokenRegister;
		error: string | null;
	}

	const result = $derived<DeriveResult>(deriveResult());

	function deriveResult(): DeriveResult {
		try {
			let built: Algorithm;
			if (state.algorithm === CUSTOM_ALGORITHM) {
				built = buildCustomAlgorithm();
			} else if (state.algorithm === CUSTOM_CODE_ALGORITHM) {
				if (!(state.customCode ?? "").trim()) {
					// a custom-code theme with no source — restored from a share link (which never
					// carries code) or a legacy doc — has nothing to drive the sandbox; fall back to
					// the neutral default rather than erroring on every load.
					built = baseAlgorithm;
				} else if (authoredError) {
					throw new Error(authoredError);
				} else if (!authoredAlgorithm) {
					// the sandbox build is in flight on first open / right after an edit — hold the
					// last good theme without flagging an error until the async load resolves.
					return { algorithm: lastGoodAlgorithm, register: lastGood, error: null };
				} else {
					built = authoredAlgorithm;
				}
			} else {
				built = baseAlgorithm;
			}
			return {
				algorithm: built,
				register: derive(built, {
					knobs: toDeriveKnobs(state.knobs),
					// bg/fg/accent ride the one token channel; explicit overrides layer on top.
					constraints: { ...anchorsToConstraints(state.anchors), ...state.overrides },
				}),
				error: null,
			};
		} catch (e) {
			return { algorithm: lastGoodAlgorithm, register: lastGood, error: (e as Error).message };
		}
	}

	const algorithm = $derived<Algorithm>(result.algorithm);
	const register = $derived<TokenRegister>(result.register);
	const error = $derived<string | null>(result.error);

	/** For each token, how many other tokens transitively derive from it — the blast radius of editing
	 * it. Read off the lineage graph's `refs` (reversed), so a set token's badge says what it feeds. */
	function computeInfluence(nodes: TokenLineageNode[]): Record<string, number> {
		const dependents = new Map<string, Set<string>>();
		for (const node of nodes) {
			for (const ref of node.refs ?? []) {
				let set = dependents.get(ref);
				if (!set) dependents.set(ref, (set = new Set()));
				set.add(node.name);
			}
		}
		const influence: Record<string, number> = {};
		for (const node of nodes) {
			const seen = new Set<string>();
			const stack = [...(dependents.get(node.name) ?? [])];
			while (stack.length) {
				const t = stack.pop() as string;
				if (seen.has(t)) continue;
				seen.add(t);
				for (const d of dependents.get(t) ?? []) stack.push(d);
			}
			influence[node.name] = seen.size;
		}
		return influence;
	}

	const influence = $derived.by<Record<string, number>>(() => {
		try {
			return computeInfluence(
				algorithm.lineage({
					knobs: toDeriveKnobs(state.knobs),
					constraints: { ...anchorsToConstraints(state.anchors), ...state.overrides },
				}),
			);
		} catch {
			return {};
		}
	});

	$effect(() => {
		if (!result.error) {
			lastGood = result.register;
			lastGoodAlgorithm = result.algorithm;
		}
	});

	let savedAt = $state<number | null>(null);

	$effect(() => {
		if (typeof window === "undefined") return;
		if (editingId === null) return;
		const id = editingId;
		const snapshot = $state.snapshot(state) as BenchState;
		untrack(() => {
			themeStore.updateRecipe(id, snapshot);
			savedAt = Date.now();
			if (themeStore.activeId === id) reapplyActiveTheme();
		});
	});

	let nowTick = $state(Date.now());
	$effect(() => {
		if (typeof window === "undefined") return;
		const handle = window.setInterval(() => (nowTick = Date.now()), 15_000);
		return () => window.clearInterval(handle);
	});

	const editingDoc = $derived<ThemeDoc | null>(
		editingId === null
			? null
			: (themeStore.docs.find((doc) => doc.id === editingId) ?? null),
	);

	const savedLabel = $derived.by<string>(() => {
		void nowTick;
		if (savedAt === null) return "saved";
		const diff = Date.now() - savedAt;
		if (diff < 4_000) return "saved";
		if (diff < 60_000) return `saved ${Math.round(diff / 1000)}s ago`;
		if (diff < 3_600_000) return `saved ${Math.round(diff / 60_000)}m ago`;
		return "saved";
	});

	let libraryOpen = $state(false);

	function openDocInEditor(doc: ThemeDoc): void {
		editingId = doc.id;
		themeStore.setSelected(doc.id);
		state = normalizeState($state.snapshot(doc.recipe));
		savedAt = doc.updatedAt;
	}

	function newTheme(): void {
		const created = themeStore.create({ recipe: defaultState() });
		editingId = created.id;
		state = $state.snapshot(created.recipe) as BenchState;
		savedAt = created.updatedAt;
	}

	function duplicateTheme(): void {
		if (editingId === null) return;
		const copy = themeStore.duplicate(editingId);
		editingId = copy.id;
		state = $state.snapshot(copy.recipe) as BenchState;
		savedAt = copy.updatedAt;
	}

	function deleteTheme(): void {
		if (editingId === null) return;
		if (typeof window !== "undefined") {
			const ok = window.confirm(`Delete "${themeName}"? This cannot be undone.`);
			if (!ok) return;
		}
		themeStore.remove(editingId);
		const next = themeStore.selectedDoc ?? themeStore.docs[0] ?? null;
		if (next) openDocInEditor(next);
		else newTheme();
	}

	function renameEditing(name: string): void {
		if (editingId === null) return;
		const trimmed = name.trim();
		if (trimmed) themeStore.rename(editingId, trimmed);
	}

	const themeName = $derived(editingDoc?.meta.name ?? "Untitled");

	let renaming = $state(false);
	let renameValue = $state("");
	let nameButtonEl = $state<HTMLButtonElement>();
	let nameHadFocus = false;

	function startRename(): void {
		if (editingId === null) return;
		renameValue = themeName;
		renaming = true;
	}

	function commitRename(): void {
		renameEditing(renameValue);
		renaming = false;
		nameHadFocus = false;
	}

	function cancelRename(): void {
		renaming = false;
		nameHadFocus = false;
	}

	function onNameMousedown(): void {
		nameHadFocus = document.activeElement === nameButtonEl;
	}

	function onNameClick(): void {
		if (nameHadFocus) startRename();
	}

	function onNameKeydown(e: KeyboardEvent): void {
		if (e.key === "F2" || e.key === "Enter") {
			e.preventDefault();
			startRename();
		}
	}

	function onRenameKeydown(e: KeyboardEvent): void {
		if (e.key === "Enter") {
			e.preventDefault();
			commitRename();
		} else if (e.key === "Escape") {
			e.preventDefault();
			cancelRename();
		}
	}

	function autofocusSelect(node: HTMLInputElement): void {
		node.focus();
		node.select();
	}

	function exportEditing(): void {
		if (editingDoc) exportDoc(editingDoc, register);
	}

	const SITE_SYNC_KEY = "xtyle.bench.site-sync";

	function loadSiteSync(): boolean {
		if (typeof localStorage === "undefined") return false;
		try {
			return localStorage.getItem(SITE_SYNC_KEY) === "1";
		} catch {
			return false;
		}
	}

	let siteSync = $state(loadSiteSync());

	/** Set the active site theme, reapply it to the document, and notify the other islands. */
	function applyActiveTheme(id: string | null): void {
		themeStore.setActive(id);
		reapplyActiveTheme();
		broadcastActiveTheme(id);
	}

	function setSiteSync(on: boolean): void {
		siteSync = on;
		if (typeof localStorage !== "undefined") {
			try {
				localStorage.setItem(SITE_SYNC_KEY, on ? "1" : "0");
			} catch {
				/* best-effort */
			}
		}
		if (on && editingId !== null) applyActiveTheme(editingId);
	}

	// Mirror bench → site: while synced, the active site theme follows whatever theme the bench has loaded.
	$effect(() => {
		if (typeof window === "undefined") return;
		if (!siteSync) return;
		const id = editingId;
		if (id === null) return;
		untrack(() => {
			if (themeStore.activeId !== id) applyActiveTheme(id);
		});
	});

	// Mirror site → bench: while synced, picking a theme in the outer dropdown loads it into the bench.
	$effect(() => {
		if (typeof window === "undefined") return;
		const sync = siteSync;
		const loaded = editingId;
		const handler = (e: Event): void => {
			if (!sync) return;
			const id = (e as CustomEvent<{ id: string | null }>).detail?.id ?? null;
			if (id === null) {
				// "Default" is the shipped baseline, not a saved theme — there's nothing to mirror,
				// so picking it in the dropdown breaks the sync link rather than loading a theme.
				setSiteSync(false);
				return;
			}
			if (id === loaded) return;
			const doc = themeStore.docs.find((d) => d.id === id);
			if (doc) openDocInEditor(doc);
		};
		window.addEventListener(ACTIVE_CHANGED_EVENT, handler);
		return () => window.removeEventListener(ACTIVE_CHANGED_EVENT, handler);
	});

	let exportFormat = $state("css");

	function themeFileText(): string {
		return serializeThemeFile(
			buildThemeFile({
				meta: {
					name: editingDoc?.meta.name ?? "Untitled",
					generator: "@xtyle/core",
				},
				recipe: state,
				register,
			}),
		);
	}

	const exportText = $derived(
		exportFormat === "css"
			? emit(register, "css")
			: exportFormat === "tokens"
				? emit(register, "json")
				: exportFormat === "theme"
					? themeFileText()
					: toInvocation(state),
	);

	const EXPORT_FORMATS: { value: typeof exportFormat; label: string }[] = [
		{ value: "css", label: "CSS" },
		{ value: "tokens", label: "Tokens" },
		{ value: "theme", label: "Theme" },
		{ value: "invocation", label: "Invocation" },
	];

	let copyLabel = $state("Copy");

	async function copyExport(): Promise<void> {
		try {
			await navigator.clipboard.writeText(exportText);
			copyLabel = "Copied";
			setTimeout(() => (copyLabel = "Copy"), 1200);
		} catch {
			/* clipboard unavailable */
		}
	}

	let shareLabel = $state("Copy share link");

	async function copyShare(): Promise<void> {
		if (typeof window === "undefined") return;
		const url = `${window.location.origin}${window.location.pathname}#${encodeState(state)}`;
		try {
			await navigator.clipboard.writeText(url);
			shareLabel = "Link copied";
			setTimeout(() => (shareLabel = "Copy share link"), 1200);
		} catch {
			/* clipboard unavailable */
		}
	}

	function reset(): void {
		state = defaultState();
	}

	let importOpen = $state(false);
	let importText = $state("");
	let importStatus = $state<string | null>(null);

	function loadFromText(): void {
		const result = parseImport(importText);
		const doc = result.docs[0];
		if (!doc) {
			importStatus = "Couldn't read a theme from that JSON.";
			return;
		}
		state = normalizeState($state.snapshot(doc.recipe));
		if (editingId !== null) renameEditing(doc.meta.name);
		importText = "";
		importStatus = `Loaded "${doc.meta.name}" into this theme.`;
	}

	const tokenCount = $derived(Object.keys(register).length);

	const MAIN_TABS = [
		{ value: "mockups", label: "Mockups" },
		{ value: "components", label: "Components" },
		{ value: "report", label: "Report" },
		{ value: "export", label: "Export" },
		{ value: "help", label: "Help" },
	];
	let mainTab = $state("mockups");

	const MOCKUP_TABS = [
		{ value: "email", label: "Email Client" },
		{ value: "news", label: "News Site" },
		{ value: "crm", label: "CRM App" },
		{ value: "settings", label: "Settings" },
		{ value: "dashboard", label: "Dashboard" },
		{ value: "code", label: "Code Workspace" },
		{ value: "order", label: "Order Status" },
	];
	let mockupTab = $state("email");

	const COMPONENT_TABS = [
		{ value: "buttons", label: "Buttons" },
		{ value: "form", label: "Form" },
		{ value: "feedback", label: "Feedback" },
		{ value: "navigation", label: "Navigation" },
		{ value: "data", label: "Data" },
		{ value: "typography", label: "Type" },
		{ value: "overlays", label: "Overlays" },
	];
	let componentTab = $state("buttons");

	const REPORT_TABS = [
		{ value: "contrast", label: "Contrast" },
		{ value: "coverage", label: "Coverage" },
		{ value: "gamut", label: "Gamut" },
		{ value: "graph", label: "Graph" },
	];
	let reportTab = $state("contrast");

	const HELP_TABS = [
		{ value: "overview", label: "Overview" },
		{ value: "tiers", label: "Input tiers" },
		{ value: "authoring", label: "Authoring" },
	];
	let helpTab = $state("overview");

	/**
	 * Keep a nested sub-tab's activation from leaking to the outer Tabs. The Tabs element
	 * binds its `[role="tab"]` click/keydown interaction on its own shadow root in the bubble
	 * phase, so an inner tab's event bubbles up and the outer matches it too — selecting a key
	 * it doesn't own and falling back to its first tab. The inner element (deeper in the path)
	 * has already handled the event by the time it reaches this wrapper, so stopping it here is
	 * safe; scoped to tab events so panel content (menus, dialogs) still bubbles normally.
	 */
	function containSubTabChange(e: Event): void {
		if ((e.target as HTMLElement | null)?.classList?.contains("bench-subtabs")) {
			e.stopPropagation();
		}
	}

</script>

<div class="bench-shell">
	<AppShell mainId="bench-main" rightSize={368} class="bench-shell__app">
		{#snippet toolbar()}
			<Toolbar>
				{#snippet start()}
					<span class="bench-brand">
						<span class="bench-brand__text">
							<span class="bench-brand__tag">Algorithm &amp; Theme Studio</span>
							{#if renaming}
								<input
									class="bench-brand__name-input"
									bind:value={renameValue}
									use:autofocusSelect
									onkeydown={onRenameKeydown}
									onblur={commitRename}
									aria-label="Theme name"
									spellcheck="false"
								/>
							{:else}
								<button
									type="button"
									class="bench-brand__name"
									bind:this={nameButtonEl}
									onmousedown={onNameMousedown}
									onclick={onNameClick}
									onkeydown={onNameKeydown}
									title="Click again or press F2 to rename"
								>{themeName}</button>
							{/if}
						</span>
					</span>
				{/snippet}
				{#snippet center()}
					<div class="bench-actions">
						<Button size="sm" variant="subtle" onclick={() => (libraryOpen = true)}>
							<span aria-hidden="true">&#9656;</span> Library
						</Button>
						<Button size="sm" variant="subtle" onclick={newTheme}>New</Button>
						<Button size="sm" variant="subtle" onclick={duplicateTheme}>Save a copy</Button>
						<Button size="sm" variant="subtle" tone="warn" onclick={reset}>Reset</Button>
						<Button size="sm" variant="subtle" tone="danger" onclick={deleteTheme}>Delete</Button>
					</div>
				{/snippet}
				{#snippet end()}
					<Badge tone="info" variant="soft" size="sm">{savedLabel}</Badge>
					<Switch
						checked={siteSync}
						label="Site Sync"
						title="Mirror the loaded theme with the site's active theme"
						onchange={(e) => setSiteSync((e.currentTarget as unknown as { checked: boolean }).checked)}
					/>
				{/snippet}
			</Toolbar>
		{/snippet}

		{#snippet right()}
			<aside class="bench__rail x-surface-section">
				<Controls bench={state} {register} {influence} onchange={(next) => (state = next)} />
			</aside>
		{/snippet}

	<div class="bench__content">
	<div class="bench__main">
		{#if error}
			<div class="bench__error" role="alert">
				<strong>Derivation error</strong>
				<span>{error}</span>
				<span class="bench__error-hint">Showing the last valid theme.</span>
			</div>
		{/if}

		<div class="bench__tabs">
		<Tabs items={MAIN_TABS} bind:value={mainTab} variant="enclosed" sticky label="Bench view">
			{#snippet panel(value)}
				{#if value === "mockups"}
					<div class="bench-subtabs-wrap" onchange={containSubTabChange}>
						<Tabs items={MOCKUP_TABS} bind:value={mockupTab} variant="underline" class="bench-subtabs" label="Mockup scene">
							{#snippet panel(scene)}
								<div class="bench-scene">
									{#if scene === "email"}
										<EmailClient {register} />
									{:else if scene === "news"}
										<NewsSite {register} />
									{:else if scene === "crm"}
										<CrmApp {register} />
									{:else if scene === "settings"}
										<SettingsPanel {register} />
									{:else if scene === "dashboard"}
										<DashboardApp {register} />
									{:else if scene === "code"}
										<CodeWorkspace {register} />
									{:else}
										<OrderStatus {register} />
									{/if}
								</div>
							{/snippet}
						</Tabs>
					</div>
				{:else if value === "components"}
					<div class="bench-subtabs-wrap" onchange={containSubTabChange}>
						<Tabs items={COMPONENT_TABS} bind:value={componentTab} variant="underline" class="bench-subtabs" label="Component family">
							{#snippet panel(fam)}
								<div class="bench-scene">
									<BenchGallery {register} family={fam} />
								</div>
							{/snippet}
						</Tabs>
					</div>
				{:else if value === "report"}
					<div class="bench-subtabs-wrap" onchange={containSubTabChange}>
						<Tabs items={REPORT_TABS} bind:value={reportTab} variant="underline" class="bench-subtabs" label="Report view">
							{#snippet panel(p)}
								<div class="bench-scene">
									<Inspectors {register} {algorithm} bench={state} panel={p} />
								</div>
							{/snippet}
						</Tabs>
					</div>
				{:else if value === "export"}
					<div class="bench-subtabs-wrap" onchange={containSubTabChange}>
						<Tabs items={EXPORT_FORMATS} bind:value={exportFormat} variant="underline" class="bench-subtabs" label="Export format">
							{#snippet panel(fmt)}
								<div class="bench-scene bench-export">
									<div class="bench__export-actions">
										<Button size="sm" variant="subtle" onclick={() => (importOpen = !importOpen)}>{importOpen ? "Close import" : "Import JSON"}</Button>
										<Button size="sm" variant="subtle" onclick={copyShare}>{shareLabel}</Button>
										<Button size="sm" variant="solid" tone="accent" onclick={copyExport}>{copyLabel}</Button>
									</div>
									{#if importOpen}
										<div class="bench__import">
											<label class="bench__import-label" for="bench-import">Paste a <code>.xtyle.json</code> theme (or a raw token map) to load it into this theme</label>
											<textarea
												id="bench-import"
												class="bench__export-area"
												spellcheck="false"
												placeholder={'{ "format": "xtyle-theme", … }'}
												bind:value={importText}
											></textarea>
											<div class="bench__import-actions">
												<Button size="sm" variant="solid" tone="accent" onclick={loadFromText} disabled={!importText.trim()}>Load theme</Button>
												{#if importStatus}<span class="bench__import-status" role="status">{importStatus}</span>{/if}
											</div>
										</div>
									{:else}
										<textarea class="bench__export-area" readonly spellcheck="false" aria-label={`Emitted ${fmt}`}>{exportText}</textarea>
									{/if}
								</div>
							{/snippet}
						</Tabs>
					</div>
				{:else}
					<div class="bench-subtabs-wrap" onchange={containSubTabChange}>
						<Tabs items={HELP_TABS} bind:value={helpTab} variant="underline" class="bench-subtabs" label="Help topic">
							{#snippet panel(topic)}
								<div class="bench-scene">
									{#if topic === "overview"}
										<p class="bench__help-text">
											Pick an algorithm and you have a working theme. From there set as little
											or as much as you want: a few anchor colors, the knobs, or any of the
											{tokenCount} derived tokens directly. <code>@xtyle/core</code> re-derives the
											whole register in your browser on every change; the mockups, the report,
											and the export all read straight from it.
										</p>
									{:else if topic === "tiers"}
										<p class="bench__help-text">
											Three input tiers, each optional on top of the last. The
											<strong>algorithm</strong> is the only required choice — it maps a few
											anchors into a full token set. <strong>Anchors and knobs</strong> are the
											casual dials: background, foreground, accent, vibrancy, density, and the
											rest. <strong>Token overrides</strong> are the escape hatch — set any of the
											{tokenCount} derived tokens directly and the dependents re-solve around it.
										</p>
									{:else}
										<p class="bench__help-text">
											Beyond the blessed algorithms, you can author your own.
											<strong>Custom</strong> takes a taste-vector spec — pure JSON that builds an
											algorithm in-process. <strong>Custom code</strong> runs an import-free
											<code>defineAlgorithm</code> source in xript's zero-authority sandbox. Both
											feed the same derivation, and anchors, knobs, and overrides still layer on top.
										</p>
									{/if}
								</div>
							{/snippet}
						</Tabs>
					</div>
				{/if}
			{/snippet}
		</Tabs>
		</div>
	</div>
	</div>
	</AppShell>

	<Library
		open={libraryOpen}
		{editingId}
		algos={hosted}
		onclose={() => (libraryOpen = false)}
		onopendoc={openDocInEditor}
		onnew={newTheme}
	/>
</div>

<style>
	.bench-shell {
		position: relative;
		display: flex;
		flex-direction: column;
		margin: calc(var(--space-5) * -1);
		height: calc(100% + var(--space-5) * 2);
	}

	:global(.bench-shell__app::part(app)) {
		height: 100%;
	}

	:global(.bench-shell__app::part(main)) {
		padding: 0;
	}

	.bench-subtabs-wrap {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.bench-subtabs-wrap :global(.bench-subtabs::part(tablist)) {
		--accent: var(--accent-2);
		--accent-text: var(--accent-2);
		--accent-bg: color-mix(in oklab, var(--accent-2) 16%, transparent);
		--ring: var(--accent-2);
	}

	.bench-scene {
		padding: var(--space-5);
	}

	.bench-brand {
		display: inline-flex;
		align-items: center;
		gap: var(--space-3);
	}

	.bench-brand__text {
		display: inline-flex;
		flex-direction: column;
		line-height: 1.05;
	}

	.bench-brand__name,
	.bench-brand__name-input {
		font-family: "Teko", var(--font-display, var(--font-sans));
		font-weight: 600;
		font-size: var(--text-xl);
		letter-spacing: 0.01em;
		line-height: 1.05;
		color: var(--fg-0);
		border-radius: var(--radius-sm);
		padding: 0 var(--space-1);
		margin-left: calc(var(--space-1) * -1);
	}

	.bench-brand__name {
		max-width: 22rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-align: left;
		background: transparent;
		border: var(--border-thin) solid transparent;
		cursor: default;
	}

	.bench-brand__name:hover,
	.bench-brand__name:focus-visible {
		border-color: var(--line);
		background: var(--bg-0);
		outline: none;
	}

	.bench-brand__name-input {
		width: 16rem;
		background: var(--bg-0);
		border: var(--border-thin) solid var(--accent);
	}

	.bench-brand__tag {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--fg-2);
	}

	.bench-actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.bench-actions__library {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
	}

	.bench__content {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		min-width: 0;
	}

	.bench__rail {
		height: 100%;
		overflow-y: auto;
		padding: var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	/*
	 * The nested shell's right cell sizes to content, so a tall rail can't resolve a
	 * percentage height and won't scroll. Pin the rail to the shell body (a definite-height,
	 * position:relative ancestor) so it fills the body and scrolls internally instead of
	 * clipping. Desktop only — below the shell's breakpoint the rail stacks under the main.
	 */
	@media (min-width: 901px) {
		.bench__rail {
			position: absolute;
			inset: 0 0 0 auto;
			width: var(--xtyle-app-right, 368px);
			height: auto;
		}
	}

	.bench__main {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		min-width: 0;
	}

	.bench__tabs {
		min-width: 0;
	}

	.bench__error {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		background: var(--danger-bg);
		color: var(--danger-text);
		border: var(--border-thin) solid var(--danger);
		border-radius: var(--radius-md);
		padding: var(--space-3) var(--space-4);
		font-size: var(--text-sm);
	}

	.bench__error-hint {
		color: var(--fg-2);
		font-size: var(--text-xs);
	}

	.bench__help-text {
		margin: 0;
		max-width: 52rem;
		color: var(--fg-1);
		font-size: var(--text-md, var(--text-base));
		line-height: var(--leading-relaxed, 1.7);
	}

	.bench__help-text code {
		font-family: var(--font-mono);
	}

	.bench-export {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.bench__export-actions {
		display: flex;
		gap: var(--space-2);
	}


	.bench__import {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.bench__import-label {
		font-size: var(--text-sm);
		color: var(--fg-2);
	}

	.bench__import-label code {
		font-family: var(--font-mono);
	}

	.bench__import-actions {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.bench__import-status {
		font-size: var(--text-sm);
		color: var(--accent-text, var(--accent));
	}

	.bench__export-area {
		width: 100%;
		min-height: 14rem;
		background: var(--bg-0);
		color: var(--fg-1);
		border: var(--border-thin) solid var(--line);
		border-radius: var(--radius-md);
		padding: var(--space-4);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		line-height: var(--leading-normal);
		resize: vertical;
	}

</style>
