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

  // packages/xtyle/src/elements/fragments/command-palette/mod.ts
  var SEARCH_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6" /><path d="M15.5 15.5 20 20" /></svg>';
  var LEGEND = [
    { keys: ["\u2191", "\u2193"], text: "navigate" },
    { keys: ["\u21B5"], text: "run" },
    { keys: ["Esc"], text: "dismiss" }
  ];
  function keycap(key) {
    return `<kbd class="xtyle-kbd xtyle-kbd--sm" part="key">${escapeHtml(key)}</kbd>`;
  }
  function keys(shortcut) {
    const parts = (shortcut ?? "").split("+").map((part) => part.trim()).filter((part) => part !== "");
    if (parts.length === 0) return "";
    return `<span class="xtyle-command-palette__keys" part="keys">${parts.map(keycap).join("")}</span>`;
  }
  function label(runs) {
    return runs.map(
      (run) => run.match ? `<mark class="xtyle-command-palette__match" part="match">${escapeHtml(run.text)}</mark>` : escapeHtml(run.text)
    ).join("");
  }
  function option(view) {
    const disabled = view.disabled ? ' aria-disabled="true"' : "";
    const active = view.active ? ' data-active="true"' : "";
    const shortcut = view.shortcut ? ` aria-keyshortcuts="${escapeAttr(view.shortcut)}"` : "";
    const hint = view.hint ? `<span class="xtyle-command-palette__hint" part="hint">${escapeHtml(view.hint)}</span>` : "";
    return `<div class="xtyle-command-palette__option" part="option" role="option" id="${escapeAttr(view.optionId)}" data-id="${escapeAttr(view.id)}" aria-selected="${view.active ? "true" : "false"}"${disabled}${active}${shortcut}><span class="xtyle-command-palette__label" part="label">${label(view.runs ?? [])}</span>${hint}${keys(view.shortcut)}</div>`;
  }
  function group(view) {
    const headingId = `${view.id}-heading`;
    const heading = view.heading ? `<div class="xtyle-command-palette__heading" part="heading" id="${escapeAttr(headingId)}">${escapeHtml(view.heading)}</div>` : "";
    const named = view.heading ? ` aria-labelledby="${escapeAttr(headingId)}"` : "";
    return `<div class="xtyle-command-palette__group" part="group" role="group"${named}>${heading}${(view.options ?? []).map(option).join("")}</div>`;
  }
  function legend() {
    return LEGEND.map(
      (entry) => `<span class="xtyle-command-palette__legend" part="legend">${entry.keys.map(keycap).join("")} ${entry.text}</span>`
    ).join("");
  }
  function paint(b, ops) {
    const name = b.label ?? "Command palette";
    const listId = b.listId ?? "xtyle-command-palette-list";
    const count = b.count ?? 0;
    ops.setAttr("[data-modal]", "aria-label", name);
    ops.replaceChildren("[data-glyph]", SEARCH_ICON);
    ops.setAttr("[data-input]", "id", b.inputId ?? "xtyle-command-palette-input");
    ops.setAttr("[data-input]", "aria-label", name);
    ops.setAttr("[data-input]", "placeholder", b.placeholder ?? "");
    ops.setAttr("[data-input]", "aria-controls", listId);
    ops.setAttr("[data-input]", "aria-expanded", count > 0 ? "true" : "false");
    ops.setAttr("[data-input]", "aria-activedescendant", b.activeId ?? "");
    ops.setAttr("[data-list]", "id", listId);
    ops.setAttr("[data-list]", "aria-label", name);
    ops.replaceChildren("[data-list]", (b.groups ?? []).map(group).join(""));
    ops.setText("[data-empty]", b.emptyText ?? "");
    ops.setAttr("[data-empty]", "hidden", count > 0 ? "hidden" : "");
    ops.replaceChildren("[data-footer]", legend());
    ops.setAttr("[data-footer]", "hidden", b.footer ? "" : "hidden");
  }
  hooks.fragment.mount("command-palette", (bindings, ops) => {
    paint(bindings, ops);
  });
  hooks.fragment.update("command-palette", (bindings, ops) => {
    paint(bindings, ops);
  });
  xript.exports.register("paletteInput", (payload) => {
    return { inputValue: payload.value ?? "" };
  });
  xript.exports.register("paletteKeydown", (payload) => {
    const e = payload;
    switch (e.key) {
      case "ArrowDown":
        return { nudge: 1, preventDefault: true };
      case "ArrowUp":
        return { nudge: -1, preventDefault: true };
      case "PageDown":
        return { jump: "page-down", preventDefault: true };
      case "PageUp":
        return { jump: "page-up", preventDefault: true };
      case "Enter":
        return { commitValue: true, preventDefault: true };
      case "Escape":
        return { requestClose: true, preventDefault: true, stopPropagation: true };
      default:
        return {};
    }
  });
  xript.exports.register("optionClick", (payload) => {
    const e = payload;
    if (e.ariaDisabled === "true") return {};
    const id = e.dataset?.id;
    return id === void 0 ? {} : { activateValue: id };
  });
  xript.exports.register("optionHover", (payload) => {
    const e = payload;
    if (e.ariaDisabled === "true") return {};
    const id = e.dataset?.id;
    return id === void 0 ? {} : { focusValue: id };
  });
})();
