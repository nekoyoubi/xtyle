"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/escape.ts
  var AMP = /&/g;
  var LT = /</g;
  var GT = />/g;
  var DQUOTE = /"/g;
  var SQUOTE = /'/g;
  function escapeHtml(value) {
    return value.replace(AMP, "&amp;").replace(LT, "&lt;").replace(GT, "&gt;");
  }
  function escapeAttr(value) {
    return escapeHtml(value).replace(DQUOTE, "&quot;").replace(SQUOTE, "&#39;");
  }

  // packages/xtyle/src/elements/fragments/dropzone/mod.ts
  var UPLOAD_ICON = '<svg viewBox="0 0 24 24" width="1.4em" height="1.4em" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M12 15V4m0 0L8 8m4-4 4 4M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>';
  var FILE_ICON = '<svg viewBox="0 0 24 24" width="1em" height="1em" focusable="false" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7l-4-4Zm0 0v4h4"/></svg>';
  var REMOVE_ICON = '<svg viewBox="0 0 24 24" width="1em" height="1em" focusable="false" aria-hidden="true"><path fill="currentColor" d="m12 10.6 5-5 1.4 1.4-5 5 5 5L17 18.4l-5-5-5 5L5.6 17l5-5-5-5L7 5.6l5 5Z"/></svg>';
  function surfaceClass(b) {
    let cls = "xtyle-dropzone__surface";
    if (b.disabled) cls += " xtyle-dropzone__surface--disabled";
    else if (b.rejecting) cls += " xtyle-dropzone__surface--rejecting";
    else if (b.dragging) cls += " xtyle-dropzone__surface--dragging";
    return cls;
  }
  function rowClass(file) {
    return `xtyle-dropzone__file xtyle-dropzone__file--${file.status}`;
  }
  function barWidth(file) {
    const pct = file.progress < 0 ? 0 : file.progress > 100 ? 100 : file.progress;
    return `width: ${pct}%`;
  }
  function rowHtml(file, b) {
    const removeLabel = `${b.removeLabel ?? "Remove"} ${file.name}`;
    const error = file.error ? `<span class="xtyle-dropzone__file-error" part="file-error" data-error="${escapeAttr(file.id)}">${escapeAttr(file.error)}</span>` : "";
    return `<li class="${rowClass(file)}" part="file" data-file="${escapeAttr(file.id)}"><span class="xtyle-dropzone__file-icon" part="file-icon">${FILE_ICON}</span><span class="xtyle-dropzone__file-name" part="file-name">${escapeAttr(file.name)}</span><span class="xtyle-dropzone__file-meta" part="file-meta">${escapeAttr(file.sizeLabel)} \xB7 <span data-status="${escapeAttr(file.id)}">${escapeAttr(file.statusLabel)}</span></span><button type="button" class="xtyle-dropzone__remove" part="remove" data-remove="${escapeAttr(file.id)}" aria-label="${escapeAttr(removeLabel)}">${REMOVE_ICON}</button><span class="xtyle-dropzone__track" part="track" data-track="${escapeAttr(file.id)}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${file.progress}" aria-label="${escapeAttr(file.name)}"><span class="xtyle-dropzone__fill" part="bar" data-bar="${escapeAttr(file.id)}" style="${barWidth(file)}"></span></span>` + error + `</li>`;
  }
  function listHtml(b) {
    let out = "";
    for (const file of b.files ?? []) out += rowHtml(file, b);
    return out;
  }
  function errorsHtml(b) {
    let out = "";
    for (const rejection of b.rejections ?? []) {
      out += `<li part="error" data-reason="${escapeAttr(rejection.reason)}">${escapeAttr(rejection.message)}</li>`;
    }
    return out;
  }
  function footHtml(b) {
    return `<span part="count" data-count>${escapeAttr(b.countLabel ?? "")}</span><button type="button" class="xtyle-dropzone__clear" part="clear" data-clear>${escapeAttr(b.clearLabel ?? "Clear all")}</button>`;
  }
  function paintChrome(b, ops) {
    const files = b.files ?? [];
    const rejections = b.rejections ?? [];
    ops.setAttr(".xtyle-dropzone__surface", "class", surfaceClass(b));
    ops.setAttr("[data-surface]", "for", b.inputId ?? "");
    ops.setAttr("[data-surface]", "aria-disabled", b.disabled ? "true" : "");
    ops.setText("[data-hint]", b.hint ?? "");
    ops.setAttr("[data-hint]", "id", b.hintId ?? "");
    ops.toggle("[data-hint]", (b.hint ?? "").length > 0);
    ops.setText("[data-browse]", b.browseLabel ?? "");
    if (!b.slotted) ops.setText("[data-prompt-text]", b.prompt ?? "");
    ops.replaceChildren("[data-errors]", errorsHtml(b));
    ops.toggle("[data-errors]", rejections.length > 0);
    ops.toggle("[data-list]", files.length > 0);
    ops.replaceChildren("[data-foot]", footHtml(b));
    ops.toggle("[data-foot]", files.length > 1);
  }
  hooks.fragment.mount("dropzone", (bindings, ops) => {
    ops.replaceChildren("[data-glyph]", UPLOAD_ICON);
    paintChrome(bindings, ops);
    ops.replaceChildren("[data-list]", listHtml(bindings));
  });
  hooks.fragment.update("dropzone", (bindings, ops) => {
    paintChrome(bindings, ops);
    if (bindings.rebuildList) ops.replaceChildren("[data-list]", listHtml(bindings));
    for (const file of bindings.files ?? []) {
      const key = `"${file.id}"`;
      ops.setAttr(`[data-file=${key}]`, "class", rowClass(file));
      ops.setAttr(`[data-bar=${key}]`, "style", barWidth(file));
      ops.setAttr(`[data-track=${key}]`, "aria-valuenow", String(file.progress));
      ops.setText(`[data-status=${key}]`, file.statusLabel);
    }
  });
  xript.exports.register("remove", (payload) => {
    const e = payload;
    const id = e.dataset?.remove;
    if (!id) return {};
    return { activate: "remove", value: id, preventDefault: true, stopPropagation: true };
  });
  xript.exports.register("clear", () => {
    return { activate: "clear", preventDefault: true, stopPropagation: true };
  });
})();
