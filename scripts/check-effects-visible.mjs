import { chromium } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const URL = process.argv[2] ?? "http://localhost:4381/effects";
const FRAMES = 9;
const GAP = 110;

function delta(a, b) {
	const pa = PNG.sync.read(a);
	const pb = PNG.sync.read(b);
	if (pa.width !== pb.width || pa.height !== pb.height) return { pct: 100, mean: 255 };
	const changed = pixelmatch(pa.data, pb.data, null, pa.width, pa.height, { threshold: 0.06 });
	let sum = 0;
	for (let i = 0; i < pa.data.length; i += 4) {
		sum += Math.abs(pa.data[i] - pb.data[i]) + Math.abs(pa.data[i + 1] - pb.data[i + 1]) + Math.abs(pa.data[i + 2] - pb.data[i + 2]);
	}
	return {
		pct: +((changed / (pa.width * pa.height)) * 100).toFixed(2),
		mean: +(sum / (pa.data.length / 4) / 3).toFixed(2),
	};
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

const tiles = await page.locator("#library .x-fx-tile").all();
const rows = [];
for (const tile of tiles) {
	const target = tile.locator("[data-fx]").first();
	const spec = (await target.getAttribute("data-fx")) ?? "?";
	const shot = tile.locator(".x-fx-stage");
	await shot.scrollIntoViewIfNeeded();
	await page.mouse.move(0, 0);
	await page.waitForTimeout(500);
	const rest = await shot.screenshot({ animations: "allow" });

	const toggle = tile.locator("[data-fx-sat]");
	if (spec.startsWith("reveal")) {
		await page.locator(`#${await tile.getAttribute("data-arm")}`).click().catch(() => {});
	} else if (await toggle.count()) {
		await toggle.click();
	} else if (spec.includes("@")) {
		await target.hover();
	}
	let pct = 0;
	let mean = 0;
	for (let i = 0; i < FRAMES; i++) {
		await page.waitForTimeout(GAP);
		const d = delta(rest, await shot.screenshot({ animations: "allow" }));
		pct = Math.max(pct, d.pct);
		mean = Math.max(mean, d.mean);
	}
	const visible = pct >= 1 || mean >= 0.5;
	rows.push({ spec, pct, mean, verdict: visible ? "visible" : "NOTHING" });
}
console.table(rows);
await browser.close();
const dead = rows.filter((row) => row.verdict !== "visible");
if (dead.length) {
	console.error(`
${dead.length} effect(s) render no visible change: ${dead.map((d) => d.spec).join(", ")}`);
	process.exit(1);
}
console.log(`
all ${rows.length} effects register a visible change`);
