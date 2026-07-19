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

  // packages/xtyle/src/elements/fragments/avatar-group/mod.ts
  function groupClass(b) {
    const size = b.size === "sm" || b.size === "lg" || b.size === "xl" ? b.size : "md";
    const spacing = b.spacing === "snug" || b.spacing === "loose" ? b.spacing : "normal";
    return [
      "xtyle-avatar-group",
      size !== "md" && `xtyle-avatar-group--${size}`,
      spacing !== "normal" && `xtyle-avatar-group--${spacing}`
    ].filter(Boolean).join(" ");
  }
  function overflowMarkup(b) {
    const n = Math.trunc(Number(b.overflow));
    if (!Number.isFinite(n) || n <= 0) return "";
    return `<span class="xtyle-avatar-group__overflow" part="overflow" role="img" aria-label="${escapeAttr(`${n} more`)}">+${n}</span>`;
  }
  function groupHtml(b) {
    const label = b.label ? ` aria-label="${escapeAttr(b.label)}"` : "";
    return `<div part="group" class="${groupClass(b)}" role="group"${label}><slot></slot>${overflowMarkup(b)}</div>`;
  }
  hooks.fragment.mount("avatar-group", (bindings, ops) => {
    ops.replaceChildren("[data-avatar-group]", groupHtml(bindings));
  });
  hooks.fragment.update("avatar-group", (bindings, ops) => {
    ops.setAttr(".xtyle-avatar-group", "class", groupClass(bindings));
  });
})();
