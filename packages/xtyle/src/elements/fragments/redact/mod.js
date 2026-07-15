"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/redact/mod.ts
  function rootClass(b) {
    const mode = b.mode ?? "blur";
    const reveal = b.reveal ?? "hover";
    return ["xtyle-redact", `xtyle-redact--${mode}`, `xtyle-redact--reveal-${reveal}`, b.revealed && "xtyle-redact--revealed"].filter(Boolean).join(" ");
  }
  function paint(b, ops) {
    const interactive = b.interactive !== false;
    ops.setAttr(".xtyle-redact", "class", rootClass(b));
    ops.setAttr("[data-rd-content]", "style", b.blur != null ? `--redact-blur: ${b.blur}` : "");
    ops.setAttr("[data-rd-content]", "aria-hidden", b.contentHidden === true ? "true" : "");
    ops.setAttr("[data-rd-cover]", "aria-label", b.coverLabel ?? "");
    ops.setAttr("[data-rd-cover]", "disabled", interactive ? "" : "disabled");
    ops.setAttr("[data-rd-cover]", "tabindex", interactive ? "" : "-1");
    ops.setAttr("[data-rd-cover]", "aria-hidden", interactive ? "" : "true");
    if (b.cue != null) ops.setText("[data-rd-cue]", b.cue);
    ops.setAttr("[data-rd-cue]", "hidden", b.showCue === true ? "" : "hidden");
  }
  hooks.fragment.mount("redact", (bindings, ops) => {
    paint(bindings, ops);
  });
  hooks.fragment.update("redact", (bindings, ops) => {
    paint(bindings, ops);
  });
})();
