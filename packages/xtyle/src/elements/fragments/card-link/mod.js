"use strict";
(() => {
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
    const attrs = [`href="${href}"`, target ? `target="${target}"` : "", rel ? `rel="${rel}"` : ""].filter(Boolean).join(" ");
    return `<a part="card" class="${cardLinkClass(b)}" ${attrs}><div class="xtyle-card__header" part="header"><slot name="header"></slot></div><div class="xtyle-card__body" part="body"><slot></slot></div><div class="xtyle-card__footer" part="footer"><slot name="footer"></slot></div></a>`;
  }
  hooks.fragment.mount("card-link", (bindings, ops) => {
    ops.replaceChildren("[data-card-link]", cardLinkHtml(bindings));
  });
  hooks.fragment.update("card-link", (bindings, ops) => {
    ops.setAttr('[part="card"]', "class", cardLinkClass(bindings));
    ops.setAttr('[part="card"]', "href", bindings.href ?? "#");
  });
})();
