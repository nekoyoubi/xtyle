"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/cluster/mod.ts
  function clusterClass(b) {
    const gap = Math.min(Math.max(Math.trunc(b.gap ?? 2), 0), 8);
    return [
      "xtyle-cluster",
      `xtyle-cluster--gap-${gap}`,
      b.align && `xtyle-cluster--align-${b.align}`,
      b.justify && `xtyle-cluster--justify-${b.justify}`,
      b.nowrap && "xtyle-cluster--nowrap",
      b.inline && "xtyle-cluster--inline"
    ].filter(Boolean).join(" ");
  }
  function clusterHtml(b) {
    return `<div part="cluster" class="${clusterClass(b)}"><slot></slot></div>`;
  }
  hooks.fragment.mount("cluster", (bindings, ops) => {
    ops.replaceChildren("[data-cluster]", clusterHtml(bindings));
  });
  hooks.fragment.update("cluster", (bindings, ops) => {
    ops.setAttr(".xtyle-cluster", "class", clusterClass(bindings));
  });
})();
