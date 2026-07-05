"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/accordion/mod.ts
  var CHEVRON = '<svg class="xtyle-accordion__chevron" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" /></svg>';
  function accordionClass(bindings) {
    const size = bindings.size ?? "md";
    return size === "md" ? "xtyle-accordion" : `xtyle-accordion xtyle-accordion--${size}`;
  }
  function headingLevel(bindings) {
    const level = Number(bindings.headingLevel);
    return level >= 1 && level <= 6 ? Math.floor(level) : 3;
  }
  function items(bindings) {
    const sections = bindings.sections ?? [];
    const open = new Set(bindings.openKeys ?? []);
    const uid = bindings.uid ?? "xtyle-accordion";
    const level = headingLevel(bindings);
    return sections.map((section, i) => {
      const key = section.value ?? String(i);
      const isOpen = open.has(key);
      const triggerId = `${uid}-h-${i}`;
      const panelId = `${uid}-p-${i}`;
      const disabledAttr = section.disabled ? ' disabled aria-disabled="true"' : "";
      const body = section.panelSlot ? `<slot name="${section.panelSlot}"></slot>` : section.panel ?? "";
      return `<div class="xtyle-accordion__item${isOpen ? " is-open" : ""}" part="item" data-key="${key}"><h${level} class="xtyle-accordion__heading" part="heading"><button class="xtyle-accordion__trigger" part="trigger" type="button" id="${triggerId}" data-key="${key}" aria-expanded="${String(isOpen)}" aria-controls="${panelId}"${disabledAttr}><span class="xtyle-accordion__label">${section.header}</span>${CHEVRON}</button></h${level}><div class="xtyle-accordion__panel" part="panel" id="${panelId}" data-key="${key}" role="region" aria-labelledby="${triggerId}"${isOpen ? "" : " hidden"}><div class="xtyle-accordion__content">${body}</div></div></div>`;
    }).join("");
  }
  hooks.fragment.mount("accordion", (bindings, ops) => {
    ops.setAttr("[data-root]", "class", accordionClass(bindings));
    ops.replaceChildren("[data-items]", items(bindings));
  });
  hooks.fragment.update("accordion", (bindings, ops) => {
    const open = new Set(bindings.openKeys ?? []);
    (bindings.sections ?? []).forEach((section, i) => {
      const key = section.value ?? String(i);
      const isOpen = open.has(key);
      ops.setAttr(`.xtyle-accordion__trigger[data-key="${key}"]`, "aria-expanded", String(isOpen));
      ops.toggle(`.xtyle-accordion__panel[data-key="${key}"]`, isOpen);
      if (isOpen) ops.addClass(`.xtyle-accordion__item[data-key="${key}"]`, "is-open");
      else ops.removeClass(`.xtyle-accordion__item[data-key="${key}"]`, "is-open");
    });
  });
  xript.exports.register("toggleSection", (payload, context) => {
    const e = payload;
    const ctx = context;
    if (e.disabled || e.ariaDisabled === "true") return {};
    const key = e.dataset?.key;
    if (!key) return {};
    const open = new Set(ctx.openKeys ?? []);
    const wasOpen = open.has(key);
    if (ctx.multiple) {
      if (wasOpen) open.delete(key);
      else open.add(key);
    } else {
      open.clear();
      if (!wasOpen) open.add(key);
    }
    return { open: [...open], toggledKey: key, isOpen: open.has(key) };
  });
  xript.exports.register("navKeydown", (payload, context) => {
    const e = payload;
    const ctx = context;
    const k = e.key ?? "";
    const current = e.dataset?.key ?? "";
    const enabled = ctx.enabledKeys ?? [];
    const here = enabled.indexOf(current);
    let target;
    if (k === "ArrowDown") target = enabled[(here + 1) % enabled.length];
    else if (k === "ArrowUp") target = enabled[(here - 1 + enabled.length) % enabled.length];
    else if (k === "Home") target = enabled[0];
    else if (k === "End") target = enabled[enabled.length - 1];
    else return {};
    if (target === void 0) return {};
    return { focus: target, preventDefault: true };
  });
})();
