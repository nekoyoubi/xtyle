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

  // packages/xtyle/src/elements/fragments/statusbar/mod.ts
  function statusbarClass(b) {
    const overflow = b.overflow ?? "clip";
    return [
      "xtyle-statusbar",
      overflow !== "clip" && `xtyle-statusbar--${overflow}`,
      b.separated && "xtyle-statusbar--separated"
    ].filter(Boolean).join(" ");
  }
  function overflowMenu(b) {
    const overflow = b.overflow ?? "clip";
    if (overflow !== "collapse" || b.manualOverflow) return "";
    const popoverId = `${b.elementId ?? "xtyle-statusbar"}-overflow`;
    return `<span class="xtyle-statusbar__overflow" part="overflow" style="display:none"><button class="xtyle-statusbar__item xtyle-statusbar__overflow-trigger" part="overflow-trigger" type="button" popovertarget="${escapeAttr(popoverId)}" aria-label="Show hidden status items">+0</button><div class="xtyle-statusbar__overflow-popover" part="overflow-popover" id="${escapeAttr(popoverId)}" popover role="group" aria-label="Hidden status items"></div></span>`;
  }
  function statusbarHtml(b) {
    const live = b.live ? ` role="status" aria-live="polite"` : "";
    const label = b.label ? ` aria-label="${escapeAttr(b.label)}"` : "";
    const scrollable = (b.overflow ?? "clip") === "scroll" ? ` tabindex="0"` : "";
    return `<footer part="statusbar" class="${statusbarClass(b)}"${live}${label}${scrollable}><slot></slot>${overflowMenu(b)}</footer>`;
  }
  hooks.fragment.mount("statusbar", (bindings, ops) => {
    ops.replaceChildren("[data-statusbar]", statusbarHtml(bindings));
  });
  hooks.fragment.update("statusbar", (bindings, ops) => {
    ops.setAttr(".xtyle-statusbar", "class", statusbarClass(bindings));
    ops.setAttr('[part="statusbar"]', "tabindex", (bindings.overflow ?? "clip") === "scroll" ? "0" : "");
  });
})();
