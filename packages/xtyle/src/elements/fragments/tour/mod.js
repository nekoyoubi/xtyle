"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/tour/mod.ts
  function dots(index, count) {
    let html = "";
    for (let i = 0; i < count; i++) {
      html += `<span class="xtyle-tour__dot${i === index ? " xtyle-tour__dot--on" : ""}"></span>`;
    }
    return html;
  }
  function paint(b, ops) {
    ops.setAttr("[data-root]", "hidden", b.open ? "" : "hidden");
    ops.setText("[data-tour-back]", b.backLabel ?? "Back");
    ops.setAttr("[data-tour-back]", "hidden", b.showBack ? "" : "hidden");
    ops.setText("[data-tour-next]", b.nextLabel ?? "Next");
    ops.setText("[data-tour-skip]", b.skipLabel ?? "Skip");
    ops.setAttr("[data-tour-skip]", "hidden", b.showSkip ? "" : "hidden");
    const progress = b.progress ?? "count";
    const count = b.stepCount ?? 0;
    const index = b.stepIndex ?? 0;
    if (progress === "dots" && count > 0) {
      ops.replaceChildren("[data-tour-progress]", dots(index, count));
      ops.setAttr("[data-tour-progress]", "hidden", "");
    } else if (progress === "count" && count > 0) {
      ops.setText("[data-tour-progress]", `${index + 1} of ${count}`);
      ops.setAttr("[data-tour-progress]", "hidden", "");
    } else {
      ops.setAttr("[data-tour-progress]", "hidden", "hidden");
    }
  }
  hooks.fragment.mount("tour", (bindings, ops) => {
    paint(bindings, ops);
  });
  hooks.fragment.update("tour", (bindings, ops) => {
    paint(bindings, ops);
  });
  xript.exports.register("back", () => ({ tourNav: "back", stopPropagation: true }));
  xript.exports.register("next", () => ({ tourNav: "next", stopPropagation: true }));
  xript.exports.register("skip", () => ({ tourNav: "skip", stopPropagation: true }));
})();
