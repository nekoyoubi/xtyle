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

  // packages/xtyle/src/elements/fragments/progress/mod.ts
  var RADIUS = 16;
  var CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  function thicknessValue(b) {
    const t = b.thickness?.trim();
    return t && /^[0-9]*\.?[0-9]+(?:[a-z]+|%)?$/i.test(t) ? t : null;
  }
  function fixedStroke(b) {
    const t = thicknessValue(b);
    return !!t && !/^[0-9]*\.?[0-9]+$/.test(t);
  }
  function isVertical(b) {
    return b.orient === "vertical" && (b.variant ?? "linear") !== "circular";
  }
  function hasLabel(b) {
    return !!b.label || b.hasLabel === true;
  }
  function hasReading(b) {
    return !!b.reading || b.hasReading === true;
  }
  function hasNote(b) {
    return !!b.note || b.hasNote === true;
  }
  function hasCaption(b) {
    return hasLabel(b) || hasReading(b);
  }
  function progressClass(b) {
    const variant = b.variant ?? "linear";
    const tone = b.tone ?? "accent";
    const size = b.size ?? "md";
    const pulse = b.pulse === "fast" || b.pulse === "slow" ? b.pulse : null;
    const track = b.track ?? null;
    return [
      "xtyle-progress",
      `xtyle-progress--${variant}`,
      `xtyle-progress--${tone}`,
      size !== "md" && `xtyle-progress--${size}`,
      isVertical(b) && "xtyle-progress--vertical",
      b.indeterminate && "xtyle-progress--indeterminate",
      b.colorizeValue && "xtyle-progress--colorize-value",
      b.valuePosition === "inset" && "xtyle-progress--value-inset",
      pulse && `xtyle-progress--pulse-${pulse}`,
      track === "none" && "xtyle-progress--no-track",
      track && track !== "none" && `xtyle-progress--track-${track}`,
      fixedStroke(b) && "xtyle-progress--fixed-stroke"
    ].filter(Boolean).join(" ");
  }
  function rootStyle(b) {
    const t = thicknessValue(b);
    return t ? `--xtyle-progress-stroke:${t}` : "";
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
    const name = label !== null ? ` aria-label="${escapeAttr(label)}"` : labelledby !== null ? ` aria-labelledby="${escapeAttr(labelledby)}"` : "";
    const orientation = isVertical(b) ? ` aria-orientation="vertical"` : "";
    return `${min}${max}${now}${name}${orientation}`;
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
    const vertical = isVertical(b);
    const pct = Math.round(fraction(b) * 100);
    const parts = [vertical ? `height:${pct}%` : `width:${pct}%`];
    if (b.ramp && b.rampMode === "gradient" && b.rampStops && b.rampStops.length) {
      const f = fraction(b);
      const size = f > 0 ? 100 / f : 100;
      parts.push(
        `background:linear-gradient(${vertical ? "0deg" : "90deg"}, ${b.rampStops.join(", ")})`,
        vertical ? `background-size:100% ${size.toFixed(2)}%` : `background-size:${size.toFixed(2)}% 100%`,
        "background-repeat:no-repeat",
        ...vertical ? ["background-position:bottom"] : []
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
  function rootAttrs(b) {
    const style = rootStyle(b);
    return `part="progress" class="${progressClass(b)}"${style ? ` style="${style}"` : ""}`;
  }
  function barAttrs(b) {
    return `part="bar" class="xtyle-progress__bar" role="${escapeAttr(b.role ?? "progressbar")}"${ariaAttrs(b)}`;
  }
  function captionHtml(b) {
    if (!hasCaption(b)) return "";
    const labelMarkup = hasLabel(b) ? `<span class="xtyle-progress__label" part="label"><slot name="label"><span data-progress-label>${escapeHtml(b.label ?? "")}</span></slot></span>` : "";
    const readingMarkup = hasReading(b) ? `<span class="xtyle-progress__reading" part="reading"><slot name="reading"><span data-progress-reading>${escapeHtml(b.reading ?? "")}</span></slot></span>` : "";
    return `<div class="xtyle-progress__caption" part="caption">${labelMarkup}${readingMarkup}</div>`;
  }
  function noteHtml(b) {
    if (!hasNote(b)) return "";
    return `<div class="xtyle-progress__note" part="note"><slot name="note"><span data-progress-note>${escapeHtml(b.note ?? "")}</span></slot></div>`;
  }
  function linearBar(b) {
    const style = linearIndicatorStyle(b);
    const styleAttr = style ? ` style="${style}"` : "";
    const readout = b.showValue ? valueReadout(b) : "";
    return `<div ${barAttrs(b)}><div class="xtyle-progress__track" part="track"><div class="xtyle-progress__indicator" part="indicator"${styleAttr}></div></div>${readout}</div>`;
  }
  function circularBar(b) {
    const dashStyle = ` style="${circularIndicatorStyle(b)}"`;
    const readout = b.showValue && !b.indeterminate ? valueReadout(b) : "";
    const size = b.size ?? "md";
    const sw = size === "sm" ? 3 : size === "lg" ? 5 : 4;
    return `<div ${barAttrs(b)}><svg class="xtyle-progress__svg" viewBox="0 0 40 40" aria-hidden="true"><circle class="xtyle-progress__track-ring" part="track" cx="20" cy="20" r="${RADIUS}" stroke-width="${sw}"></circle><circle class="xtyle-progress__indicator" part="indicator" cx="20" cy="20" r="${RADIUS}" stroke-width="${sw}"${dashStyle}></circle></svg>${readout}</div>`;
  }
  function progressHtml(b) {
    const bar = (b.variant ?? "linear") === "circular" ? circularBar(b) : linearBar(b);
    return `<div ${rootAttrs(b)}>${captionHtml(b)}${bar}${noteHtml(b)}</div>`;
  }
  hooks.fragment.mount("progress", (bindings, ops) => {
    ops.replaceChildren("[data-progress]", progressHtml(bindings));
  });
  hooks.fragment.update("progress", (bindings, ops) => {
    ops.setAttr(".xtyle-progress", "class", progressClass(bindings));
    ops.setAttr('[part="progress"]', "style", rootStyle(bindings));
    ops.setAttr('[part="bar"]', "role", bindings.role ?? "progressbar");
    ops.setAttr('[part="bar"]', "aria-valuemin", String(bindings.min ?? 0));
    ops.setAttr('[part="bar"]', "aria-valuemax", String(bindings.max ?? 100));
    if (!bindings.indeterminate) ops.setAttr('[part="bar"]', "aria-valuenow", String(bindings.value ?? 0));
    if ((bindings.variant ?? "linear") === "circular") {
      ops.setAttr('[part="indicator"]', "style", circularIndicatorStyle(bindings));
    } else if (!bindings.indeterminate) {
      ops.setAttr('[part="indicator"]', "style", linearIndicatorStyle(bindings));
    }
    if (bindings.showValue) ops.setText("[data-progress-value]", valueText(bindings));
    if (bindings.label != null) ops.setText("[data-progress-label]", bindings.label);
    if (bindings.reading != null) ops.setText("[data-progress-reading]", bindings.reading);
    if (bindings.note != null) ops.setText("[data-progress-note]", bindings.note);
  });
})();
