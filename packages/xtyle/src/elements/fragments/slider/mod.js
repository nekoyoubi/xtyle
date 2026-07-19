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

  // packages/xtyle/src/elements/fragments/slider/mod.ts
  function sliderClass(b) {
    const size = b.size ?? "md";
    const tone = b.tone ?? "accent";
    return [
      "xtyle-slider",
      `xtyle-slider--${tone}`,
      size !== "md" && `xtyle-slider--${size}`,
      b.disabled && "xtyle-slider--disabled",
      b.showValue && b.editableValue && "xtyle-slider--value-editable"
    ].filter(Boolean).join(" ");
  }
  function trueValue(b) {
    const value = b.value ?? (b.min ?? 0);
    return Number.isNaN(value) ? b.min ?? 0 : value;
  }
  function railValue(b) {
    const min = b.min ?? 0;
    const max = b.max ?? 100;
    return Math.min(max, Math.max(min, trueValue(b)));
  }
  function fraction(value, min, max) {
    return max === min ? 0 : (value - min) / (max - min);
  }
  function readout(b, value) {
    return b.valueText ?? String(value);
  }
  function editorHtml(value) {
    return `<input class="xtyle-slider__value-input" part="value-input" type="text" inputmode="decimal" value="${value}" aria-label="Edit value">`;
  }
  function inner(b) {
    const railMin = b.min ?? 0;
    const railMax = b.max ?? 100;
    const value = trueValue(b);
    const rail = railValue(b);
    const ariaMin = Math.min(railMin, value);
    const ariaMax = Math.max(railMax, value);
    const uid = b.elementId ?? "xtyle-slider";
    const labelId = `${uid}-label`;
    const pct = `${(fraction(rail, railMin, railMax) * 100).toFixed(3)}%`;
    const nameAttr = b.labelledby ? ` aria-labelledby="${escapeAttr(b.labelledby)}"` : b.label ? ` aria-labelledby="${labelId}"` : "";
    const disabledAttr = b.disabled ? ' aria-disabled="true"' : "";
    const tabindex = b.disabled ? "-1" : "0";
    const valueText = readout(b, value);
    const valueTextAttr = valueText !== String(value) ? ` aria-valuetext="${escapeAttr(valueText)}"` : "";
    const labelClass = b.hideLabel ? "xtyle-slider__label xtyle-slider__label--hidden" : "xtyle-slider__label";
    const label = b.label ? `<span class="${labelClass}" part="label" id="${labelId}">${escapeAttr(b.label)}</span>` : "";
    const readoutMarkup = `<span class="xtyle-slider__value-text" part="value-text" data-value-text>${escapeAttr(valueText)}</span>`;
    const valueMarkup = b.showValue ? b.editing ? `<span class="xtyle-slider__value" part="value">${editorHtml(value)}</span>` : `<span class="xtyle-slider__value" part="value" aria-hidden="true">${readoutMarkup}</span>` : "";
    const headerLabel = b.hideLabel ? "" : label;
    const header = valueMarkup ? `<span class="xtyle-slider__header" part="header">${headerLabel}${valueMarkup}</span>${b.hideLabel ? label : ""}` : label;
    return `${header}<span class="xtyle-slider__rail" part="rail"><span class="xtyle-slider__groove" part="groove"></span><span class="xtyle-slider__fill" part="fill" style="width: ${pct}"></span><span class="xtyle-slider__thumb" part="thumb" role="slider" tabindex="${tabindex}" aria-valuemin="${ariaMin}" aria-valuemax="${ariaMax}" aria-valuenow="${value}"${valueTextAttr} aria-orientation="horizontal"${nameAttr}${disabledAttr} style="inset-inline-start: ${pct}"></span></span>`;
  }
  hooks.fragment.mount("slider", (bindings, ops) => {
    ops.setAttr(".xtyle-slider", "class", sliderClass(bindings));
    ops.replaceChildren("[data-slider]", inner(bindings));
  });
  hooks.fragment.update("slider", (bindings, ops) => {
    const railMin = bindings.min ?? 0;
    const railMax = bindings.max ?? 100;
    const value = trueValue(bindings);
    const rail = railValue(bindings);
    const pct = `${(fraction(rail, railMin, railMax) * 100).toFixed(3)}%`;
    ops.setAttr(".xtyle-slider", "class", sliderClass(bindings));
    ops.setAttr(".xtyle-slider__thumb", "aria-valuemin", String(Math.min(railMin, value)));
    ops.setAttr(".xtyle-slider__thumb", "aria-valuemax", String(Math.max(railMax, value)));
    ops.setAttr(".xtyle-slider__thumb", "aria-valuenow", String(value));
    const valueText = readout(bindings, value);
    ops.setAttr(".xtyle-slider__thumb", "aria-valuetext", valueText !== String(value) ? valueText : "");
    ops.setAttr(".xtyle-slider__thumb", "tabindex", bindings.disabled ? "-1" : "0");
    ops.setAttr(".xtyle-slider__thumb", "style", `inset-inline-start: ${pct}`);
    ops.setAttr(".xtyle-slider__fill", "style", `width: ${pct}`);
    if (bindings.showValue && !bindings.editing) ops.setText("[data-value-text]", readout(bindings, value));
  });
  xript.exports.register("keyAdjust", (payload, context) => {
    const e = payload;
    if (e.disabled || e.ariaDisabled === "true") return {};
    const ctx = context;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        return { nudge: 1, preventDefault: true };
      case "ArrowLeft":
      case "ArrowDown":
        return { nudge: -1, preventDefault: true };
      case "PageUp":
        return { nudge: 1, forceAlt: true, preventDefault: true };
      case "PageDown":
        return { nudge: -1, forceAlt: true, preventDefault: true };
      case "Home":
        return { setValue: ctx.min, commit: "change", preventDefault: true };
      case "End":
        return { setValue: ctx.max, commit: "change", preventDefault: true };
    }
    return {};
  });
})();
