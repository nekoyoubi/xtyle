"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/markdown/mod.ts
  function chrome(b) {
    if (!b.editable) return "";
    const pressed = String(!!b.editing);
    return `<xtyle-textarea class="xtyle-markdown__editor" part="editor" data-editor label="Markdown source" mono rows="8" spellcheck="false"${b.editing ? "" : " hidden"}></xtyle-textarea><span class="xtyle-markdown__controls" part="controls" data-controls><xtyle-button class="xtyle-markdown__toggle" part="toggle" variant="subtle" size="xs" data-toggle aria-pressed="${pressed}">${b.editing ? "Done" : "Edit"}</xtyle-button></span>`;
  }
  function patch(b, ops) {
    if (b.inline) ops.addClass("[data-root]", "xtyle-markdown--inline");
    else ops.removeClass("[data-root]", "xtyle-markdown--inline");
    ops.replaceChildren("[data-body]", b.html ?? "");
    ops.setAttr("[data-body]", "data-allow-html", b.allowHtml ? "true" : "");
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
