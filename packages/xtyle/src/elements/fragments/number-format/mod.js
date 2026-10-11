"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/number-format/mod.ts
  function numberClass(b) {
    return [
      "xtyle-number-format",
      b.tone && `xtyle-number-format--${b.tone}`,
      b.tabular === false && "xtyle-number-format--proportional"
    ].filter(Boolean).join(" ");
  }
  function paint(b, ops) {
    ops.setAttr(".xtyle-number-format", "value", b.value ?? "");
    ops.setText(".xtyle-number-format", b.formatted ?? "");
    ops.setAttr(".xtyle-number-format", "class", numberClass(b));
  }
  hooks.fragment.mount("number-format", (bindings, ops) => {
    ops.replaceChildren("[data-number-format]", `<data part="number" class="xtyle-number-format"></data>`);
    paint(bindings, ops);
  });
  hooks.fragment.update("number-format", (bindings, ops) => {
    paint(bindings, ops);
  });
})();
