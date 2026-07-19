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

  // packages/xtyle/src/elements/fragments/button/mod.ts
  function buttonClass(b) {
    const variant = b.variant ?? "solid";
    const tone = b.tone ?? "accent";
    const size = b.size ?? "md";
    const align = b.align ?? "center";
    return [
      "xtyle-button",
      `xtyle-button--${variant}`,
      `xtyle-button--${tone}`,
      size !== "md" && `xtyle-button--${size}`,
      align !== "center" && `xtyle-button--align-${align}`,
      b.block && "xtyle-button--block",
      b.iconOnly && "xtyle-button--icon",
      b.loading && "xtyle-button--loading"
    ].filter(Boolean).join(" ");
  }
  function inner(b) {
    const spinner = b.loading ? '<span class="xtyle-button__spinner" part="spinner" aria-hidden="true"></span>' : "";
    return '<span class="xtyle-button__icon" part="icon-start"><slot name="icon-start"></slot></span><span class="xtyle-button__label" part="label"><slot></slot></span><span class="xtyle-button__icon" part="icon-end"><slot name="icon-end"></slot></span>' + spinner;
  }
  function buttonHtml(b) {
    const blocked = (b.disabled ?? false) || (b.loading ?? false);
    const pressed = b.pressed ?? null;
    const ariaPressed = pressed === null ? "" : ` aria-pressed="${String(pressed)}"`;
    const selected = b.selected ?? null;
    const ariaCurrent = selected ? ' aria-current="true"' : "";
    const name = b.ariaLabelledby ? ` aria-labelledby="${escapeAttr(b.ariaLabelledby)}"` : b.ariaLabel ? ` aria-label="${escapeAttr(b.ariaLabel)}"` : "";
    const body = inner(b);
    if (b.href != null) {
      const hrefAttr = blocked ? "" : ` href="${escapeAttr(b.href)}"`;
      const ariaDisabled = blocked ? ' aria-disabled="true"' : "";
      const ariaBusy2 = b.loading ? ' aria-busy="true"' : "";
      return `<a part="button" class="${buttonClass(b)}"${hrefAttr}${ariaDisabled}${ariaBusy2}${ariaPressed}${ariaCurrent}${name} role="button">${body}</a>`;
    }
    const disabledAttr = blocked ? " disabled" : "";
    const ariaBusy = b.loading ? ' aria-busy="true"' : "";
    const type = b.type ?? "button";
    return `<button part="button" class="${buttonClass(b)}" type="${escapeAttr(type)}"${disabledAttr}${ariaBusy}${ariaPressed}${ariaCurrent}${name}>${body}</button>`;
  }
  hooks.fragment.mount("button", (bindings, ops) => {
    ops.replaceChildren("[data-button]", buttonHtml(bindings));
  });
  hooks.fragment.update("button", (bindings, ops) => {
    ops.setAttr(".xtyle-button", "class", buttonClass(bindings));
    if (bindings.pressed != null) ops.setAttr('[part="button"]', "aria-pressed", String(bindings.pressed));
    if (bindings.selected != null) ops.setAttr('[part="button"]', "aria-current", bindings.selected ? "true" : "false");
  });
})();
