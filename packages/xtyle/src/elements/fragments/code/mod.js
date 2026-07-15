"use strict";
(() => {
  // packages/xtyle/src/markup/code.ts
  function closeTagFor(openTag) {
    const name = /^<\s*([a-z0-9-]+)/i.exec(openTag)?.[1] ?? "span";
    return `</${name}>`;
  }
  function splitCodeLines(html, highlight, numbers) {
    const open = [];
    const rows = [];
    let row = "";
    for (const part of html.split(/(<[^>]+>)/g)) {
      if (!part) continue;
      if (part[0] === "<") {
        row += part;
        if (part[1] === "/") open.pop();
        else if (part[part.length - 2] !== "/") open.push(part);
        continue;
      }
      const segments = part.split("\n");
      for (let i = 0; i < segments.length; i++) {
        row += segments[i];
        if (i < segments.length - 1) {
          row += open.map(closeTagFor).reverse().join("");
          rows.push(row);
          row = open.join("");
        }
      }
    }
    rows.push(row);
    if (rows.length > 1 && rows[rows.length - 1] === "") rows.pop();
    const number = (n) => numbers ? `<span class="xtyle-code-line__number" aria-hidden="true">${n}</span>` : "";
    return {
      html: rows.map((r, i) => `<span class="xtyle-code-line"${highlight?.has(i + 1) ? " data-line-highlight" : ""}>${number(i + 1)}<span class="xtyle-code-line__text">${r || "\u200B"}</span></span>`).join(""),
      lines: rows.length
    };
  }
  function codeGutterWidth(lines) {
    return `${Math.max(2, String(lines).length) + 0.5}ch`;
  }
  function parseLineSpec(spec) {
    const lines = /* @__PURE__ */ new Set();
    for (const part of spec.split(",")) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const range = /^(\d+)\s*-\s*(\d+)$/.exec(trimmed);
      if (range) {
        const lo = Math.min(Number(range[1]), Number(range[2]));
        const hi = Math.max(Number(range[1]), Number(range[2]));
        for (let n = lo; n <= hi; n++) if (n > 0) lines.add(n);
        continue;
      }
      const single = Number(trimmed);
      if (Number.isInteger(single) && single > 0) lines.add(single);
    }
    return lines;
  }

  // packages/xtyle/src/elements/fragments/code/mod.ts
  function escapeCaption(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function codeClass(b) {
    const lang = b.language ?? "none";
    return `xtyle-code__code language-${lang}`;
  }
  function preClass(b) {
    return `xtyle-code ${codeClass(b)}`;
  }
  function preLabel(b) {
    const lang = b.language ?? "none";
    return lang !== "none" ? `${lang} code` : "Code";
  }
  function rendered(b) {
    const html = b.html ?? "";
    const spec = b.highlight ? parseLineSpec(b.highlight) : void 0;
    if (!b.lineNumbers && !spec) return { html, gutter: "" };
    const split = splitCodeLines(html, spec, b.lineNumbers === true);
    return { html: split.html, gutter: b.lineNumbers ? `--xtyle-code-gutter: ${codeGutterWidth(split.lines)}` : "" };
  }
  function paint(bindings, ops) {
    const out = rendered(bindings);
    ops.setAttr(".xtyle-code", "class", preClass(bindings));
    ops.setAttr("[data-root]", "aria-label", preLabel(bindings));
    ops.setAttr("[data-root]", "style", out.gutter);
    ops.setAttr(".xtyle-code__code", "class", codeClass(bindings));
    ops.replaceChildren("[data-code]", out.html);
    ops.replaceChildren("[data-caption]", bindings.caption ? escapeCaption(bindings.caption) : "");
  }
  hooks.fragment.mount("code", (bindings, ops) => {
    ops.setAttr("[data-root]", "tabindex", "0");
    paint(bindings, ops);
  });
  hooks.fragment.update("code", paint);
})();
