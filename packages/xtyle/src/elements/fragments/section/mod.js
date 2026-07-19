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

  // packages/xtyle/src/elements/fragments/section/mod.ts
  function sectionClass(b) {
    const variant = b.variant ?? "band";
    const tone = b.tone ?? "plain";
    const padding = b.padding ?? "lg";
    const classes = ["xtyle-section"];
    if (variant === "stage") {
      classes.push("xtyle-section--stage");
      return classes.join(" ");
    }
    if (tone !== "plain") classes.push(`xtyle-section--${tone}`);
    if (b.bordered) {
      classes.push("xtyle-section--bordered");
      if (tone === "plain") classes.push("xtyle-section--plain");
    }
    if (padding !== "lg") classes.push(`xtyle-section--${padding}`);
    return classes.join(" ");
  }
  function hasStageLabel(b) {
    return (b.variant ?? "band") === "stage" && b.label != null && b.label !== "";
  }
  function isLandmarkTag(tag) {
    return tag === "section" || tag === "header" || tag === "footer";
  }
  function sectionHtml(b) {
    const tag = b.as ?? "section";
    const label = hasStageLabel(b) ? `<span part="label" class="xtyle-section__label">${escapeHtml(String(b.label))}</span>` : "";
    const named = isLandmarkTag(tag) && b.label != null && b.label !== "";
    const nameAttr = named ? ` aria-label="${escapeAttr(String(b.label))}"` : "";
    return `<${tag} part="section" class="${sectionClass(b)}"${nameAttr}>${label}<span class="xtyle-slot"><slot></slot></span></${tag}>`;
  }
  hooks.fragment.mount("section", (bindings, ops) => {
    ops.replaceChildren("[data-section]", sectionHtml(bindings));
  });
  hooks.fragment.update("section", (bindings, ops) => {
    ops.setAttr(".xtyle-section", "class", sectionClass(bindings));
    if (hasStageLabel(bindings)) ops.setText('[part="label"]', String(bindings.label));
    const tag = bindings.as ?? "section";
    const named = isLandmarkTag(tag) && bindings.label != null && bindings.label !== "";
    ops.setAttr('[part="section"]', "aria-label", named ? String(bindings.label) : "");
  });
})();
