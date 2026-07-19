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

  // packages/xtyle/src/elements/fragments/swatch/mod.ts
  function swatchClass(b) {
    const size = b.size ?? "md";
    return [
      "xtyle-swatch",
      size !== "md" && `xtyle-swatch--${size}`,
      b.interactive && "xtyle-swatch--interactive",
      b.selected && "xtyle-swatch--selected"
    ].filter(Boolean).join(" ");
  }
  function detailsMarkup(b) {
    if (!b.showsDetails) return "";
    const rows = (b.detailRows ?? []).map(
      (row) => `<span class="xtyle-swatch__detail-model" part="detail-model">${escapeAttr(row.model)}</span><span class="xtyle-swatch__detail-value" part="detail-value">${escapeAttr(row.value)}</span>`
    ).join("");
    const id = b.detailsId ?? "xtyle-swatch-details";
    return `<span class="xtyle-swatch__details" part="details" id="${escapeAttr(id)}" role="tooltip" popover="manual">${rows}</span>`;
  }
  function bodyMarkup(b) {
    const color = escapeAttr(b.color ?? "transparent");
    const dot = `<span class="xtyle-swatch__dot" part="dot" style="background:${color}" aria-hidden="true"></span>`;
    const label = b.label ? `<span class="xtyle-swatch__label" part="label">${escapeAttr(b.label)}</span>` : "";
    const value = b.value ? `<span class="xtyle-swatch__value" part="value">${escapeAttr(b.value)}</span>` : "";
    return `${dot}${label}${value}${detailsMarkup(b)}`;
  }
  function describedBy(b) {
    return b.showsDetails ? ` aria-describedby="${escapeAttr(b.detailsId ?? "xtyle-swatch-details")}"` : "";
  }
  function accessibleName(b) {
    return b.label ?? b.value ?? b.color;
  }
  function inner(b) {
    const body = bodyMarkup(b);
    if (!b.interactive) {
      const focusable = b.showsDetails ? ` tabindex="0"` : "";
      return `<span part="swatch" class="${swatchClass(b)}"${focusable}${describedBy(b)}>${body}</span>`;
    }
    const ariaPressed = ` aria-pressed="${String(!!b.selected)}"`;
    const name = accessibleName(b);
    const ariaLabel = !b.label && name ? ` aria-label="${escapeAttr(name)}"` : "";
    return `<button part="swatch" type="button" class="${swatchClass(b)}"${ariaPressed}${ariaLabel}${describedBy(b)}>${body}</button>`;
  }
  hooks.fragment.mount("swatch", (bindings, ops) => {
    ops.replaceChildren("[data-swatch]", inner(bindings));
  });
  hooks.fragment.update("swatch", (bindings, ops) => {
    ops.setAttr(".xtyle-swatch", "class", swatchClass(bindings));
    if (bindings.interactive) ops.setAttr('[part="swatch"]', "aria-pressed", String(!!bindings.selected));
    ops.setAttr('[part="dot"]', "style", `background:${bindings.color ?? "transparent"}`);
    if (bindings.label) ops.setText('[part="label"]', bindings.label);
    if (bindings.value) ops.setText('[part="value"]', bindings.value);
    if (bindings.interactive && !bindings.label) {
      const name = accessibleName(bindings);
      if (name) ops.setAttr('[part="swatch"]', "aria-label", name);
    }
  });
  xript.exports.register("select", (payload, context) => {
    const e = payload;
    if (e.disabled || e.ariaDisabled === "true") return {};
    const ctx = context ?? {};
    return {
      emit: {
        type: "select",
        detail: { color: ctx.color ?? null, label: ctx.label ?? null, value: ctx.value ?? null }
      }
    };
  });
})();
