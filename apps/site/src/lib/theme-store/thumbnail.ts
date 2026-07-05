import type { TokenRegister } from "@xtyle/core";

export interface ThumbnailOptions {
	width?: number;
	height?: number;
}

const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 200;
const NEUTRAL = "#888888";

const ROLES = {
	canvas: ["--body-bg", "--bg-0"],
	card: ["--bg-0", "--bg-1"],
	inset: ["--bg-1", "--bg-2"],
	line: ["--line", "--line-2"],
	title: ["--fg-0", "--fg-1"],
	muted: ["--fg-2", "--fg-3"],
	accent: ["--accent"],
	accentFg: ["--accent-fg", "--bg-0"],
	accent2: ["--accent-2", "--accent"],
	success: ["--success"],
	warn: ["--warn"],
	danger: ["--danger"],
	info: ["--info"],
} as const;

function pick(register: TokenRegister, names: readonly string[]): string {
	for (const name of names) {
		const value = register[name] ?? register[name.replace(/^--/, "")];
		if (value) return value;
	}
	return NEUTRAL;
}

function esc(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export function renderThumbnailSvg(
	register: TokenRegister,
	opts: ThumbnailOptions = {},
): string {
	const w = opts.width ?? DEFAULT_WIDTH;
	const h = opts.height ?? DEFAULT_HEIGHT;

	const c = {
		canvas: esc(pick(register, ROLES.canvas)),
		card: esc(pick(register, ROLES.card)),
		inset: esc(pick(register, ROLES.inset)),
		line: esc(pick(register, ROLES.line)),
		title: esc(pick(register, ROLES.title)),
		muted: esc(pick(register, ROLES.muted)),
		accent: esc(pick(register, ROLES.accent)),
		accentFg: esc(pick(register, ROLES.accentFg)),
		accent2: esc(pick(register, ROLES.accent2)),
		success: esc(pick(register, ROLES.success)),
		warn: esc(pick(register, ROLES.warn)),
		danger: esc(pick(register, ROLES.danger)),
		info: esc(pick(register, ROLES.info)),
	};

	const pad = 16;
	const cardX = pad;
	const cardY = pad;
	const cardW = w - pad * 2;
	const cardH = h - pad * 2;
	const inX = cardX + 16;
	const inW = cardW - 32;

	const titleBarY = cardY + 18;
	const subBarY = titleBarY + 16;

	const swatchY = subBarY + 26;
	const swatchH = 40;
	const swatchGap = 10;
	const swatchCount = 4;
	const swatchW = (inW - swatchGap * (swatchCount - 1)) / swatchCount;
	const swatchFills = [c.inset, c.accent, c.accent2, c.line];

	const btnW = 84;
	const btnH = 26;
	const btnY = swatchY + swatchH + 18;
	const btnLabelW = 40;

	const dotR = 5;
	const dotY = btnY + btnH / 2;
	const dotGap = 18;
	const dotStartX = inX + btnW + 24;
	const dotFills = [c.success, c.warn, c.danger, c.info];

	const swatches = swatchFills
		.map((fill, i) => {
			const x = inX + i * (swatchW + swatchGap);
			return `<rect x="${x.toFixed(1)}" y="${swatchY}" width="${swatchW.toFixed(1)}" height="${swatchH}" rx="6" fill="${fill}"/>`;
		})
		.join("");

	const dots = dotFills
		.map((fill, i) => {
			const cx = dotStartX + i * dotGap;
			return `<circle cx="${cx}" cy="${dotY}" r="${dotR}" fill="${fill}"/>`;
		})
		.join("");

	return [
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" role="img">`,
		`<rect x="0" y="0" width="${w}" height="${h}" rx="14" fill="${c.canvas}"/>`,
		`<rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="12" fill="${c.card}" stroke="${c.line}" stroke-width="1"/>`,
		`<rect x="${inX}" y="${titleBarY}" width="${(inW * 0.55).toFixed(1)}" height="9" rx="4.5" fill="${c.title}"/>`,
		`<rect x="${inX}" y="${subBarY}" width="${(inW * 0.78).toFixed(1)}" height="6" rx="3" fill="${c.muted}"/>`,
		swatches,
		`<rect x="${inX}" y="${btnY}" width="${btnW}" height="${btnH}" rx="8" fill="${c.accent}"/>`,
		`<rect x="${inX + (btnW - btnLabelW) / 2}" y="${btnY + btnH / 2 - 3}" width="${btnLabelW}" height="6" rx="3" fill="${c.accentFg}"/>`,
		dots,
		`</svg>`,
	].join("");
}

export function thumbnailDataUri(
	register: TokenRegister,
	opts?: ThumbnailOptions,
): string {
	return (
		"data:image/svg+xml;utf8," +
		encodeURIComponent(renderThumbnailSvg(register, opts))
	);
}
