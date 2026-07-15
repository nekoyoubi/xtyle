"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/spotlight/mod.ts
  function rootClass(b) {
    const arrow = b.arrow ?? "bounce";
    const pulse = b.pulse ?? "none";
    return [
      "xtyle-spotlight",
      b.open && "xtyle-spotlight--open",
      pulse !== "none" && `xtyle-spotlight--pulse-${pulse}`,
      arrow !== "none" && `xtyle-spotlight--arrow-${arrow}`
    ].filter(Boolean).join(" ");
  }
  function paint(b, ops) {
    const heading = b.heading ?? "";
    const open = b.open === true;
    ops.setAttr(".xtyle-spotlight", "class", rootClass(b));
    ops.setAttr("[data-root]", "hidden", open ? "" : "hidden");
    const veilStyle = [
      b.cutout ? `clip-path: path(evenodd, "${b.cutout}")` : "",
      b.dim != null ? `--spotlight-dim: ${b.dim}` : "",
      b.blur != null ? `--spotlight-blur: ${b.blur}` : ""
    ].filter(Boolean).join("; ");
    ops.setAttr("[data-veil]", "style", veilStyle);
    ops.setAttr("[data-ring]", "style", b.ringStyle ?? "");
    ops.setAttr("[data-pointer]", "style", b.pointerStyle ?? "");
    ops.setAttr("[data-pointer]", "hidden", b.showPointer === true ? "" : "hidden");
    ops.setText("[data-sl-title]", heading);
    ops.setAttr("[data-sl-title]", "id", b.headingId ?? "");
    ops.setAttr("[data-sl-title]", "hidden", heading.length > 0 ? "" : "hidden");
    ops.setAttr("[data-callout]", "aria-labelledby", heading.length > 0 ? b.headingId ?? "" : "");
    ops.setText("[data-sl-close]", b.closeLabel ?? "Got it");
    ops.setAttr("[data-sl-close]", "hidden", b.noCloseButton === true ? "hidden" : "");
  }
  hooks.fragment.mount("spotlight", (bindings, ops) => {
    paint(bindings, ops);
  });
  hooks.fragment.update("spotlight", (bindings, ops) => {
    paint(bindings, ops);
  });
  xript.exports.register("dismiss", (payload) => {
    const e = payload;
    if (e.disabled) return {};
    return { requestClose: true, preventDefault: true, stopPropagation: true };
  });
  xript.exports.register("veilClick", () => {
    return { requestClose: true };
  });
})();
