"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/escape.ts
  var AMP = /&/g;
  var LT = /</g;
  var GT = />/g;
  function escapeHtml(value) {
    return value.replace(AMP, "&amp;").replace(LT, "&lt;").replace(GT, "&gt;");
  }

  // packages/xtyle/src/elements/fragments/ribbon/mod.ts
  function ribbonClass(b) {
    const corner = b.corner ?? "top-right";
    const size = b.size ?? "md";
    const variant = b.variant ?? "solid";
    return [
      "xtyle-ribbon",
      `xtyle-ribbon--${corner}`,
      size !== "md" && `xtyle-ribbon--${size}`,
      variant !== "solid" && `xtyle-ribbon--${variant}`,
      !b.color && b.tone && `xtyle-ribbon--${b.tone}`
    ].filter(Boolean).join(" ");
  }
  function ribbonStyle(b) {
    return [b.color && `--rb-bg: ${b.color}`, b.textColor && `--rb-fg: ${b.textColor}`].filter(Boolean).join("; ");
  }
  function bandHtml(b) {
    return `<span part="band" class="xtyle-ribbon__band">${escapeHtml(b.label ?? "")}</span>`;
  }
  function ribbonHtml(b) {
    return `<span part="ribbon" class="${ribbonClass(b)}" style="${ribbonStyle(b)}">${bandHtml(b)}</span>`;
  }
  hooks.fragment.mount("ribbon", (bindings, ops) => {
    ops.replaceChildren("[data-ribbon]", ribbonHtml(bindings));
  });
  hooks.fragment.update("ribbon", (bindings, ops) => {
    ops.setAttr(".xtyle-ribbon", "class", ribbonClass(bindings));
    ops.setAttr('[part="ribbon"]', "style", ribbonStyle(bindings));
    ops.replaceChildren('[part="ribbon"]', bandHtml(bindings));
  });
})();
