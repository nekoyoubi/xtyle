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

  // packages/xtyle/src/elements/fragments/link/mod.ts
  var EXTERNAL_ICON = '<svg class="xtyle-link__external-icon" part="external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3h7v7"/><path d="M10 14 21 3"/><path d="M19 14v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/></svg>';
  function linkClass(b) {
    const variant = b.variant ?? "default";
    return ["xtyle-link", variant !== "default" && `xtyle-link--${variant}`].filter(Boolean).join(" ");
  }
  function linkHtml(b) {
    const href = b.href ?? null;
    const target = b.target ?? null;
    const external = target === "_blank";
    const icon = b.showExternalIcon ? EXTERNAL_ICON : "";
    const newTabHint = external ? '<span class="xtyle-link__sr-only" part="sr-hint"> (opens in a new tab)</span>' : "";
    if (href === null) {
      return `<span part="link" class="${linkClass(b)}"><span class="xtyle-slot"><slot></slot></span>${newTabHint}${icon}</span>`;
    }
    const targetAttr = target ? ` target="${escapeAttr(target)}"` : "";
    const explicitRel = b.rel ?? null;
    const rel = explicitRel ?? (external ? "noopener noreferrer" : null);
    const relAttr = rel ? ` rel="${escapeAttr(rel)}"` : "";
    return `<a part="link" class="${linkClass(b)}" href="${escapeAttr(href)}"${targetAttr}${relAttr}><span class="xtyle-slot"><slot></slot></span>${newTabHint}${icon}</a>`;
  }
  hooks.fragment.mount("link", (bindings, ops) => {
    ops.replaceChildren("[data-link]", linkHtml(bindings));
  });
  hooks.fragment.update("link", (bindings, ops) => {
    ops.setAttr(".xtyle-link", "class", linkClass(bindings));
    if (bindings.href != null) {
      ops.setAttr('[part="link"]', "href", bindings.href);
      if (bindings.target != null) ops.setAttr('[part="link"]', "target", bindings.target);
      const rel = bindings.rel ?? (bindings.target === "_blank" ? "noopener noreferrer" : null);
      if (rel) ops.setAttr('[part="link"]', "rel", rel);
    }
  });
})();
