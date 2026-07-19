"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/markdown/mod.ts
  function chrome(b) {
    if (!b.editable) return "";
    const pressed = String(!!b.editing);
    return `<textarea class="xtyle-markdown__editor" part="editor" data-editor aria-label="Markdown source" spellcheck="false"${b.editing ? "" : " hidden"}></textarea><span class="xtyle-markdown__controls" part="controls" data-controls><button class="xtyle-markdown__toggle" part="toggle" type="button" data-toggle aria-pressed="${pressed}">${b.editing ? "Done" : "Edit"}</button></span>`;
  }
  function patch(b, ops) {
    if (b.inline) ops.addClass("[data-root]", "xtyle-markdown--inline");
    else ops.removeClass("[data-root]", "xtyle-markdown--inline");
    ops.replaceChildren("[data-body]", b.html ?? "");
    ops.toggle("[data-body]", !b.editing);
    ops.toggle("[data-editor]", !!b.editing);
    ops.setAttr("[data-toggle]", "aria-pressed", String(!!b.editing));
    ops.setText("[data-toggle]", b.editing ? "Done" : "Edit");
  }
  hooks.fragment.mount("markdown", (b, ops) => {
    ops.replaceChildren("[data-chrome]", chrome(b));
    patch(b, ops);
  });
  hooks.fragment.update("markdown", patch);
  xript.exports.register("toggleEdit", () => ({ toggleEditing: true }));
  xript.exports.register("editInput", (payload) => {
    const e = payload;
    return { value: e.value ?? "" };
  });
})();
