"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/steps/mod.ts
  var CHECK = "\u2713";
  var NAME_PATTERN = /^[a-zA-Z_:][-a-zA-Z0-9_:.]*$/;
  var OWNED = ["class", "part", "slot", "aria-current", "data-step", "data-marker", "data-connector"];
  function esc(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function stepClass(step) {
    const base = `xtyle-steps__step xtyle-steps__step--${step.state}`;
    const authored = step.attrs?.class ?? "";
    return authored ? `${base} ${authored}` : base;
  }
  function markerText(step) {
    return step.state === "done" ? CHECK : String(step.index + 1);
  }
  function authoredAttrs(step) {
    const attrs = step.attrs ?? {};
    let out = "";
    for (const name of Object.keys(attrs)) {
      if (OWNED.includes(name) || !NAME_PATTERN.test(name)) continue;
      out += ` ${name}="${esc(String(attrs[name]))}"`;
    }
    return out;
  }
  function stepHtml(step) {
    const current = step.state === "current" ? ' aria-current="step"' : "";
    const connector = step.index === 0 ? "" : `<span class="xtyle-steps__connector" part="connector" data-connector="${step.index}" aria-hidden="true"></span>`;
    return `<li class="${stepClass(step)}" part="step" data-step="${step.index}"${current}${authoredAttrs(step)}>` + connector + `<span class="xtyle-steps__marker" part="marker" data-marker="${step.index}" aria-hidden="true">${esc(markerText(step))}</span><span class="xtyle-steps__label" part="label" data-slot="step-${step.index}"></span></li>`;
  }
  hooks.fragment.mount("steps", (bindings, ops) => {
    const steps = bindings.steps ?? [];
    ops.replaceChildren("[data-steps]", steps.map(stepHtml).join(""));
  });
  hooks.fragment.update("steps", (bindings, ops) => {
    for (const step of bindings.steps ?? []) {
      const selector = `[data-step="${step.index}"]`;
      ops.setAttr(selector, "class", stepClass(step));
      ops.setAttr(selector, "aria-current", step.state === "current" ? "step" : "");
      ops.setText(`[data-marker="${step.index}"]`, markerText(step));
    }
  });
})();
