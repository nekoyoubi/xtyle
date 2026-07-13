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

  // packages/xtyle/src/elements/fragments/badge/mod.ts
  var STATUS_WORD = {
    success: "Success",
    warn: "Warning",
    danger: "Danger",
    info: "Info"
  };
  var REMOVE_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" d="M6 6l12 12M18 6L6 18" /></svg>`;
  function badgeClass(b) {
    const variant = b.variant ?? "soft";
    const tone = b.tone ?? "neutral";
    const size = b.size ?? "md";
    const pulse = b.pulse === "fast" || b.pulse === "slow" ? b.pulse : null;
    return [
      "xtyle-badge",
      `xtyle-badge--${variant}`,
      `xtyle-badge--${tone}`,
      size !== "md" && `xtyle-badge--${size}`,
      pulse && b.dot && `xtyle-badge--pulse-${pulse}`
    ].filter(Boolean).join(" ");
  }
  function badgeHtml(b) {
    const tone = b.tone ?? "neutral";
    const statusWord = STATUS_WORD[tone];
    const srTone = statusWord ? `<span class="xtyle-badge__sr-only" part="status-word">${statusWord}:</span>` : "";
    const dotPulse = b.pulse === "fast" || b.pulse === "slow" ? b.pulse : void 0;
    const dot = b.dot ? `<span class="${dotClass({ size: (b.size ?? "md") === "lg" ? "md" : "sm", pulse: dotPulse })} xtyle-badge__dot" part="dot" aria-hidden="true"></span>` : "";
    const countValue = b.count === null || b.count === void 0 ? null : String(b.count);
    const hasCount = countValue !== null && countValue !== "" && countValue !== "undefined";
    const count = hasCount ? `<span class="xtyle-badge__count" part="count">${countValue}</span>` : "";
    const removeLabel = b.removeLabel ?? "Remove";
    const remove = b.removable ? `<button type="button" class="xtyle-badge__remove" part="remove" aria-label="${removeLabel}">${REMOVE_ICON}</button>` : "";
    return `<span part="badge" class="${badgeClass(b)}">${srTone}${dot}<span class="xtyle-badge__label" part="label" data-slot><slot></slot></span>${count}${remove}</span>`;
  }
  hooks.fragment.mount("badge", (bindings, ops) => {
    ops.replaceChildren("[data-badge]", badgeHtml(bindings));
  });
  hooks.fragment.update("badge", (bindings, ops) => {
    ops.setAttr('[part="badge"]', "class", badgeClass(bindings));
    ops.setAttr(".xtyle-badge__remove", "aria-label", bindings.removeLabel ?? "Remove");
  });
})();
