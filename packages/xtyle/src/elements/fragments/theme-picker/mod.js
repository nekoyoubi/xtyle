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

  // packages/xtyle/src/elements/fragments/theme-picker/mod.ts
  function jsonAttr(name, value) {
    if (value === void 0 || value === null) return "";
    return ` ${name}="${escapeAttr(JSON.stringify(value))}"`;
  }
  function stringAttr(name, value) {
    return value ? ` ${name}="${escapeAttr(value)}"` : "";
  }
  function invocationAttrs(theme) {
    return stringAttr("algorithm", theme.algorithm) + stringAttr("scheme", theme.scheme) + jsonAttr("knobs", theme.knobs) + jsonAttr("constraints", theme.constraints);
  }
  function itemMarkup(theme, b, index) {
    const invocation = invocationAttrs(theme);
    const card = `<xtyle-theme-card part="card" interactive data-index="${index}" data-key="${escapeAttr(theme.key)}"` + stringAttr("name", theme.name) + invocation + (theme.selected ? " selected" : "") + `></xtyle-theme-card>`;
    const swatch = b.swatches ? `<xtyle-theme-swatch part="swatch" size="sm" labels="false"${invocation}></xtyle-theme-swatch>` : "";
    return `<div class="xtyle-theme-picker__item" part="item">${card}${swatch}</div>`;
  }
  function gallery(b) {
    const themes = b.themes ?? [];
    if (themes.length === 0) {
      const message = b.empty ?? "No themes to choose from.";
      return `<p class="xtyle-theme-picker__empty" part="empty">${escapeAttr(message)}</p>`;
    }
    const min = b.minColWidth ? ` style="--xtyle-theme-picker-min: ${escapeAttr(b.minColWidth)}"` : "";
    const label = b.label ? ` aria-label="${escapeAttr(b.label)}"` : "";
    const items = themes.map((theme, i) => itemMarkup(theme, b, i)).join("");
    return `<div class="xtyle-theme-picker__grid" part="grid" role="group"${label}${min}>${items}</div>`;
  }
  function menu(b) {
    const label = b.label ?? "Theme";
    const current = b.currentName ?? "";
    return `<xtyle-popover class="xtyle-theme-picker__menu" part="menu" placement="bottom" align="end" panel-role="menu" label="${escapeAttr(label)}"${b.open ? " open" : ""}><xtyle-button slot="trigger" part="trigger" variant="outline" size="sm"><span class="xtyle-theme-picker__current" part="trigger-label">${escapeAttr(current)}</span><span class="xtyle-theme-picker__caret" aria-hidden="true">\u25BE</span></xtyle-button><div class="xtyle-theme-picker__panel" part="panel">${gallery(b)}</div></xtyle-popover>`;
  }
  function inner(b) {
    return b.layout === "menu" ? menu(b) : gallery(b);
  }
  hooks.fragment.mount("theme-picker", (bindings, ops) => {
    ops.replaceChildren("[data-theme-picker]", inner(bindings));
  });
  hooks.fragment.update("theme-picker", (bindings, ops) => {
    (bindings.themes ?? []).forEach((theme, index) => {
      ops.setAttr(`[data-index="${index}"]`, "selected", theme.selected ? "selected" : "");
    });
    if (bindings.layout === "menu") ops.setText('[part="trigger-label"]', bindings.currentName ?? "");
  });
})();
