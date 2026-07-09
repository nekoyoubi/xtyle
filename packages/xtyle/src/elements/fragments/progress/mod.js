"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/progress/mod.ts
  var RADIUS = 16;
  var CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  function progressClass(b) {
    const variant = b.variant ?? "linear";
    const tone = b.tone ?? "accent";
    const size = b.size ?? "md";
    const pulse = b.pulse === "fast" || b.pulse === "slow" ? b.pulse : null;
    return [
      "xtyle-progress",
      `xtyle-progress--${variant}`,
      `xtyle-progress--${tone}`,
      size !== "md" && `xtyle-progress--${size}`,
      b.indeterminate && "xtyle-progress--indeterminate",
      b.colorizeValue && "xtyle-progress--colorize-value",
      b.valuePosition === "inset" && "xtyle-progress--value-inset",
      pulse && `xtyle-progress--pulse-${pulse}`
    ].filter(Boolean).join(" ");
  }
  function fraction(b) {
    const min = b.min ?? 0;
    const max = b.max ?? 100;
    const value = b.value ?? 0;
    const span = max - min;
    if (!Number.isFinite(span) || span <= 0) return 0;
    const clamped = Math.min(Math.max(value, min), max);
    return (clamped - min) / span;
  }
  function ariaAttrs(b) {
    const min = ` aria-valuemin="${b.min ?? 0}"`;
    const max = ` aria-valuemax="${b.max ?? 100}"`;
    const now = b.indeterminate ? "" : ` aria-valuenow="${b.value ?? 0}"`;
    const label = b.ariaLabel ?? null;
    const labelledby = b.ariaLabelledby ?? null;
    const name = label !== null ? ` aria-label="${label}"` : labelledby !== null ? ` aria-labelledby="${labelledby}"` : "";
    return `${min}${max}${now}${name}`;
  }
  function valueText(b) {
    if (b.indeterminate) return "\u2026";
    const min = b.min ?? 0;
    const max = b.max ?? 100;
    const value = Math.min(Math.max(b.value ?? 0, min), max);
    const unit = b.unit ?? "";
    switch (b.valueFormat ?? "percent") {
      case "value":
        return `${value}${unit}`;
      case "value-max":
        return `${value}/${max}${unit}`;
      default:
        return `${Math.round(fraction(b) * 100)}%`;
    }
  }
  function valueReadout(b) {
    return `<span class="xtyle-progress__value" part="value"><slot name="value"><span data-progress-value>${valueText(b)}</span></slot></span>`;
  }
  function linearIndicatorStyle(b) {
    if (b.indeterminate) return "";
    const parts = [`width:${Math.round(fraction(b) * 100)}%`];
    if (b.ramp && b.rampMode === "gradient" && b.rampStops && b.rampStops.length) {
      const f = fraction(b);
      const size = f > 0 ? 100 / f : 100;
      parts.push(
        `background:linear-gradient(90deg, ${b.rampStops.join(", ")})`,
        `background-size:${size.toFixed(2)}% 100%`,
        "background-repeat:no-repeat"
      );
    } else if (b.ramp && b.rampColor) {
      parts.push(`background:${b.rampColor}`);
    }
    return parts.join(";");
  }
  function circularIndicatorStyle(b) {
    const dasharray = CIRCUMFERENCE.toFixed(3);
    const offset = b.indeterminate ? (CIRCUMFERENCE * 0.7).toFixed(3) : (CIRCUMFERENCE * (1 - fraction(b))).toFixed(3);
    const parts = [`stroke-dasharray:${dasharray}`, `stroke-dashoffset:${offset}`];
    if (b.ramp && b.rampColor && !b.indeterminate) parts.push(`stroke:${b.rampColor}`);
    return parts.join(";");
  }
  function linearHtml(b) {
    const style = linearIndicatorStyle(b);
    const styleAttr = style ? ` style="${style}"` : "";
    const readout = b.showValue ? valueReadout(b) : "";
    return `<div part="progress" class="${progressClass(b)}" role="${b.role ?? "progressbar"}"${ariaAttrs(b)}><div class="xtyle-progress__track" part="track"><div class="xtyle-progress__indicator" part="indicator"${styleAttr}></div></div>${readout}</div>`;
  }
  function circularHtml(b) {
    const dashStyle = ` style="${circularIndicatorStyle(b)}"`;
    const readout = b.showValue && !b.indeterminate ? valueReadout(b) : "";
    const size = b.size ?? "md";
    const sw = size === "sm" ? 3 : size === "lg" ? 5 : 4;
    return `<div part="progress" class="${progressClass(b)}" role="${b.role ?? "progressbar"}"${ariaAttrs(b)}><svg class="xtyle-progress__svg" viewBox="0 0 40 40" aria-hidden="true"><circle class="xtyle-progress__track-ring" cx="20" cy="20" r="${RADIUS}" stroke-width="${sw}"></circle><circle class="xtyle-progress__indicator" part="indicator" cx="20" cy="20" r="${RADIUS}" stroke-width="${sw}"${dashStyle}></circle></svg>${readout}</div>`;
  }
  function progressHtml(b) {
    return (b.variant ?? "linear") === "circular" ? circularHtml(b) : linearHtml(b);
  }
  hooks.fragment.mount("progress", (bindings, ops) => {
    ops.replaceChildren("[data-progress]", progressHtml(bindings));
  });
  hooks.fragment.update("progress", (bindings, ops) => {
    ops.setAttr('[part="progress"]', "class", progressClass(bindings));
    ops.setAttr('[part="progress"]', "role", bindings.role ?? "progressbar");
    ops.setAttr('[part="progress"]', "aria-valuemin", String(bindings.min ?? 0));
    ops.setAttr('[part="progress"]', "aria-valuemax", String(bindings.max ?? 100));
    if (!bindings.indeterminate) ops.setAttr('[part="progress"]', "aria-valuenow", String(bindings.value ?? 0));
    if ((bindings.variant ?? "linear") === "circular") {
      ops.setAttr('[part="indicator"]', "style", circularIndicatorStyle(bindings));
    } else if (!bindings.indeterminate) {
      ops.setAttr('[part="indicator"]', "style", linearIndicatorStyle(bindings));
    }
    if (bindings.showValue) ops.setText("[data-progress-value]", valueText(bindings));
  });
})();
