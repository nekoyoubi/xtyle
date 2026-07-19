"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/escape.ts
  var AMP = /&/g;
  var LT = /</g;
  var GT = />/g;
  var DQUOTE = /"/g;
  var SQUOTE = /'/g;
  function escapeHtml(value) {
    return value.replace(AMP, "&amp;").replace(LT, "&lt;").replace(GT, "&gt;");
  }
  function escapeAttr(value) {
    return escapeHtml(value).replace(DQUOTE, "&quot;").replace(SQUOTE, "&#39;");
  }

  // packages/xtyle/src/elements/fragments/card-link/mod.ts
  function cardLinkClass(b) {
    return [
      "xtyle-card",
      "xtyle-card-link",
      b.overlay && "xtyle-card--overlay",
      b.interactive && "xtyle-card--interactive",
      b.compact && "xtyle-card--compact"
    ].filter(Boolean).join(" ");
  }
  function cardLinkHtml(b) {
    const href = b.href ?? "#";
    const target = b.target ?? null;
    const rel = b.rel ?? null;
    const attrs = [`href="${escapeAttr(href)}"`, target ? `target="${escapeAttr(target)}"` : "", rel ? `rel="${escapeAttr(rel)}"` : ""].filter(Boolean).join(" ");
    const headerHidden = b.hasHeader ? "" : " hidden";
    const footerHidden = b.hasFooter ? "" : " hidden";
    return `<a part="card" class="${cardLinkClass(b)}" ${attrs}><div class="xtyle-card__header" part="header" data-slot="header"${headerHidden}><slot name="header"></slot></div><div class="xtyle-card__body" part="body" data-slot><slot></slot></div><div class="xtyle-card__footer" part="footer" data-slot="footer"${footerHidden}><slot name="footer"></slot></div></a>`;
  }
  hooks.fragment.mount("card-link", (bindings, ops) => {
    ops.replaceChildren("[data-card-link]", cardLinkHtml(bindings));
  });
  hooks.fragment.update("card-link", (bindings, ops) => {
    ops.setAttr(".xtyle-card", "class", cardLinkClass(bindings));
    ops.setAttr('[part="card"]', "href", bindings.href ?? "#");
  });
})();
