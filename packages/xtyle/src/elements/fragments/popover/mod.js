"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/popover/mod.ts
  function rootClass(b) {
    return b.flush ? "xtyle-popover xtyle-popover--flush" : "xtyle-popover";
  }
  function paint(b, ops) {
    const panelId = b.panelId ?? "xtyle-popover-panel";
    const modal = b.modal ?? false;
    ops.setAttr(".xtyle-popover", "class", rootClass(b));
    ops.setAttr("[data-trigger]", "hidden", b.hasTrigger ? "" : "hidden");
    ops.setAttr("[data-arrow]", "hidden", b.arrow ? "" : "hidden");
    ops.setAttr("[data-surface]", "id", panelId);
    ops.setAttr("[data-surface]", "role", b.panelRole ?? "dialog");
    ops.setAttr("[data-surface]", "data-modal", modal ? "true" : "");
    ops.setAttr("[data-surface]", "aria-modal", modal ? "true" : "");
    ops.setAttr("[data-surface]", "aria-label", b.label ?? "");
    ops.setAttr("[data-surface]", "aria-labelledby", b.labelledby ?? "");
  }
  hooks.fragment.mount("popover", (bindings, ops) => {
    paint(bindings, ops);
  });
  hooks.fragment.update("popover", (bindings, ops) => {
    paint(bindings, ops);
  });
})();
