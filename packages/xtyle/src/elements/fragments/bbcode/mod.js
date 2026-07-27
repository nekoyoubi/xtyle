"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/bbcode/mod.ts
  function chrome(b) {
    if (!b.editable) return "";
    const pressed = String(!!b.editing);
    return `<xtyle-textarea class="xtyle-bbcode__editor" part="editor" data-editor label="BBCode source" mono rows="8" spellcheck="false"${b.editing ? "" : " hidden"}></xtyle-textarea><span class="xtyle-bbcode__controls" part="controls" data-controls><xtyle-button class="xtyle-bbcode__toggle" part="toggle" variant="subtle" size="xs" data-toggle aria-pressed="${pressed}">${b.editing ? "Done" : "Edit"}</xtyle-button></span>`;
  }
  function patch(b, ops) {
    if (b.inline) ops.addClass("[data-root]", "xtyle-bbcode--inline");
    else ops.removeClass("[data-root]", "xtyle-bbcode--inline");
    ops.replaceChildren("[data-body]", b.html ?? "");
    ops.setAttr("[data-body]", "data-vocabulary", b.vocabulary ?? "");
    ops.toggle("[data-body]", !b.editing);
    ops.toggle("[data-editor]", !!b.editing);
    ops.setAttr("[data-toggle]", "aria-pressed", String(!!b.editing));
    ops.setText("[data-toggle]", b.editing ? "Done" : "Edit");
  }
  hooks.fragment.mount("bbcode", (b, ops) => {
    ops.replaceChildren("[data-chrome]", chrome(b));
    patch(b, ops);
  });
  hooks.fragment.update("bbcode", patch);
  xript.exports.register("toggleEdit", () => ({ toggleEditing: true }));
  xript.exports.register("editInput", (payload) => {
    const e = payload;
    return { value: e.value ?? "" };
  });
})();
