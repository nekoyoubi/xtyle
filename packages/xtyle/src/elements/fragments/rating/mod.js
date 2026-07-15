"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/rating/mod.ts
  function units(b) {
    const max = b.max ?? 5;
    return max > 0 ? max : 0;
  }
  function fillWidth(b) {
    const max = units(b);
    const value = Math.min(Math.max(b.value ?? 0, 0), max);
    return `width: ${max > 0 ? value / max * 100 : 0}%`;
  }
  function repeat(glyph, count) {
    let out = "";
    for (let i = 0; i < count; i++) out += glyph;
    return out;
  }
  function rowsHtml(b) {
    const count = units(b);
    return `<span class="xtyle-rating__row xtyle-rating__row--empty" part="track" aria-hidden="true">` + repeat(b.emptyIcon ?? "", count) + `</span><span class="xtyle-rating__row xtyle-rating__row--filled" part="fill" aria-hidden="true" style="${fillWidth(b)}">` + repeat(b.filledIcon ?? "", count) + `</span>`;
  }
  hooks.fragment.mount("rating", (bindings, ops) => {
    ops.replaceChildren("[data-rating]", rowsHtml(bindings));
  });
  hooks.fragment.update("rating", (bindings, ops) => {
    ops.setAttr('[part="fill"]', "style", fillWidth(bindings));
  });
})();
