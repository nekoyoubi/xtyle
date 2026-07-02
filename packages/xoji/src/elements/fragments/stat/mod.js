"use strict";
(() => {
  // packages/xoji/src/elements/fragments/stat/mod.ts
  var SENTIMENT_FOR_TREND = { up: "positive", down: "negative", flat: "neutral" };
  var TREND_ICON = {
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 5l7 12H5z" /></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 19L5 7h14z" /></svg>',
    flat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" d="M5 12h14" /></svg>'
  };
  function statClass(b) {
    const size = b.size ?? "md";
    return [
      "xoji-stat",
      size !== "md" && `xoji-stat--${size}`,
      b.align === "center" && "xoji-stat--center",
      b.inline && "xoji-stat--inline"
    ].filter(Boolean).join(" ");
  }
  function statHtml(b) {
    const trend = b.trend ?? "flat";
    const sentiment = b.sentiment ?? SENTIMENT_FOR_TREND[trend] ?? "neutral";
    const label = b.label ? `<span part="label" class="xoji-stat__label">${b.label}</span>` : "";
    const delta = b.delta ? `<span part="delta" class="xoji-stat__delta xoji-stat__delta--${sentiment}">${TREND_ICON[trend] ?? TREND_ICON.flat}<span>${b.delta}</span></span>` : "";
    const caption = b.caption ? `<span part="caption" class="xoji-stat__caption">${b.caption}</span>` : "";
    return `<div part="stat" class="${statClass(b)}"><span part="value" class="xoji-stat__value"><slot></slot></span>${label}${delta}${caption}</div>`;
  }
  hooks.fragment.mount("stat", (bindings, ops) => {
    ops.replaceChildren("[data-stat]", statHtml(bindings));
  });
  hooks.fragment.update("stat", (bindings, ops) => {
    ops.setAttr('[part="stat"]', "class", statClass(bindings));
  });
})();
