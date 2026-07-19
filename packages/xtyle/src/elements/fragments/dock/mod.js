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

  // packages/xtyle/src/elements/fragments/dock/mod.ts
  function dockClass(b) {
    const size = b.size ?? "md";
    return [
      "xtyle-dock",
      b.side === "right" && "xtyle-dock--right",
      size !== "md" && `xtyle-dock--${size}`,
      b.tone && `xtyle-dock--${b.tone}`,
      b.reverseEdge && "xtyle-dock--edge-out",
      b.edgeWidth && `xtyle-dock--edge-${b.edgeWidth}`
    ].filter(Boolean).join(" ");
  }
  function dockInner(b) {
    const header = b.label && !b.hideHeader ? `<div class="xtyle-dock__header" part="header"><slot name="header">${escapeHtml(b.label)}</slot></div>` : `<slot name="header"></slot>`;
    return `${header}<div class="xtyle-dock__body" part="body"><slot></slot></div><slot name="footer"></slot>`;
  }
  function dockHtml(b) {
    const tag = b.nav ? "nav" : "aside";
    const label = b.label ?? null;
    const labelAttr = label && !b.hasAriaLabel ? ` aria-label="${escapeAttr(label)}"` : "";
    return `<${tag} part="dock" class="${dockClass(b)}"${labelAttr}>${dockInner(b)}</${tag}>`;
  }
  hooks.fragment.mount("dock", (bindings, ops) => {
    ops.replaceChildren("[data-dock]", dockHtml(bindings));
  });
  hooks.fragment.update("dock", (bindings, ops) => {
    ops.setAttr(".xtyle-dock", "class", dockClass(bindings));
    const label = bindings.label ?? null;
    if (label && !bindings.hideHeader) {
      ops.setText('slot[name="header"]', label);
    }
    if (label && !bindings.hasAriaLabel) {
      ops.setAttr('[part="dock"]', "aria-label", label);
    }
  });
})();
