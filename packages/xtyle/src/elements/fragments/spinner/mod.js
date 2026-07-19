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

  // packages/xtyle/src/elements/fragments/spinner/mod.ts
  function spinnerClass(b) {
    const tone = b.tone ?? "accent";
    const size = b.size ?? "md";
    return ["xtyle-spinner", `xtyle-spinner--${tone}`, size !== "md" && `xtyle-spinner--${size}`].filter(Boolean).join(" ");
  }
  function spinnerHtml(b) {
    const label = b.label ?? "Loading";
    return `<span part="spinner" class="${spinnerClass(b)}" role="status" aria-label="${escapeAttr(label)}"></span>`;
  }
  hooks.fragment.mount("spinner", (bindings, ops) => {
    ops.replaceChildren("[data-spinner]", spinnerHtml(bindings));
  });
  hooks.fragment.update("spinner", (bindings, ops) => {
    ops.setAttr(".xtyle-spinner", "class", spinnerClass(bindings));
    ops.setAttr('[part="spinner"]', "aria-label", bindings.label ?? "Loading");
  });
})();
