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
  function railWidth(b) {
    const raw = b.sidebar ?? null;
    return raw !== null && raw.trim() !== "" ? raw : null;
  }
  function gridClass(b) {
    const gap = clampGap(b.gap);
    const columns = clampColumns(b.columns);
    const min = b.minColWidth ?? null;
    const rail = railWidth(b);
    const usesColumns = rail === null && min === null && columns !== null;
    return [
      "xtyle-grid",
      `xtyle-grid--gap-${gap}`,
      usesColumns && `xtyle-grid--cols-${columns}`,
      rail !== null && "xtyle-grid--sidebar",
      rail !== null && `xtyle-grid--sidebar-${b.side === "start" ? "start" : "end"}`,
      b.align && `xtyle-grid--align-${b.align}`,
      b.justify && `xtyle-grid--justify-${b.justify}`,
      b.inline && "xtyle-grid--inline"
    ].filter(Boolean).join(" ");
  }
  function gridStyle(b) {
    const min = b.minColWidth ?? null;
    const rail = railWidth(b);
    if (rail !== null) {
      const floor = min === null ? "" : ` --xtyle-grid-main: ${min};`;
      return `--xtyle-grid-rail: ${rail};${floor}`;
    }
    return min === null ? "" : `grid-template-columns: repeat(auto-fit, minmax(${min}, 1fr))`;
  }
  function gridHtml(b) {
    const style = gridStyle(b);
    const styleAttr = style === "" ? "" : ` style="${escapeAttr(style)}"`;
    return `<div part="grid" class="${escapeAttr(gridClass(b))}"${styleAttr}><slot></slot></div>`;
  }
  hooks.fragment.mount("grid", (bindings, ops) => {
    ops.replaceChildren("[data-grid]", gridHtml(bindings));
  });
  hooks.fragment.update("grid", (bindings, ops) => {
    ops.setAttr(".xtyle-grid", "class", gridClass(bindings));
    ops.setAttr('[part="grid"]', "style", gridStyle(bindings));
  });
})();
