"use strict";
(() => {
  // packages/xoji/src/elements/fragments/sparkline/mod.ts
  var AMP = /&/g;
  var LT = /</g;
  var GT = />/g;
  var QUOT = /"/g;
  function esc(value) {
    return value.replace(AMP, "&amp;").replace(LT, "&lt;").replace(GT, "&gt;").replace(QUOT, "&quot;");
  }
  var VW = 100;
  var VH = 32;
  var PAD = 3;
  function valuesOf(b) {
    return (b.values ?? []).map((v) => Number.isFinite(v) ? v : 0);
  }
  function sparkClass(b) {
    const variant = b.variant ?? "line";
    const tone = b.tone ?? "accent";
    return ["xoji-sparkline", `xoji-sparkline--${variant}`, `xoji-sparkline--${tone}`].join(" ");
  }
  function points(values, lo, hi, xs) {
    const n = values.length;
    const span = hi - lo || 1;
    const innerW = VW - PAD * 2;
    const innerH = VH - PAD * 2;
    return values.map((v, i) => {
      const nx = xs ? xs[i] ?? 0 : n <= 1 ? 0.5 : i / (n - 1);
      return {
        x: PAD + nx * innerW,
        y: PAD + (1 - (v - lo) / span) * innerH
      };
    });
  }
  function stepCoords(pts) {
    const out = [];
    pts.forEach((p, i) => {
      if (i > 0) out.push(`${p.x.toFixed(2)},${pts[i - 1].y.toFixed(2)}`);
      out.push(`${p.x.toFixed(2)},${p.y.toFixed(2)}`);
    });
    return out.join(" ");
  }
  function sparkHtml(b) {
    const plot = b.plot;
    const values = plot ? plot.map((p) => Number.isFinite(p.value) ? p.value : 0) : valuesOf(b);
    const xs = plot ? plot.map((p) => p.x) : void 0;
    const variant = b.variant ?? "line";
    const label = b.label ?? "";
    if (values.length === 0) {
      return `<span class="${sparkClass(b)}" role="img" aria-label="${label ? esc(label) : "No data"}"><span class="xoji-sparkline__empty">No data</span></span>`;
    }
    const a11y = label ? ` role="img" aria-label="${esc(label)}"` : ` role="img" aria-label="Sparkline of ${values.length} values"`;
    const lo = b.min ?? Math.min(...values);
    const hi = b.max ?? Math.max(...values);
    const pts = points(values, lo, hi, xs);
    const lineCoords = b.step === true ? stepCoords(pts) : pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
    let shape = "";
    if (variant === "bar") {
      const bandW = (VW - PAD * 2) / values.length;
      const barW = bandW * 0.7;
      const span = hi - lo || 1;
      const base = VH - PAD;
      shape = values.map((v, i) => {
        const x = pts[i].x - barW / 2;
        const h = (v - lo) / span * (VH - PAD * 2);
        const y = base - h;
        return `<rect class="xoji-sparkline__bar" x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barW.toFixed(2)}" height="${Math.max(0.5, h).toFixed(2)}"></rect>`;
      }).join("");
    } else if (variant === "area") {
      const base = VH - PAD;
      const first = pts[0];
      const last = pts[pts.length - 1];
      const path = `M ${first.x.toFixed(2)},${base} L ${lineCoords.replace(/ /g, " L ")} L ${last.x.toFixed(2)},${base} Z`;
      shape = `<path class="xoji-sparkline__area" d="${path}"></path><polyline class="xoji-sparkline__line" points="${lineCoords}" vector-effect="non-scaling-stroke"></polyline>`;
    } else {
      shape = `<polyline class="xoji-sparkline__line" points="${lineCoords}" vector-effect="non-scaling-stroke"></polyline>`;
    }
    const end = b.showEnd !== false && variant !== "bar" && pts.length > 0 ? `<circle class="xoji-sparkline__end" cx="${pts[pts.length - 1].x.toFixed(2)}" cy="${pts[pts.length - 1].y.toFixed(2)}" r="2" vector-effect="non-scaling-stroke"></circle>` : "";
    const marker = `<g class="xoji-sparkline__marker" hidden><line class="xoji-sparkline__guide" y1="0" y2="${VH}" vector-effect="non-scaling-stroke"></line><circle class="xoji-sparkline__dot" r="2.5" vector-effect="non-scaling-stroke"></circle></g>`;
    const tooltip = `<span class="xoji-sparkline__tooltip" role="status" aria-hidden="true" hidden></span>`;
    return `<span class="${sparkClass(b)}"><svg class="xoji-sparkline__svg" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="none"${a11y}>${shape}${end}${marker}</svg>${tooltip}</span>`;
  }
  hooks.fragment.mount("sparkline", (bindings, ops) => {
    ops.replaceChildren("[data-sparkline]", sparkHtml(bindings));
  });
  hooks.fragment.update("sparkline", (bindings, ops) => {
    ops.replaceChildren("[data-sparkline]", sparkHtml(bindings));
  });
})();
