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

  // packages/xtyle/src/elements/fragments/stat/mod.ts
  var SENTIMENT_FOR_TREND = { up: "positive", down: "negative", flat: "neutral" };
  var TREND_ICON = {
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 5l7 12H5z" /></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 19L5 7h14z" /></svg>',
    flat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" d="M5 12h14" /></svg>'
  };
  function statClass(b) {
    const size = b.size ?? "md";
    return [
      "xtyle-stat",
      size !== "md" && `xtyle-stat--${size}`,
      b.align === "center" && "xtyle-stat--center",
      b.inline && "xtyle-stat--inline"
    ].filter(Boolean).join(" ");
  }
  function statHtml(b) {
    const trend = b.trend ?? "flat";
    const sentiment = b.sentiment ?? SENTIMENT_FOR_TREND[trend] ?? "neutral";
    const label = b.label ? `<span part="label" class="xtyle-stat__label">${escapeHtml(b.label)}</span>` : "";
    const delta = b.delta ? `<span part="delta" class="xtyle-stat__delta xtyle-stat__delta--${escapeAttr(sentiment)}">${TREND_ICON[trend] ?? TREND_ICON.flat}<span>${escapeHtml(b.delta)}</span></span>` : "";
    const caption = b.caption ? `<span part="caption" class="xtyle-stat__caption">${escapeHtml(b.caption)}</span>` : "";
    return `<div part="stat" class="${statClass(b)}"><span part="value" class="xtyle-stat__value"><slot></slot></span>${label}${delta}${caption}</div>`;
  }
  hooks.fragment.mount("stat", (bindings, ops) => {
    ops.replaceChildren("[data-stat]", statHtml(bindings));
  });
  hooks.fragment.update("stat", (bindings, ops) => {
    ops.setAttr(".xtyle-stat", "class", statClass(bindings));
  });
})();
