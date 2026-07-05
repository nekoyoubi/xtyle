"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/avatar/mod.ts
  function avatarPulseClass(pulse, hasStatus) {
    if (!hasStatus || pulse == null || pulse === false) return false;
    return pulse === "fast" ? "xtyle-avatar--pulse-fast" : "xtyle-avatar--pulse-slow";
  }
  function avatarClass(b) {
    const tone = b.tone ?? "neutral";
    const size = b.size ?? "md";
    const shape = b.shape ?? "circle";
    return [
      "xtyle-avatar",
      `xtyle-avatar--${tone}`,
      size !== "md" && `xtyle-avatar--${size}`,
      shape === "square" && "xtyle-avatar--square",
      b.status && `xtyle-avatar--status-${b.status}`,
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
    const image = src !== null ? `<img class="xtyle-avatar__image" part="image" src="${src}" alt="${alt}" onerror="this.remove()" />` : "";
    const fallback = `<span class="xtyle-avatar__fallback" part="fallback"><span class="xtyle-slot"><slot name="icon"></slot></span><span class="xtyle-slot"><slot></slot></span></span>`;
    const statusDot = b.status ? `<span class="xtyle-avatar__status-dot" part="status-dot" aria-hidden="true"></span>` : "";
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
      ops.setAttr(".xtyle-avatar__image", "src", bindings.src);
      ops.setAttr(".xtyle-avatar__image", "alt", bindings.alt ?? "");
    }
  });
})();
