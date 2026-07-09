"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/card/mod.ts
  function cardClass(b) {
    return [
      "xtyle-card",
      b.overlay && "xtyle-card--overlay",
      (b.interactive || b.action) && "xtyle-card--interactive",
      b.action && "xtyle-card--action",
      b.compact && "xtyle-card--compact",
      b.depthStrength && `xtyle-card--depth-${b.depthStrength}`,
      b.tone && `xtyle-card--${b.tone}`,
      b.tone && "xtyle-card--toned"
    ].filter(Boolean).join(" ");
  }
  function cardHtml(b) {
    return `<div part="card" class="${cardClass(b)}"><div class="xtyle-card__header" part="header"><slot name="header"></slot></div><div class="xtyle-card__body" part="body"><slot></slot></div><div class="xtyle-card__footer" part="footer"><slot name="footer"></slot></div></div>`;
  }
  hooks.fragment.mount("card", (bindings, ops) => {
    ops.replaceChildren("[data-card]", cardHtml(bindings));
  });
  hooks.fragment.update("card", (bindings, ops) => {
    ops.setAttr('[part="card"]', "class", cardClass(bindings));
  });
})();
