interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
}

interface QrBox {
	x: number;
	y: number;
	size: number;
}

interface QrBindings {
	path?: string;
	viewBox?: string;
	extent?: number;
	moduleColor?: string | null;
	bgColor?: string | null;
	shape?: string;
	size?: number;
	logoBox?: QrBox | null;
	iconName?: string | null;
	logoSrc?: string | null;
	iconOverlay?: boolean;
	iconOutline?: boolean;
	frame?: boolean;
	caption?: string | null;
	linkHref?: string | null;
	modeToggle?: boolean;
	isBitonal?: boolean;
	label?: string;
	lowContrast?: boolean;
	version?: number;
	ecLevel?: string;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: QrBindings, ops: OpsBuilder) => void) => void };
};

const AMP = /&/g;
const LT = /</g;
const GT = />/g;
const QUOT = /"/g;

function esc(value: string): string {
	return value.replace(AMP, "&amp;").replace(LT, "&lt;").replace(GT, "&gt;").replace(QUOT, "&quot;");
}

/** A CSS color the element resolved (a hex literal or a bare keyword); keep only characters a color
 * can legitimately contain so it can never break out of the inline `style`. */
function safeColor(value: string): string {
	return value.replace(/[^a-zA-Z0-9#(),.%\s-]/g, "");
}

function logoHtml(b: QrBindings): string {
	const box = b.logoBox;
	const extent = b.extent ?? 0;
	if (!box || extent <= 0 || (!b.iconName && !b.logoSrc)) return "";
	const pct = (n: number): string => `${((n / extent) * 100).toFixed(3)}%`;
	const style = `left:${pct(box.x)};top:${pct(box.y)};width:${pct(box.size)};height:${pct(box.size)}`;
	const mod = b.iconOverlay ? " xtyle-qr__logo--overlay" : " xtyle-qr__logo--knockout";
	const outline = b.iconOutline ? " xtyle-qr__logo--outline" : "";
	const inner = b.iconName
		? `<xtyle-icon class="xtyle-qr__icon" name="${esc(b.iconName)}"></xtyle-icon>`
		: `<img class="xtyle-qr__img" src="${esc(b.logoSrc as string)}" alt="" />`;
	return `<div class="xtyle-qr__logo${mod}${outline}" part="logo" style="${style}"><span class="xtyle-qr__logo-inner">${inner}</span></div>`;
}

function qrHtml(b: QrBindings): string {
	const size = Math.max(48, b.size ?? 200);
	const shape = b.shape ?? "square";
	const label = esc(b.label ?? "QR code");
	const pinned = b.moduleColor && b.bgColor;
	const colorVars = pinned ? `;--qr-module:${safeColor(b.moduleColor as string)};--qr-bg:${safeColor(b.bgColor as string)}` : "";
	const contrastAttr = b.lowContrast ? ' data-contrast="low"' : "";

	// Square modules read cleanest with anti-aliasing off (sharp edges); dot / rounded modules are
	// curved, so they keep the default smoothing or they look jagged.
	const rendering = shape === "square" ? "crispEdges" : "geometricPrecision";
	const svg =
		`<svg class="xtyle-qr__svg" viewBox="${esc(b.viewBox ?? "0 0 29 29")}" role="img" aria-label="${label}" shape-rendering="${rendering}">` +
		`<rect class="xtyle-qr__bg" part="background" x="0" y="0" width="100%" height="100%"></rect>` +
		`<path class="xtyle-qr__modules" part="modules" d="${b.path ?? ""}"></path>` +
		`</svg>`;

	const code = `<div class="xtyle-qr__code">${svg}${logoHtml(b)}</div>`;
	const footer = footerHtml(b);
	const frameClass = b.frame ? " xtyle-qr--framed" : "";
	const shapeClass = ` xtyle-qr--${shape}`;

	return `<figure class="xtyle-qr${frameClass}${shapeClass}" part="chart"${contrastAttr} style="--qr-size:${size}px${colorVars}">${code}${footer}</figure>`;
}

/** The half-filled disc that reads as "swap contrast". */
const TOGGLE_ICON =
	'<svg class="xtyle-qr__toggle-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5"></circle><path d="M8 1.5 A6.5 6.5 0 0 1 8 14.5 Z" fill="currentColor"></path></svg>';

/** The frame footer: the payload as a real link (when it is one) plus the optional themed/bitonal
 * swap button. Present only in a frame, and only when there is something to show. */
function footerHtml(b: QrBindings): string {
	if (!b.frame) return "";
	const showCaption = !!b.caption;
	const showToggle = !!b.modeToggle;
	if (!showCaption && !showToggle) return "";
	let caption = "";
	if (showCaption) {
		const text = esc(b.caption as string);
		caption = b.linkHref
			? `<a class="xtyle-qr__caption xtyle-link" part="caption" href="${esc(b.linkHref)}" rel="noopener noreferrer">${text}</a>`
			: `<figcaption class="xtyle-qr__caption" part="caption">${text}</figcaption>`;
	}
	const toggle = showToggle
		? `<button type="button" class="xtyle-qr__toggle" part="toggle" data-qr-toggle aria-label="Swap high-contrast rendering" aria-pressed="${b.isBitonal ? "true" : "false"}">${TOGGLE_ICON}</button>`
		: "";
	return `<div class="xtyle-qr__footer">${caption}${toggle}</div>`;
}

hooks.fragment.mount("qr", (bindings, ops) => {
	ops.replaceChildren("[data-qr]", qrHtml(bindings));
});

hooks.fragment.update("qr", (bindings, ops) => {
	ops.replaceChildren("[data-qr]", qrHtml(bindings));
});
