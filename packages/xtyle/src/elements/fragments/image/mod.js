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
  function mediaHtml(b) {
    const src = esc(b.src ?? "");
    if (!src) return "";
    const alt = esc(b.alt ?? "");
    const loading = b.loading === "eager" ? "eager" : "lazy";
    return `<img class="xtyle-image__img" part="image" src="${src}" alt="${alt}" loading="${loading}" decoding="async" />`;
  }
  function captionHtml(b) {
    return b.caption ? `<figcaption class="xtyle-image__caption" part="caption">${esc(b.caption)}</figcaption>` : "";
  }
  function imageHtml(b) {
    const ratioStyle = b.ratio ? ` style="aspect-ratio: ${esc(b.ratio)}"` : "";
    const placeholder = `<span class="xtyle-image__placeholder" part="placeholder" aria-hidden="true"></span>`;
    const media = `<span class="xtyle-image__media" data-image-media>${mediaHtml(b)}</span>`;
    const hover = `<span class="xtyle-image__hover" part="hover" aria-hidden="true" data-slot="hover"><slot name="hover"></slot></span>`;
    const frame = `<span class="xtyle-image__frame" part="frame"${ratioStyle}>${placeholder}${media}${hover}</span>`;
    return `<figure class="${imageClass(b)}" part="figure">${frame}${captionHtml(b)}</figure>`;
  }
  function mount(bindings, ops) {
    ops.replaceChildren("[data-image]", imageHtml(bindings));
  }
  function patch(bindings, ops) {
    ops.setAttr('[part="figure"]', "class", imageClass(bindings));
    ops.setAttr('[part="frame"]', "style", bindings.ratio ? `aspect-ratio: ${esc(bindings.ratio)}` : "");
    ops.replaceChildren("[data-image-media]", mediaHtml(bindings));
  }
  hooks.fragment.mount("image", mount);
  hooks.fragment.update("image", patch);
})();
