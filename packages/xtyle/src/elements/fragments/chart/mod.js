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

  // packages/xtyle/src/elements/fragments/chart/mod.ts
  var IW = 640;
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var MINUTE = 6e4;
  var HOUR = 36e5;
  var DAY = 864e5;
  function f(n) {
    return n.toFixed(1);
  }
  function pad2(n) {
    return n < 10 ? `0${n}` : String(n);
  }
  function niceNum(range, round) {
    if (!(range > 0)) return 1;
    const exp = Math.floor(Math.log10(range));
    const frac = range / 10 ** exp;
    const nice = round ? frac < 1.5 ? 1 : frac < 3 ? 2 : frac < 7 ? 5 : 10 : frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
    return nice * 10 ** exp;
  }
  function niceScale(lo, hi, count) {
    if (!(hi > lo)) {
      lo -= 0.5;
      hi += 0.5;
    }
    const step = niceNum(niceNum(hi - lo, false) / Math.max(1, count), true);
    return { min: Math.floor(lo / step) * step, max: Math.ceil(hi / step) * step, step };
  }
  function formatTick(value) {
    const abs = Math.abs(value);
    if (abs >= 1e6) return `${trim(value / 1e6)}M`;
    if (abs >= 1e3) return `${trim(value / 1e3)}k`;
    return trim(value);
  }
  function trim(value) {
    const rounded = Math.round(value * 1e3) / 1e3;
    return Number.isInteger(rounded) ? String(rounded) : String(Math.round(value * 100) / 100);
  }
  function formatValue(value) {
    return Number.isInteger(value) ? String(value) : String(Math.round(value * 1e3) / 1e3);
  }
  function formatX(value, xScale, span) {
    if (xScale !== "time") return formatTick(value);
    const d = new Date(value);
    if (span < 2 * MINUTE) return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
    if (span < 36 * HOUR) return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    if (span < 400 * DAY) return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  }
  function formatPointX(value, xScale, span) {
    if (xScale !== "time") return formatValue(value);
    const d = new Date(value);
    const clock = `${pad2(d.getHours())}:${pad2(d.getMinutes())}${span < 2 * MINUTE ? `:${pad2(d.getSeconds())}` : ""}`;
    if (span < 36 * HOUR) return clock;
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${clock}`;
  }
  function seriesOf(b) {
    return (b.series ?? []).map((s) => ({
      name: s.name ?? "",
      points: (Array.isArray(s.points) ? s.points : []).map((p) => ({ x: Number(p.x), value: Number(p.value) })).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.value))
    }));
  }
  function linePath(pts) {
    return pts.map((p, i) => `${i ? "L" : "M"}${f(p[0])} ${f(p[1])}`).join(" ");
  }
  function stepPath(pts) {
    let d = "";
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (i === 0) {
        d += `M${f(p[0])} ${f(p[1])}`;
        continue;
      }
      const prev = pts[i - 1];
      d += ` L${f(p[0])} ${f(prev[1])} L${f(p[0])} ${f(p[1])}`;
    }
    return d;
  }
  function smoothPath(pts) {
    if (pts.length < 3) return linePath(pts);
    const first = pts[0];
    let d = `M${f(first[0])} ${f(first[1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p0 = pts[i - 1] ?? p1;
      const p3 = pts[i + 2] ?? p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d;
  }
  function pathOf(pts, curve) {
    if (curve === "step") return stepPath(pts);
    if (curve === "smooth") return smoothPath(pts);
    return linePath(pts);
  }
  function chartClass(b) {
    return [
      "xtyle-chart",
      b.variant === "area" && "xtyle-chart--area",
      b.markers && "xtyle-chart--markers",
      b.selectable && "xtyle-chart--selectable"
    ].filter(Boolean).join(" ");
  }
  function legendHtml(series, colors) {
    const items = series.map(
      (s, i) => `<span class="xtyle-chart__legend-item" part="legend-item"><span class="xtyle-chart__legend-swatch" part="legend-swatch" style="background:${escapeAttr(colors[i] ?? "currentColor")}"></span>${escapeAttr(s.name)}</span>`
    ).join("");
    return `<div class="xtyle-chart__legend" part="legend">${items}</div>`;
  }
  function tooltipHtml(series, colors) {
    const rows = series.map(
      (s, i) => `<li class="xtyle-chart__tooltip-row" part="tooltip-row" data-tip-row="${i}" hidden><span class="xtyle-chart__tooltip-swatch" style="background:${escapeAttr(colors[i] ?? "currentColor")}"></span><span class="xtyle-chart__tooltip-name">${escapeAttr(s.name)}</span><span class="xtyle-chart__tooltip-value" data-tip-value="${i}"></span></li>`
    ).join("");
    return `<div class="xtyle-chart__tooltip" part="tooltip" role="status" aria-live="polite" hidden><span class="xtyle-chart__tooltip-x" data-tip-x></span><ul class="xtyle-chart__tooltip-rows">${rows}</ul></div>`;
  }
  function tableHtml(series, caption, toDomain, xScale, span) {
    const anchors = [];
    for (const s of series) for (const p of s.points) if (anchors.indexOf(p.x) === -1) anchors.push(p.x);
    anchors.sort((a, b) => a - b);
    const head = `<tr><th scope="col">${xScale === "time" ? "Time" : "X"}</th>${series.map((s) => `<th scope="col">${escapeAttr(s.name)}</th>`).join("")}</tr>`;
    const rows = anchors.map((x) => {
      const cells = series.map((s) => {
        const hit = s.points.filter((p) => p.x === x)[0];
        return `<td>${hit ? escapeAttr(formatValue(hit.value)) : ""}</td>`;
      }).join("");
      return `<tr><th scope="row">${escapeAttr(formatPointX(toDomain(x), xScale, span))}</th>${cells}</tr>`;
    }).join("");
    const cap = caption ? `<caption>${escapeAttr(caption)}</caption>` : "";
    return `<table class="xtyle-chart__a11y">${cap}<thead>${head}</thead><tbody>${rows}</tbody></table>`;
  }
  function emptyHtml(b, height) {
    const label = b.title ?? b.ariaLabel ?? "";
    const svg = `<svg class="xtyle-chart__svg" viewBox="0 0 ${IW} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${label ? escapeAttr(label) : "No data"}"><text class="xtyle-chart__empty" x="${IW / 2}" y="${height / 2}" text-anchor="middle" dy="0.32em">No data</text></svg>`;
    return `<figure part="chart" class="${chartClass(b)}" style="--chart-height:${height}px"><div class="xtyle-chart__plot" part="plot">${svg}</div></figure>`;
  }
  function chartHtml(b) {
    const series = seriesOf(b);
    const colors = b.colors ?? [];
    const height = Math.max(160, b.height ?? 320);
    const plottable = series.filter((s) => s.points.length > 0);
    if (plottable.length === 0) return emptyHtml(b, height);
    const start = Number.isFinite(b.domainStart) ? b.domainStart : 0;
    const end = Number.isFinite(b.domainEnd) ? b.domainEnd : 1;
    const domainSpan = end - start || 1;
    const toDomain = (x) => start + x * domainSpan;
    const xTickCount = Math.max(2, Math.min(12, Math.round(b.xTicks ?? 5)));
    const yTickCount = Math.max(2, Math.min(12, Math.round(b.yTicks ?? 4)));
    const values = series.flatMap((s) => s.points.map((p) => p.value));
    let lo = Math.min(...values);
    let hi = Math.max(...values);
    if (lo > 0) lo = 0;
    if (hi < 0) hi = 0;
    const nice = niceScale(lo, hi, yTickCount);
    const hasMin = Number.isFinite(b.yMin);
    const hasMax = Number.isFinite(b.yMax);
    const yMin = hasMin ? b.yMin : nice.min;
    const yMax = hasMax ? b.yMax : nice.max;
    const ySpan = yMax > yMin ? yMax - yMin : 1;
    const yTicks = hasMin || hasMax ? Array.from({ length: yTickCount + 1 }, (_, i) => yMin + ySpan * i / yTickCount) : (() => {
      const out = [];
      for (let v = yMin; v <= yMax + nice.step / 2; v += nice.step) out.push(Math.round(v * 1e6) / 1e6);
      return out;
    })();
    const hasXLabel = !!b.xLabel;
    const hasYLabel = !!b.yLabel;
    const padTop = 14;
    const padRight = 18;
    const padBottom = 32 + (hasXLabel ? 20 : 0);
    const padLeft = 48 + (hasYLabel ? 18 : 0);
    const x0 = padLeft;
    const x1 = IW - padRight;
    const y0 = padTop;
    const y1 = height - padBottom;
    const plotW = x1 - x0;
    const plotH = y1 - y0;
    const xOf = (x) => x0 + x * plotW;
    const yOf = (v) => y1 - (v - yMin) / ySpan * plotH;
    const gridlines = yTicks.map((t) => {
      const y = f(yOf(t));
      return `<line class="xtyle-chart__grid" part="grid" x1="${x0}" y1="${y}" x2="${x1}" y2="${y}"></line><text class="xtyle-chart__ytick" part="ytick" x="${x0 - 8}" y="${y}" dy="0.32em" text-anchor="end">${escapeAttr(formatTick(t))}</text>`;
    }).join("");
    const xTickMarks = Array.from({ length: xTickCount + 1 }, (_, i) => i / xTickCount).map((t) => {
      const x = f(xOf(t));
      return `<line class="xtyle-chart__grid xtyle-chart__grid--x" part="grid" x1="${x}" y1="${y0}" x2="${x}" y2="${y1}"></line><text class="xtyle-chart__xtick" part="xtick" x="${x}" y="${f(y1 + 18)}" text-anchor="middle">${escapeAttr(formatX(toDomain(t), b.xScale, domainSpan))}</text>`;
    }).join("");
    const zero = yMin < 0 && yMax > 0 ? `<line class="xtyle-chart__zero" part="zero" x1="${x0}" y1="${f(yOf(0))}" x2="${x1}" y2="${f(yOf(0))}"></line>` : "";
    const axes = `<line class="xtyle-chart__axis" part="axis" x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}"></line><line class="xtyle-chart__axis" part="axis" x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}"></line>`;
    const axisTitles = (hasXLabel ? `<text class="xtyle-chart__axis-title" part="axis-title" x="${f(x0 + plotW / 2)}" y="${height - 6}" text-anchor="middle">${escapeAttr(String(b.xLabel))}</text>` : "") + (hasYLabel ? `<text class="xtyle-chart__axis-title" part="axis-title" transform="rotate(-90 14 ${f(y0 + plotH / 2)})" x="14" y="${f(y0 + plotH / 2)}" text-anchor="middle">${escapeAttr(String(b.yLabel))}</text>` : "");
    const area = b.variant === "area";
    const plots = series.map((s, si) => {
      if (s.points.length === 0) return "";
      const color = colors[si] ?? "currentColor";
      const pts = s.points.map((p) => [xOf(p.x), yOf(p.value)]);
      const d = pathOf(pts, b.curve);
      const first = pts[0];
      const last = pts[pts.length - 1];
      const fill = area ? `<path class="xtyle-chart__area" part="area" d="${escapeAttr(d)} L${f(last[0])} ${f(y1)} L${f(first[0])} ${f(y1)} Z" fill="${escapeAttr(color)}"></path>` : "";
      const line = `<path class="xtyle-chart__line" part="line" d="${escapeAttr(d)}" fill="none" stroke="${escapeAttr(color)}"></path>`;
      const dots = s.points.map(
        (p, i) => `<circle class="xtyle-chart__point" part="point" data-si="${si}" data-i="${i}" cx="${f(xOf(p.x))}" cy="${f(yOf(p.value))}" r="3" fill="${escapeAttr(color)}" data-x-label="${escapeAttr(formatPointX(toDomain(p.x), b.xScale, domainSpan))}" data-value="${escapeAttr(formatValue(p.value))}"></circle>`
      ).join("");
      return `<g class="xtyle-chart__series" part="series" data-si="${si}">${fill}${line}<g class="xtyle-chart__points">${dots}</g></g>`;
    }).join("");
    const guide = `<line class="xtyle-chart__guide" part="guide" x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}" hidden></line>`;
    const label = b.title ?? b.ariaLabel ?? "Chart";
    const hint = b.selectable ? "Use arrow keys to read values, Enter to select a point." : "Use arrow keys to read values.";
    const svg = `<svg class="xtyle-chart__svg" viewBox="0 0 ${IW} ${height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><g class="xtyle-chart__grid-layer">${xTickMarks}${gridlines}</g>${zero}${axes}${axisTitles}<g class="xtyle-chart__plots">${plots}</g>${guide}</svg>`;
    const plot = `<div class="xtyle-chart__plot" part="plot" tabindex="0" role="img" aria-label="${escapeAttr(`${label}. ${hint}`)}">${svg}${tooltipHtml(series, colors)}</div>`;
    const legend = b.legend !== false && series.length > 1 ? legendHtml(series, colors) : "";
    const table = tableHtml(series, b.title ?? b.ariaLabel ?? "", toDomain, b.xScale, domainSpan);
    return `<figure part="chart" class="${chartClass(b)}" style="--chart-height:${height}px">${plot}${legend}${table}</figure>`;
  }
  hooks.fragment.mount("chart", (bindings, ops) => {
    ops.replaceChildren("[data-chart]", chartHtml(bindings));
  });
  hooks.fragment.update("chart", (bindings, ops) => {
    ops.replaceChildren("[data-chart]", chartHtml(bindings));
  });
})();
