"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/pagination/mod.ts
  function escapeAttr(value) {
    return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function span(lo, hi) {
    const out = [];
    for (let n = lo; n <= hi; n++) out.push(n);
    return out;
  }
  function range(page, total, siblings, boundaries) {
    const safeTotal = Math.max(1, Math.floor(total));
    const current = Math.min(Math.max(1, Math.floor(page)), safeTotal);
    const sib = Math.max(0, Math.floor(siblings));
    const bound = Math.max(1, Math.floor(boundaries));
    const slots = bound * 2 + sib * 2 + 3;
    if (slots >= safeTotal) return span(1, safeTotal);
    const leftSibling = Math.max(current - sib, bound + 2);
    const rightSibling = Math.min(current + sib, safeTotal - bound - 1);
    const showLeftGap = leftSibling > bound + 2;
    const showRightGap = rightSibling < safeTotal - bound - 1;
    const edgeRun = bound + sib * 2 + 2;
    if (!showLeftGap && showRightGap) {
      return [...span(1, edgeRun), "ellipsis", ...span(safeTotal - bound + 1, safeTotal)];
    }
    if (showLeftGap && !showRightGap) {
      return [...span(1, bound), "ellipsis", ...span(safeTotal - edgeRun + 1, safeTotal)];
    }
    return [
      ...span(1, bound),
      "ellipsis",
      ...span(leftSibling, rightSibling),
      "ellipsis",
      ...span(safeTotal - bound + 1, safeTotal)
    ];
  }
  function href(template, page) {
    return template.includes("{page}") ? template.replace(/\{page\}/g, String(page)) : `${template}${page}`;
  }
  function paginationClass(bindings) {
    const tone = bindings.tone ?? "accent";
    const size = bindings.size ?? "md";
    return ["xtyle-pagination", `xtyle-pagination--${tone}`, size !== "md" && `xtyle-pagination--${size}`].filter(Boolean).join(" ");
  }
  var ARROW_PREV = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M10 3.5 5.5 8l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  var ARROW_NEXT = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  function control(rel, target, disabled, link, ariaLabel) {
    const glyph = rel === "prev" ? ARROW_PREV : ARROW_NEXT;
    const cls = `xtyle-pagination__control xtyle-pagination__control--${rel}`;
    if (link && !disabled) {
      return `<a class="${cls}" part="control" href="${escapeAttr(href(link, target))}" rel="${rel}" aria-label="${escapeAttr(ariaLabel)}" data-page="${target}">${glyph}</a>`;
    }
    const dis = disabled ? ' aria-disabled="true"' : "";
    const dataPage = disabled ? "" : ` data-page="${target}"`;
    return `<button type="button" class="${cls}" part="control" aria-label="${escapeAttr(ariaLabel)}"${dis}${dataPage}>${glyph}</button>`;
  }
  function pageItem(n, current, link) {
    if (n === current) {
      return `<li class="xtyle-pagination__item" part="item-wrap"><span class="xtyle-pagination__page xtyle-pagination__page--current" part="page" aria-current="page">${n}</span></li>`;
    }
    const label = `Go to page ${n}`;
    const cell = link !== void 0 ? `<a class="xtyle-pagination__page" part="page" href="${escapeAttr(href(link, n))}" aria-label="${escapeAttr(label)}" data-page="${n}">${n}</a>` : `<button type="button" class="xtyle-pagination__page" part="page" aria-label="${escapeAttr(label)}" data-page="${n}">${n}</button>`;
    return `<li class="xtyle-pagination__item" part="item-wrap">${cell}</li>`;
  }
  function body(bindings) {
    const total = Math.max(1, Math.floor(bindings.total ?? 1));
    const page = Math.min(Math.max(1, Math.floor(bindings.page ?? 1)), total);
    const link = bindings.href;
    const items = range(page, total, bindings.siblings ?? 1, bindings.boundaries ?? 1).map(
      (entry) => entry === "ellipsis" ? `<li class="xtyle-pagination__item" part="item-wrap"><span class="xtyle-pagination__ellipsis" part="ellipsis" aria-hidden="true">\u2026</span></li>` : pageItem(entry, page, link)
    ).join("");
    const prev = control("prev", page - 1, page <= 1, link, bindings.prevLabel ?? "Previous page");
    const next = control("next", page + 1, page >= total, link, bindings.nextLabel ?? "Next page");
    return `${prev}<ol class="xtyle-pagination__list" part="list">${items}</ol>${next}`;
  }
  hooks.fragment.mount("pagination", (bindings, ops) => {
    ops.setAttr(".xtyle-pagination", "class", paginationClass(bindings));
    ops.setAttr("[data-root]", "aria-label", bindings.label ?? "Pagination");
    ops.replaceChildren("[data-root]", body(bindings));
  });
  hooks.fragment.update("pagination", (bindings, ops) => {
    ops.setAttr(".xtyle-pagination", "class", paginationClass(bindings));
    ops.setAttr("[data-root]", "aria-label", bindings.label ?? "Pagination");
  });
})();
