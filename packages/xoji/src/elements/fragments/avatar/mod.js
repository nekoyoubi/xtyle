"use strict";
(() => {
  // packages/xoji/src/elements/fragments/avatar/mod.ts
  function avatarPulseClass(pulse, hasStatus) {
    if (!hasStatus || pulse == null || pulse === false) return false;
    return pulse === "fast" ? "xoji-avatar--pulse-fast" : "xoji-avatar--pulse-slow";
  }
  function avatarClass(b) {
    const tone = b.tone ?? "neutral";
    const size = b.size ?? "md";
    const shape = b.shape ?? "circle";
    return [
      "xoji-avatar",
      `xoji-avatar--${tone}`,
      size !== "md" && `xoji-avatar--${size}`,
      shape === "square" && "xoji-avatar--square",
      b.status && `xoji-avatar--status-${b.status}`,
      avatarPulseClass(b.pulse, Boolean(b.status))
    ].filter(Boolean).join(" ");
  }
  function avatarLabel(b) {
    const alt = b.alt ?? "";
    const status = b.statusLabel ?? "";
    if (alt && status) return `${alt} \u2014 ${status}`;
    return alt || status;
  }
  function avatarInner(b) {
    const src = b.src ?? null;
    const alt = b.alt ?? "";
    const image = src !== null ? `<img class="xoji-avatar__image" part="image" src="${src}" alt="${alt}" onerror="this.remove()" />` : "";
    const fallback = `<span class="xoji-avatar__fallback" part="fallback"><span class="xoji-slot"><slot name="icon"></slot></span><span class="xoji-slot"><slot></slot></span></span>`;
    const statusDot = b.status ? `<span class="xoji-avatar__status-dot" part="status-dot" aria-hidden="true"></span>` : "";
    return `${image}${fallback}${statusDot}`;
  }
  function avatarHtml(b) {
    const label = avatarLabel(b);
    const naming = label ? ` role="img" aria-label="${label}"` : "";
    return `<span part="avatar" class="${avatarClass(b)}"${naming}>${avatarInner(b)}</span>`;
  }
  hooks.fragment.mount("avatar", (bindings, ops) => {
    ops.replaceChildren("[data-avatar]", avatarHtml(bindings));
  });
  hooks.fragment.update("avatar", (bindings, ops) => {
    ops.setAttr('[part="avatar"]', "class", avatarClass(bindings));
    ops.setAttr('[part="avatar"]', "aria-label", avatarLabel(bindings));
    if (bindings.src != null) {
      ops.setAttr(".xoji-avatar__image", "src", bindings.src);
      ops.setAttr(".xoji-avatar__image", "alt", bindings.alt ?? "");
    }
  });
})();
