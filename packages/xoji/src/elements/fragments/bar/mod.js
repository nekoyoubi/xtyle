"use strict";
(() => {
  // packages/xoji/src/elements/fragments/bar/mod.ts
  var AMP = /&/g;
  var LT = /</g;
  var GT = />/g;
  var QUOT = /"/g;
  function esc(value) {
    return value.replace(AMP, "&amp;").replace(LT, "&lt;").replace(GT, "&gt;").replace(QUOT, "&quot;");
  }
  var IW = 640;
  function niceMax(raw) {
    if (raw <= 0) return 1;
    const pow = 10 ** Math.floor(Math.log10(raw));
    const n = raw / pow;
    const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return step * pow;
  }
  function ticks(max, count) {
    return Array.from({ length: count + 1 }, (_, i) => max * i / count);
  }
  function formatTick(value) {
    if (value >= 1e3) return `${(value / 1e3).toFixed(value % 1e3 === 0 ? 0 : 1)}k`;
    return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
  }
  function seriesOf(b) {
    return (b.series ?? []).map((s) => ({ name: s.name ?? "", values: Array.isArray(s.values) ? s.values : [] }));
  }
  function colorAt(colors, colorBy, si, ci) {
    return (colorBy === "category" ? colors[ci] : colors[si]) ?? "currentColor";
  }
  function barClass(b) {
    const horizontal = b.orientation === "horizontal";
    return ["xoji-bar", horizontal && "xoji-bar--horizontal", b.stacked && "xoji-bar--stacked", b.selectable && "xoji-bar--selectable"].filter(Boolean).join(" ");
  }
  function rect(x, y, w, h, fill, si, ci, label, selectable) {
    const role = selectable ? "button" : "img";
    return `<rect class="xoji-bar__bar" part="bar" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(0, w).toFixed(1)}" height="${Math.max(0, h).toFixed(1)}" fill="${esc(fill)}" data-si="${si}" data-ci="${ci}" tabindex="0" role="${role}" aria-label="${esc(label)}"></rect>`;
  }
  function legendHtml(series, colors) {
    const items = series.map(
      (s, i) => `<span class="xoji-bar__legend-item" part="legend-item"><span class="xoji-bar__legend-dot" style="background:${esc(colors[i] ?? "currentColor")}"></span>${esc(s.name)}</span>`
    ).join("");
    return `<div class="xoji-bar__legend" part="legend">${items}</div>`;
  }
  function tableHtml(series, categories, caption) {
    const head = `<tr><th scope="col">Category</th>${series.map((s) => `<th scope="col">${esc(s.name)}</th>`).join("")}</tr>`;
    const rows = categories.map(
      (cat, ci) => `<tr><th scope="row">${esc(cat)}</th>${series.map((s) => `<td>${esc(String(s.values[ci] ?? 0))}</td>`).join("")}</tr>`
    ).join("");
    const cap = caption ? `<caption>${esc(caption)}</caption>` : "";
    return `<table class="xoji-bar__a11y">${cap}<thead>${head}</thead><tbody>${rows}</tbody></table>`;
  }
  function verticalPlot(b, series, colors, height) {
    const categories = b.categories ?? [];
    const stacked = !!b.stacked;
    const selectable = !!b.selectable;
    const pad = { top: 12, right: 12, bottom: 30, left: 44 };
    const plotX0 = pad.left;
    const plotX1 = IW - pad.right;
    const plotY0 = pad.top;
    const plotY1 = height - pad.bottom;
    const plotW = plotX1 - plotX0;
    const plotH = plotY1 - plotY0;
    const n = categories.length;
    const m = series.length;
    const rawMax = stacked ? Math.max(0, ...categories.map((_, ci) => series.reduce((sum, s) => sum + Math.max(0, s.values[ci] ?? 0), 0))) : Math.max(0, ...series.flatMap((s) => s.values.map((v) => Math.max(0, v ?? 0))));
    const max = niceMax(rawMax);
    const yOf = (v) => plotY1 - Math.max(0, v) / max * plotH;
    const grid = ticks(max, 4).map((t) => {
      const y = yOf(t).toFixed(1);
      return `<line class="xoji-bar__grid" x1="${plotX0}" y1="${y}" x2="${plotX1}" y2="${y}"></line><text class="xoji-bar__ytick" x="${plotX0 - 6}" y="${y}" dy="0.32em" text-anchor="end">${esc(formatTick(t))}</text>`;
    }).join("");
    const bandW = n > 0 ? plotW / n : plotW;
    const rects = [];
    const xLabels = [];
    const valueLabels = [];
    for (let ci = 0; ci < n; ci++) {
      const bandX = plotX0 + ci * bandW;
      const centerX = bandX + bandW / 2;
      xLabels.push(
        `<text class="xoji-bar__xtick" x="${centerX.toFixed(1)}" y="${(plotY1 + 18).toFixed(1)}" text-anchor="middle">${esc(categories[ci] ?? "")}</text>`
      );
      if (stacked) {
        const barW = bandW * 0.6;
        const x = bandX + (bandW - barW) / 2;
        let acc = 0;
        for (let si = 0; si < m; si++) {
          const v = Math.max(0, series[si]?.values[ci] ?? 0);
          if (v <= 0) continue;
          const yTop = yOf(acc + v);
          rects.push(rect(x, yTop, barW, yOf(acc) - yTop, colorAt(colors, b.colorBy, si, ci), si, ci, `${series[si]?.name ?? ""}, ${categories[ci] ?? ""}: ${v}`, selectable));
          acc += v;
        }
      } else {
        const groupW = bandW * 0.74;
        const barW = m > 0 ? groupW / m : groupW;
        const groupX0 = bandX + (bandW - groupW) / 2;
        for (let si = 0; si < m; si++) {
          const v = Math.max(0, series[si]?.values[ci] ?? 0);
          const x = groupX0 + si * barW;
          const yTop = yOf(v);
          rects.push(rect(x + barW * 0.08, yTop, barW * 0.84, plotY1 - yTop, colorAt(colors, b.colorBy, si, ci), si, ci, `${series[si]?.name ?? ""}, ${categories[ci] ?? ""}: ${v}`, selectable));
          if (b.showValues && v > 0) {
            valueLabels.push(
              `<text class="xoji-bar__value" x="${(x + barW / 2).toFixed(1)}" y="${(yTop - 4).toFixed(1)}" text-anchor="middle">${esc(formatTick(v))}</text>`
            );
          }
        }
      }
    }
    const baseline = `<line class="xoji-bar__axis" x1="${plotX0}" y1="${plotY1}" x2="${plotX1}" y2="${plotY1}"></line>`;
    return `<g class="xoji-bar__grid-layer">${grid}</g>${baseline}<g class="xoji-bar__bars">${rects.join("")}</g><g class="xoji-bar__values">${valueLabels.join("")}</g><g class="xoji-bar__xlabels">${xLabels.join("")}</g>`;
  }
  function horizontalPlot(b, series, colors, height) {
    const categories = b.categories ?? [];
    const stacked = !!b.stacked;
    const selectable = !!b.selectable;
    const pad = { top: 12, right: 16, bottom: 28, left: 76 };
    const plotX0 = pad.left;
    const plotX1 = IW - pad.right;
    const plotY0 = pad.top;
    const plotY1 = height - pad.bottom;
    const plotW = plotX1 - plotX0;
    const plotH = plotY1 - plotY0;
    const n = categories.length;
    const m = series.length;
    const rawMax = stacked ? Math.max(0, ...categories.map((_, ci) => series.reduce((sum, s) => sum + Math.max(0, s.values[ci] ?? 0), 0))) : Math.max(0, ...series.flatMap((s) => s.values.map((v) => Math.max(0, v ?? 0))));
    const max = niceMax(rawMax);
    const xOf = (v) => plotX0 + Math.max(0, v) / max * plotW;
    const grid = ticks(max, 4).map((t) => {
      const x = xOf(t).toFixed(1);
      return `<line class="xoji-bar__grid" x1="${x}" y1="${plotY0}" x2="${x}" y2="${plotY1}"></line><text class="xoji-bar__xtick" x="${x}" y="${(plotY1 + 18).toFixed(1)}" text-anchor="middle">${esc(formatTick(t))}</text>`;
    }).join("");
    const bandH = n > 0 ? plotH / n : plotH;
    const rects = [];
    const catLabels = [];
    const valueLabels = [];
    for (let ci = 0; ci < n; ci++) {
      const bandY = plotY0 + ci * bandH;
      const centerY = bandY + bandH / 2;
      catLabels.push(
        `<text class="xoji-bar__ytick" x="${(plotX0 - 8).toFixed(1)}" y="${centerY.toFixed(1)}" dy="0.32em" text-anchor="end">${esc(categories[ci] ?? "")}</text>`
      );
      if (stacked) {
        const barH = bandH * 0.6;
        const y = bandY + (bandH - barH) / 2;
        let acc = 0;
        for (let si = 0; si < m; si++) {
          const v = Math.max(0, series[si]?.values[ci] ?? 0);
          if (v <= 0) continue;
          const xStart = xOf(acc);
          rects.push(rect(xStart, y, xOf(acc + v) - xStart, barH, colorAt(colors, b.colorBy, si, ci), si, ci, `${series[si]?.name ?? ""}, ${categories[ci] ?? ""}: ${v}`, selectable));
          acc += v;
        }
      } else {
        const groupH = bandH * 0.74;
        const barH = m > 0 ? groupH / m : groupH;
        const groupY0 = bandY + (bandH - groupH) / 2;
        for (let si = 0; si < m; si++) {
          const v = Math.max(0, series[si]?.values[ci] ?? 0);
          const y = groupY0 + si * barH;
          const w = xOf(v) - plotX0;
          rects.push(rect(plotX0, y + barH * 0.08, w, barH * 0.84, colorAt(colors, b.colorBy, si, ci), si, ci, `${series[si]?.name ?? ""}, ${categories[ci] ?? ""}: ${v}`, selectable));
          if (b.showValues && v > 0) {
            valueLabels.push(
              `<text class="xoji-bar__value" x="${(plotX0 + w + 4).toFixed(1)}" y="${(y + barH / 2).toFixed(1)}" dy="0.32em" text-anchor="start">${esc(formatTick(v))}</text>`
            );
          }
        }
      }
    }
    const baseline = `<line class="xoji-bar__axis" x1="${plotX0}" y1="${plotY0}" x2="${plotX0}" y2="${plotY1}"></line>`;
    return `<g class="xoji-bar__grid-layer">${grid}</g>${baseline}<g class="xoji-bar__bars">${rects.join("")}</g><g class="xoji-bar__values">${valueLabels.join("")}</g><g class="xoji-bar__ylabels">${catLabels.join("")}</g>`;
  }
  function barHtml(b) {
    const series = seriesOf(b);
    const categories = b.categories ?? [];
    const colors = b.colors ?? [];
    const height = Math.max(160, b.height ?? 320);
    const horizontal = b.orientation === "horizontal";
    if (categories.length === 0 || series.length === 0) {
      const label = b.title ?? b.ariaLabel ?? "";
      const emptySvg = `<svg class="xoji-bar__svg" viewBox="0 0 ${IW} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${label ? esc(label) : "No data"}"><text class="xoji-bar__empty" x="${IW / 2}" y="${height / 2}" text-anchor="middle" dy="0.32em">No data</text></svg>`;
      return `<figure part="chart" class="${barClass(b)}" style="--bar-height:${height}px">${emptySvg}</figure>`;
    }
    const plot = horizontal ? horizontalPlot(b, series, colors, height) : verticalPlot(b, series, colors, height);
    const svg = `<svg class="xoji-bar__svg" viewBox="0 0 ${IW} ${height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${plot}</svg>`;
    const legend = b.legend !== false && series.length > 1 ? legendHtml(series, colors) : "";
    const tooltip = `<div class="xoji-bar__tooltip" part="tooltip" role="status" aria-hidden="true" hidden></div>`;
    const table = tableHtml(series, categories, b.title ?? b.ariaLabel ?? "");
    return `<figure part="chart" class="${barClass(b)}" style="--bar-height:${height}px">${svg}${legend}${tooltip}${table}</figure>`;
  }
  hooks.fragment.mount("bar", (bindings, ops) => {
    ops.replaceChildren("[data-bar]", barHtml(bindings));
  });
  hooks.fragment.update("bar", (bindings, ops) => {
    ops.replaceChildren("[data-bar]", barHtml(bindings));
  });
})();
