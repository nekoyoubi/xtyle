"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/dot/mod.ts
  function dotClass(b) {
    const size = b.size ?? "md";
    return [
      "xtyle-dot",
      size !== "md" && `xtyle-dot--${size}`,
      !b.color && b.tone && `xtyle-dot--${b.tone}`,
      b.pulse && `xtyle-dot--pulse-${b.pulse}`,
      b.ping && "xtyle-dot--ping",
      b.glow && "xtyle-dot--glow"
    ].filter(Boolean).join(" ");
  }
  function dotStyle(b) {
    return b.color ? `--dot-color: ${b.color}` : "";
  }
  function dotHtml(b) {
    return `<span part="dot" class="${dotClass(b)}" style="${dotStyle(b)}" aria-hidden="true"></span>`;
  }
  hooks.fragment.mount("dot", (bindings, ops) => {
    ops.replaceChildren("[data-dot]", dotHtml(bindings));
  });
  hooks.fragment.update("dot", (bindings, ops) => {
    ops.setAttr('[part="dot"]', "class", dotClass(bindings));
    ops.setAttr('[part="dot"]', "style", dotStyle(bindings));
  });
})();
