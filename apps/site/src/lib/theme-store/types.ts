import type { BenchState } from "../../components/bench/state.js";

export const CURRENT_SCHEMA_VERSION = 1 as const;

export const STORAGE_KEY = "xtyle.themes.v1";

export type ThemeRecipe = BenchState;

export interface ThemeMeta {
	name: string;
	description?: string;
	tags?: string[];
}

export interface ThemeDoc {
	schemaVersion: number;
	id: string;
	meta: ThemeMeta;
	recipe: ThemeRecipe;
	createdAt: number;
	updatedAt: number;
}

export interface StoreEnvelope {
	schemaVersion: number;
	docs: ThemeDoc[];
	activeId: string | null;
	selectedId: string | null;
}

export type Migration = (raw: any) => any;

export function emptyEnvelope(): StoreEnvelope {
	return {
		schemaVersion: CURRENT_SCHEMA_VERSION,
		docs: [],
		activeId: null,
		selectedId: null,
	};
}
