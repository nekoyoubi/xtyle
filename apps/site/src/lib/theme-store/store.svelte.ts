import type { StoreBackend } from "./backend.js";
import { defaultBackend } from "./backend.js";
import { migrateEnvelope } from "./migrate.js";
import { defaultState } from "./recipe.js";
import type {
	StoreEnvelope,
	ThemeDoc,
	ThemeMeta,
	ThemeRecipe,
} from "./types.js";
import { CURRENT_SCHEMA_VERSION } from "./types.js";

function freshId(): string {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}
	return `theme-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function uniqueName(base: string, existing: ThemeDoc[]): string {
	const taken = new Set(existing.map((doc) => doc.meta.name));
	if (!taken.has(base)) return base;
	let n = 2;
	while (taken.has(`${base} ${n}`)) n += 1;
	return `${base} ${n}`;
}

function byUpdatedDesc(a: ThemeDoc, b: ThemeDoc): number {
	return b.updatedAt - a.updatedAt;
}

class ThemeStore {
	private docsState = $state<ThemeDoc[]>([]);
	private activeIdState = $state<string | null>(null);
	private selectedIdState = $state<string | null>(null);
	private hydratedState = $state(false);
	private backend: StoreBackend = defaultBackend();
	private suppressPersist = false;

	constructor() {
		this.hydrate();
	}

	get docs(): ThemeDoc[] {
		return this.docsState;
	}

	get activeId(): string | null {
		return this.activeIdState;
	}

	get activeDoc(): ThemeDoc | null {
		const id = this.activeIdState;
		if (id === null) return null;
		return this.docsState.find((doc) => doc.id === id) ?? null;
	}

	get selectedId(): string | null {
		return this.selectedIdState;
	}

	get selectedDoc(): ThemeDoc | null {
		const id = this.selectedIdState;
		if (id === null) return null;
		return this.docsState.find((doc) => doc.id === id) ?? null;
	}

	get hydrated(): boolean {
		return this.hydratedState;
	}

	private ensureHydrated(): void {
		if (this.hydratedState) return;
		if (typeof window === "undefined") return;
		this.hydrate();
	}

	hydrate(): void {
		if (this.hydratedState) return;
		if (typeof window === "undefined") return;
		const raw = this.backend.load();
		const envelope = migrateEnvelope(raw);
		this.suppressPersist = true;
		this.docsState = [...envelope.docs].sort(byUpdatedDesc);
		this.activeIdState = envelope.activeId;
		this.selectedIdState = envelope.selectedId;
		this.suppressPersist = false;
		this.hydratedState = true;
	}

	private snapshot(): StoreEnvelope {
		return {
			schemaVersion: CURRENT_SCHEMA_VERSION,
			docs: this.docsState,
			activeId: this.activeIdState,
			selectedId: this.selectedIdState,
		};
	}

	private commit(): void {
		this.docsState = [...this.docsState].sort(byUpdatedDesc);
		if (this.suppressPersist) return;
		if (typeof window === "undefined") return;
		this.backend.save(this.snapshot());
	}

	create(opts?: { name?: string; recipe?: ThemeRecipe }): ThemeDoc {
		this.ensureHydrated();
		const now = Date.now();
		const name = uniqueName(opts?.name ?? "Untitled", this.docsState);
		const doc: ThemeDoc = {
			schemaVersion: CURRENT_SCHEMA_VERSION,
			id: freshId(),
			meta: { name },
			recipe: opts?.recipe ?? defaultState(),
			createdAt: now,
			updatedAt: now,
		};
		this.docsState = [doc, ...this.docsState];
		this.selectedIdState = doc.id;
		this.commit();
		return doc;
	}

	duplicate(id: string): ThemeDoc {
		this.ensureHydrated();
		const source = this.docsState.find((doc) => doc.id === id);
		if (!source) throw new Error(`unknown theme: ${id}`);
		const now = Date.now();
		const doc: ThemeDoc = {
			schemaVersion: CURRENT_SCHEMA_VERSION,
			id: freshId(),
			meta: {
				...source.meta,
				name: uniqueName(`${source.meta.name} copy`, this.docsState),
			},
			recipe: $state.snapshot(source.recipe) as ThemeRecipe,
			createdAt: now,
			updatedAt: now,
		};
		this.docsState = [doc, ...this.docsState];
		this.selectedIdState = doc.id;
		this.commit();
		return doc;
	}

	remove(id: string): void {
		this.ensureHydrated();
		this.docsState = this.docsState.filter((doc) => doc.id !== id);
		if (this.activeIdState === id) {
			this.activeIdState = null;
		}
		if (this.selectedIdState === id) {
			this.selectedIdState = this.docsState[0]?.id ?? null;
		}
		this.commit();
	}

	rename(id: string, name: string): void {
		this.patchMeta(id, { name });
	}

	setActive(id: string | null): void {
		this.ensureHydrated();
		if (id !== null && !this.docsState.some((doc) => doc.id === id)) return;
		this.activeIdState = id;
		this.commit();
	}

	setSelected(id: string | null): void {
		this.ensureHydrated();
		if (id !== null && !this.docsState.some((doc) => doc.id === id)) return;
		this.selectedIdState = id;
		this.commit();
	}

	updateRecipe(id: string, recipe: ThemeRecipe): void {
		this.ensureHydrated();
		this.docsState = this.docsState.map((doc) =>
			doc.id === id ? { ...doc, recipe, updatedAt: Date.now() } : doc,
		);
		this.commit();
	}

	updateActiveRecipe(recipe: ThemeRecipe): void {
		const id = this.activeIdState;
		if (id === null) return;
		this.updateRecipe(id, recipe);
	}

	patchMeta(id: string, meta: Partial<ThemeMeta>): void {
		this.ensureHydrated();
		this.docsState = this.docsState.map((doc) =>
			doc.id === id
				? { ...doc, meta: { ...doc.meta, ...meta }, updatedAt: Date.now() }
				: doc,
		);
		this.commit();
	}

	importDocs(docs: ThemeDoc[]): ThemeDoc[] {
		this.ensureHydrated();
		if (docs.length === 0) return [];
		const now = Date.now();
		let next = [...this.docsState];
		const landed: ThemeDoc[] = [];
		for (const incoming of docs) {
			const existing = next.findIndex((doc) => doc.meta.name === incoming.meta.name);
			if (existing >= 0) {
				const prior = next[existing]!;
				const merged = { ...incoming, id: prior.id, createdAt: prior.createdAt, updatedAt: now };
				next[existing] = merged;
				landed.push(merged);
			} else {
				next = [incoming, ...next];
				landed.push(incoming);
			}
		}
		this.docsState = next;
		this.selectedIdState = landed[landed.length - 1]!.id;
		this.commit();
		return landed;
	}

	replaceBackend(backend: StoreBackend): void {
		this.backend = backend;
		this.hydratedState = false;
		this.docsState = [];
		this.activeIdState = null;
		this.selectedIdState = null;
		this.hydrate();
	}
}

export const themeStore = new ThemeStore();
