"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/toc/mod.ts
  function escapeHtml(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function escapeAttr(value) {
    return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function tocClass(bindings) {
    return ["xtyle-toc", bindings.sticky && "xtyle-toc--sticky"].filter(Boolean).join(" ");
  }
  function links(bindings) {
    const items = bindings.items ?? [];
    return items.map(
      (item) => `<li><a class="xtyle-toc__link" part="link" href="#${escapeAttr(item.id)}" data-toc-link="${escapeAttr(item.id)}">${escapeHtml(item.label)}</a></li>`
    ).join("");
  }
  hooks.fragment.mount("toc", (bindings, ops) => {
    const label = bindings.label ?? "On this page";
    ops.setAttr("[data-root]", "class", tocClass(bindings));
    ops.setAttr("[data-root]", "aria-label", label);
    ops.setText("[data-label]", label);
    ops.replaceChildren("[data-list]", links(bindings));
  });
  hooks.fragment.update("toc", (bindings, ops) => {
    const label = bindings.label ?? "On this page";
    ops.setAttr("[data-root]", "class", tocClass(bindings));
    ops.setAttr("[data-root]", "aria-label", label);
    ops.setText("[data-label]", label);
  });
})();
