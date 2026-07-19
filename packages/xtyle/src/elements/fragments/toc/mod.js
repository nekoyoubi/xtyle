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

  // packages/xtyle/src/elements/fragments/toc/mod.ts
  function tocClass(bindings) {
    return ["xtyle-toc", bindings.sticky && "xtyle-toc--sticky"].filter(Boolean).join(" ");
  }
  function link(item) {
    return `<a class="xtyle-toc__link" part="link" href="#${escapeAttr(item.id)}" data-toc-link="${escapeAttr(item.id)}">${escapeAttr(item.label)}</a>`;
  }
  function links(bindings) {
    const items = bindings.items ?? [];
    let out = "";
    let depth = 1;
    let open = false;
    for (const item of items) {
      const raw = Math.trunc(Number(item.level));
      const wanted = Number.isFinite(raw) && raw >= 1 ? raw : 1;
      const level = open ? Math.min(wanted, depth + 1) : 1;
      if (open && level > depth) {
        out += `<ul class="xtyle-toc__list xtyle-toc__list--nested" role="list" data-level="${level}">`;
      } else {
        if (open) out += "</li>";
        for (; depth > level; depth--) out += "</ul></li>";
      }
      depth = level;
      out += `<li>${link(item)}`;
      open = true;
    }
    if (open) out += "</li>";
    for (; depth > 1; depth--) out += "</ul></li>";
    return out;
  }
  hooks.fragment.mount("toc", (bindings, ops) => {
    const label = bindings.label ?? "On this page";
    ops.setAttr(".xtyle-toc", "class", tocClass(bindings));
    ops.setAttr("[data-root]", "aria-label", label);
    ops.setText("[data-label]", label);
    ops.replaceChildren("[data-list]", links(bindings));
  });
  hooks.fragment.update("toc", (bindings, ops) => {
    const label = bindings.label ?? "On this page";
    ops.setAttr(".xtyle-toc", "class", tocClass(bindings));
    ops.setAttr("[data-root]", "aria-label", label);
    ops.setText("[data-label]", label);
  });
})();
