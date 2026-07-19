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

  // packages/xtyle/src/elements/fragments/switch/mod.ts
  function switchClass(b) {
    const size = b.size ?? "md";
    const tone = b.tone ?? "accent";
    return [
      "xtyle-switch",
      `xtyle-switch--${tone}`,
      size !== "md" && `xtyle-switch--${size}`,
      b.shape === "square" && "xtyle-switch--square",
      b.orientation === "vertical" && "xtyle-switch--vertical",
      b.reverse && "xtyle-switch--reverse",
      b.labelSide === "end" && "xtyle-switch--label-end",
      b.disabled && "xtyle-switch--disabled"
    ].filter(Boolean).join(" ");
  }
  function stateLabel(b) {
    const text = (b.checked ? b.onLabel : b.offLabel) ?? null;
    return text;
  }
  function inner(b) {
    const checked = b.checked ?? false;
    const disabled = b.disabled ?? false;
    const uid = b.elementId ?? "xtyle-switch";
    const labelId = `${uid}-label`;
    const stateId = `${uid}-state`;
    const stateText = stateLabel(b);
    const hasState = stateText !== null;
    let nameAttr = "";
    if (b.labelledby) nameAttr = ` aria-labelledby="${escapeAttr(b.labelledby)}"`;
    else if (b.label) nameAttr = ` aria-labelledby="${labelId}"`;
    else if (hasState) nameAttr = ` aria-labelledby="${stateId}"`;
    const disabledAttr = disabled ? ' disabled aria-disabled="true"' : "";
    const leadingLabel = b.label ? `<span class="xtyle-switch__label" part="label" id="${labelId}">${escapeHtml(b.label)}</span>` : "";
    const trailingState = hasState ? `<span class="xtyle-switch__state" part="state" id="${stateId}">${stateText}</span>` : "";
    return leadingLabel + `<button class="xtyle-switch__track" part="track" type="button" role="switch" aria-checked="${String(checked)}"${nameAttr}${disabledAttr}><span class="xtyle-switch__thumb" part="thumb" aria-hidden="true"></span></button>` + trailingState;
  }
  hooks.fragment.mount("switch", (bindings, ops) => {
    ops.setAttr(".xtyle-switch", "class", switchClass(bindings));
    ops.replaceChildren("[data-switch]", inner(bindings));
  });
  hooks.fragment.update("switch", (bindings, ops) => {
    ops.setAttr(".xtyle-switch", "class", switchClass(bindings));
    ops.setAttr('[role="switch"]', "aria-checked", String(bindings.checked ?? false));
    const text = stateLabel(bindings);
    if (text !== null) ops.setText('[part="state"]', text);
  });
  xript.exports.register("toggle", (payload) => {
    const e = payload;
    if (e.disabled || e.ariaDisabled === "true") return {};
    return { toggleChecked: true };
  });
  xript.exports.register("keyToggle", (payload) => {
    const e = payload;
    if (e.disabled || e.ariaDisabled === "true") return {};
    if (e.key === " " || e.key === "Spacebar" || e.key === "Enter") return { toggleChecked: true, preventDefault: true };
    return {};
  });
})();
