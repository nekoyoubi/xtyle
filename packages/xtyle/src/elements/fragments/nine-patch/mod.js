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

  // packages/xtyle/src/elements/fragments/nine-patch/mod.ts
  function slicedFrame(b) {
    const cls = ["xtyle-nine-patch__frame", b.tinted ? "xtyle-nine-patch__frame--tinted" : ""].filter(Boolean).join(" ");
    const style = b.frameStyle ? ` style="${escapeAttr(b.frameStyle)}"` : "";
    return `<span class="${cls}" part="frame" aria-hidden="true"${style}></span>`;
  }
  function regionGrid(cells, extraClass, tracks) {
    const style = tracks ? ` style="${escapeAttr(tracks)}"` : "";
    const html = cells.map((cell) => {
      const cls2 = `xtyle-nine-patch__piece xtyle-nine-patch__piece--${cell.region}`;
      const own = cell.style ? ` style="${escapeAttr(cell.style)}"` : "";
      return `<span class="${cls2}" part="piece ${escapeAttr(cell.region)}" data-region="${escapeAttr(cell.region)}"${own}></span>`;
    }).join("");
    const cls = ["xtyle-nine-patch__pieces", extraClass].filter(Boolean).join(" ");
    return `<span class="${cls}" part="frame" aria-hidden="true"${style}>${html}</span>`;
  }
  function piecedFrame(b) {
    return regionGrid(b.pieces ?? [], "", b.tracks);
  }
  function tintedFrame(b) {
    return regionGrid(b.regions ?? [], "xtyle-nine-patch__frame--tinted", b.tracks);
  }
  function inner(b) {
    const base = b.regions?.length ? tintedFrame(b) : b.frameStyle ? slicedFrame(b) : "";
    const overrides = b.pieces && b.pieces.some((piece) => piece.style) ? piecedFrame(b) : "";
    return `${base}${overrides}<div class="xtyle-nine-patch__content" part="content"><slot></slot></div>`;
  }
  hooks.fragment.mount("nine-patch", (bindings, ops) => {
    ops.replaceChildren("[data-nine-patch]", inner(bindings));
  });
  hooks.fragment.update("nine-patch", (bindings, ops) => {
    ops.replaceChildren("[data-nine-patch]", inner(bindings));
  });
})();
