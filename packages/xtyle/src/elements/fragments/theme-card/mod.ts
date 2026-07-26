import { escapeAttr } from "../escape.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, text: string): void;
}

type Register = Record<string, string>;

interface ThemeCardBindings {
	name?: string | null;
	algorithm?: string | null;
	scheme?: string | null;
	register?: Register | null;
	selected?: boolean;
	interactive?: boolean;
	error?: string | null;
	previewLabel?: string;
}

interface EventPayload {
	disabled?: boolean;
	ariaDisabled?: string;
}

interface SelectContext {
	name?: string | null;
	algorithm?: string | null;
	scheme?: string | null;
}

interface Intent {
	emit?: { type: string; detail?: unknown };
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: ThemeCardBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

const NEUTRAL = "#888888";

const ROLES: Record<string, readonly string[]> = {
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
};

function pick(register: Register, names: readonly string[]): string {
	for (const name of names) {
		const value = register[name] ?? register[name.replace(/^--/, "")];
		if (value) return value;
	}
	return NEUTRAL;
}

function palette(register: Register | null | undefined): Record<string, string> {
	const source = register ?? {};
	const out: Record<string, string> = {};
	for (const role of Object.keys(ROLES)) out[role] = escapeAttr(pick(source, ROLES[role] as string[]));
	return out;
}

function previewSvg(register: Register | null | undefined): string {
	const c = palette(register);
	const w = 320;
	const h = 168;
	const inX = 22;
	const inW = w - inX * 2;
	const titleY = 26;
	const subY = titleY + 16;
	const swatchY = subY + 24;
	const swatchH = 38;
	const swatchGap = 10;
	const swatchW = (inW - swatchGap * 3) / 4;
	const btnW = 84;
	const btnH = 26;
	const btnY = swatchY + swatchH + 18;
	const btnLabelW = 40;
	const dotY = btnY + btnH / 2;
	const dotStartX = inX + btnW + 24;

	const swatches = [c.inset, c.accent, c.accent2, c.line]
		.map((fill, i) => {
			const x = inX + i * (swatchW + swatchGap);
			return `<rect x="${x.toFixed(1)}" y="${swatchY}" width="${swatchW.toFixed(1)}" height="${swatchH}" rx="6" fill="${fill}"/>`;
		})
		.join("");

	const dots = [c.success, c.warn, c.danger, c.info]
		.map((fill, i) => `<circle cx="${dotStartX + i * 18}" cy="${dotY}" r="5" fill="${fill}"/>`)
		.join("");

	return [
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">`,
		`<rect x="0" y="0" width="${w}" height="${h}" fill="${c.card}"/>`,
		`<rect x="${inX}" y="${titleY}" width="${(inW * 0.55).toFixed(1)}" height="9" rx="4.5" fill="${c.title}"/>`,
		`<rect x="${inX}" y="${subY}" width="${(inW * 0.78).toFixed(1)}" height="6" rx="3" fill="${c.muted}"/>`,
		swatches,
		`<rect x="${inX}" y="${btnY}" width="${btnW}" height="${btnH}" rx="8" fill="${c.accent}"/>`,
		`<rect x="${inX + (btnW - btnLabelW) / 2}" y="${btnY + btnH / 2 - 3}" width="${btnLabelW}" height="6" rx="3" fill="${c.accentFg}"/>`,
		dots,
		`</svg>`,
	].join("");
}

function cardClass(b: ThemeCardBindings): string {
	return [
		"xtyle-theme-card",
		b.interactive && "xtyle-theme-card--interactive",
		b.selected && "xtyle-theme-card--selected",
		b.error && "xtyle-theme-card--error",
	]
		.filter(Boolean)
		.join(" ");
}

function metaLine(b: ThemeCardBindings): string {
	return [b.algorithm, b.scheme].filter(Boolean).map(String).join(" · ");
}

function body(b: ThemeCardBindings): string {
	const preview = `<span class="xtyle-theme-card__preview" part="preview">${previewSvg(b.register)}</span>`;
	const name = b.name
		? `<span class="xtyle-theme-card__name" part="name">${escapeAttr(b.name)}</span>`
		: "";
	const meta = metaLine(b)
		? `<span class="xtyle-theme-card__meta" part="meta">${escapeAttr(metaLine(b))}</span>`
		: "";
	const note = b.error
		? `<span class="xtyle-theme-card__error" part="error">${escapeAttr(b.error)}</span>`
		: "";
	return `${preview}<span class="xtyle-theme-card__body" part="body">${name}${meta}${note}</span>`;
}

function accessibleName(b: ThemeCardBindings): string {
	const label = b.previewLabel ?? "Theme";
	return [b.name ?? label, metaLine(b)].filter(Boolean).join(", ");
}

function inner(b: ThemeCardBindings): string {
	const content = body(b);
	if (!b.interactive) {
		return `<span part="card" class="${cardClass(b)}" role="group" aria-label="${escapeAttr(accessibleName(b))}">${content}</span>`;
	}
	return (
		`<button part="card" type="button" class="${cardClass(b)}"` +
		` aria-pressed="${String(!!b.selected)}" aria-label="${escapeAttr(accessibleName(b))}">${content}</button>`
	);
}

hooks.fragment.mount("theme-card", (bindings, ops) => {
	ops.replaceChildren("[data-theme-card]", inner(bindings));
});

hooks.fragment.update("theme-card", (bindings, ops) => {
	ops.setAttr('[part="card"]', "class", cardClass(bindings));
	ops.setAttr('[part="card"]', "aria-label", accessibleName(bindings));
	if (bindings.interactive) ops.setAttr('[part="card"]', "aria-pressed", String(!!bindings.selected));
	ops.replaceChildren('[part="preview"]', previewSvg(bindings.register));
	if (bindings.name) ops.setText('[part="name"]', bindings.name);
	if (metaLine(bindings)) ops.setText('[part="meta"]', metaLine(bindings));
});

xript.exports.register("select", (payload: unknown, context: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.disabled || e.ariaDisabled === "true") return {};
	const ctx = (context ?? {}) as SelectContext;
	return {
		emit: {
			type: "select",
			detail: { name: ctx.name ?? null, algorithm: ctx.algorithm ?? null, scheme: ctx.scheme ?? null },
		},
	};
});
