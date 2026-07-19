"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/grid/mod.ts
  function clampGap(value) {
    if (value === null || value === void 0) return 4;
    const n = Math.trunc(value);
    if (!Number.isFinite(n) || n < 0 || n > 8) return 4;
    return n;
  }
  function clampColumns(value) {
    if (value === null || value === void 0) return null;
    const n = Math.trunc(value);
    if (!Number.isFinite(n) || n < 1 || n > 12) return null;
    return n;
  }
  function gridClass(b) {
    const gap = clampGap(b.gap);
    const columns = clampColumns(b.columns);
    const min = b.minColWidth ?? null;
    const usesColumns = min === null && columns !== null;
    return [
      "xtyle-grid",
      `xtyle-grid--gap-${gap}`,
      usesColumns && `xtyle-grid--cols-${columns}`,
      b.align && `xtyle-grid--align-${b.align}`,
      b.justify && `xtyle-grid--justify-${b.justify}`,
      b.inline && "xtyle-grid--inline"
    ].filter(Boolean).join(" ");
  }
  function gridStyle(b) {
    const min = b.minColWidth ?? null;
    return min === null ? "" : `grid-template-columns: repeat(auto-fit, minmax(${min}, 1fr))`;
  }
  function gridHtml(b) {
    const style = gridStyle(b);
    const styleAttr = style === "" ? "" : ` style="${style}"`;
    return `<div part="grid" class="${gridClass(b)}"${styleAttr}><slot></slot></div>`;
  }
  hooks.fragment.mount("grid", (bindings, ops) => {
    ops.replaceChildren("[data-grid]", gridHtml(bindings));
  });
  hooks.fragment.update("grid", (bindings, ops) => {
    ops.setAttr(".xtyle-grid", "class", gridClass(bindings));
    ops.setAttr('[part="grid"]', "style", gridStyle(bindings));
  });
})();
