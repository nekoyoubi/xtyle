"use strict";
(() => {
  // packages/xtyle/src/markup/dot.ts
  function dotClass(props) {
    const size = props.size ?? "md";
    return [
      "xtyle-dot",
      size !== "md" && `xtyle-dot--${size}`,
      !props.color && props.tone && `xtyle-dot--${props.tone}`,
      props.pulse && `xtyle-dot--pulse-${props.pulse}`,
      props.ping && "xtyle-dot--ping",
      props.glow && "xtyle-dot--glow"
    ].filter(Boolean).join(" ");
  }

  // packages/xtyle/src/elements/fragments/avatar/mod.ts
  function escapeHtml(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function escapeAttr(value) {
    return escapeHtml(value).replace(/"/g, "&quot;");
  }
  function avatarInitials(userName) {
    const words = (userName ?? "").trim().split(/\s+/).filter(Boolean);
    if (!words.length) return "";
    const firstOf = (word) => [...word][0] ?? "";
    const lead = firstOf(words[0]);
    const tail = words.length > 1 ? firstOf(words[words.length - 1]) : "";
    return (lead + tail).toUpperCase();
  }
  function avatarPulseClass(pulse, hasStatus) {
    if (!hasStatus || pulse == null || pulse === false) return false;
    return pulse === "fast" ? "xtyle-avatar--pulse-fast" : "xtyle-avatar--pulse-slow";
  }
  function avatarStatusDotClass(b) {
    const pulse = b.status ? b.pulse === "fast" ? "fast" : b.pulse ? "slow" : void 0 : void 0;
    return `${dotClass({ pulse })} xtyle-avatar__status-dot`;
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
    const name = b.alt || b.userName || "";
    const status = b.statusLabel ?? "";
    if (name && status) return `${name} \u2014 ${status}`;
    return name || status;
  }
  function avatarInner(b) {
    const src = b.src ?? null;
    const alt = b.alt ?? "";
    const image = src !== null ? `<img class="xtyle-avatar__image" part="image" src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" onerror="this.remove()" />` : "";
    const initials = escapeHtml(b.initials ?? avatarInitials(b.userName));
    const initialsSpan = initials ? `<span class="xtyle-avatar__initials" part="initials">${initials}</span>` : "";
    const fallback = `<span class="xtyle-avatar__fallback" part="fallback"><span class="xtyle-slot"><slot name="icon"></slot></span>${initialsSpan}<span class="xtyle-slot"><slot></slot></span></span>`;
    const statusDot = b.status ? `<span class="${avatarStatusDotClass(b)}" part="status-dot" aria-hidden="true"></span>` : "";
    return `${image}${fallback}${statusDot}`;
  }
  function avatarHtml(b) {
    const label = avatarLabel(b);
    const naming = label ? ` role="img" aria-label="${escapeAttr(label)}"` : "";
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
