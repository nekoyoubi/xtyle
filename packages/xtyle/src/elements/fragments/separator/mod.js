"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/separator/mod.ts
  function separatorClass(b) {
    return [
      "xtyle-separator",
      b.variant === "with-label" && "xtyle-separator--with-label",
      b.orientation === "vertical" && "xtyle-separator--vertical",
      b.size === "thin" && "xtyle-separator--thin"
    ].filter(Boolean).join(" ");
  }
  function separatorHtml(b) {
    const ariaOrientation = b.orientation === "vertical" ? ' aria-orientation="vertical"' : "";
    if (b.variant === "with-label") {
      return `<div part="separator" class="${separatorClass(b)}" role="separator"${ariaOrientation}><span class="xtyle-separator__label" part="label"><slot></slot></span></div>`;
    }
    return `<div part="separator" class="${separatorClass(b)}" aria-hidden="true"></div>`;
  }
  hooks.fragment.mount("separator", (bindings, ops) => {
    ops.replaceChildren("[data-separator]", separatorHtml(bindings));
  });
  hooks.fragment.update("separator", (bindings, ops) => {
    ops.setAttr('[part="separator"]', "class", separatorClass(bindings));
  });
})();
