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

  // packages/xtyle/src/elements/fragments/splitter/mod.ts
  function splitterClass(b) {
    const orientation = b.orientation === "horizontal" ? "horizontal" : "vertical";
    const size = b.size ?? "md";
    return [
      "xtyle-splitter",
      `xtyle-splitter--${orientation}`,
      size !== "md" && `xtyle-splitter--${size}`,
      b.line && "xtyle-splitter--line",
      b.disabled && "xtyle-splitter--disabled"
    ].filter(Boolean).join(" ");
  }
  function inner(b) {
    const orientation = b.orientation === "horizontal" ? "horizontal" : "vertical";
    const name = b.labelledby ? ` aria-labelledby="${escapeAttr(b.labelledby)}"` : b.label ? ` aria-label="${escapeAttr(b.label)}"` : "";
    const disabled = b.disabled ? ` aria-disabled="true"` : "";
    const tabindex = b.disabled ? "" : ` tabindex="0"`;
    return `<div part="splitter" class="${splitterClass(b)}" role="separator" aria-orientation="${escapeAttr(orientation)}" aria-valuenow="${b.value ?? 0}" aria-valuemin="${b.min ?? 0}" aria-valuemax="${b.max ?? 0}"${name}${disabled}${tabindex}><span class="xtyle-splitter__grip" part="grip" aria-hidden="true"></span></div>`;
  }
  hooks.fragment.mount("splitter", (bindings, ops) => {
    ops.replaceChildren("[data-splitter]", inner(bindings));
  });
  hooks.fragment.update("splitter", (bindings, ops) => {
    const orientation = bindings.orientation === "horizontal" ? "horizontal" : "vertical";
    ops.setAttr(".xtyle-splitter", "class", splitterClass(bindings));
    ops.setAttr(".xtyle-splitter", "aria-orientation", orientation);
    ops.setAttr(".xtyle-splitter", "aria-valuenow", String(bindings.value ?? 0));
    ops.setAttr(".xtyle-splitter", "aria-valuemin", String(bindings.min ?? 0));
    ops.setAttr(".xtyle-splitter", "aria-valuemax", String(bindings.max ?? 0));
  });
  xript.exports.register("keydown", (payload, context) => {
    const e = payload;
    const ctx = context;
    if (e.disabled || e.ariaDisabled === "true") return {};
    const sign = ctx.reversed ? -1 : 1;
    const grow = ctx.axisIsX ? "ArrowRight" : "ArrowDown";
    const shrink = ctx.axisIsX ? "ArrowLeft" : "ArrowUp";
    switch (e.key) {
      case grow:
        return { nudge: sign, preventDefault: true };
      case shrink:
        return { nudge: -sign, preventDefault: true };
      case "PageUp":
        return { nudge: sign, forceAlt: true, preventDefault: true };
      case "PageDown":
        return { nudge: -sign, forceAlt: true, preventDefault: true };
      case "Home":
        return { jump: "min", preventDefault: true };
      case "End":
        return { jump: "max", preventDefault: true };
      default:
        return {};
    }
  });
  xript.exports.register("reset", (payload) => {
    const e = payload;
    if (e.disabled || e.ariaDisabled === "true") return {};
    return { reset: true };
  });
})();
