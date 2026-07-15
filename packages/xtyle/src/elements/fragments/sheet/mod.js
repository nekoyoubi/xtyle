"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/sheet/mod.ts
  var CLOSE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M6 6l12 12M18 6L6 18" /></svg>';
  function sheetClass(b) {
    const side = b.side ?? "bottom";
    const size = b.size ?? "md";
    return [
      "xtyle-sheet",
      `xtyle-sheet--${side}`,
      size !== "md" && `xtyle-sheet--${size}`,
      b.nonModal && "xtyle-sheet--non-modal"
    ].filter(Boolean).join(" ");
  }
  function titleId(b) {
    return `${b.elementId ?? "xtyle-sheet"}-title`;
  }
  function inner(b) {
    const heading = b.heading ?? null;
    const label = b.label ?? null;
    const labelledby = b.labelledby ?? null;
    const closeLabel = b.closeLabel ?? "Close";
    const labelAttr = labelledby ? ` aria-labelledby="${labelledby}"` : heading ? ` aria-labelledby="${titleId(b)}"` : label ? ` aria-label="${label}"` : "";
    const handle = b.noGrabber ? "" : '<div class="xtyle-sheet__handle" part="handle" data-handle aria-hidden="true"><span class="xtyle-sheet__grabber" part="grabber"></span></div>';
    const closeButton = b.noCloseButton ? "" : `<button type="button" class="xtyle-sheet__close" part="close" aria-label="${closeLabel}">${CLOSE_ICON}</button>`;
    const titleMarkup = heading ? `<h2 class="xtyle-sheet__title" id="${titleId(b)}">${heading}</h2>` : "";
    const header = `<header class="xtyle-sheet__header" part="header" data-handle-region><slot name="header">${titleMarkup}</slot>${closeButton}</header>`;
    const panel = '<div class="xtyle-sheet__panel" part="panel">' + header + '<div class="xtyle-sheet__body" part="body"><slot></slot></div><footer class="xtyle-sheet__footer" part="footer"><slot name="footer"></slot></footer></div>';
    return `<dialog class="${sheetClass(b)}" part="sheet"${labelAttr}>` + handle + panel + "</dialog>";
  }
  hooks.fragment.mount("sheet", (bindings, ops) => {
    ops.replaceChildren("[data-sheet]", inner(bindings));
  });
  hooks.fragment.update("sheet", (bindings, ops) => {
    ops.setAttr(".xtyle-sheet", "class", sheetClass(bindings));
    if (bindings.heading) ops.setText(".xtyle-sheet__title", bindings.heading);
  });
  xript.exports.register("requestClose", (payload) => {
    const e = payload;
    if (e.disabled || e.ariaDisabled === "true") return {};
    return { requestClose: true };
  });
})();
