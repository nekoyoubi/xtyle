#!/usr/bin/env node
// Bakes `apps/site/public/favicon.svg` from the masthead mark.
//
// A favicon is rendered outside the page, so nothing the document provides reaches it: no stylesheet,
// no `var(--…)`, and no webfont. The mark's `letter` layers typeset real `<text>`, so the font has to
// travel with the file or the glyphs fall back to whatever the OS picks and the wordmark stops being
// the wordmark. This inlines the Sigmar subset as a data URI, resolves the theme tokens the mark
// carries to concrete values, and pins a pixel size in place of the `1em` an inline icon uses.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { derive, iconComposition, composeIconThemed } from "@xtyle/core";
import { resolveAlgorithm } from "@xtyle/core/algorithms";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** The masthead mark (`apps/site/src/layouts/Base.astro`) with the brand's own two inks pinned. The
 * site draws its `x` from the live series palette; the favicon has no cascade to draw from. */
const MARK =
	"xtyle--letter-x-x-2-y-6-s120-c9-o2cb--column-x22-s145-ko--letter-t-x16-s105-cf-o2cb---d9p8s1t20--f0-Sigmar--ps-skittles--pc9-00bec6--pcf-ffffff";

const FONT = join(ROOT, "node_modules", "@fontsource", "sigmar", "files", "sigmar-latin-400-normal.woff2");
const OUT = join(ROOT, "apps", "site", "public", "favicon.svg");
const SIZE = 64;

const register = derive(await resolveAlgorithm("xtyle-default"), {});
let svg = composeIconThemed(iconComposition(MARK), { register });

const unresolved = [...svg.matchAll(/var\((--[a-z0-9-]+)\)/g)].map((m) => m[1]);
for (const token of new Set(unresolved)) {
	const value = register[token];
	if (!value) throw new Error(`xtyle: the mark reads ${token}, which the default register does not produce`);
	svg = svg.replaceAll(`var(${token})`, value);
}

const font = readFileSync(FONT).toString("base64");
const face =
	`<style>@font-face{font-family:"Sigmar";font-style:normal;font-weight:400;` +
	`src:url(data:font/woff2;base64,${font}) format("woff2")}</style>`;

svg = svg
	.replace(/ width="1em" height="1em"/, ` width="${SIZE}" height="${SIZE}"`)
	.replace(/ focusable="false"| style="overflow:visible"/g, "")
	.replace("<defs>", `${face}<defs>`);

writeFileSync(OUT, `${svg}\n`, "utf8");
console.log(`baked ${OUT} (${svg.length} bytes, Sigmar inlined, ${new Set(unresolved).size} tokens resolved)`);
