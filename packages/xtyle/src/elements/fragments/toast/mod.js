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

  // packages/xtyle/src/elements/fragments/toast/mod.ts
  var TONE_ICONS = {
    success: '<path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.1 14.2-4.1-4.1 1.4-1.4 2.7 2.7 5.6-5.6 1.4 1.4-7 7Z"/>',
    warn: '<path fill="currentColor" d="M12 2 1 21h22L12 2Zm0 5 .5 8h-1L11 7h2Zm-1 10h2v2h-2v-2Z"/>',
    danger: '<path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1 4h2v8h-2V6Zm0 10h2v2h-2v-2Z"/>',
    info: '<path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1 5h2v2h-2V7Zm0 4h2v6h-2v-6Z"/>'
  };
  var ASSERTIVE = { danger: true, warn: true };
  function severityOf(b) {
    if (b.severity) return b.severity;
    if (b.tone) return TONE_ICONS[b.tone] ? b.tone : "";
    return "info";
  }
  function toastClass(b) {
    const variant = b.variant ?? "soft";
    const color = b.tone ?? severityOf(b) ?? "info";
    const noIcon = severityOf(b) ? "" : " xtyle-toast--noicon";
    return `xtyle-toast xtyle-toast--${variant} xtyle-toast--${color || "info"}${noIcon}`;
  }
  function iconSvg(b) {
    const path = TONE_ICONS[severityOf(b)];
    return path ? `<svg viewBox="0 0 24 24" width="1em" height="1em">${path}</svg>` : "";
  }
  function role(b) {
    return ASSERTIVE[severityOf(b)] ? "alert" : "status";
  }
  function live(b) {
    return ASSERTIVE[severityOf(b)] ? "assertive" : "polite";
  }
  function actionButton(b) {
    const label = b.actionLabel ?? null;
    if (!label) return "";
    return `<button class="xtyle-toast__action" part="action" type="button">${escapeHtml(label)}</button>`;
  }
  function closeButton(b) {
    if (!(b.closable ?? true)) return "";
    const label = b.closeLabel ?? "Dismiss";
    return `<button class="xtyle-toast__close" part="close" type="button" aria-label="${escapeAttr(label)}"><svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true"><path fill="currentColor" d="m12 10.6 5-5 1.4 1.4-5 5 5 5L17 18.4l-5-5-5 5L5.6 17l5-5-5-5L7 5.6l5 5Z"/></svg></button>`;
  }
  hooks.fragment.mount("toast", (bindings, ops) => {
    ops.setAttr(".xtyle-toast", "class", toastClass(bindings));
    ops.setAttr("[data-root]", "role", role(bindings));
    ops.setAttr("[data-root]", "aria-live", live(bindings));
    ops.replaceChildren("[data-glyph]", iconSvg(bindings));
    ops.replaceChildren("[data-action]", actionButton(bindings));
    ops.replaceChildren("[data-close]", closeButton(bindings));
  });
  hooks.fragment.update("toast", (bindings, ops) => {
    ops.setAttr(".xtyle-toast", "class", toastClass(bindings));
    ops.setAttr("[data-root]", "role", role(bindings));
    ops.setAttr("[data-root]", "aria-live", live(bindings));
    ops.replaceChildren("[data-glyph]", iconSvg(bindings));
  });
  xript.exports.register("dismiss", () => {
    return { dismiss: true };
  });
  xript.exports.register("action", () => {
    return { emit: { type: "action" } };
  });
})();
