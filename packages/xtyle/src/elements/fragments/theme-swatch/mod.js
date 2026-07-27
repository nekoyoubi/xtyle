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

  // packages/xtyle/src/elements/fragments/theme-swatch/mod.ts
  function chipMarkup(chip, b) {
    const size = b.size && b.size !== "md" ? ` size="${escapeAttr(b.size)}"` : "";
    const label = b.labels === false ? "" : ` label="${escapeAttr(chip.label)}"`;
    const details = b.details ? " details" : "";
    return `<xtyle-swatch part="chip" color="${escapeAttr(chip.color)}"${label} value="${escapeAttr(chip.color)}"${size}${details}></xtyle-swatch>`;
  }
  function inner(b) {
    if (b.error) {
      return `<span class="xtyle-theme-swatch__error" part="error">${escapeAttr(b.error)}</span>`;
    }
    const chips = (b.chips ?? []).map((chip) => chipMarkup(chip, b)).join("");
    return `<span class="xtyle-theme-swatch__row" part="row">${chips}</span>`;
  }
  hooks.fragment.mount("theme-swatch", (bindings, ops) => {
    ops.replaceChildren("[data-theme-swatch]", inner(bindings));
  });
  hooks.fragment.update("theme-swatch", (bindings, ops) => {
    ops.replaceChildren("[data-theme-swatch]", inner(bindings));
  });
})();
