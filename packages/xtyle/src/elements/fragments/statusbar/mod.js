"use strict";
(() => {
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
    return `<span class="xtyle-statusbar__overflow" part="overflow" style="display:none"><button class="xtyle-statusbar__item xtyle-statusbar__overflow-trigger" part="overflow-trigger" type="button" popovertarget="${popoverId}" aria-label="Show hidden status items">+0</button><div class="xtyle-statusbar__overflow-popover" part="overflow-popover" id="${popoverId}" popover role="group" aria-label="Hidden status items"></div></span>`;
  }
  function statusbarHtml(b) {
    const live = b.live ? ` role="status" aria-live="polite"` : "";
    const label = b.label ? ` aria-label="${b.label}"` : "";
    const scrollable = (b.overflow ?? "clip") === "scroll" ? ` tabindex="0"` : "";
    return `<footer part="statusbar" class="${statusbarClass(b)}"${live}${label}${scrollable}><slot></slot>${overflowMenu(b)}</footer>`;
  }
  hooks.fragment.mount("statusbar", (bindings, ops) => {
    ops.replaceChildren("[data-statusbar]", statusbarHtml(bindings));
  });
  hooks.fragment.update("statusbar", (bindings, ops) => {
    ops.setAttr('[part="statusbar"]', "class", statusbarClass(bindings));
    ops.setAttr('[part="statusbar"]', "tabindex", (bindings.overflow ?? "clip") === "scroll" ? "0" : "");
  });
})();
