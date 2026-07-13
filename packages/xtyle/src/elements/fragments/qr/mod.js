"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/qr/mod.ts
  var AMP = /&/g;
  var LT = /</g;
  var GT = />/g;
  var QUOT = /"/g;
  function esc(value) {
    return value.replace(AMP, "&amp;").replace(LT, "&lt;").replace(GT, "&gt;").replace(QUOT, "&quot;");
  }
  function safeColor(value) {
    return value.replace(/[^a-zA-Z0-9#(),.%\s-]/g, "");
  }
  function logoHtml(b) {
    const box = b.logoBox;
    const extent = b.extent ?? 0;
    if (!box || extent <= 0 || !b.iconName && !b.logoSrc) return "";
    const pct = (n) => `${(n / extent * 100).toFixed(3)}%`;
    const style = `left:${pct(box.x)};top:${pct(box.y)};width:${pct(box.size)};height:${pct(box.size)}`;
    const mod = b.iconOverlay ? " xtyle-qr__logo--overlay" : " xtyle-qr__logo--knockout";
    const outline = b.iconOutline ? " xtyle-qr__logo--outline" : "";
    const inner = b.iconName ? `<xtyle-icon class="xtyle-qr__icon" name="${esc(b.iconName)}"></xtyle-icon>` : `<img class="xtyle-qr__img" src="${esc(b.logoSrc)}" alt="" />`;
    return `<div class="xtyle-qr__logo${mod}${outline}" part="logo" style="${style}"><span class="xtyle-qr__logo-inner">${inner}</span></div>`;
  }
  function qrHtml(b) {
    const size = Math.max(48, b.size ?? 200);
    const shape = b.shape ?? "square";
    const label = esc(b.label ?? "QR code");
    const pinned = b.moduleColor && b.bgColor;
    const colorVars = pinned ? `;--qr-module:${safeColor(b.moduleColor)};--qr-bg:${safeColor(b.bgColor)}` : "";
    const contrastAttr = b.lowContrast ? ' data-contrast="low"' : "";
    const rendering = shape === "square" ? "crispEdges" : "geometricPrecision";
    const svg = `<svg class="xtyle-qr__svg" viewBox="${esc(b.viewBox ?? "0 0 29 29")}" role="img" aria-label="${label}" shape-rendering="${rendering}"><rect class="xtyle-qr__bg" part="background" x="0" y="0" width="100%" height="100%"></rect><path class="xtyle-qr__modules" part="modules" d="${b.path ?? ""}"></path></svg>`;
    const code = `<div class="xtyle-qr__code">${svg}${logoHtml(b)}</div>`;
    const footer = footerHtml(b);
    const frameClass = b.frame ? " xtyle-qr--framed" : "";
    const shapeClass = ` xtyle-qr--${shape}`;
    return `<figure class="xtyle-qr${frameClass}${shapeClass}" part="chart"${contrastAttr} style="--qr-size:${size}px${colorVars}">${code}${footer}</figure>`;
  }
  var TOGGLE_ICON = '<svg class="xtyle-qr__toggle-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5"></circle><path d="M8 1.5 A6.5 6.5 0 0 1 8 14.5 Z" fill="currentColor"></path></svg>';
  function footerHtml(b) {
    if (!b.frame) return "";
    const showCaption = !!b.caption;
    const showToggle = !!b.modeToggle;
    if (!showCaption && !showToggle) return "";
    let caption = "";
    if (showCaption) {
      const text = esc(b.caption);
      caption = b.linkHref ? `<a class="xtyle-qr__caption xtyle-link" part="caption" href="${esc(b.linkHref)}" rel="noopener noreferrer">${text}</a>` : `<figcaption class="xtyle-qr__caption" part="caption">${text}</figcaption>`;
    }
    const toggle = showToggle ? `<button type="button" class="xtyle-qr__toggle" part="toggle" data-qr-toggle aria-label="Swap high-contrast rendering" aria-pressed="${b.isBitonal ? "true" : "false"}">${TOGGLE_ICON}</button>` : "";
    return `<div class="xtyle-qr__footer">${caption}${toggle}</div>`;
  }
  hooks.fragment.mount("qr", (bindings, ops) => {
    ops.replaceChildren("[data-qr]", qrHtml(bindings));
  });
  hooks.fragment.update("qr", (bindings, ops) => {
    ops.replaceChildren("[data-qr]", qrHtml(bindings));
  });
})();
