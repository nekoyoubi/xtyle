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

  // packages/xtyle/src/elements/fragments/number-input/mod.ts
  function numberClass(b) {
    const size = b.size ?? "md";
    return ["xtyle-number", size !== "md" && `xtyle-number--${size}`, b.disabled && "xtyle-number--disabled"].filter(Boolean).join(" ");
  }
  function inner(b) {
    const value = b.value ?? "";
    const labelText = b.label ?? null;
    const labelledby = b.labelledby ?? null;
    const uid = b.elementId ?? "xtyle-number";
    const labelId = `${uid}-label`;
    const placeholder = b.placeholder ?? null;
    const nameAttr = labelledby ? ` aria-labelledby="${escapeAttr(labelledby)}"` : labelText ? ` aria-labelledby="${labelId}"` : "";
    const disabledAttr = b.disabled ? " disabled" : "";
    const minAttr = b.min !== void 0 ? ` aria-valuemin="${b.min}"` : "";
    const maxAttr = b.max !== void 0 ? ` aria-valuemax="${b.max}"` : "";
    const placeholderAttr = placeholder ? ` placeholder="${escapeAttr(placeholder)}"` : "";
    const decDisabled = b.disabled || b.canDec === false ? " disabled" : "";
    const incDisabled = b.disabled || b.canInc === false ? " disabled" : "";
    const label = labelText ? `<span class="xtyle-number__label" part="label" id="${labelId}">${escapeHtml(labelText)}</span>` : "";
    return `${label}<div class="xtyle-number__control" part="control"><button class="xtyle-number__step xtyle-number__step--dec" part="step-down" type="button" tabindex="-1" aria-label="Decrease"${decDisabled}>&#8722;</button><input class="xtyle-number__input" part="input" type="text" inputmode="decimal" role="spinbutton" autocomplete="off" spellcheck="false" value="${escapeAttr(value)}"${placeholderAttr}${nameAttr}${minAttr}${maxAttr} aria-valuenow="${escapeAttr(value)}"${disabledAttr} /><button class="xtyle-number__step xtyle-number__step--inc" part="step-up" type="button" tabindex="-1" aria-label="Increase"${incDisabled}>&#43;</button></div>`;
  }
  hooks.fragment.mount("number-input", (bindings, ops) => {
    ops.setAttr(".xtyle-number", "class", numberClass(bindings));
    ops.replaceChildren("[data-number]", inner(bindings));
  });
  hooks.fragment.update("number-input", (bindings, ops) => {
    ops.setAttr(".xtyle-number", "class", numberClass(bindings));
    const value = bindings.value ?? "";
    ops.setAttr(".xtyle-number__input", "value", value);
    ops.setAttr(".xtyle-number__input", "aria-valuenow", value);
  });
  xript.exports.register("dec", (payload) => {
    const e = payload;
    if (e.disabled) return {};
    return { nudge: -1 };
  });
  xript.exports.register("inc", (payload) => {
    const e = payload;
    if (e.disabled) return {};
    return { nudge: 1 };
  });
  xript.exports.register("commit", (payload) => {
    const e = payload;
    if (e.disabled) return {};
    return { commit: e.value ?? "" };
  });
  xript.exports.register("keydown", (payload) => {
    const e = payload;
    if (e.disabled) return {};
    switch (e.key) {
      case "ArrowUp":
        return { nudge: 1, preventDefault: true };
      case "ArrowDown":
        return { nudge: -1, preventDefault: true };
      case "PageUp":
        return { nudge: 1, forceAlt: true, preventDefault: true };
      case "PageDown":
        return { nudge: -1, forceAlt: true, preventDefault: true };
      case "Enter":
        return { commit: e.value ?? "" };
      default:
        return {};
    }
  });
})();
