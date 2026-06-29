"use strict";
(() => {
  // packages/xoji/src/elements/fragments/code/mod.ts
  function escapeCaption(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function codeClass(b) {
    const lang = b.language ?? "none";
    return `language-${lang}`;
  }
  function preClass(b) {
    return `xoji-code ${codeClass(b)}`;
  }
  function preLabel(b) {
    const lang = b.language ?? "none";
    return lang !== "none" ? `${lang} code` : "Code";
  }
  hooks.fragment.mount("code", (bindings, ops) => {
    ops.setAttr("[data-root]", "class", preClass(bindings));
    ops.setAttr("[data-root]", "tabindex", "0");
    ops.setAttr("[data-root]", "aria-label", preLabel(bindings));
    ops.setAttr("[data-code]", "class", codeClass(bindings));
    ops.replaceChildren("[data-code]", bindings.html ?? "");
    ops.replaceChildren("[data-caption]", bindings.caption ? escapeCaption(bindings.caption) : "");
  });
  hooks.fragment.update("code", (bindings, ops) => {
    ops.setAttr("[data-root]", "class", preClass(bindings));
    ops.setAttr("[data-root]", "aria-label", preLabel(bindings));
    ops.setAttr("[data-code]", "class", codeClass(bindings));
    ops.replaceChildren("[data-code]", bindings.html ?? "");
    ops.replaceChildren("[data-caption]", bindings.caption ? escapeCaption(bindings.caption) : "");
  });
})();
