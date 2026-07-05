import { apply } from "@xtyle/core/dom";
import { getAlgorithm } from "@xtyle/core/algorithms";
import type { TokenRegister } from "@xtyle/core";
import { deriveRegister } from "./theme-store/recipe.js";
import { migrateEnvelope } from "./theme-store/migrate.js";
import type { StoreEnvelope, ThemeDoc } from "./theme-store/types.js";
import { STORAGE_KEY } from "./theme-store/types.js";

export const ACTIVE_VARS_KEY = "xtyle.theme.active-vars";

/** Fired on `window` whenever the active site theme changes, so same-tab islands (the toolbar dropdown and the bench) can mirror each other — `storage` events don't fire within one tab. */
export const ACTIVE_CHANGED_EVENT = "xtyle:theme-active-changed";

export function broadcastActiveTheme(id: string | null): void {
	if (typeof window === "undefined") return;
	window.dispatchEvent(new CustomEvent(ACTIVE_CHANGED_EVENT, { detail: { id } }));
}

const APPLIED_KEYS: unique symbol = Symbol.for("xtyle.themeActive.appliedKeys");

interface AppliedKeyHolder {
	[APPLIED_KEYS]?: string[];
}

function bakedAlgorithmExists(id: string): boolean {
	try {
		getAlgorithm(id);
		return true;
	} catch {
		return false;
	}
}

function readEnvelope(): StoreEnvelope | null {
	if (typeof localStorage === "undefined") return null;
	let raw: unknown = null;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === null) return null;
		raw = JSON.parse(stored);
	} catch {
		return null;
	}
	return migrateEnvelope(raw);
}

function readActiveDoc(): ThemeDoc | null {
	const envelope = readEnvelope();
	if (!envelope || envelope.activeId === null) return null;
	return envelope.docs.find((doc) => doc.id === envelope.activeId) ?? null;
}

export interface ThemeOption {
	id: string;
	name: string;
}

/** Built themes from the bench, most-recently-updated first. */
export function listThemes(): ThemeOption[] {
	const envelope = readEnvelope();
	if (!envelope) return [];
	return [...envelope.docs]
		.sort((a, b) => b.updatedAt - a.updatedAt)
		.map((doc) => ({ id: doc.id, name: doc.meta.name }));
}

/** Full theme docs from the bench, most-recently-updated first — for thumbnail-driven pickers. */
export function listThemeDocs(): ThemeDoc[] {
	const envelope = readEnvelope();
	if (!envelope) return [];
	return [...envelope.docs].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function activeThemeId(): string | null {
	return readEnvelope()?.activeId ?? null;
}

/** Sets the active theme (or `null` for the shipped Default) and reapplies it. */
export function setActiveTheme(id: string | null): void {
	const envelope = readEnvelope();
	if (!envelope) return;
	const next: StoreEnvelope = {
		...envelope,
		activeId: id !== null && envelope.docs.some((doc) => doc.id === id) ? id : null,
	};
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
	} catch {
		/* quota or serialization failure — best-effort */
	}
	reapplyActiveTheme();
	broadcastActiveTheme(next.activeId);
}

function clearApplied(root: HTMLElement, holder: AppliedKeyHolder): void {
	root.style.colorScheme = "";
	const previous = holder[APPLIED_KEYS];
	if (!previous) return;
	for (const key of previous) {
		root.style.removeProperty(key.startsWith("--") ? key : `--${key}`);
	}
	holder[APPLIED_KEYS] = undefined;
}

export function writeActiveVarsCache(register: TokenRegister): void {
	if (typeof localStorage === "undefined") return;
	try {
		localStorage.setItem(ACTIVE_VARS_KEY, JSON.stringify(register));
	} catch {
		/* quota or serialization failure — pre-paint cache is best-effort */
	}
}

function clearActiveVarsCache(): void {
	if (typeof localStorage === "undefined") return;
	try {
		localStorage.removeItem(ACTIVE_VARS_KEY);
	} catch {
		/* best-effort */
	}
}

/**
 * Syncs the toolbar/statusbar theme labels to the active theme. Each target
 * carries its baseline in `data-default`, so passing `null` restores the site's
 * shipped identity (the SSR-rendered xtyle-default dark) when no theme is active.
 */
function updateThemeLabels(
	algorithm: string | null,
	scheme: string | null,
	tokens: number | null,
): void {
	const set = (ids: string[], value: string | null): void => {
		for (const id of ids) {
			const el = document.getElementById(id);
			if (el) el.textContent = value ?? el.dataset.default ?? el.textContent;
		}
	};
	set(["x-theme-algo", "x-status-algo"], algorithm);
	set(["x-theme-scheme", "x-status-scheme"], scheme);
	set(["x-status-tokens"], tokens === null ? null : String(tokens));
}

export function reapplyActiveTheme(): void {
	if (typeof document === "undefined") return;
	const root = document.documentElement;
	const holder = window as unknown as AppliedKeyHolder;

	clearApplied(root, holder);

	const doc = readActiveDoc();
	if (!doc || !bakedAlgorithmExists(doc.recipe.algorithm)) {
		clearActiveVarsCache();
		updateThemeLabels(null, null, null);
		return;
	}

	const { register, error } = deriveRegister(doc.recipe);
	if (error) {
		clearActiveVarsCache();
		updateThemeLabels(null, null, null);
		return;
	}

	apply(register, { target: root });
	holder[APPLIED_KEYS] = Object.keys(register).map((key) =>
		key.startsWith("--") ? key : `--${key}`,
	);
	writeActiveVarsCache(register);
	updateThemeLabels(
		doc.recipe.algorithm,
		register["--scheme"] ?? null,
		Object.keys(register).length,
	);
}
