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

  // packages/xtyle/src/elements/fragments/toolbar/mod.ts
  function toolbarClass(b) {
    const size = b.size ?? "md";
    return ["xtyle-toolbar", size !== "md" && `xtyle-toolbar--${size}`, b.sticky && "xtyle-toolbar--sticky", b.bare && "xtyle-toolbar--bare"].filter(Boolean).join(" ");
  }
  function titleMarkup(b) {
    const heading = b.heading ?? null;
    if (heading === null) return "";
    const href = b.href ?? null;
    if (href !== null) {
      return `<a class="xtyle-toolbar__title" part="title" href="${escapeAttr(href)}">${escapeHtml(heading)}</a>`;
    }
    return `<span class="xtyle-toolbar__title" part="title">${escapeHtml(heading)}</span>`;
  }
  function inner(b) {
    return '<div class="xtyle-toolbar__group xtyle-toolbar__group--start" part="group"><slot name="start"></slot></div>' + titleMarkup(b) + '<slot></slot><div class="xtyle-toolbar__group xtyle-toolbar__group--center" part="group"><slot name="center"></slot></div><div class="xtyle-toolbar__group xtyle-toolbar__group--end" part="group"><slot name="end"></slot></div>';
  }
  function toolbarHtml(b) {
    const tag = b.landmark ? "header" : "div";
    const nameAttr = b.landmark && b.heading ? ` aria-label="${escapeAttr(b.heading)}"` : "";
    return `<${tag} part="toolbar" class="${toolbarClass(b)}"${nameAttr}>${inner(b)}</${tag}>`;
  }
  hooks.fragment.mount("toolbar", (bindings, ops) => {
    ops.replaceChildren("[data-toolbar]", toolbarHtml(bindings));
  });
  hooks.fragment.update("toolbar", (bindings, ops) => {
    ops.setAttr(".xtyle-toolbar", "class", toolbarClass(bindings));
    const heading = bindings.heading ?? null;
    if (heading !== null) {
      ops.setText('[part="title"]', heading);
      const href = bindings.href ?? null;
      if (href !== null) ops.setAttr('[part="title"]', "href", href);
    }
    if (bindings.landmark) ops.setAttr('[part="toolbar"]', "aria-label", heading ?? "");
  });
})();
