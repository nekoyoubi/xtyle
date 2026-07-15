"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/split-button/mod.ts
  function buttonClasses(b, part) {
    const variant = b.variant ?? "solid";
    const tone = b.tone ?? "accent";
    const size = b.size ?? "md";
    return [
      "xtyle-button",
      `xtyle-button--${variant}`,
      `xtyle-button--${tone}`,
      size !== "md" && `xtyle-button--${size}`,
      b.loading && part === "primary" && "xtyle-button--loading",
      `xtyle-split-button__${part}`
    ].filter(Boolean).join(" ");
  }
  function rootClass(b) {
    return [
      "xtyle-split-button",
      b.disabled && "xtyle-split-button--disabled",
      b.block && "xtyle-split-button--block",
      b.open && "xtyle-split-button--open"
    ].filter(Boolean).join(" ");
  }
  function paint(b, ops) {
    const disabled = b.disabled === true;
    const loading = b.loading === true;
    ops.setAttr(".xtyle-split-button", "class", rootClass(b));
    ops.setAttr(".xtyle-split-button__primary", "class", buttonClasses(b, "primary"));
    ops.setAttr("[data-primary]", "type", b.type ?? "button");
    ops.setAttr("[data-primary]", "disabled", disabled || loading ? "disabled" : "");
    ops.setAttr("[data-primary]", "aria-busy", loading ? "true" : "");
    ops.setAttr("[data-busy]", "hidden", loading ? "" : "hidden");
    ops.setAttr(".xtyle-split-button__toggle", "class", buttonClasses(b, "toggle"));
    ops.setAttr("[data-toggle]", "disabled", disabled ? "disabled" : "");
    ops.setAttr("[data-toggle]", "aria-label", b.menuLabel ?? "More actions");
    ops.setAttr("[data-toggle]", "aria-expanded", b.open === true ? "true" : "false");
    ops.setAttr("[data-dropdown]", "items", b.itemsJson ?? "[]");
  }
  hooks.fragment.mount("split-button", (bindings, ops) => {
    paint(bindings, ops);
  });
  hooks.fragment.update("split-button", (bindings, ops) => {
    paint(bindings, ops);
  });
  xript.exports.register("toggleClick", (payload) => {
    const e = payload;
    if (e.disabled || e.ariaDisabled === "true") return {};
    return { toggleOpen: true, preventDefault: true, stopPropagation: true };
  });
  xript.exports.register("groupKeydown", (payload) => {
    const e = payload;
    switch (e.key) {
      case "ArrowDown":
        return { openMenu: "first", preventDefault: true };
      case "ArrowUp":
        return { openMenu: "last", preventDefault: true };
      case "Escape":
        return { closeMenu: true };
      default:
        return {};
    }
  });
})();
