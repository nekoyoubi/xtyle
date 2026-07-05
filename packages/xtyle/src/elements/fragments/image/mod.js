"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/image/mod.ts
  function esc(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function imageClass(b) {
    const radius = b.radius ?? "md";
    return [
      "xtyle-image",
      b.fit === "contain" && "xtyle-image--contain",
      radius !== "md" && `xtyle-image--radius-${radius}`
    ].filter(Boolean).join(" ");
  }
  function imageHtml(b) {
    const src = esc(b.src ?? "");
    const alt = esc(b.alt ?? "");
    const ratioStyle = b.ratio ? ` style="aspect-ratio: ${esc(b.ratio)}"` : "";
    const loading = b.loading === "eager" ? "eager" : "lazy";
    const img = src ? `<img class="xtyle-image__img" part="image" src="${src}" alt="${alt}" loading="${loading}" decoding="async" />` : "";
    const placeholder = `<span class="xtyle-image__placeholder" part="placeholder" aria-hidden="true"></span>`;
    const frame = `<span class="xtyle-image__frame" part="frame"${ratioStyle}>${placeholder}${img}</span>`;
    const caption = b.caption ? `<figcaption class="xtyle-image__caption" part="caption">${esc(b.caption)}</figcaption>` : "";
    return `<figure class="${imageClass(b)}" part="figure">${frame}${caption}</figure>`;
  }
  function render(bindings, ops) {
    ops.replaceChildren("[data-image]", imageHtml(bindings));
  }
  hooks.fragment.mount("image", render);
  hooks.fragment.update("image", render);
})();
