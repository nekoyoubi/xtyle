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

  // packages/xtyle/src/elements/fragments/mobile-shell/mod.ts
  function titleText(b) {
    return b.heading ? escapeAttr(b.heading) : "";
  }
  function shellHtml(b) {
    const mainId = escapeAttr(b.mainId ?? "main");
    return `<div class="xtyle-mshell" part="shell"><header class="xtyle-mshell__bar" part="bar"><span class="xtyle-mshell__lead" part="lead"><slot name="brand"></slot><span class="xtyle-mshell__title" part="title" data-mshell-title>${titleText(b)}</span></span><span class="xtyle-mshell__actions" part="actions"><slot name="actions"></slot></span></header><main class="xtyle-mshell__content" part="content" id="${mainId}" tabindex="-1"><slot></slot></main><div class="xtyle-mshell__nav" part="nav" data-slot="nav"><slot name="nav"></slot></div></div>`;
  }
  function mount(bindings, ops) {
    ops.replaceChildren("[data-mobile-shell]", shellHtml(bindings));
  }
  function patch(bindings, ops) {
    ops.replaceChildren("[data-mshell-title]", titleText(bindings));
    ops.setAttr('[part="content"]', "id", escapeAttr(bindings.mainId ?? "main"));
  }
  hooks.fragment.mount("mobile-shell", mount);
  hooks.fragment.update("mobile-shell", patch);
})();
