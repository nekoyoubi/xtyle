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

  // packages/xtyle/src/elements/fragments/timeline/mod.ts
  var NAME_PATTERN = /^[a-zA-Z_:][-a-zA-Z0-9_:.]*$/;
  var OWNED = ["class", "part", "slot", "data-event", "data-dot", "data-rail"];
  function eventClass(event) {
    const authored = event.attrs?.class ?? "";
    return authored ? `xtyle-timeline__item ${authored}` : "xtyle-timeline__item";
  }
  function authoredAttrs(event) {
    const attrs = event.attrs ?? {};
    let out = "";
    for (const name of Object.keys(attrs)) {
      if (OWNED.includes(name) || !NAME_PATTERN.test(name)) continue;
      out += ` ${name}="${escapeAttr(String(attrs[name]))}"`;
    }
    return out;
  }
  function eventHtml(event) {
    const rail = event.last ? "" : `<span class="xtyle-timeline__rail" part="rail" data-rail="${event.index}" aria-hidden="true"></span>`;
    return `<li class="${eventClass(event)}" part="item" data-event="${event.index}"${authoredAttrs(event)}><span class="xtyle-timeline__dot" part="dot" data-dot="${event.index}" aria-hidden="true"></span>` + rail + `<div class="xtyle-timeline__content" part="content" data-slot="event-${event.index}"></div></li>`;
  }
  hooks.fragment.mount("timeline", (bindings, ops) => {
    const events = bindings.events ?? [];
    ops.replaceChildren("[data-events]", events.map(eventHtml).join(""));
  });
  hooks.fragment.update("timeline", (bindings, ops) => {
    for (const event of bindings.events ?? []) {
      ops.setAttr(`[data-event="${event.index}"]`, "class", eventClass(event));
    }
  });
})();
