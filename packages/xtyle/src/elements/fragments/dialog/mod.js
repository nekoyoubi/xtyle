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

  // packages/xtyle/src/elements/fragments/dialog/mod.ts
  var CLOSE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M6 6l12 12M18 6L6 18" /></svg>';
  function dialogClass(b) {
    const size = b.size ?? "md";
    return ["xtyle-dialog", size !== "md" && `xtyle-dialog--${size}`].filter(Boolean).join(" ");
  }
  function titleId(b) {
    return `${b.elementId ?? "xtyle-dialog"}-title`;
  }
  function inner(b) {
    const heading = b.heading ?? null;
    const label = b.label ?? null;
    const labelledby = b.labelledby ?? null;
    const closeLabel = b.closeLabel ?? "Close";
    const showCloseButton = !b.noCloseButton;
    const labelAttr = labelledby ? ` aria-labelledby="${escapeAttr(labelledby)}"` : heading ? ` aria-labelledby="${titleId(b)}"` : label ? ` aria-label="${escapeAttr(label)}"` : "";
    const closeButton = showCloseButton ? `<button type="button" class="xtyle-dialog__close" part="close" aria-label="${escapeAttr(closeLabel)}">${CLOSE_ICON}</button>` : "";
    const titleMarkup = heading ? `<h2 class="xtyle-dialog__title" id="${titleId(b)}">${escapeHtml(heading)}</h2>` : "";
    const header = `<header class="xtyle-dialog__header" part="header"><slot name="header">${titleMarkup}</slot>${closeButton}</header>`;
    return `<dialog class="${dialogClass(b)}" part="dialog"${labelAttr}>` + header + `<div class="xtyle-dialog__body" part="body"><slot></slot></div><footer class="xtyle-dialog__footer" part="footer"><slot name="footer"></slot></footer></dialog>`;
  }
  hooks.fragment.mount("dialog", (bindings, ops) => {
    ops.replaceChildren("[data-dialog]", inner(bindings));
  });
  hooks.fragment.update("dialog", (bindings, ops) => {
    ops.setAttr(".xtyle-dialog", "class", dialogClass(bindings));
    if (bindings.heading) ops.setText(".xtyle-dialog__title", bindings.heading);
  });
  xript.exports.register("requestClose", (payload) => {
    const e = payload;
    if (e.disabled || e.ariaDisabled === "true") return {};
    return { requestClose: true };
  });
})();
