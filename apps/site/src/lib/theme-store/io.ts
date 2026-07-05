import type { TokenRegister } from "@xtyle/core";
import { buildThemeFile, serializeThemeFile, type ThemeFileMeta } from "@xtyle/core";
import { normalizeRecipe } from "./recipe.js";
import type { ThemeDoc, ThemeMeta } from "./types.js";
import { CURRENT_SCHEMA_VERSION } from "./types.js";

function slug(name: string): string {
	const cleaned = name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return cleaned || "theme";
}

function freshId(): string {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}
	return `theme-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function normalizeMeta(raw: unknown): ThemeMeta {
	if (!isObject(raw)) return { name: "Imported theme" };
	const meta: ThemeMeta = {
		name:
			typeof raw.name === "string" && raw.name.trim() ? raw.name : "Imported theme",
	};
	if (typeof raw.description === "string") meta.description = raw.description;
	if (Array.isArray(raw.tags)) {
		meta.tags = raw.tags.filter((t): t is string => typeof t === "string");
	}
	return meta;
}

function themeFileMeta(meta: ThemeMeta): ThemeFileMeta {
	const out: ThemeFileMeta = { name: meta.name, generator: "@xtyle/core" };
	if (meta.description) out.description = meta.description;
	if (meta.tags && meta.tags.length) out.tags = [...meta.tags];
	return out;
}

/** Serialize a stored doc + its materialized register into the canonical theme-file text. */
export function themeFileText(doc: ThemeDoc, register: TokenRegister): string {
	return serializeThemeFile(
		buildThemeFile({ meta: themeFileMeta(doc.meta), recipe: doc.recipe, register }),
	);
}

export function exportDoc(doc: ThemeDoc, register: TokenRegister): void {
	if (typeof document === "undefined") return;
	const json = themeFileText(doc, register);
	const blob = new Blob([json], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = `${slug(doc.meta.name)}.xtyle.json`;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(url);
}

export interface ImportResult {
	docs: ThemeDoc[];
	rejected: number;
}

function looksLikeTokenMap(raw: Record<string, unknown>): boolean {
	const keys = Object.keys(raw);
	return (
		keys.length > 0 &&
		keys.every((k) => k.startsWith("--") && typeof raw[k] === "string")
	);
}

function adoptDoc(raw: unknown): ThemeDoc | null {
	if (!isObject(raw)) return null;
	const now = Date.now();
	if (!isObject(raw.recipe)) {
		// A bare token register (e.g. a flat `--format json` dump) still imports —
		// every value becomes an override on the default algorithm.
		if (!looksLikeTokenMap(raw)) return null;
		return {
			schemaVersion: CURRENT_SCHEMA_VERSION,
			id: freshId(),
			meta: { name: "Imported tokens" },
			recipe: normalizeRecipe({ overrides: raw }),
			createdAt: now,
			updatedAt: now,
		};
	}
	const createdAt = typeof raw.createdAt === "number" ? raw.createdAt : now;
	return {
		schemaVersion: CURRENT_SCHEMA_VERSION,
		id: freshId(),
		meta: normalizeMeta(raw.meta),
		recipe: normalizeRecipe(raw.recipe),
		createdAt,
		updatedAt: now,
	};
}

export function parseImport(text: string): ImportResult {
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		return { docs: [], rejected: 1 };
	}
	const entries = Array.isArray(parsed) ? parsed : [parsed];
	const docs: ThemeDoc[] = [];
	let rejected = 0;
	for (const entry of entries) {
		const doc = adoptDoc(entry);
		if (doc) docs.push(doc);
		else rejected += 1;
	}
	return { docs, rejected };
}

function isImportable(name: string): boolean {
	const lower = name.toLowerCase();
	return lower.endsWith(".xtyle.json") || lower.endsWith(".json");
}

export async function readDroppedFiles(files: FileList): Promise<ImportResult> {
	const docs: ThemeDoc[] = [];
	let rejected = 0;
	for (const file of Array.from(files)) {
		if (!isImportable(file.name)) {
			rejected += 1;
			continue;
		}
		try {
			const text = await file.text();
			const result = parseImport(text);
			docs.push(...result.docs);
			rejected += result.rejected;
		} catch {
			rejected += 1;
		}
	}
	return { docs, rejected };
}
