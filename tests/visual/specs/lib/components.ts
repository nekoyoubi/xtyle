import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

const demoDir = resolve(
	here,
	"..",
	"..",
	"..",
	"..",
	"apps",
	"site",
	"src",
	"components",
	"demos",
);

const all = readdirSync(demoDir)
	.filter((f) => f.endsWith(".astro"))
	.map((f) => f.replace(/\.astro$/, ""))
	.sort();

const only = process.env.XTYLE_VISUAL_ONLY?.split(",")
	.map((s) => s.trim())
	.filter(Boolean);

export const COMPONENTS = only
	? all.filter((id) => only.includes(id))
	: all;
