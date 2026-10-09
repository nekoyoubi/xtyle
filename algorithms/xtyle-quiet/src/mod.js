(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // packages/xtyle/dist/color-primitives.host.js
  function parseColor(input) {
    return cuti.toOklch(input);
  }
  function gamutClamp(color) {
    return cuti.clamp(color.l, color.c, color.h, color.alpha);
  }
  function formatColor(source) {
    return cuti.format(source.l, source.c, source.h, source.alpha);
  }
  function contrastRatio(a, b) {
    return cuti.ratio(a, b);
  }

  // packages/xtyle/dist/color.js
  var DEFAULT_OKLCH = { l: 0, c: 0, h: 0, alpha: 1 };
  var MEMO_LIMIT = 4096;
  function memoized(cache, key, compute) {
    const hit = cache.get(key);
    if (hit !== void 0)
      return hit;
    const value = compute();
    if (cache.size >= MEMO_LIMIT)
      cache.clear();
    cache.set(key, value);
    return value;
  }
  var parsedColors = /* @__PURE__ */ new Map();
  var formattedStrings = /* @__PURE__ */ new Map();
  var formattedColors = /* @__PURE__ */ new Map();
  var contrastRatios = /* @__PURE__ */ new Map();
  function oklchKey(color) {
    return `${color.l} ${color.c} ${color.h} ${color.alpha}`;
  }
  function toOklchColor(input) {
    if (typeof input !== "string")
      return input;
    return { ...memoized(parsedColors, input, () => parseColor(input)) };
  }
  function oklch(l, c, h, alpha2 = 1) {
    return { l: clamp01(l), c: Math.max(0, c), h: (h % 360 + 360) % 360, alpha: alpha2 };
  }
  function withLightness(color, l) {
    return { ...color, l: clamp01(l) };
  }
  function withAlpha(color, alpha2) {
    return { ...color, alpha: clamp01(alpha2) };
  }
  function hueDelta(from, to) {
    let d = ((to - from) % 360 + 360) % 360;
    if (d > 180)
      d -= 360;
    return d;
  }
  function lightness(input) {
    return toOklchColor(input).l;
  }
  function contrast(a, b) {
    const x = formatCss(a);
    const y = formatCss(b);
    return memoized(contrastRatios, `${x}|${y}`, () => contrastRatio(x, y));
  }
  function flatten(over, under) {
    const top = toOklchColor(over);
    if (top.alpha >= 1)
      return { ...top, alpha: 1 };
    const base = toOklchColor(under);
    const a = clamp01(top.alpha);
    const mixHue = (from, to, t) => from + hueDelta(from, to) * t;
    return {
      l: base.l + (top.l - base.l) * a,
      c: base.c + (top.c - base.c) * a,
      h: mixHue(base.h, top.h, a),
      alpha: 1
    };
  }
  function oklabDistance(a, b) {
    const x = toOklchColor(a);
    const y = toOklchColor(b);
    const rad = Math.PI / 180;
    const ax = x.c * Math.cos(x.h * rad);
    const ay = x.c * Math.sin(x.h * rad);
    const bx = y.c * Math.cos(y.h * rad);
    const by = y.c * Math.sin(y.h * rad);
    return Math.hypot(x.l - y.l, ax - bx, ay - by);
  }
  function clampToGamut(color) {
    return gamutClamp(color);
  }
  function formatCss(input) {
    if (typeof input === "string")
      return memoized(formattedStrings, input, () => formatColor(toOklchColor(input)));
    return memoized(formattedColors, oklchKey(input), () => formatColor(input));
  }
  function schemeOf(bg) {
    return lightness(bg) < 0.5 ? "dark" : "light";
  }
  function pickReadable(fill, options, floor = 4.5) {
    let best = options[0] ?? DEFAULT_OKLCH;
    let bestContrast = -1;
    for (const option of options) {
      const ratio = contrast(fill, option);
      if (ratio >= floor)
        return formatCss(option);
      if (ratio > bestContrast) {
        bestContrast = ratio;
        best = option;
      }
    }
    return formatCss(best);
  }
  function clamp01(value) {
    if (Number.isNaN(value))
      return 0;
    return Math.min(1, Math.max(0, value));
  }

  // packages/xtyle/dist/graph.js
  var CycleError = class extends Error {
    constructor(cycle) {
      super(`xtyle: cycle detected in token graph: ${cycle.join(" -> ")}`);
      __publicField(this, "cycle");
      this.cycle = cycle;
      this.name = "CycleError";
    }
  };
  function resolveGraph(nodes) {
    const byName = /* @__PURE__ */ new Map();
    for (const node of nodes)
      byName.set(node.name, node);
    const computed = /* @__PURE__ */ new Map();
    const visiting = /* @__PURE__ */ new Set();
    const done = /* @__PURE__ */ new Set();
    const stack = [];
    const visit = (name) => {
      if (done.has(name))
        return;
      const node = byName.get(name);
      if (!node)
        return;
      if (visiting.has(name)) {
        const start = stack.indexOf(name);
        throw new CycleError([...stack.slice(start), name]);
      }
      visiting.add(name);
      stack.push(name);
      for (const ref of node.refs ?? [])
        visit(ref);
      if (node.resolve) {
        const inputs = {};
        for (const [key, value] of computed)
          inputs[key] = value;
        computed.set(name, node.resolve(inputs));
      } else if (node.value !== void 0) {
        computed.set(name, node.value);
      }
      stack.pop();
      visiting.delete(name);
      done.add(name);
    };
    for (const node of nodes)
      visit(node.name);
    const resolved = {};
    for (const node of nodes) {
      const value = computed.get(node.name);
      if (value !== void 0)
        resolved[node.name] = value;
    }
    return resolved;
  }

  // packages/xtyle/dist/vocab.js
  var TONES = ["accent", "neutral", "danger", "success", "warn", "info"];
  var ACCENT_VARIANTS = ["accent-2", "accent-3", "accent-4"];
  var HUES = [
    "red",
    "orange",
    "yellow",
    "green",
    "blue",
    "purple",
    "brown",
    "pink",
    "cyan",
    "gray",
    "white",
    "black"
  ];
  var FULL_TONES = [...TONES, ...ACCENT_VARIANTS, ...HUES];
  var SURFACE_ROLES = ["--bg-0", "--bg-1", "--bg-2"];

  // packages/xtyle/dist/algorithms/factory.js
  var AA = 4.5;
  var AAA = 7;
  var LINK_HOVER_MIN_DELTA = 0.01;
  var POLE_REACH = 0.03;
  var ENFORCE = AA + 0.2;
  var SURFACE_SEPARATION = 1.5;
  var FILL_SURFACE_FLOOR = 3;
  var FILL_SURFACE_TARGET = FILL_SURFACE_FLOOR + 0.05;
  var STATUS_SEPARATION = 0.02;
  var ACCENT_STATUS_SEPARATION = 0.05;
  var CONTROL_EDGE_FLOOR = 3;
  var BORDER_SEPARATION = 1.5;
  var DIVIDER_SEPARATION = 1.8;
  var DEFAULT_SHIFT_STEP = 90;
  var DEFAULT_ACCENT_SPLIT = 45;
  var DEFAULT_SURFACE_STEP = 0.02;
  function defaultSurfaceRamp(scheme) {
    return scheme === "dark" ? DEFAULT_SURFACE_STEP : -DEFAULT_SURFACE_STEP;
  }
  var DERIVED_SURFACE_TINT_C = 0.02;
  var DEFAULT_ACCENT_STRATEGY = "fan";
  var ACCENT_STRATEGIES = ["fan", "step", "shade", "duo"];
  function accentStrategyOf(preset, knobs) {
    const knob = knobs.accentStrategy;
    if (typeof knob === "string" && ACCENT_STRATEGIES.includes(knob))
      return knob;
    return preset.accentStrategy ?? DEFAULT_ACCENT_STRATEGY;
  }
  function resolveAccentKnobs(preset, knobs) {
    return {
      strategy: accentStrategyOf(preset, knobs),
      split: typeof knobs.accentSplit === "number" ? knobs.accentSplit : DEFAULT_ACCENT_SPLIT,
      shiftStep: typeof knobs.accentShiftStep === "number" ? knobs.accentShiftStep : DEFAULT_SHIFT_STEP
    };
  }
  var ACHROMATIC_CHROMA = 0.02;
  var DERIVED_ACCENT_HUE_ROTATION = 150;
  var DERIVED_ACCENT_FALLBACK_HUE = 250;
  var DERIVED_ACCENT_L = 0.62;
  var DERIVED_ACCENT_C = 0.16;
  var ACCENT_RAMP_L_MIN = 0.1;
  var ACCENT_RAMP_L_MAX = 0.95;
  var SHADE_LADDER_L_STEP = 0.12;
  var DUO_L_STEP = 0.16;
  var HUE_STABLE_CHROMA = 0.1;
  var FAN_MIN_CHROMA = 0.045;
  var ACCENT_FAMILY_SEPARATION = 0.02;
  var ACCENT_FAMILY_HUE_ARC = 0.6;
  function fanFourthOffset(accentHue, flankA, flankB) {
    const norm = (deg) => (deg % 360 + 360) % 360;
    const placed = [accentHue, flankA, flankB].map(norm).sort((x, y) => x - y);
    let widest = -1;
    let center = 180;
    for (let i = 0; i < placed.length; i++) {
      const from = placed[i];
      const to = i === placed.length - 1 ? placed[0] + 360 : placed[i + 1];
      if (to - from > widest) {
        widest = to - from;
        center = norm(from + (to - from) / 2);
      }
    }
    return norm(center - accentHue);
  }
  var FAN_CHROMA_RICH_L = 0.6;
  var FAN_LIGHTNESS_SEARCH_STEPS = 24;
  function chromaCapableBase(base) {
    const holds = (l) => clampToGamut({ l, c: FAN_MIN_CHROMA, h: base.h, alpha: 1 }).c >= FAN_MIN_CHROMA - 1e-3;
    if (holds(base.l))
      return base;
    for (let step = 1; step <= FAN_LIGHTNESS_SEARCH_STEPS; step++) {
      const l = base.l + (FAN_CHROMA_RICH_L - base.l) * (step / FAN_LIGHTNESS_SEARCH_STEPS);
      if (holds(l))
        return { ...base, l };
    }
    return { ...base, l: FAN_CHROMA_RICH_L };
  }
  function shadeLadderRungs(l) {
    const step = SHADE_LADDER_L_STEP;
    const room = (offset) => l + offset <= ACCENT_RAMP_L_MAX && l + offset >= ACCENT_RAMP_L_MIN;
    if (room(step) && room(-2 * step))
      return [step, -step, -2 * step];
    if (room(3 * step))
      return [step, 2 * step, 3 * step];
    if (room(-3 * step))
      return [-step, -2 * step, -3 * step];
    const span = (ACCENT_RAMP_L_MAX - ACCENT_RAMP_L_MIN) / 4;
    return [span, 2 * span, 3 * span].map((offset) => l - ACCENT_RAMP_L_MIN < ACCENT_RAMP_L_MAX - l ? offset : -offset);
  }
  var HUE_TOLERANCE = 8;
  var LIGHTNESS_TOLERANCE = 0.05;
  var DEFAULT_TYPE_SCALE = 1.2;
  var DEFAULT_RADIUS_SCALE = 1;
  var BASE_TEXT_REM = 1;
  var DEFAULT_FONTS = {
    sans: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    mono: 'ui-monospace, "SF Mono", "Cascadia Code", Consolas, monospace',
    display: '"Avenir Next", "Futura", "Century Gothic", "Trebuchet MS", system-ui, -apple-system, "Segoe UI", sans-serif'
  };
  var TEXT_LIGHT = { l: 0.98, c: 0, h: 0, alpha: 1 };
  var TEXT_DARK = { l: 0.15, c: 0, h: 0, alpha: 1 };
  var TRUE_WHITE = { l: 1, c: 0, h: 0, alpha: 1 };
  var TRUE_BLACK = { l: 0, c: 0, h: 0, alpha: 1 };
  var TEXT_POLES = [TRUE_WHITE, TRUE_BLACK];
  function bestTruePole(bg) {
    return contrast(TRUE_BLACK, bg) >= contrast(TRUE_WHITE, bg) ? TRUE_BLACK : TRUE_WHITE;
  }
  var STATUS_TO_HUE = {
    success: "green",
    warn: "yellow",
    danger: "red",
    info: "blue"
  };
  var NEUTRAL_ACCENT_CHROMA = 0.13;
  var PALETTE_HUES = {
    red: { h: 25, c: 0.2 },
    orange: { h: 55, c: 0.18 },
    yellow: { h: 95, c: 0.17 },
    green: { h: 145, c: 0.18 },
    blue: { h: 250, c: 0.18 },
    purple: { h: 300, c: 0.18 },
    brown: { h: 50, c: 0.08, l: -0.1 },
    pink: { h: 350, c: 0.16 },
    cyan: { h: 200, c: 0.14 },
    gray: "gray",
    white: "white",
    black: "black"
  };
  var PALETTE_STOPS = ["subtle", "muted", "base", "strong", "contrast"];
  var CODE_VIVID_ROLES = [
    "keyword",
    "number",
    "function",
    "type",
    "string",
    "tag",
    "attr",
    "regexp"
  ];
  var CODE_HUE_RANK = [0, 4, 2, 6, 1, 5, 3, 7];
  var CODE_STRUCTURAL_ROLES = ["comment", "operator", "punctuation", "variable"];
  var CODE_SCOPES = [...CODE_VIVID_ROLES, ...CODE_STRUCTURAL_ROLES];
  var CODE_SURFACES = ["--code-bg", "--code-fg", "--code-line-highlight", "--code-selection"];
  var TERMINAL_CHROME = ["bg", "fg", "cursor", "cursor-accent"];
  var ANSI_ORDER = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"];
  var ANSI_HUES = {
    red: 25,
    green: 145,
    yellow: 95,
    blue: 250,
    magenta: 330,
    cyan: 200
  };
  var ANSI_CHROMATIC = ["red", "green", "yellow", "blue", "magenta", "cyan"];
  var SURFACES = ["--body-bg", "--bg-0", "--bg-1", "--bg-2", "--bg-3"];
  var PANEL_REF_INDEX = SURFACES.indexOf("--bg-2");
  var PANEL_SURFACES = ["--bg-1", "--bg-2"];
  var BASE_SURFACE_INDEX = SURFACES.indexOf("--bg-0");
  var RING_SURFACE_INDICES = SURFACE_ROLES.map((name) => SURFACES.indexOf(name));
  function solveSurfaceLadder(pins, baseLightness, step) {
    const anchors = [];
    pins.forEach((pin, index) => {
      if (pin)
        anchors.push({ index, lightness: pin.l, token: SURFACES[index] });
    });
    if (!anchors.some((anchor) => anchor.index === BASE_SURFACE_INDEX)) {
      anchors.push({ index: BASE_SURFACE_INDEX, lightness: baseLightness, token: null });
    }
    anchors.sort((a, b) => a.index - b.index);
    const lightness2 = [];
    const sources = [];
    const tokensOf = (...of) => of.flatMap((anchor) => anchor?.token ? [anchor.token] : []);
    pins.forEach((_, index) => {
      const exact = anchors.find((anchor) => anchor.index === index);
      if (exact) {
        lightness2.push(exact.lightness);
        sources.push(tokensOf(exact));
        return;
      }
      const below = anchors.filter((anchor) => anchor.index < index).at(-1);
      const above = anchors.find((anchor) => anchor.index > index);
      if (below && above) {
        const span = (index - below.index) / (above.index - below.index);
        lightness2.push(below.lightness + (above.lightness - below.lightness) * span);
        sources.push(tokensOf(below, above));
        return;
      }
      const edge = below ?? above;
      lightness2.push(edge.lightness + step * (index - edge.index));
      sources.push(tokensOf(edge));
    });
    return { lightness: lightness2, sources };
  }
  var TEXT_STEPS = ["xs", "sm", "body", "lg", "xl", "2xl", "3xl", "4xl", "5xl"];
  var LEADING_STEPS = ["tight", "normal", "loose"];
  var WEIGHT_STEPS = ["normal", "medium", "semibold", "bold"];
  var RADIUS_STEPS = ["none", "sm", "md", "lg", "full"];
  var BORDER_STEPS = ["thin", "normal", "thick"];
  var DURATION_STEPS = ["fast", "base", "slow"];
  var EASE_STEPS = ["standard", "emphasized"];
  var SPACE_STEPS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  var ELEVATION_STEPS = [0, 1, 2, 3, 4, 5];
  var LAYER_STEPS = [
    /** Sticky chrome that outranks the content it scrolls over. */
    ["sticky", 10],
    /** App furniture over its own regions: a rail resizer, a drag handle. */
    ["chrome", 20],
    /** A floating surface that is *not* in the native top layer. */
    ["overlay", 30],
    /** A full-viewport veil that isolates one thing under it. */
    ["veil", 40],
    /** Notifications. Above the veil: a message that can't be read hasn't been delivered, and a
     * spotlight is the exact moment an app is most likely to be saying something. */
    ["toast", 50],
    /** The skip link. Nothing an app draws may cover the way out of it. */
    ["skip", 60]
  ];
  var WEIGHT_VALUES = {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  };
  var LEADING_VALUES = {
    tight: 1.2,
    normal: 1.5,
    loose: 1.8
  };
  var DENSITY_MULTIPLIER = {
    compact: 0.8,
    normal: 1,
    comfortable: 1.25
  };
  var SPACE_BASE_REM = 0.25;
  function buildProduces() {
    const produces = [];
    const categories = {};
    const add = (name, category) => {
      produces.push(name);
      categories[name] = category;
    };
    add("--bg-sunken", "color");
    for (const s of SURFACES)
      add(s, "color");
    add("--scrim", "color");
    add("--surface-overlay", "color");
    add("--surface-overlay-border", "color");
    for (let i = 0; i <= 3; i++)
      add(`--fg-${i}`, "color");
    add("--fg-disabled", "color");
    add("--placeholder", "color");
    add("--line", "color");
    add("--line-2", "color");
    add("--scrollbar-track", "color");
    add("--scrollbar-thumb", "color");
    add("--scrollbar-thumb-hover", "color");
    add("--ring", "color");
    add("--ring-bg", "color");
    add("--accent", "color");
    add("--accent-hover", "color");
    add("--accent-active", "color");
    add("--accent-bg", "color");
    add("--accent-fg", "color");
    add("--accent-text", "color");
    add("--accent-vivid", "color");
    for (const n of ["2", "3", "4"]) {
      add(`--accent-${n}`, "color");
      add(`--accent-${n}-bg`, "color");
      add(`--accent-${n}-fg`, "color");
      add(`--accent-${n}-text`, "color");
      add(`--accent-${n}-vivid`, "color");
    }
    add("--accent-shift-step", "number");
    add("--neutral", "color");
    add("--neutral-bg", "color");
    add("--neutral-fg", "color");
    add("--neutral-text", "color");
    add("--neutral-vivid", "color");
    add("--field-bg", "color");
    add("--field-border", "color");
    add("--line-strong", "color");
    for (const role of Object.keys(STATUS_TO_HUE)) {
      add(`--${role}`, "color");
      add(`--${role}-bg`, "color");
      add(`--${role}-fg`, "color");
      add(`--${role}-text`, "color");
      add(`--${role}-vivid`, "color");
    }
    for (const s of ["hover", "press", "selected", "disabled", "drag"]) {
      add(`--state-${s}`, "color");
    }
    add("--link", "color");
    add("--link-hover", "color");
    add("--selection", "color");
    add("--highlight", "color");
    add("--selection-cue", "keyword");
    add("--shadow", "shadow");
    for (const hue of Object.keys(PALETTE_HUES)) {
      add(`--color-${hue}`, "color");
      for (const stop of PALETTE_STOPS)
        add(`--color-${hue}-${stop}`, "color");
      add(`--${hue}`, "color");
      add(`--${hue}-bg`, "color");
      add(`--${hue}-fg`, "color");
      add(`--${hue}-text`, "color");
      add(`--${hue}-vivid`, "color");
    }
    for (const t of CODE_SURFACES)
      add(t, "color");
    for (const role of CODE_SCOPES)
      add(`--code-${role}`, "color");
    for (const role of TERMINAL_CHROME)
      add(`--terminal-${role}`, "color");
    for (const name of ANSI_ORDER) {
      add(`--terminal-${name}`, "color");
      add(`--terminal-bright-${name}`, "color");
    }
    add("--font-sans", "font");
    add("--font-mono", "font");
    add("--font-display", "font");
    for (const step of TEXT_STEPS)
      add(`--text-${step}`, "length");
    for (const step of LEADING_STEPS)
      add(`--leading-${step}`, "number");
    for (const step of WEIGHT_STEPS)
      add(`--weight-${step}`, "number");
    for (const step of RADIUS_STEPS)
      add(`--radius-${step}`, "length");
    for (const step of BORDER_STEPS)
      add(`--border-${step}`, "length");
    for (const step of DURATION_STEPS)
      add(`--duration-${step}`, "duration");
    for (const step of EASE_STEPS)
      add(`--ease-${step}`, "easing");
    add("--fx-intensity", "number");
    add("--fx-color", "color");
    add("--fx-color-alt", "color");
    add("--fx-duration", "duration");
    add("--fx-ease", "easing");
    for (const step of ELEVATION_STEPS)
      add(`--elevation-${step}`, "shadow");
    for (const [role] of LAYER_STEPS)
      add(`--layer-${role}`, "number");
    for (const step of SPACE_STEPS)
      add(`--space-${step}`, "length");
    return { produces, categories };
  }
  var { produces: PRODUCES, categories: CATEGORIES } = buildProduces();
  var PRODUCED_SINCE = {
    "--layer-chrome": "0.9.0",
    "--layer-overlay": "0.9.0",
    "--layer-skip": "0.9.0",
    "--layer-sticky": "0.9.0",
    "--layer-toast": "0.9.0",
    "--layer-veil": "0.9.0"
  };
  var PACK_SINCE = "0.1.0";
  var KEYWORD_DOMAINS = {
    "--selection-cue": ["tint", "marker"]
  };
  function contrastBandFloor(knobs) {
    const band = knobs.contrastBand;
    if (typeof band === "number")
      return band;
    if (band === "aaa")
      return AAA;
    if (band === "aa")
      return AA;
    return void 0;
  }
  function vibrancyOf(knobs, preset) {
    const v = typeof knobs.vibrancy === "number" ? knobs.vibrancy : preset.defaultVibrancy;
    return Math.min(1, Math.max(0, v));
  }
  function typeScaleOf(knobs) {
    const v = typeof knobs.typeScale === "number" ? knobs.typeScale : DEFAULT_TYPE_SCALE;
    return Math.min(2, Math.max(1.05, v));
  }
  function radiusScaleOf(knobs) {
    const v = typeof knobs.radiusScale === "number" ? knobs.radiusScale : DEFAULT_RADIUS_SCALE;
    return Math.max(0, v);
  }
  function densityOf(knobs) {
    const d = knobs.density;
    if (typeof d === "number")
      return Math.max(0.4, d);
    if (d === "compact" || d === "comfortable")
      return DENSITY_MULTIPLIER[d];
    return DENSITY_MULTIPLIER.normal;
  }
  function fontsOf(knobs) {
    return {
      sans: knobs.fonts?.sans ?? DEFAULT_FONTS.sans,
      mono: knobs.fonts?.mono ?? DEFAULT_FONTS.mono,
      display: knobs.fonts?.display ?? DEFAULT_FONTS.display
    };
  }
  function emittedContrast(fg, bgCss) {
    return contrast(formatCss(fg), bgCss);
  }
  function enforceContrastFloor(fg, bg, scheme, floor = ENFORCE) {
    const bgCss = formatCss(bg);
    if (emittedContrast(fg, bgCss) >= floor)
      return fg;
    const preferred = scheme === "dark" ? TRUE_WHITE.l : TRUE_BLACK.l;
    const other = scheme === "dark" ? TRUE_BLACK.l : TRUE_WHITE.l;
    const swept = sweepToward(fg, bgCss, preferred, floor) ?? sweepToward(fg, bgCss, other, floor);
    const pole = bestTruePole(bgCss);
    if (!swept)
      return pole;
    return emittedContrast(pole, bgCss) > emittedContrast(swept, bgCss) ? pole : swept;
  }
  function sweepToward(fg, bgCss, targetL, floor) {
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const candidate = {
        l: fg.l + (targetL - fg.l) * t,
        c: fg.c * (1 - t),
        h: fg.h,
        alpha: fg.alpha
      };
      if (emittedContrast(candidate, bgCss) >= floor)
        return candidate;
    }
    return null;
  }
  function bestPoleContrast(bg) {
    return Math.max(contrast(TEXT_LIGHT, bg), contrast(TEXT_DARK, bg));
  }
  function ensureTextHeadroom(bg, scheme, floor = ENFORCE) {
    if (bestPoleContrast(bg) >= floor)
      return bg;
    const target = scheme === "dark" ? 0 : 1;
    let candidate = bg;
    for (let i = 1; i <= 100; i++) {
      const t = i / 100;
      candidate = withLightness(bg, bg.l + (target - bg.l) * t);
      if (bestPoleContrast(candidate) >= floor)
        return candidate;
    }
    return withLightness(bg, target);
  }
  function fillWithTextHeadroom(l, c, h, floor = ENFORCE) {
    const seed = oklch(l, c, h);
    if (bestPoleContrast(seed) >= floor)
      return seed;
    let fallback = seed;
    for (let i = 1; i <= 100; i++) {
      const down = oklch(l - l * i / 100, c, h);
      if (bestPoleContrast(down) >= floor)
        return down;
      const up = oklch(l + (1 - l) * i / 100, c, h);
      if (bestPoleContrast(up) >= floor)
        return up;
      fallback = bestPoleContrast(down) >= bestPoleContrast(up) ? down : up;
    }
    return fallback;
  }
  function lightnessForContrast(pole, bg, bgCss, target) {
    let bestL = pole.l;
    for (let i = 0; i <= 200; i++) {
      const t = i / 200;
      const candidateL = pole.l + (bg.l - pole.l) * t;
      if (emittedContrast(withLightness(pole, candidateL), bgCss) >= target)
        bestL = candidateL;
      else
        break;
    }
    return bestL;
  }
  function liftStopForContrast(fg, bgCss, target, towardLight) {
    if (contrast(formatCss(fg), bgCss) >= target)
      return fg;
    const poleL = towardLight ? 1 : 0;
    let best = fg;
    for (let i = 1; i <= 100; i++) {
      const candidate = clampToGamut(oklch(fg.l + (poleL - fg.l) * (i / 100), fg.c, fg.h));
      best = candidate;
      if (contrast(formatCss(candidate), bgCss) >= target)
        return candidate;
    }
    return best;
  }
  function readsAsOneColor(a, b) {
    const arc = Math.abs(hueDelta(a.h, b.h)) * Math.min(a.c, b.c);
    return Math.abs(a.l - b.l) < ACCENT_FAMILY_SEPARATION && Math.abs(a.c - b.c) < ACCENT_FAMILY_SEPARATION && arc < ACCENT_FAMILY_HUE_ARC;
  }
  function separateTintFromFill(tint, fill, inkCss, target, towardLight) {
    if (!readsAsOneColor(tint, fill))
      return tint;
    for (const direction of [1, -1]) {
      for (let step = 1; step <= 40; step++) {
        const l = tint.l + direction * step * 0.01;
        if (l < 0 || l > 1)
          break;
        const candidate = liftStopForContrast(clampToGamut(oklch(l, tint.c, tint.h)), inkCss, target, towardLight);
        if (!readsAsOneColor(candidate, fill))
          return candidate;
      }
    }
    return tint;
  }
  function walkFillOffSurfaces(fill, surfaces, separation, textFloor) {
    const surfaceCss = surfaces.map((s) => formatCss(s));
    const clears = (color) => {
      const css = formatCss(color);
      return surfaceCss.every((s) => contrast(css, s) >= separation);
    };
    if (clears(fill))
      return { found: fill, last: fill };
    const headroom = Math.min(textFloor, bestPoleContrast(fill));
    const poleL = surfaces[0].l < 0.5 ? 1 : 0;
    let last = fill;
    for (let i = 1; i <= 100; i++) {
      const candidate = clampToGamut(oklch(fill.l + (poleL - fill.l) * (i / 100), fill.c, fill.h));
      last = candidate;
      if (clears(candidate) && bestPoleContrast(candidate) >= headroom - 0.01) {
        return { found: candidate, last };
      }
    }
    return { found: null, last };
  }
  function separateFillFromSurface(fill, surface, separation, textFloor) {
    const { found, last } = walkFillOffSurfaces(fill, [surface], separation, textFloor);
    return found ?? last;
  }
  function floorFillOnSurfaces(fill, surfaces, textFloor) {
    return walkFillOffSurfaces(fill, surfaces, FILL_SURFACE_TARGET, textFloor).found ?? separateFillFromSurface(fill, surfaces[0], SURFACE_SEPARATION, textFloor);
  }
  function borderForContrast(seed, surface, minContrast) {
    const surfaceCss = formatCss(surface);
    if (emittedContrast(seed, surfaceCss) >= minContrast)
      return seed;
    const targetL = surface.l < 0.5 ? 1 : 0;
    let candidate = seed;
    for (let i = 1; i <= 100; i++) {
      candidate = withLightness(seed, seed.l + (targetL - seed.l) * (i / 100));
      if (emittedContrast(candidate, surfaceCss) >= minContrast)
        break;
    }
    return candidate;
  }
  function ringForContrast(seed, surfaces, floor) {
    const backdrops = surfaces.map(formatCss);
    if (backdrops.length === 0)
      return seed;
    const worst = (candidate) => Math.min(...backdrops.map((bg) => contrast(formatCss(flatten(formatCss(candidate), bg)), bg)));
    if (worst(seed) >= floor)
      return seed;
    const meanL = surfaces.reduce((sum, s) => sum + s.l, 0) / surfaces.length;
    const away = meanL < 0.5 ? 1 : 0;
    let best = seed;
    let bestRatio = worst(seed);
    for (const keepChroma of [true, false]) {
      for (const targetL of [away, 1 - away]) {
        for (let i = 1; i <= 100; i++) {
          const t = i / 100;
          const candidate = {
            l: seed.l + (targetL - seed.l) * t,
            c: keepChroma ? seed.c : seed.c * (1 - t),
            h: seed.h,
            alpha: seed.alpha
          };
          const ratio = worst(candidate);
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = candidate;
          }
          if (ratio >= floor)
            return candidate;
        }
      }
    }
    return best;
  }
  function readableOnTint(tint, hue, floor, inkChroma) {
    const tintCss = formatCss(tint);
    const towardDark = contrast("#000000", tintCss) >= contrast("#ffffff", tintCss);
    const targetL = towardDark ? 0 : 1;
    const seedChroma = inkChroma ?? (towardDark ? 0.06 : 0.04);
    const seed = oklch(tint.l + (towardDark ? -0.4 : 0.4), seedChroma, hue);
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const css = formatCss({
        l: seed.l + (targetL - seed.l) * t,
        c: seed.c * (1 - t),
        h: hue,
        alpha: 1
      });
      if (contrast(css, tintCss) >= floor)
        return css;
    }
    return towardDark ? "#000000" : "#ffffff";
  }
  function readableHuedOnTintAndPanel(tint, hue, tintFloor, panels, panelFloor, seedChroma) {
    const tintCss = formatCss(tint);
    const panelCss = panels.map((p) => formatCss(p));
    const sweep = (towardDark) => {
      const targetL = towardDark ? 0 : 1;
      const seed = towardDark ? oklch(tint.l - 0.4, seedChroma, hue) : oklch(tint.l + 0.4, seedChroma * 0.667, hue);
      const out = [];
      for (let i = 0; i <= 100; i++) {
        const t = i / 100;
        out.push(formatCss({
          l: seed.l + (targetL - seed.l) * t,
          c: seed.c * (1 - t),
          h: hue,
          alpha: 1
        }));
      }
      return out;
    };
    const minPanel = (css) => panelCss.length === 0 ? Infinity : Math.min(...panelCss.map((p) => contrast(css, p)));
    let best = null;
    let bestMin = -1;
    for (const towardDark of [true, false]) {
      for (const css of sweep(towardDark)) {
        if (contrast(css, tintCss) < tintFloor)
          continue;
        const m = minPanel(css);
        if (m >= panelFloor)
          return css;
        if (m > bestMin) {
          bestMin = m;
          best = css;
        }
      }
    }
    return best ?? readableOnTint(tint, hue, tintFloor);
  }
  function vividOnPanel(hue, panels, floor, targetChroma) {
    const panelCss = panels.map((p) => formatCss(p));
    const minPanel = (css) => panelCss.length === 0 ? Infinity : Math.min(...panelCss.map((p) => contrast(css, p)));
    const avgL = panels.reduce((sum, p) => sum + p.l, 0) / Math.max(1, panels.length);
    const towardLight = avgL < 0.5;
    let best = null;
    let bestChroma = -1;
    for (let i = 0; i <= 80; i++) {
      const t = i / 80;
      const l = towardLight ? 0.5 + t * 0.45 : 0.5 - t * 0.42;
      const chroma = clampToGamut(oklch(l, targetChroma, hue)).c;
      const css = formatCss(oklch(l, chroma, hue));
      if (minPanel(css) >= floor && chroma > bestChroma) {
        bestChroma = chroma;
        best = css;
      }
    }
    return best ?? (towardLight ? "#ffffff" : "#000000");
  }
  function deriveAccentAnchor(bg, fg) {
    const sourceHue = bg.c >= ACHROMATIC_CHROMA ? bg.h : fg.c >= ACHROMATIC_CHROMA ? fg.h : void 0;
    const hue = sourceHue === void 0 ? DERIVED_ACCENT_FALLBACK_HUE : ((sourceHue + DERIVED_ACCENT_HUE_ROTATION) % 360 + 360) % 360;
    return clampToGamut(oklch(DERIVED_ACCENT_L, DERIVED_ACCENT_C, hue));
  }
  function shadowString(scheme, level, vibrancy, preset) {
    if (level <= 0)
      return "none";
    const baseAlpha = (scheme === "dark" ? 0.5 : 0.16) + vibrancy * 0.1 + preset.elevationAlphaBoost;
    const y = Math.max(1, Math.round(level * 2 * preset.elevationStrengthMul));
    const blur = Math.max(1, Math.round(level * 4 * preset.elevationStrengthMul));
    const spread = Math.max(0, level - 3);
    const alpha2 = Math.min(0.92, baseAlpha + level * 0.04);
    const ambientY = Math.max(1, Math.round(level / 2));
    const ambientBlur = Math.max(1, Math.round(level * 2 * preset.elevationStrengthMul));
    const ambientAlpha = Math.min(0.7, alpha2 * 0.6);
    return [
      `0 ${y}px ${blur}px ${spread}px rgba(0, 0, 0, ${alpha2.toFixed(2)})`,
      `0 ${ambientY}px ${ambientBlur}px 0 rgba(0, 0, 0, ${ambientAlpha.toFixed(2)})`
    ].join(", ");
  }
  function paletteRamp(register, hue, spec2, scheme, vibrancy, floor, preset, accent, panels, pinnedBase) {
    const set = (suffix, color) => {
      register[suffix ? `--color-${hue}-${suffix}` : `--color-${hue}`] = formatCss(color);
    };
    const family = (solid, bg, fg, text, vivid) => {
      register[`--${hue}`] = solid;
      register[`--${hue}-bg`] = bg;
      register[`--${hue}-fg`] = fg;
      register[`--${hue}-text`] = text;
      register[`--${hue}-vivid`] = vivid;
    };
    const page = panels[0];
    const offPage = (fill) => separateFillFromSurface(fill, page, SURFACE_SEPARATION, floor);
    const grayscale = (lights, chroma2) => {
      const stops2 = lights.map((l) => oklch(l, chroma2, 0));
      const baseStop = stops2[2];
      const solidBase2 = offPage(pinnedBase ?? baseStop);
      const subtleStop2 = stops2[0];
      const strongStop2 = liftStopForContrast(stops2[3], formatCss(subtleStop2), AA + 0.2, stops2[3].l >= subtleStop2.l);
      const stopInk = readableOnTint(baseStop, 0, AA + 0.3, 0);
      const solidInk = readableOnTint(solidBase2, 0, AA + 0.3, 0);
      set("", baseStop);
      set("subtle", subtleStop2);
      set("muted", stops2[1]);
      set("base", baseStop);
      set("strong", strongStop2);
      register[`--color-${hue}-contrast`] = stopInk;
      family(formatCss(solidBase2), formatCss(subtleStop2), solidInk, readableOnTint(subtleStop2, 0, AA + 0.2, 0), vividOnPanel(0, panels, floor, 0));
    };
    if (spec2 === "white") {
      grayscale([0.82, 0.9, 0.97, 1], 0);
      return;
    }
    if (spec2 === "black") {
      grayscale([0.05, 0.12, 0.2, 0.32], 0);
      return;
    }
    if (spec2 === "gray") {
      grayscale(scheme === "dark" ? [0.4, 0.55, 0.68, 0.82] : [0.82, 0.68, 0.55, 0.4], 5e-3);
      return;
    }
    const accentChromaFactor = Math.max(0.5, Math.min(1.6, accent.c / NEUTRAL_ACCENT_CHROMA));
    const chroma = spec2.c * accentChromaFactor * (0.6 + vibrancy * 0.7) * preset.paletteChromaMul;
    const baseL = scheme === "dark" ? 0.7 : 0.55;
    const lBias = Math.max(-0.06, Math.min(0.06, (accent.l - baseL) * 0.25));
    const ladderL = (scheme === "dark" ? [0.45, 0.58, baseL, 0.82] : [0.78, 0.66, baseL, 0.42]).map((l) => Math.max(0.05, Math.min(0.97, l + lBias + (spec2.l ?? 0))));
    const ladderC = [chroma * 0.7, chroma * 0.9, chroma, chroma * 0.85];
    const stops = ladderL.map((l, i) => clampToGamut(oklch(l, ladderC[i], spec2.h)));
    const base = stops[2];
    const solidBase = pinnedBase ?? base;
    const subtleStop = stops[0];
    const strongStop = liftStopForContrast(stops[3], formatCss(subtleStop), AA + 0.2, stops[3].l >= subtleStop.l);
    const contrast2 = readableOnTint(solidBase, spec2.h, Math.max(floor, AA + 0.3));
    set("", base);
    set("subtle", subtleStop);
    set("muted", stops[1]);
    set("base", base);
    set("strong", strongStop);
    register[`--color-${hue}-contrast`] = contrast2;
    const bg0p = panels[0];
    const washL = scheme === "dark" ? Math.max(0.2, bg0p.l + 0.08) : Math.min(0.92, bg0p.l - 0.04);
    const bgTint = ensureTextHeadroom(oklch(washL, chroma * 0.35, spec2.h), scheme, AA + 0.3);
    const bgText = readableHuedOnTintAndPanel(bgTint, spec2.h, AA + 0.3, panels.slice(1), AA + 0.05, chroma);
    family(formatCss(solidBase), formatCss(bgTint), contrast2, bgText, vividOnPanel(spec2.h, panels, floor, chroma));
  }
  function schemeFromFg(fg) {
    return fg.l >= 0.5 ? "dark" : "light";
  }
  function deriveSurface(scheme, hue, chroma, depth, floor) {
    const l = scheme === "dark" ? depth : 1 - depth;
    return ensureTextHeadroom(oklch(l, chroma, hue), scheme, floor);
  }
  function completeAnchors(preset, opts) {
    const pin = opts.constraints ?? {};
    const givenBg = parsePin(pin["--bg-0"]);
    const givenFg = parsePin(pin["--fg-0"]);
    const givenAccent = parsePin(pin["--accent"]);
    const baseScheme = schemeOf(toOklchColor(preset.defaultAnchors.bg));
    const scheme = opts.knobs?.scheme ?? (givenBg ? schemeOf(givenBg) : givenFg ? schemeFromFg(givenFg) : baseScheme);
    const anchors = preset.anchorsByScheme?.[scheme] ?? preset.defaultAnchors;
    const defBg = toOklchColor(anchors.bg);
    const defFg = toOklchColor(anchors.fg);
    const defScheme = schemeOf(defBg);
    const surfaceDepth = defScheme === "dark" ? defBg.l : 1 - defBg.l;
    const floor = Math.max(ENFORCE, preset.contrastFloor);
    let bg;
    if (givenBg) {
      bg = scheme === schemeOf(givenBg) ? givenBg : withLightness(givenBg, 1 - givenBg.l);
    } else if (givenAccent || givenFg) {
      const hue = givenAccent?.h ?? givenFg.h;
      const tint = givenAccent ? DERIVED_SURFACE_TINT_C : 5e-3;
      bg = deriveSurface(scheme, hue, tint, surfaceDepth, floor);
    } else {
      bg = scheme === defScheme ? defBg : withLightness(defBg, 1 - defBg.l);
    }
    const fg = givenFg ?? defFg;
    const accentExplicit = givenAccent !== null || anchors.accent !== void 0;
    const accent = givenAccent ?? (anchors.accent ? toOklchColor(anchors.accent) : deriveAccentAnchor(bg, fg));
    return { bg, fg, accent, scheme, accentExplicit };
  }
  function parsePin(value) {
    if (!value)
      return null;
    try {
      const o = toOklchColor(value);
      if (Number.isNaN(o.l) || Number.isNaN(o.c))
        return null;
      return o;
    } catch {
      return null;
    }
  }
  function parseChromaticPin(value) {
    const o = parsePin(value);
    if (!o || Number.isNaN(o.h) || o.c < ACHROMATIC_CHROMA)
      return null;
    return o;
  }
  function paletteHueAngle(name) {
    const spec2 = PALETTE_HUES[name];
    return typeof spec2 === "object" ? spec2.h : 0;
  }
  function resolveStatusHue(role, pinned) {
    const name = STATUS_TO_HUE[role] ?? "red";
    const pin = parseChromaticPin(pinned[`--${name}`] ?? pinned[`--color-${name}-base`] ?? pinned[`--color-${name}`]);
    return pin ? pin.h : paletteHueAngle(name);
  }
  var STATUS_ACCENT_MIN_HUE_SEPARATION = 30;
  var ACCENT_COLLISION_GUARDED = /* @__PURE__ */ new Set(["danger"]);
  function separateFromAccent(roleHue, accentHue, otherHues) {
    const delta = hueDelta(accentHue, roleHue);
    if (Math.abs(delta) >= STATUS_ACCENT_MIN_HUE_SEPARATION)
      return roleHue;
    if (delta !== 0)
      return accentHue + Math.sign(delta) * STATUS_ACCENT_MIN_HUE_SEPARATION;
    const clearance = (candidate) => otherHues.reduce((min, other) => Math.min(min, Math.abs(hueDelta(candidate, other))), 360);
    const ahead = accentHue + STATUS_ACCENT_MIN_HUE_SEPARATION;
    const behind = accentHue - STATUS_ACCENT_MIN_HUE_SEPARATION;
    return clearance(ahead) >= clearance(behind) ? ahead : behind;
  }
  var GRAPH_CACHE_LIMIT = 16;
  var graphCaches = /* @__PURE__ */ new WeakMap();
  function buildGraph(preset, opts) {
    let cache = graphCaches.get(preset);
    if (!cache)
      graphCaches.set(preset, cache = /* @__PURE__ */ new Map());
    const key = JSON.stringify(opts ?? {});
    const hit = cache.get(key);
    if (hit)
      return hit;
    const nodes = buildGraphUncached(preset, opts);
    cache.set(key, nodes);
    if (cache.size > GRAPH_CACHE_LIMIT) {
      const oldest = cache.keys().next().value;
      cache.delete(oldest);
    }
    return nodes;
  }
  function buildGraphUncached(preset, opts) {
    const completed = completeAnchors(preset, opts);
    const bg = completed.bg;
    const fgAnchor = completed.fg;
    const pinned = opts.constraints ?? {};
    const accent = pinned["--accent"] ? toOklchColor(pinned["--accent"]) : completed.accent;
    const scheme = completed.scheme;
    const knobs = opts.knobs ?? {};
    const { strategy, split: accentSplit, shiftStep } = resolveAccentKnobs(preset, knobs);
    const band = contrastBandFloor(knobs);
    const floor = Math.max(ENFORCE, preset.contrastFloor, (band ?? 0) + 0.2);
    const extreme = preset.extreme === true;
    let vibrancy = vibrancyOf(knobs, preset);
    if (extreme)
      vibrancy = 1;
    const typeScale = typeScaleOf(knobs);
    const radiusScale = radiusScaleOf(knobs);
    const density = densityOf(knobs);
    const fonts = fontsOf(knobs);
    const surfaceRamp = typeof knobs.surfaceRamp === "number" ? knobs.surfaceRamp : defaultSurfaceRamp(scheme);
    const nodes = [];
    const lit = (name, value, refs) => {
      nodes.push(refs && refs.length ? { name, value, refs } : { name, value });
    };
    const pinKeys = new Set(Object.keys(pinned));
    const refIfPinned = (...names) => names.filter((n) => pinKeys.has(n));
    lit("--scheme", scheme);
    const pinnedSurface = (token, derived) => pinned[token] ? toOklchColor(pinned[token]) : derived;
    const bg0 = pinned["--bg-0"] ? toOklchColor(pinned["--bg-0"]) : extreme ? oklch(scheme === "dark" ? 0 : 1, 0, 0) : ensureTextHeadroom(withLightness(bg, bg.l + surfaceRamp), scheme, floor);
    const surfacePins = SURFACES.map((name) => pinned[name] ? toOklchColor(pinned[name]) : null);
    const ladder = solveSurfaceLadder(surfacePins, bg0.l, surfaceRamp);
    const surfaceRefs = (index) => [
      .../* @__PURE__ */ new Set([...refIfPinned("--bg-0"), ...ladder.sources[index]])
    ];
    const surfaceColors = SURFACES.map((_, index) => surfacePins[index] ?? withLightness(bg0, ladder.lightness[index]));
    SURFACES.forEach((name, index) => {
      lit(name, formatCss(surfaceColors[index]), surfaceRefs(index));
    });
    const fillSurfaces = SURFACE_ROLES.map((role) => surfaceColors[SURFACES.indexOf(role)]);
    const pageFloor = (fill) => floorFillOnSurfaces(fill, fillSurfaces, floor);
    const bottomStep = ladder.lightness[1] - ladder.lightness[0];
    lit("--bg-sunken", formatCss(withLightness(bg0, ladder.lightness[0] - bottomStep)), [.../* @__PURE__ */ new Set([...surfaceRefs(0), ...surfaceRefs(1)])]);
    lit("--scrim", formatCss(oklch(scheme === "dark" ? 0 : 0.1, 0, 0, 0.6)));
    const overlayBase = withLightness(bg0, scheme === "dark" ? bg0.l + 0.07 : bg0.l + 0.03);
    lit("--surface-overlay", formatCss(overlayBase), refIfPinned("--bg-0"));
    lit("--surface-overlay-border", formatCss(withAlpha(withLightness(bg0, scheme === "dark" ? bg0.l + 0.25 : bg0.l - 0.2), 0.6)), refIfPinned("--bg-0"));
    const fg0 = pinned["--fg-0"] ? toOklchColor(pinned["--fg-0"]) : extreme ? bestTruePole(formatCss(bg0)) : enforceContrastFloor(withLightness(fgAnchor, scheme === "dark" ? Math.max(fgAnchor.l, 0.9) : Math.min(fgAnchor.l, 0.2)), bg0, scheme, floor);
    lit("--fg-0", formatCss(fg0), refIfPinned("--bg-0", "--fg-0"));
    const fgBg0Css = formatCss(bg0);
    const fg0Contrast = emittedContrast(fg0, fgBg0Css);
    const panelRef = surfaceColors[PANEL_REF_INDEX];
    const panelRefCss = formatCss(panelRef);
    const panelSurfaces = PANEL_SURFACES.map((s) => surfaceColors[SURFACES.indexOf(s)]);
    const rampFloor = extreme ? Math.min(fg0Contrast, Math.max(floor, fg0Contrast * 0.66)) : Math.min(floor, fg0Contrast);
    const conservativeFloorL = (target) => {
      const againstBg0 = lightnessForContrast(fg0, bg0, fgBg0Css, target);
      const againstPanel = lightnessForContrast(fg0, panelRef, panelRefCss, target);
      return Math.abs(againstBg0 - fg0.l) <= Math.abs(againstPanel - fg0.l) ? againstBg0 : againstPanel;
    };
    const textLight = scheme === "dark";
    const enforceOnPanels = (color) => {
      const onBg0 = enforceContrastFloor(color, bg0, scheme, floor);
      const sameSidePanels = panelSurfaces.filter((p) => p.l < 0.5 === textLight);
      if (sameSidePanels.length === 0)
        return onBg0;
      const panelCss = sameSidePanels.map((p) => formatCss(p));
      const minPanel = (c) => Math.min(...panelCss.map((p) => emittedContrast(c, p)));
      if (minPanel(onBg0) >= floor - 0.01)
        return onBg0;
      const targetL = textLight ? 1 : 0;
      let best = onBg0;
      let bestMin = minPanel(onBg0);
      for (let i = 1; i <= 100; i++) {
        const t = i / 100;
        const candidate = withLightness(onBg0, onBg0.l + (targetL - onBg0.l) * t);
        if (emittedContrast(candidate, fgBg0Css) < floor - 0.01)
          break;
        const m = minPanel(candidate);
        if (m > bestMin) {
          bestMin = m;
          best = candidate;
        }
        if (m >= floor)
          break;
      }
      return best;
    };
    const enforceChromaticOnPanels = (color) => {
      const bg0Css = formatCss(bg0);
      const sameSidePanels = panelSurfaces.filter((p) => p.l < 0.5 === textLight);
      const refsCss = [bg0Css, ...sameSidePanels.map((p) => formatCss(p))];
      const minRef = (c) => Math.min(...refsCss.map((r) => emittedContrast(c, r)));
      if (minRef(color) >= floor - 0.01)
        return color;
      const targetL = textLight ? 1 : 0;
      for (let i = 1; i <= 100; i++) {
        const candidate = withLightness(color, color.l + (targetL - color.l) * (i / 100));
        if (minRef(candidate) >= floor)
          return candidate;
      }
      return enforceOnPanels(color);
    };
    const floorL = conservativeFloorL(rampFloor);
    for (let i = 1; i <= 3; i++) {
      const reduced = withLightness(fg0, fg0.l + (floorL - fg0.l) * (i / 3));
      lit(`--fg-${i}`, formatCss(reduced), ["--fg-0", ...refIfPinned("--bg-0")]);
    }
    lit("--fg-disabled", formatCss(withLightness(fg0, conservativeFloorL(3))), ["--fg-0", ...refIfPinned("--bg-0")]);
    const placeholderFloor = extreme ? rampFloor : Math.min(floor, fg0Contrast);
    const placeholderL = conservativeFloorL(placeholderFloor);
    lit("--placeholder", formatCss(withLightness(fg0, placeholderL)), ["--fg-0", ...refIfPinned("--bg-0")]);
    const accentFill = pinned["--accent"] ? accent : completed.accentExplicit ? pageFloor(accent) : pageFloor(fillWithTextHeadroom(accent.l, accent.c * (0.6 + vibrancy * 0.8) * preset.accentChromaMul, accent.h, floor));
    const accentValue = pinned["--accent"] ?? formatCss(accentFill);
    lit("--accent", accentValue, refIfPinned("--accent"));
    lit("--accent-fg", pickReadable(accentFill, TEXT_POLES, floor), ["--accent"]);
    const accentTextColor = enforceChromaticOnPanels(accentFill);
    const accentTextCss = formatCss(accentTextColor);
    const pinnedAccentTint = parsePin(pinned["--accent-bg"]);
    const accentTint = pinnedAccentTint ?? separateTintFromFill(liftStopForContrast(oklch(scheme === "dark" ? Math.max(0.2, bg0.l + 0.08) : Math.min(0.92, bg0.l - 0.04), accentFill.c * preset.accentTintChromaMul, accentFill.h), accentTextCss, AA + 0.2, bestTruePole(accentTextCss) === TRUE_WHITE), accentFill, accentTextCss, AA + 0.2, bestTruePole(accentTextCss) === TRUE_WHITE);
    const accentTextOnTint = pinnedAccentTint ? readableHuedOnTintAndPanel(accentTint, accentFill.h, AA + 0.3, panelSurfaces, AA + 0.05, accentFill.c) : accentTextCss;
    lit("--accent-bg", formatCss(accentTint), ["--accent", ...refIfPinned("--bg-0")]);
    lit("--accent-text", accentTextOnTint, ["--accent", ...refIfPinned("--bg-0")]);
    lit("--accent-vivid", vividOnPanel(accentFill.h, [bg0, ...panelSurfaces], floor, accentFill.c), ["--accent", ...refIfPinned("--bg-0")]);
    const pinnedNeutral = parsePin(pinned["--neutral"]);
    const neutralFill = pinnedNeutral ?? pageFloor(fillWithTextHeadroom(scheme === "dark" ? 0.6 : 0.5, preset.neutralChroma, accentFill.h, floor));
    const neutralTintHue = Number.isFinite(neutralFill.h) ? neutralFill.h : accentFill.h;
    lit("--neutral", formatCss(neutralFill), ["--accent", ...refIfPinned("--neutral")]);
    const neutralTextColor = extreme ? enforceOnPanels(neutralFill) : enforceChromaticOnPanels(neutralFill);
    const neutralTextCss = formatCss(neutralTextColor);
    const neutralInkRefs = [bg0, ...panelSurfaces.filter((p) => p.l < 0.5 === textLight)].map((s) => formatCss(s));
    const neutralVividColor = (() => {
      const clearsAAA = (c) => neutralInkRefs.every((r) => emittedContrast(c, r) >= AAA);
      const towardL = textLight ? 1 : 0;
      let candidate = neutralTextColor;
      for (let i = 1; i <= 100 && !clearsAAA(candidate); i++) {
        candidate = withLightness(neutralTextColor, neutralTextColor.l + (towardL - neutralTextColor.l) * (i / 100));
      }
      return candidate;
    })();
    const neutralTintSeed = oklch(scheme === "dark" ? Math.max(0.2, bg0.l + 0.06) : Math.min(0.92, bg0.l - 0.04), 5e-3, neutralTintHue);
    const neutralTintTarget = AA + 0.2;
    const neutralTintLeaned = liftStopForContrast(neutralTintSeed, neutralTextCss, neutralTintTarget, neutralTextColor.l < 0.5);
    const neutralTint = contrast(formatCss(neutralTintLeaned), neutralTextCss) >= neutralTintTarget ? neutralTintLeaned : liftStopForContrast(neutralTintSeed, neutralTextCss, neutralTintTarget, neutralTextColor.l >= 0.5);
    lit("--neutral-bg", formatCss(neutralTint), ["--accent", ...refIfPinned("--bg-0")]);
    lit("--neutral-fg", pickReadable(neutralFill, TEXT_POLES, floor), ["--neutral"]);
    lit("--neutral-text", neutralTextCss, ["--neutral", ...refIfPinned("--bg-0")]);
    lit("--neutral-vivid", formatCss(neutralVividColor), ["--neutral-text", ...refIfPinned("--bg-0")]);
    const lineSeed = extreme ? oklch(scheme === "dark" ? 0.7 : 0.3, 0, 0) : withLightness(bg0, scheme === "dark" ? bg0.l + 0.12 : bg0.l - 0.12);
    lit("--line", formatCss(borderForContrast(lineSeed, bg0, BORDER_SEPARATION)), refIfPinned("--bg-0"));
    const line2Seed = extreme ? oklch(scheme === "dark" ? 0.85 : 0.15, 0, 0) : withLightness(bg0, scheme === "dark" ? bg0.l + 0.2 : bg0.l - 0.2);
    const line2Color = borderForContrast(line2Seed, bg0, DIVIDER_SEPARATION);
    lit("--line-2", formatCss(line2Color), refIfPinned("--bg-0"));
    lit("--scrollbar-track", "transparent");
    lit("--scrollbar-thumb", formatCss(line2Color), ["--line-2", ...refIfPinned("--bg-0")]);
    lit("--scrollbar-thumb-hover", formatCss(withLightness(line2Color, line2Color.l + (scheme === "dark" ? 0.12 : -0.12))), ["--scrollbar-thumb"]);
    const ringSurfaces = RING_SURFACE_INDICES.map((index) => surfaceColors[index]);
    const ringColor = ringForContrast(withAlpha(accentFill, 0.7), ringSurfaces, preset.declaredFocusRingFloor);
    const ringRefs = ["--accent", ...refIfPinned("--bg-0")];
    lit("--ring", formatCss(ringColor), ringRefs);
    lit("--ring-bg", formatCss(withAlpha(ringColor, 0.18)), ["--ring"]);
    const fieldBg = pinnedSurface("--field-bg", withLightness(bg0, scheme === "dark" ? bg0.l - 0.03 : bg0.l + 0.02));
    lit("--field-bg", formatCss(fieldBg), refIfPinned("--bg-0"));
    const fieldBorderSeed = extreme ? oklch(scheme === "dark" ? 0.8 : 0.2, 0, 0) : withLightness(bg0, scheme === "dark" ? bg0.l + 0.16 : bg0.l - 0.16);
    lit("--field-border", formatCss(borderForContrast(fieldBorderSeed, fieldBg, BORDER_SEPARATION)), refIfPinned("--bg-0"));
    const lineStrong = [fieldBg, ...fillSurfaces].reduce((edge, surface) => borderForContrast(edge, surface, CONTROL_EDGE_FLOOR), fieldBorderSeed);
    lit("--line-strong", formatCss(lineStrong), [.../* @__PURE__ */ new Set([...refIfPinned("--bg-0"), ...refIfPinned("--field-bg")])]);
    lit("--accent-hover", formatCss(withLightness(accentFill, accentFill.l + (scheme === "dark" ? 0.06 : -0.06))), ["--accent"]);
    lit("--accent-active", formatCss(withLightness(accentFill, accentFill.l + (scheme === "dark" ? -0.06 : 0.06))), ["--accent"]);
    const accentDisplay = toOklchColor(accentValue);
    const accentDelta = (from, to) => ({
      dL: to.l - from.l,
      dC: to.c - from.c,
      dH: hueDelta(from.h, to.h)
    });
    const applyAccentDelta = (from, delta) => {
      const rawL = from.l + delta.dL;
      const l = delta.dL === 0 ? Math.min(1, Math.max(0, rawL)) : Math.min(ACCENT_RAMP_L_MAX, Math.max(ACCENT_RAMP_L_MIN, rawL));
      return {
        l,
        c: Math.max(0, from.c + delta.dC),
        h: ((from.h + delta.dH) % 360 + 360) % 360,
        alpha: 1
      };
    };
    const emitAccent = (color) => {
      const maxC = clampToGamut({ l: color.l, c: color.c, h: color.h, alpha: 1 }).c;
      return formatCss({ ...color, c: Math.min(color.c, maxC) });
    };
    const a1 = accentDisplay;
    const fanBase = { ...a1, c: Math.max(a1.c, FAN_MIN_CHROMA) };
    const hueFanBase = chromaCapableBase(fanBase);
    const rotate = (deg) => ({ dL: 0, dC: 0, dH: deg });
    const fanned = (n, derived) => pinned[`--accent-${n}`] ? toOklchColor(pinned[`--accent-${n}`]) : derived;
    let a2;
    let a3;
    let a4;
    let a2Refs;
    let a3Refs;
    let a4Refs;
    if (strategy === "fan") {
      const mirrorOf = (c) => applyAccentDelta(hueFanBase, rotate(-hueDelta(a1.h, c.h)));
      const a2Pin = pinned["--accent-2"];
      const a3Pin = pinned["--accent-3"];
      let a2Derived = applyAccentDelta(hueFanBase, rotate(-accentSplit));
      let a3Derived = applyAccentDelta(hueFanBase, rotate(accentSplit));
      if (a2Pin && !a3Pin)
        a3Derived = mirrorOf(toOklchColor(a2Pin));
      else if (a3Pin && !a2Pin)
        a2Derived = mirrorOf(toOklchColor(a3Pin));
      a2 = fanned("2", a2Derived);
      a3 = fanned("3", a3Derived);
      a4 = fanned("4", applyAccentDelta(hueFanBase, rotate(fanFourthOffset(a1.h, a2.h, a3.h))));
      a2Refs = a3Pin && !a2Pin ? ["--accent", "--accent-3"] : ["--accent"];
      a3Refs = a2Pin && !a3Pin ? ["--accent", "--accent-2"] : ["--accent"];
      a4Refs = a2Pin || a3Pin ? ["--accent", "--accent-2", "--accent-3"] : ["--accent"];
    } else if (strategy === "shade") {
      const rungs = shadeLadderRungs(fanBase.l);
      a2 = fanned("2", applyAccentDelta(fanBase, { dL: rungs[0], dC: 0, dH: 0 }));
      a3 = fanned("3", applyAccentDelta(fanBase, { dL: rungs[1], dC: 0, dH: 0 }));
      a4 = fanned("4", applyAccentDelta(fanBase, { dL: rungs[2], dC: 0, dH: 0 }));
      a2Refs = ["--accent"];
      a3Refs = ["--accent"];
      a4Refs = ["--accent"];
    } else if (strategy === "duo") {
      a2 = fanned("2", applyAccentDelta(fanBase, rotate(accentSplit)));
      const midL = (a1.l + a2.l) / 2;
      const away = scheme === "dark" ? 1 : -1;
      const room = (dir2) => {
        const target = midL + dir2 * DUO_L_STEP;
        return target <= ACCENT_RAMP_L_MAX && target >= ACCENT_RAMP_L_MIN;
      };
      const dir = room(away) ? away : -away;
      const steppedL = Math.min(ACCENT_RAMP_L_MAX, Math.max(ACCENT_RAMP_L_MIN, midL + dir * DUO_L_STEP));
      const shadeL = chromaCapableBase({ l: steppedL, c: FAN_MIN_CHROMA, h: a1.h, alpha: 1 }).l;
      const shadeOf = (brand) => ({
        l: shadeL,
        c: Math.max(brand.c, FAN_MIN_CHROMA),
        h: brand.h,
        alpha: 1
      });
      const firstShade = shadeOf(a1);
      const secondShade = shadeOf(a2);
      const shadesRead = Math.abs(hueDelta(firstShade.h, secondShade.h)) * Math.min(firstShade.c, secondShade.c);
      const stepped = shadesRead < ACCENT_FAMILY_HUE_ARC ? { ...secondShade, l: Math.min(ACCENT_RAMP_L_MAX, Math.max(ACCENT_RAMP_L_MIN, shadeL - dir * DUO_L_STEP)) } : secondShade;
      a3 = fanned("3", firstShade);
      a4 = fanned("4", stepped);
      a2Refs = ["--accent"];
      a3Refs = ["--accent", "--accent-2"];
      a4Refs = ["--accent-2", "--accent"];
    } else {
      a2 = fanned("2", applyAccentDelta(hueFanBase, rotate(shiftStep)));
      a3 = fanned("3", applyAccentDelta(a2, accentDelta(hueFanBase, a2)));
      a4 = fanned("4", applyAccentDelta(a3, accentDelta(a2, a3)));
      a2Refs = ["--accent", "--accent-shift-step"];
      a3Refs = ["--accent-2", "--accent"];
      a4Refs = ["--accent-3", "--accent-2"];
    }
    lit("--accent-2", emitAccent(a2), a2Refs);
    lit("--accent-3", emitAccent(a3), a3Refs);
    lit("--accent-4", emitAccent(a4), a4Refs);
    lit("--accent-shift-step", String(shiftStep));
    const emitAccentFamily = (n, raw) => {
      const color = toOklchColor(emitAccent(raw));
      lit(`--accent-${n}-fg`, pickReadable(color, TEXT_POLES, floor), [`--accent-${n}`]);
      const tint = pinnedSurface(`--accent-${n}-bg`, oklch(scheme === "dark" ? Math.max(0.2, bg0.l + 0.08) : Math.min(0.92, bg0.l - 0.04), color.c * preset.accentTintChromaMul, color.h));
      lit(`--accent-${n}-bg`, formatCss(tint), [`--accent-${n}`, ...refIfPinned("--bg-0")]);
      lit(`--accent-${n}-text`, readableHuedOnTintAndPanel(tint, color.h, AA + 0.3, panelSurfaces, AA + 0.05, color.c), [`--accent-${n}-bg`, ...refIfPinned("--bg-0")]);
      lit(`--accent-${n}-vivid`, vividOnPanel(color.h, [bg0, ...panelSurfaces], floor, color.c), [`--accent-${n}`, ...refIfPinned("--bg-0")]);
    };
    emitAccentFamily("2", a2);
    emitAccentFamily("3", a3);
    emitAccentFamily("4", a4);
    lit("--selection-cue", extreme || knobs.cues === "redundant" ? "marker" : "tint");
    const statusChroma = Math.max(0.12, accent.c) * (0.6 + vibrancy * 0.7) * preset.statusChromaMul;
    const accentIsChromatic = accent.c >= ACHROMATIC_CHROMA;
    const statusRoles = Object.keys(STATUS_TO_HUE);
    const statusFillL = scheme === "dark" ? 0.62 : 0.52;
    const fillAtHue = (hue) => fillWithTextHeadroom(statusFillL, statusChroma, hue, floor);
    const readsAsAccent = (hue) => oklabDistance(formatCss(floorFillOnSurfaces(fillAtHue(hue), fillSurfaces, floor)), formatCss(accentFill)) < ACCENT_STATUS_SEPARATION;
    const statusHues = /* @__PURE__ */ new Map();
    const statusHueOf = (role) => {
      const known = statusHues.get(role);
      if (known !== void 0)
        return known;
      const pinnedFill = parseChromaticPin(pinned[`--${role}`]);
      const namedHue = resolveStatusHue(role, pinned);
      const others = statusRoles.filter((other) => other !== role).map((other) => resolveStatusHue(other, pinned));
      let hue = namedHue;
      if (pinnedFill)
        hue = pinnedFill.h;
      else if (accentIsChromatic && ACCENT_COLLISION_GUARDED.has(role))
        hue = separateFromAccent(namedHue, accent.h, others);
      else if (accentIsChromatic && readsAsAccent(namedHue)) {
        const pushed = separateFromAccent(namedHue, accentFill.h, others);
        const side = Math.sign(hueDelta(namedHue, pushed)) || Math.sign(hueDelta(accentFill.h, namedHue)) || 1;
        hue = namedHue + side * STATUS_ACCENT_MIN_HUE_SEPARATION;
        for (let step = 2; step < STATUS_ACCENT_MIN_HUE_SEPARATION; step += 2) {
          if (!readsAsAccent(namedHue + side * step)) {
            hue = namedHue + side * step;
            break;
          }
        }
      }
      statusHues.set(role, hue);
      return hue;
    };
    const statusBaseFill = (role) => fillAtHue(statusHueOf(role));
    const strongStatusFills = statusRoles.map((role) => parsePin(pinned[`--${role}`]) ?? walkFillOffSurfaces(statusBaseFill(role), fillSurfaces, FILL_SURFACE_TARGET, floor).found);
    const statusFloorHolds = strongStatusFills.every((fill) => fill !== null) && strongStatusFills.every((a, i) => strongStatusFills.every((b, j) => j <= i || oklabDistance(formatCss(a), formatCss(b)) >= STATUS_SEPARATION));
    for (const [index, role] of statusRoles.entries()) {
      const effectivePin = parsePin(pinned[`--${role}`]);
      const roleHue = statusHueOf(role);
      const fill = effectivePin ?? (statusFloorHolds ? strongStatusFills[index] : separateFillFromSurface(statusBaseFill(role), bg0, SURFACE_SEPARATION, floor));
      const tintL = scheme === "dark" ? Math.min(0.3, bg0.l + 0.08) : Math.min(0.92, bg0.l - 0.04);
      const tint = pinnedSurface(`--${role}-bg`, ensureTextHeadroom(oklch(tintL, statusChroma * 0.35, roleHue), scheme, AA + 0.3));
      const fillRefs = refIfPinned("--accent", `--${role}`);
      lit(`--${role}`, formatCss(fill), fillRefs);
      lit(`--${role}-bg`, formatCss(tint), [`--${role}`, ...refIfPinned("--bg-0")]);
      lit(`--${role}-fg`, pickReadable(fill, TEXT_POLES, floor), [`--${role}`]);
      lit(`--${role}-text`, readableHuedOnTintAndPanel(tint, roleHue, AA + 0.3, panelSurfaces, AA + 0.05, statusChroma), [`--${role}-bg`, ...refIfPinned("--bg-0")]);
      lit(`--${role}-vivid`, vividOnPanel(roleHue, [bg0, ...panelSurfaces], floor, statusChroma), [`--${role}`, ...refIfPinned("--bg-0")]);
    }
    const overlayL = scheme === "dark" ? 1 : 0;
    const extremeDist = scheme === "dark" ? bg0.l : 1 - bg0.l;
    const overlayBoost = 1 + Math.max(0, (0.15 - extremeDist) / 0.15) * 0.8;
    const overlay = (a) => formatCss(oklch(overlayL, 0, 0, Math.min(0.4, a * overlayBoost)));
    lit("--state-hover", overlay(0.06));
    lit("--state-press", overlay(0.12));
    lit("--state-selected", overlay(0.16));
    lit("--state-disabled", overlay(0.08));
    lit("--state-drag", overlay(0.1));
    lit("--selection", formatCss(withAlpha(accentFill, 0.3)), ["--accent"]);
    lit("--highlight", formatCss(withAlpha(oklch(scheme === "dark" ? 0.85 : 0.9, 0.16, paletteHueAngle("yellow")), 0.35)));
    const linkColor = enforceChromaticOnPanels(accent);
    const linkCss = formatCss(linkColor);
    let linkHoverColor = enforceChromaticOnPanels(withLightness(accent, accent.l + (scheme === "dark" ? 0.08 : -0.08)));
    if (oklabDistance(formatCss(linkHoverColor), linkCss) < LINK_HOVER_MIN_DELTA) {
      const pole = textLight ? 1 : 0;
      const toward = linkColor.l < pole ? 1 : -1;
      let best;
      let bestDelta = oklabDistance(formatCss(linkHoverColor), linkCss);
      const distinctHover = (candidate) => {
        const enforced = enforceChromaticOnPanels(candidate);
        const delta = oklabDistance(formatCss(enforced), linkCss);
        if (delta > bestDelta) {
          best = enforced;
          bestDelta = delta;
        }
        return delta < LINK_HOVER_MIN_DELTA ? void 0 : enforced;
      };
      let hover;
      for (let step = 0.1; step <= 0.6 && !hover; step += 0.05) {
        hover = distinctHover(withLightness(linkColor, linkColor.l + toward * step));
      }
      for (let step = 0.1; step <= 0.6 && !hover; step += 0.05) {
        hover = distinctHover(withLightness(linkColor, linkColor.l - toward * step));
      }
      for (let cut = 0.7; cut >= 0.05 && !hover; cut -= 0.15) {
        hover = distinctHover(oklch(linkColor.l, linkColor.c * cut, linkColor.h));
      }
      linkHoverColor = hover ?? best ?? linkHoverColor;
    }
    lit("--link", formatCss(linkColor), ["--accent", ...refIfPinned("--bg-0")]);
    lit("--link-hover", formatCss(linkHoverColor), ["--link", ...refIfPinned("--bg-0")]);
    for (const [hue, spec2] of Object.entries(PALETTE_HUES)) {
      const pinSource = pinned[`--${hue}`] ?? pinned[`--color-${hue}-base`] ?? pinned[`--color-${hue}`];
      const pinnedHue = typeof spec2 === "object" ? parseChromaticPin(pinSource) : null;
      const pinnedBase = parsePin(pinSource);
      const effectiveSpec = pinnedHue && typeof spec2 === "object" ? { h: pinnedHue.h, c: pinnedHue.c } : spec2;
      const ramp = {};
      paletteRamp(ramp, hue, effectiveSpec, scheme, vibrancy, floor, preset, accent, [bg0, ...panelSurfaces], pinnedBase ?? void 0);
      lit(`--color-${hue}`, ramp[`--color-${hue}`]);
      for (const stop of PALETTE_STOPS) {
        lit(`--color-${hue}-${stop}`, ramp[`--color-${hue}-${stop}`], [
          `--color-${hue}`
        ]);
      }
      lit(`--${hue}`, ramp[`--${hue}`], [`--color-${hue}-base`]);
      lit(`--${hue}-bg`, ramp[`--${hue}-bg`], [`--color-${hue}`, ...refIfPinned("--bg-0")]);
      lit(`--${hue}-fg`, ramp[`--${hue}-fg`], [`--color-${hue}-base`]);
      lit(`--${hue}-text`, ramp[`--${hue}-text`], [`--${hue}-bg`, ...refIfPinned("--bg-0")]);
      lit(`--${hue}-vivid`, ramp[`--${hue}-vivid`], [
        `--color-${hue}-base`,
        ...refIfPinned("--bg-0")
      ]);
    }
    const codeBg = pinnedSurface("--code-bg", ensureTextHeadroom(withLightness(bg0, scheme === "dark" ? bg0.l - 0.02 : bg0.l + 0.012), scheme, floor));
    const codeBgCss = formatCss(codeBg);
    lit("--code-bg", codeBgCss, refIfPinned("--bg-0"));
    const codeFg = enforceContrastFloor(fg0, codeBg, scheme, floor);
    const codeFgCss = formatCss(codeFg);
    lit("--code-fg", codeFgCss, ["--fg-0", ...refIfPinned("--bg-0")]);
    lit("--code-line-highlight", formatCss(withAlpha(accentFill, 0.1)), ["--accent"]);
    lit("--code-selection", formatCss(withAlpha(accentFill, 0.3)), ["--accent"]);
    const codeTowardLight = contrast("#ffffff", codeBgCss) >= contrast("#000000", codeBgCss);
    const codePole = codeTowardLight ? 1 : 0;
    const codeFloor = AA;
    const readableHuedOn = (bgCss, pole, l, c, h, fl) => {
      const seed = oklch(l, c, h);
      let best = seed;
      let bestContrast = emittedContrast(seed, bgCss);
      if (bestContrast >= fl)
        return seed;
      for (let i = 1; i <= 100; i++) {
        const cand = withLightness(seed, seed.l + (pole - seed.l) * (i / 100));
        const ct = emittedContrast(cand, bgCss);
        if (ct >= fl)
          return cand;
        if (ct > bestContrast) {
          bestContrast = ct;
          best = cand;
        }
      }
      return best;
    };
    const readableHuedOnCode = (l, c, h, fl) => readableHuedOn(codeBgCss, codePole, l, c, h, fl);
    const codeChroma = Math.max(0.08, Math.max(0.1, accent.c) * (0.7 + vibrancy * 0.7) * preset.paletteChromaMul);
    const codeBaseHue = Number.isFinite(accent.h) ? accent.h : DERIVED_ACCENT_FALLBACK_HUE;
    const codeBaseL = codeTowardLight ? 0.76 : 0.46;
    const codePoleL = codeTowardLight ? 1 : 0;
    const aaEdgeL = lightnessForContrast(oklch(codePoleL, 0, 0), codeBg, codeBgCss, codeFloor);
    const bandLo = aaEdgeL + (codePoleL - aaEdgeL) * 0.06;
    const bandHi = codePoleL - (codePoleL - aaEdgeL) * 0.32;
    CODE_VIVID_ROLES.forEach((role, rank) => {
      const hue = ((codeBaseHue + CODE_HUE_RANK[rank] * 45) % 360 + 360) % 360;
      const bandL = bandLo + (bandHi - bandLo) * (rank / 7);
      const fill = readableHuedOnCode(bandL, codeChroma, hue, codeFloor);
      lit(`--code-${role}`, formatCss(fill), ["--accent", "--code-bg"]);
    });
    const commentFloor = Math.max(3, codeFloor * 0.62);
    const commentL = codeTowardLight ? 0.6 : 0.56;
    lit("--code-comment", formatCss(readableHuedOnCode(commentL, Math.min(0.03, codeChroma * 0.3), codeBaseHue, commentFloor)), ["--accent", "--code-bg"]);
    lit("--code-operator", formatCss(readableHuedOnCode(codeBaseL, codeChroma * 0.5, codeBaseHue, codeFloor)), ["--accent", "--code-bg"]);
    lit("--code-punctuation", formatCss(enforceContrastFloor(withLightness(codeFg, codeFg.l + (codePole - codeFg.l) * 0.18), codeBg, scheme, codeFloor)), ["--code-fg", "--code-bg"]);
    lit("--code-variable", codeFgCss, ["--code-fg"]);
    const terminalBg = pinnedSurface("--terminal-bg", ensureTextHeadroom(withLightness(bg0, scheme === "dark" ? bg0.l - 0.035 : bg0.l + 0.02), scheme, floor));
    const terminalBgCss = formatCss(terminalBg);
    lit("--terminal-bg", terminalBgCss, refIfPinned("--bg-0"));
    const terminalFg = enforceContrastFloor(fg0, terminalBg, scheme, floor);
    lit("--terminal-fg", formatCss(terminalFg), ["--fg-0", ...refIfPinned("--bg-0")]);
    const terminalCursor = separateFillFromSurface(accentFill, terminalBg, SURFACE_SEPARATION, floor);
    lit("--terminal-cursor", formatCss(terminalCursor), ["--accent"]);
    lit("--terminal-cursor-accent", pickReadable(terminalCursor, TEXT_POLES, floor), ["--accent"]);
    const terminalTowardLight = contrast("#ffffff", terminalBgCss) >= contrast("#000000", terminalBgCss);
    const terminalPole = terminalTowardLight ? 1 : 0;
    const terminalFloor = AA;
    const terminalChroma = Math.max(0.07, Math.max(0.1, accent.c) * (0.55 + vibrancy * 0.7) * preset.paletteChromaMul);
    const terminalNormalL = terminalTowardLight ? 0.5 : 0.62;
    const terminalBrightL = terminalNormalL + (terminalPole - terminalNormalL) * 0.34;
    for (const name of ANSI_CHROMATIC) {
      const hue = ANSI_HUES[name];
      const normal = readableHuedOn(terminalBgCss, terminalPole, terminalNormalL, terminalChroma, hue, terminalFloor);
      const bright = readableHuedOn(terminalBgCss, terminalPole, terminalBrightL, terminalChroma * 1.08, hue, terminalFloor);
      lit(`--terminal-${name}`, formatCss(normal), ["--accent", "--terminal-bg"]);
      lit(`--terminal-bright-${name}`, formatCss(bright), ["--accent", "--terminal-bg"]);
    }
    const terminalHue = Number.isFinite(bg0.h) ? bg0.h : 0;
    const terminalAchroma = (l) => oklch(l, 6e-3, terminalHue);
    lit("--terminal-black", formatCss(terminalAchroma(0.2)), refIfPinned("--bg-0"));
    lit("--terminal-bright-black", formatCss(terminalAchroma(0.42)), refIfPinned("--bg-0"));
    lit("--terminal-white", formatCss(terminalAchroma(0.85)), refIfPinned("--bg-0"));
    lit("--terminal-bright-white", formatCss(terminalAchroma(0.97)), refIfPinned("--bg-0"));
    lit("--font-sans", fonts.sans);
    lit("--font-mono", fonts.mono);
    lit("--font-display", fonts.display);
    const bodyIndex = TEXT_STEPS.indexOf("body");
    TEXT_STEPS.forEach((step, index) => {
      const rem = BASE_TEXT_REM * typeScale ** (index - bodyIndex);
      lit(`--text-${step}`, `${rem.toFixed(4).replace(/\.?0+$/, "")}rem`);
    });
    for (const step of LEADING_STEPS) {
      lit(`--leading-${step}`, String(LEADING_VALUES[step]));
    }
    for (const step of WEIGHT_STEPS) {
      lit(`--weight-${step}`, String(WEIGHT_VALUES[step]));
    }
    const radiusPx = {
      none: 0,
      sm: 2 * radiusScale,
      md: 4 * radiusScale,
      lg: 8 * radiusScale,
      full: 9999
    };
    for (const step of RADIUS_STEPS) {
      lit(`--radius-${step}`, `${radiusPx[step]}px`);
    }
    const borderPx = { thin: 1, normal: 1.5, thick: 2 };
    for (const step of BORDER_STEPS) {
      lit(`--border-${step}`, `${borderPx[step]}px`);
    }
    const durationMs = { fast: 120, base: 200, slow: 320 };
    for (const step of DURATION_STEPS) {
      lit(`--duration-${step}`, `${durationMs[step]}ms`);
    }
    lit("--ease-standard", "cubic-bezier(0.2, 0, 0, 1)");
    lit("--ease-emphasized", "cubic-bezier(0.3, 0, 0, 1)");
    const effectIntensity = extreme ? 0 : Math.round(Math.min(1.25, 0.42 + vibrancy * 0.62) * 100) / 100;
    lit("--fx-intensity", String(effectIntensity));
    lit("--fx-color", formatCss(accentFill), ["--accent"]);
    lit("--fx-color-alt", emitAccent(a2), ["--accent-2"]);
    lit("--fx-duration", `${durationMs.base}ms`, ["--duration-base"]);
    lit("--fx-ease", "cubic-bezier(0.2, 0, 0, 1)", ["--ease-standard"]);
    const elevationStrings = {};
    for (const level of ELEVATION_STEPS) {
      const value = shadowString(scheme, level, vibrancy, preset);
      elevationStrings[level] = value;
      lit(`--elevation-${level}`, value);
    }
    lit("--shadow", elevationStrings[3], ["--elevation-3"]);
    for (const [role, order] of LAYER_STEPS)
      lit(`--layer-${role}`, String(order));
    for (const step of SPACE_STEPS) {
      const rem = SPACE_BASE_REM * step * density;
      lit(`--space-${step}`, `${rem.toFixed(4).replace(/\.?0+$/, "")}rem`);
    }
    const producedNames = new Set(nodes.map((n) => n.name));
    for (const [name, value] of Object.entries(pinned)) {
      if (producedNames.has(name)) {
        for (const node of nodes) {
          if (node.name === name) {
            node.value = value;
            node.resolve = void 0;
            node.refs = void 0;
          }
        }
      } else {
        nodes.push({ name, value });
      }
    }
    return nodes;
  }
  function resolveBaseInputs(preset, opts) {
    const completed = completeAnchors(preset, opts);
    return {
      knobs: opts.knobs ?? {},
      scheme: completed.scheme,
      pinned: opts.constraints ?? {}
    };
  }
  function buildPassContext(preset, opts, passIndex) {
    const base = resolveBaseInputs(preset, opts);
    return { ...base, passIndex };
  }
  function runPipeline(passes, makeCtx) {
    let register = {};
    const trace = [];
    passes.forEach((pass, index) => {
      register = pass.run(register, makeCtx(index));
      trace.push({ name: pass.name, register });
    });
    return { register, trace };
  }
  function settlePass(preset, opts) {
    return {
      name: "settle",
      run: () => resolveGraph(buildGraph(preset, opts))
    };
  }
  function registerToNodes(register) {
    return Object.entries(register).map(([name, value]) => ({ name, value }));
  }
  function alpha(value) {
    if (!value)
      return 1;
    const rgba = /rgba?\([^)]*?,\s*([0-9.]+)\s*\)/.exec(value);
    if (rgba && rgba[1] !== void 0)
      return Number.parseFloat(rgba[1]);
    if (value.startsWith("#") && value.length === 9) {
      return Number.parseInt(value.slice(7, 9), 16) / 255;
    }
    if (value.startsWith("#") && value.length === 5) {
      return Number.parseInt(value.slice(4, 5).repeat(2), 16) / 255;
    }
    return 1;
  }
  function parseRem(value) {
    if (!value)
      return Number.NaN;
    const m = /^(-?[0-9.]+)(rem|px)$/.exec(value.trim());
    return m ? Number.parseFloat(m[1]) : Number.NaN;
  }
  function parseMs(value) {
    if (!value)
      return Number.NaN;
    const m = /^(-?[0-9.]+)ms$/.exec(value.trim());
    return m ? Number.parseFloat(m[1]) : Number.NaN;
  }
  function shadowStrength(value) {
    if (!value || value === "none")
      return 0;
    let total = 0;
    const offsets = value.match(/([0-9.]+)px/g) ?? [];
    for (const off of offsets)
      total += Number.parseFloat(off);
    const alphas = value.match(/rgba?\([^)]*,\s*([0-9.]+)\)/g) ?? [];
    for (const a of alphas) {
      const m = /,\s*([0-9.]+)\)/.exec(a);
      if (m)
        total += Number.parseFloat(m[1]) * 20;
    }
    return total;
  }
  var STATE_TOKENS = [
    "--state-hover",
    "--state-press",
    "--state-selected",
    "--state-disabled",
    "--state-drag"
  ];
  var CEILING_EPSILON = 0.05;
  function achievableFloor(declaredFloor, bgCss) {
    if (!bgCss)
      return declaredFloor;
    const ceiling = Math.max(contrast("#000000", bgCss), contrast("#ffffff", bgCss));
    return Math.min(declaredFloor, ceiling - CEILING_EPSILON);
  }
  function achievableRingFloor(declaredFloor, ringCss, surfaces) {
    const a = alpha(ringCss);
    const reach = (pole) => Math.min(...surfaces.map((surface) => contrast(formatCss(flatten(formatCss(withAlpha(toOklchColor(pole), a)), surface)), surface)));
    const ceiling = Math.max(reach("#000000"), reach("#ffffff"));
    return Math.min(declaredFloor, ceiling - CEILING_EPSILON);
  }
  function makeInvariants(preset) {
    const onFillFloor = preset.declaredTextOnFillFloor;
    const ringFloor = preset.declaredFocusRingFloor;
    return [
      (ctx) => {
        for (const name of PRODUCES) {
          const value = ctx.register[name];
          const category = ctx.categories[name];
          if (typeof value !== "string" || value.length === 0) {
            return {
              name: "every token non-empty and format-valid for its category",
              ok: false,
              detail: `${name} is ${value === void 0 ? "missing" : "empty"}`
            };
          }
          if (/nan/i.test(value)) {
            return {
              name: "every token non-empty and format-valid for its category",
              ok: false,
              detail: `${name} contains NaN: ${value}`
            };
          }
          switch (category) {
            case "color": {
              try {
                const o = toOklchColor(value);
                if (Number.isNaN(o.l) || Number.isNaN(o.c) || Number.isNaN(o.h) || Number.isNaN(alpha(value))) {
                  return {
                    name: "every token non-empty and format-valid for its category",
                    ok: false,
                    detail: `${name} parses to NaN: ${value}`
                  };
                }
              } catch (error) {
                return {
                  name: "every token non-empty and format-valid for its category",
                  ok: false,
                  detail: `${name} unparseable color: ${value} (${String(error)})`
                };
              }
              break;
            }
            case "length": {
              if (Number.isNaN(parseRem(value))) {
                return {
                  name: "every token non-empty and format-valid for its category",
                  ok: false,
                  detail: `${name} not a css length: ${value}`
                };
              }
              break;
            }
            case "duration": {
              if (Number.isNaN(parseMs(value))) {
                return {
                  name: "every token non-empty and format-valid for its category",
                  ok: false,
                  detail: `${name} not a duration: ${value}`
                };
              }
              break;
            }
            case "number": {
              if (Number.isNaN(Number.parseFloat(value))) {
                return {
                  name: "every token non-empty and format-valid for its category",
                  ok: false,
                  detail: `${name} not a number: ${value}`
                };
              }
              break;
            }
            case "easing": {
              if (!value.startsWith("cubic-bezier(")) {
                return {
                  name: "every token non-empty and format-valid for its category",
                  ok: false,
                  detail: `${name} not an easing: ${value}`
                };
              }
              break;
            }
            case "shadow": {
              if (value !== "none" && !value.includes("rgba")) {
                return {
                  name: "every token non-empty and format-valid for its category",
                  ok: false,
                  detail: `${name} not a shadow: ${value}`
                };
              }
              break;
            }
            case "font":
              break;
            case "keyword": {
              const domain = KEYWORD_DOMAINS[name];
              if (domain && !domain.includes(value)) {
                return {
                  name: "every token non-empty and format-valid for its category",
                  ok: false,
                  detail: `${name} not in {${domain.join(" | ")}}: ${value}`
                };
              }
              break;
            }
          }
        }
        return { name: "every token non-empty and format-valid for its category", ok: true };
      },
      (ctx) => {
        const name = `fg-0 on bg-0 clears ${onFillFloor >= AAA - 0.01 ? "AAA" : "AA"}`;
        if (ctx.constraints["--fg-0"]) {
          return { name, ok: true, detail: "skipped (pinned text)" };
        }
        const fg0 = ctx.register["--fg-0"];
        const bg0 = ctx.register["--bg-0"];
        const ratio = fg0 && bg0 ? contrast(fg0, bg0) : 0;
        const required = achievableFloor(onFillFloor, ctx.constraints["--bg-0"] ? bg0 : void 0);
        return {
          name,
          ok: ratio >= required - 0.01,
          detail: `contrast ${ratio.toFixed(2)} (floor ${required.toFixed(2)}${ctx.constraints["--bg-0"] ? ` best-achievable, declared ${onFillFloor}` : ""})`
        };
      },
      (ctx) => {
        const name = `fg ramp clears ${preset.contrastFloor >= AAA - 0.01 ? "AAA" : "AA"}`;
        if (ctx.constraints["--fg-0"]) {
          return { name, ok: true, detail: "skipped (pinned text)" };
        }
        const bg0 = ctx.register["--bg-0"];
        if (!bg0)
          return { name, ok: false, detail: "missing --bg-0" };
        const required = achievableFloor(preset.contrastFloor, ctx.constraints["--bg-0"] ? bg0 : void 0);
        for (let i = 1; i <= 3; i++) {
          const key = `--fg-${i}`;
          if (ctx.constraints[key])
            continue;
          const fg = ctx.register[key];
          const ratio = fg ? contrast(fg, bg0) : 0;
          if (ratio < required - 0.01) {
            return {
              name,
              ok: false,
              detail: `${key} contrast ${ratio.toFixed(2)} (floor ${required.toFixed(2)}${ctx.constraints["--bg-0"] ? ` best-achievable, declared ${preset.contrastFloor}` : ""})`
            };
          }
        }
        return { name, ok: true };
      },
      (ctx) => {
        const pairs = [
          ["--accent-fg", "--accent"],
          ["--neutral-fg", "--neutral"],
          ["--success-fg", "--success"],
          ["--warn-fg", "--warn"],
          ["--danger-fg", "--danger"],
          ["--info-fg", "--info"],
          ["--accent-text", "--bg-0"],
          ["--neutral-text", "--bg-0"]
        ];
        const surfaceFill = new Set(SURFACES);
        for (const [fgName, fillName] of pairs) {
          const fill = ctx.register[fillName];
          const pinned = Boolean(ctx.constraints[fillName]);
          if (pinned && !surfaceFill.has(fillName))
            continue;
          const fg = ctx.register[fgName];
          if (!fg || !fill)
            continue;
          const required = pinned ? achievableFloor(onFillFloor, fill) : onFillFloor;
          if (contrast(fg, fill) < required - 0.01) {
            return {
              name: `on-fill text clears ${onFillFloor >= AAA - 0.01 ? "AAA" : "AA"}`,
              ok: false,
              detail: `${fgName} on ${fillName} = ${contrast(fg, fill).toFixed(2)} (floor ${required.toFixed(2)}${pinned ? " best-achievable" : ""})`
            };
          }
        }
        return {
          name: `on-fill text clears ${onFillFloor >= AAA - 0.01 ? "AAA" : "AA"}`,
          ok: true
        };
      },
      (ctx) => {
        const pairs = [
          ["--success-text", "--success-bg"],
          ["--warn-text", "--warn-bg"],
          ["--danger-text", "--danger-bg"],
          ["--info-text", "--info-bg"]
        ];
        for (const [fgName, fillName] of pairs) {
          const fg = ctx.register[fgName];
          const fill = ctx.register[fillName];
          if (!fg || !fill)
            continue;
          if (contrast(fg, fill) < AA - 0.01) {
            return {
              name: "text-on-tint clears AA",
              ok: false,
              detail: `${fgName} on ${fillName} = ${contrast(fg, fill).toFixed(2)}`
            };
          }
        }
        return { name: "text-on-tint clears AA", ok: true };
      },
      (ctx) => {
        const name = `focus ring clears ${ringFloor}`;
        if (ctx.constraints["--ring"])
          return { name, ok: true, detail: "skipped (pinned ring)" };
        const ring = ctx.register["--ring"];
        if (!ring)
          return { name, ok: false, detail: "missing --ring" };
        const surfaces = SURFACE_ROLES.map((token) => ctx.register[token]).filter((value) => typeof value === "string" && value.length > 0);
        if (surfaces.length === 0)
          return { name, ok: true, detail: "skipped (no surfaces)" };
        const required = achievableRingFloor(ringFloor, ring, surfaces);
        let worst = Infinity;
        let worstOn = "";
        for (const surface of surfaces) {
          const ratio = contrast(formatCss(flatten(ring, surface)), surface);
          if (ratio < worst) {
            worst = ratio;
            worstOn = surface;
          }
        }
        return {
          name,
          ok: worst >= required - 0.01,
          detail: `--ring on ${worstOn} = ${worst.toFixed(2)} (floor ${required.toFixed(2)}${required < ringFloor ? ` best-achievable, declared ${ringFloor}` : ""})`
        };
      },
      (ctx) => {
        const name = "achromatic tone inks stay neutral";
        const achromatic = ["gray", "white", "black"];
        for (const hue of achromatic) {
          for (const token of [`--${hue}-fg`, `--${hue}-text`, `--color-${hue}-contrast`]) {
            const value = ctx.register[token];
            if (!value)
              continue;
            const c = toOklchColor(value).c;
            if (c >= ACHROMATIC_CHROMA) {
              return { name, ok: false, detail: `${token} = ${value} (chroma ${c.toFixed(3)} \u2265 ${ACHROMATIC_CHROMA})` };
            }
          }
        }
        return { name, ok: true };
      },
      (ctx) => {
        const name = "panel text clears AA on --bg-1 and --bg-2";
        const neutralText = [
          "--fg-1",
          "--fg-2",
          "--fg-3",
          "--placeholder",
          "--link",
          "--accent-text",
          "--neutral-text",
          "--neutral-vivid"
        ];
        if (ctx.constraints["--bg-0"])
          return { name, ok: true, detail: "skipped (pinned bg-0)" };
        const bg0 = ctx.register["--bg-0"];
        if (!bg0)
          return { name, ok: true };
        const textLight = ctx.scheme === "dark";
        const themePole = textLight ? "#ffffff" : "#000000";
        const band = contrastBandFloor(ctx.knobs);
        const inkFloor = Math.max(ENFORCE, preset.contrastFloor, (band ?? 0) + 0.2);
        const statusRoles = Object.keys(STATUS_TO_HUE);
        for (const panel of PANEL_SURFACES) {
          const bg = ctx.register[panel];
          if (!bg)
            continue;
          const bgL = toOklchColor(bg).l;
          if (bgL < 0.5 !== textLight)
            continue;
          const poleCeiling = contrast(themePole, bg);
          const required = Math.min(AA, poleCeiling - CEILING_EPSILON);
          const fg0Reach = (() => {
            const v = ctx.register["--fg-0"];
            return v ? contrast(v, bg) : Infinity;
          })();
          const inkReach = (source) => {
            const v = ctx.register[source];
            if (!v)
              return Infinity;
            const ink = toOklchColor(v);
            const targetL = textLight ? 1 : 0;
            let reach = contrast(v, bg);
            for (let i = 1; i <= 100; i++) {
              const t = i / 100;
              const candidate = withLightness(ink, ink.l + (targetL - ink.l) * t);
              if (contrast(formatCss(candidate), bg0) < inkFloor - 0.01)
                break;
              reach = Math.max(reach, contrast(formatCss(candidate), bg));
            }
            return reach;
          };
          const accentInkReach = inkReach("--accent");
          const neutralInkReach = inkReach("--neutral");
          const check = (token, ceilingReach = Infinity) => {
            const fg = ctx.register[token];
            if (!fg)
              return null;
            const floorFor = Math.min(required, ceilingReach);
            const ratio = contrast(fg, bg);
            if (ratio < floorFor - 0.05) {
              return {
                name,
                ok: false,
                detail: `${token} on ${panel} = ${ratio.toFixed(2)} (floor ${floorFor.toFixed(2)})`
              };
            }
            return null;
          };
          const fg0Bounded = /* @__PURE__ */ new Set(["--fg-1", "--fg-2", "--fg-3", "--placeholder"]);
          const accentBounded = /* @__PURE__ */ new Set(["--link", "--accent-text"]);
          const reachFor = (token) => {
            if (fg0Bounded.has(token))
              return fg0Reach;
            if (accentBounded.has(token))
              return accentInkReach;
            if (token === "--neutral-text" || token === "--neutral-vivid")
              return neutralInkReach;
            return Infinity;
          };
          for (const token of neutralText) {
            const fail = check(token, reachFor(token));
            if (fail)
              return fail;
          }
          for (const role of statusRoles) {
            const tintBg = ctx.register[`--${role}-bg`];
            if (tintBg) {
              const whiteJoint = contrast("#ffffff", tintBg) >= AA && contrast("#ffffff", bg) >= AA;
              const blackJoint = contrast("#000000", tintBg) >= AA && contrast("#000000", bg) >= AA;
              if (!whiteJoint && !blackJoint)
                continue;
            }
            const fail = check(`--${role}-text`);
            if (fail)
              return fail;
            const failVivid = check(`--${role}-vivid`);
            if (failVivid)
              return failVivid;
          }
        }
        return { name, ok: true };
      },
      (ctx) => {
        const name = "solid fills separate from --bg-0";
        const bg0 = ctx.register["--bg-0"];
        if (!bg0)
          return { name, ok: true };
        const fills = ["--accent", "--neutral", ...Object.keys(STATUS_TO_HUE).map((r) => `--${r}`)];
        for (const token of fills) {
          if (ctx.constraints[token])
            continue;
          const fill = ctx.register[token];
          if (!fill)
            continue;
          const ratio = contrast(fill, bg0);
          if (ratio < SURFACE_SEPARATION - 0.05) {
            return { name, ok: false, detail: `${token} = ${ratio.toFixed(2)} on --bg-0 (floor ${SURFACE_SEPARATION})` };
          }
        }
        return { name, ok: true };
      },
      (ctx) => {
        const name = "the accent family stays mutually distinguishable";
        const members = ["--accent", "--accent-2", "--accent-3", "--accent-4"].filter((token) => !ctx.constraints[token] && ctx.register[token]).map((token) => ({ token, color: toOklchColor(ctx.register[token]) }));
        for (let i = 0; i < members.length; i++) {
          for (let j = i + 1; j < members.length; j++) {
            const a = members[i];
            const b = members[j];
            if (readsAsOneColor(a.color, b.color)) {
              const dL = Math.abs(a.color.l - b.color.l);
              const dC = Math.abs(a.color.c - b.color.c);
              const arc = Math.abs(hueDelta(a.color.h, b.color.h)) * Math.min(a.color.c, b.color.c);
              return {
                name,
                ok: false,
                detail: `${a.token} and ${b.token} read as one color (\u0394L ${dL.toFixed(3)}, \u0394C ${dC.toFixed(3)}, hue arc ${arc.toFixed(3)})`
              };
            }
          }
        }
        return { name, ok: true };
      },
      (ctx) => {
        const name = "a soft fill reads apart from its solid";
        for (const tone of ["accent", "neutral"]) {
          const solid = ctx.register[`--${tone}`];
          const soft = ctx.register[`--${tone}-bg`];
          if (!solid || !soft || ctx.constraints[`--${tone}-bg`] || ctx.constraints[`--${tone}`])
            continue;
          const fill = toOklchColor(solid);
          const tint = toOklchColor(soft);
          if (tint.l <= 0.02 || tint.l >= 0.98)
            continue;
          if (readsAsOneColor(fill, tint)) {
            return {
              name,
              ok: false,
              detail: `--${tone}-bg ${soft} reads as --${tone} ${solid}, so a soft variant paints its solid`
            };
          }
        }
        return { name, ok: true };
      },
      (ctx) => {
        const name = "borders separate from their surface";
        const borders = [
          ["--line", "--bg-0", BORDER_SEPARATION],
          ["--line-2", "--bg-0", DIVIDER_SEPARATION],
          ["--field-border", "--field-bg", BORDER_SEPARATION]
        ];
        for (const [token, surface, separation] of borders) {
          if (ctx.constraints[token])
            continue;
          const border = ctx.register[token];
          const bg = ctx.register[surface];
          if (!border || !bg)
            continue;
          const ratio = contrast(border, bg);
          if (ratio < separation - 0.05) {
            return { name, ok: false, detail: `${token} = ${ratio.toFixed(2)} on ${surface} (floor ${separation})` };
          }
        }
        return { name, ok: true };
      },
      (ctx) => {
        const ladder = ["--bg-sunken", ...SURFACES];
        const ls = ladder.map((name) => {
          const value = ctx.register[name];
          return value ? toOklchColor(value).l : 0;
        });
        const ascending = ctx.scheme === "dark";
        for (let i = 1; i < ls.length; i++) {
          const prev = ls[i - 1];
          const cur = ls[i];
          const ok = ascending ? cur >= prev - 1e-6 : cur <= prev + 1e-6;
          if (!ok) {
            return {
              name: "surface lightness monotonic",
              ok: false,
              detail: `${ladder[i - 1]}=${prev.toFixed(3)} ${ladder[i]}=${cur.toFixed(3)} (${ctx.scheme})`
            };
          }
        }
        return { name: "surface lightness monotonic", ok: true };
      },
      (ctx) => {
        for (const name of STATE_TOKENS) {
          const value = ctx.register[name];
          if (!value)
            continue;
          const a = alpha(value);
          if (a >= 1) {
            return {
              name: "state overlays translucent",
              ok: false,
              detail: `${name} alpha ${a}`
            };
          }
        }
        return { name: "state overlays translucent", ok: true };
      },
      (ctx) => {
        const linkName = `links clear ${onFillFloor >= AAA - 0.01 ? "AAA" : "AA"} on bg-0`;
        const bg0 = ctx.register["--bg-0"];
        const required = achievableFloor(onFillFloor, ctx.constraints["--bg-0"] ? bg0 : void 0);
        for (const name of ["--link", "--link-hover"]) {
          const link = ctx.register[name];
          if (!link || !bg0)
            continue;
          const ratio = contrast(link, bg0);
          if (ratio < required - 0.01) {
            return {
              name: linkName,
              ok: false,
              detail: `${name} on --bg-0 = ${ratio.toFixed(2)} (floor ${required.toFixed(2)}${ctx.constraints["--bg-0"] ? " best-achievable" : ""})`
            };
          }
        }
        return { name: linkName, ok: true };
      },
      (ctx) => {
        const name = "link hover distinct from link";
        const link = ctx.register["--link"];
        const hover = ctx.register["--link-hover"];
        if (!link || !hover)
          return { name, ok: true };
        if (ctx.constraints["--link"] || ctx.constraints["--link-hover"])
          return { name, ok: true };
        const delta = oklabDistance(link, hover);
        if (delta < LINK_HOVER_MIN_DELTA) {
          const l = toOklchColor(link).l;
          if (l >= 1 - POLE_REACH || l <= POLE_REACH)
            return { name, ok: true };
          return {
            name,
            ok: false,
            detail: `--link ${link} and --link-hover ${hover} read as one colour (${delta.toFixed(4)})`
          };
        }
        return { name, ok: true };
      },
      (ctx) => {
        const name = "unpinned accent ramp holds its fan at constant L/C";
        const accentValue = ctx.register["--accent"];
        if (!accentValue) {
          return { name, ok: true };
        }
        const accent = toOklchColor(accentValue);
        if (accent.c < HUE_STABLE_CHROMA) {
          return { name, ok: true };
        }
        const { strategy, split, shiftStep: step } = resolveAccentKnobs(preset, ctx.knobs);
        const accent2Value = ctx.register["--accent-2"];
        const accent3Value = ctx.register["--accent-3"];
        const pinnedAccent2 = ctx.constraints["--accent-2"] && accent2Value ? toOklchColor(accent2Value) : null;
        const pinnedAccent3 = ctx.constraints["--accent-3"] && accent3Value ? toOklchColor(accent3Value) : null;
        const duoSecondHue = () => pinnedAccent2 ? hueDelta(accent.h, pinnedAccent2.h) : split;
        const fanOffset = (n) => {
          if (strategy === "shade")
            return 0;
          if (strategy === "step")
            return step * (n - 1);
          if (strategy === "duo")
            return n === 3 ? 0 : duoSecondHue();
          if (n === 2)
            return pinnedAccent3 ? -hueDelta(accent.h, pinnedAccent3.h) : -split;
          if (n === 3)
            return pinnedAccent2 ? -hueDelta(accent.h, pinnedAccent2.h) : split;
          const flank = (slot) => (slot === 2 ? pinnedAccent2 : pinnedAccent3)?.h ?? accent.h + fanOffset(slot);
          return fanFourthOffset(accent.h, flank(2), flank(3));
        };
        const stepsLightness = strategy === "shade" || strategy === "duo";
        for (let n = 2; n <= 4; n++) {
          if (ctx.constraints[`--accent-${n}`])
            continue;
          const value = ctx.register[`--accent-${n}`];
          if (!value)
            continue;
          const rotated = toOklchColor(value);
          const wantH = ((accent.h + fanOffset(n)) % 360 + 360) % 360;
          if (rotated.c >= HUE_STABLE_CHROMA) {
            let dh = Math.abs(rotated.h - wantH) % 360;
            if (dh > 180)
              dh = 360 - dh;
            if (dh > HUE_TOLERANCE) {
              return {
                name,
                ok: false,
                detail: `--accent-${n} h=${rotated.h.toFixed(1)} want ${wantH.toFixed(1)}`
              };
            }
          }
          if (!stepsLightness) {
            if (Math.abs(rotated.l - accent.l) > LIGHTNESS_TOLERANCE) {
              return {
                name,
                ok: false,
                detail: `--accent-${n} l=${rotated.l.toFixed(3)} want ${accent.l.toFixed(3)}`
              };
            }
            const maxChroma = clampToGamut({ l: accent.l, c: accent.c, h: wantH, alpha: 1 }).c;
            const expectedChroma = Math.min(accent.c, maxChroma);
            if (Math.abs(rotated.c - expectedChroma) > 0.02) {
              return {
                name,
                ok: false,
                detail: `--accent-${n} chroma ${rotated.c.toFixed(3)} want max-at-hue ${expectedChroma.toFixed(3)}`
              };
            }
          }
        }
        return { name, ok: true };
      },
      (ctx) => {
        for (const name of ["--ring", "--ring-bg", "--scrim", "--selection", "--highlight"]) {
          const value = ctx.register[name];
          if (!value)
            continue;
          if (alpha(value) >= 1) {
            return {
              name: "ring/scrim/selection/highlight carry alpha < 1",
              ok: false,
              detail: `${name} alpha ${alpha(value)}`
            };
          }
        }
        return { name: "ring/scrim/selection/highlight carry alpha < 1", ok: true };
      },
      (ctx) => {
        let prev = -Infinity;
        for (const step of TEXT_STEPS) {
          const rem = parseRem(ctx.register[`--text-${step}`]);
          if (Number.isNaN(rem)) {
            return {
              name: "type scale strictly increasing",
              ok: false,
              detail: `--text-${step} not a length`
            };
          }
          if (rem <= prev) {
            return {
              name: "type scale strictly increasing",
              ok: false,
              detail: `--text-${step}=${rem} not > ${prev}`
            };
          }
          prev = rem;
        }
        return { name: "type scale strictly increasing", ok: true };
      },
      (ctx) => {
        let prev = -Infinity;
        for (const step of WEIGHT_STEPS) {
          const w = Number.parseFloat(ctx.register[`--weight-${step}`] ?? "");
          if (Number.isNaN(w) || w <= prev) {
            return {
              name: "weights strictly increasing",
              ok: false,
              detail: `--weight-${step}=${w} not > ${prev}`
            };
          }
          prev = w;
        }
        return { name: "weights strictly increasing", ok: true };
      },
      (ctx) => {
        let prev = -Infinity;
        for (const step of LEADING_STEPS) {
          const v = Number.parseFloat(ctx.register[`--leading-${step}`] ?? "");
          if (Number.isNaN(v) || v <= prev) {
            return {
              name: "leading strictly increasing",
              ok: false,
              detail: `--leading-${step}=${v} not > ${prev}`
            };
          }
          prev = v;
        }
        return { name: "leading strictly increasing", ok: true };
      },
      (ctx) => {
        let prev = -Infinity;
        for (const step of RADIUS_STEPS) {
          const v = parseRem(ctx.register[`--radius-${step}`]);
          if (Number.isNaN(v) || v < prev - 1e-9) {
            return {
              name: "radius ladder non-decreasing",
              ok: false,
              detail: `--radius-${step}=${v} < ${prev}`
            };
          }
          prev = v;
        }
        return { name: "radius ladder non-decreasing", ok: true };
      },
      (ctx) => {
        let prev = -Infinity;
        for (const step of BORDER_STEPS) {
          const v = parseRem(ctx.register[`--border-${step}`]);
          if (Number.isNaN(v) || v <= prev) {
            return {
              name: "borders strictly increasing",
              ok: false,
              detail: `--border-${step}=${v} not > ${prev}`
            };
          }
          prev = v;
        }
        return { name: "borders strictly increasing", ok: true };
      },
      (ctx) => {
        let prev = -Infinity;
        for (const step of DURATION_STEPS) {
          const v = parseMs(ctx.register[`--duration-${step}`]);
          if (Number.isNaN(v) || v <= prev) {
            return {
              name: "durations strictly increasing",
              ok: false,
              detail: `--duration-${step}=${v} not > ${prev}`
            };
          }
          prev = v;
        }
        return { name: "durations strictly increasing", ok: true };
      },
      (ctx) => {
        let prev = -Infinity;
        for (const level of ELEVATION_STEPS) {
          const v = shadowStrength(ctx.register[`--elevation-${level}`]);
          if (v < prev - 1e-9) {
            return {
              name: "elevation strength non-decreasing",
              ok: false,
              detail: `--elevation-${level}=${v} < ${prev}`
            };
          }
          prev = v;
        }
        return { name: "elevation strength non-decreasing", ok: true };
      },
      (ctx) => {
        let prev = -Infinity;
        for (const step of SPACE_STEPS) {
          const v = parseRem(ctx.register[`--space-${step}`]);
          if (Number.isNaN(v) || v < prev - 1e-9) {
            return {
              name: "space ramp non-decreasing",
              ok: false,
              detail: `--space-${step}=${v} < ${prev}`
            };
          }
          prev = v;
        }
        return { name: "space ramp non-decreasing", ok: true };
      },
      (ctx) => {
        for (const [hue, spec2] of Object.entries(PALETTE_HUES)) {
          const stops = PALETTE_STOPS.filter((s) => s !== "contrast").map((stop) => ctx.register[`--color-${hue}-${stop}`]);
          const ls = stops.map((v) => v ? toOklchColor(v).l : Number.NaN);
          if (ls.some((l) => Number.isNaN(l))) {
            return {
              name: "palette ramps monotonic in OKLCH lightness",
              ok: false,
              detail: `--color-${hue} ramp has a non-color stop`
            };
          }
          const ascending = ls[ls.length - 1] >= ls[0];
          for (let i = 1; i < ls.length; i++) {
            const prev = ls[i - 1];
            const cur = ls[i];
            const ok = ascending ? cur > prev + 1e-9 : cur < prev - 1e-9;
            if (!ok) {
              return {
                name: "palette ramps monotonic in OKLCH lightness",
                ok: false,
                detail: `--color-${hue} ramp l[${i}]=${cur} not strictly ${ascending ? ">" : "<"} ${prev}`
              };
            }
          }
          const base = ctx.register[`--color-${hue}-base`];
          const contrastStop = ctx.register[`--color-${hue}-contrast`];
          if (base && contrastStop && contrast(base, contrastStop) < AA - 0.01) {
            return {
              name: "palette ramps monotonic in OKLCH lightness",
              ok: false,
              detail: `--color-${hue}-contrast on -base = ${contrast(base, contrastStop).toFixed(2)}`
            };
          }
          if (spec2 !== "white" && spec2 !== "black") {
            const subtle = ctx.register[`--color-${hue}-subtle`];
            const strong = ctx.register[`--color-${hue}-strong`];
            if (subtle && strong && contrast(subtle, strong) < AA - 0.01) {
              return {
                name: "palette ramps monotonic in OKLCH lightness",
                ok: false,
                detail: `--color-${hue}-strong on -subtle = ${contrast(subtle, strong).toFixed(2)}`
              };
            }
          }
          if (typeof spec2 === "object" && base) {
            const o = toOklchColor(base);
            if (o.c >= HUE_STABLE_CHROMA) {
              let dh = Math.abs(o.h - spec2.h) % 360;
              if (dh > 180)
                dh = 360 - dh;
              if (dh > 20) {
                return {
                  name: "palette ramps monotonic in OKLCH lightness",
                  ok: false,
                  detail: `--color-${hue}-base h=${o.h.toFixed(1)} strayed from ${spec2.h}`
                };
              }
            }
          }
        }
        return { name: "palette ramps monotonic in OKLCH lightness", ok: true };
      },
      (ctx) => {
        const name = "every tone family clears AA (fg on solid, text on bg)";
        for (const tone of FULL_TONES) {
          const solid = ctx.register[`--${tone}`];
          const fg = ctx.register[`--${tone}-fg`];
          const bg = ctx.register[`--${tone}-bg`];
          const text = ctx.register[`--${tone}-text`];
          if (!solid || !fg || !bg || !text) {
            return { name, ok: false, detail: `--${tone} family is incomplete` };
          }
          if (contrast(solid, fg) < AA - 0.01) {
            return { name, ok: false, detail: `--${tone}-fg on --${tone} = ${contrast(solid, fg).toFixed(2)}` };
          }
          if (contrast(bg, text) < AA - 0.01) {
            return { name, ok: false, detail: `--${tone}-text on --${tone}-bg = ${contrast(bg, text).toFixed(2)}` };
          }
        }
        return { name, ok: true };
      },
      (ctx) => {
        const name = "code palette readable on --code-bg";
        const codeBg = ctx.register["--code-bg"];
        if (!codeBg)
          return { name, ok: false, detail: "--code-bg missing" };
        const readFloor = achievableFloor(AA, codeBg);
        const commentFloor = achievableFloor(3, codeBg);
        for (const role of [...CODE_VIVID_ROLES, "operator"]) {
          const v = ctx.register[`--code-${role}`];
          const ratio = v ? contrast(v, codeBg) : 0;
          if (ratio < readFloor - 0.05) {
            return { name, ok: false, detail: `--code-${role} on --code-bg = ${ratio.toFixed(2)} (floor ${readFloor.toFixed(2)})` };
          }
        }
        const commentRatio = contrast(ctx.register["--code-comment"] ?? "#000", codeBg);
        if (commentRatio < commentFloor - 0.05) {
          return { name, ok: false, detail: `--code-comment on --code-bg = ${commentRatio.toFixed(2)} (floor ${commentFloor.toFixed(2)})` };
        }
        return { name, ok: true };
      },
      (ctx) => {
        const name = "code scopes mutually distinguishable";
        const MIN_DE = 6e-3;
        const distinct = [...CODE_VIVID_ROLES, "comment"].map((r) => `--code-${r}`);
        for (let i = 0; i < distinct.length; i++) {
          for (let j = i + 1; j < distinct.length; j++) {
            const ni = distinct[i];
            const nj = distinct[j];
            const a = ctx.register[ni];
            const b = ctx.register[nj];
            if (!a || !b)
              continue;
            const d = oklabDistance(a, b);
            if (d < MIN_DE) {
              return { name, ok: false, detail: `${ni} vs ${nj} \u0394E=${d.toFixed(4)} (min ${MIN_DE})` };
            }
          }
        }
        return { name, ok: true };
      },
      (ctx) => {
        const name = "terminal palette readable on --terminal-bg";
        const bg = ctx.register["--terminal-bg"];
        if (!bg)
          return { name, ok: false, detail: "--terminal-bg missing" };
        const readFloor = achievableFloor(AA, bg);
        const inks = [
          "--terminal-fg",
          ...ANSI_CHROMATIC.map((n) => `--terminal-${n}`),
          ...ANSI_CHROMATIC.map((n) => `--terminal-bright-${n}`)
        ];
        for (const token of inks) {
          const v = ctx.register[token];
          const ratio = v ? contrast(v, bg) : 0;
          if (ratio < readFloor - 0.05) {
            return { name, ok: false, detail: `${token} on --terminal-bg = ${ratio.toFixed(2)} (floor ${readFloor.toFixed(2)})` };
          }
        }
        return { name, ok: true };
      },
      (ctx) => {
        const name = "terminal ANSI hues mutually distinguishable";
        const MIN_DE = 0.012;
        const slots = ANSI_CHROMATIC.map((n) => `--terminal-${n}`);
        for (let i = 0; i < slots.length; i++) {
          for (let j = i + 1; j < slots.length; j++) {
            const ni = slots[i];
            const nj = slots[j];
            const a = ctx.register[ni];
            const b = ctx.register[nj];
            if (!a || !b)
              continue;
            const d = oklabDistance(a, b);
            if (d < MIN_DE) {
              return { name, ok: false, detail: `${ni} vs ${nj} \u0394E=${d.toFixed(4)} (min ${MIN_DE})` };
            }
          }
        }
        return { name, ok: true };
      },
      (ctx) => {
        const name = "status roles mutually distinguishable";
        const MIN_DE = STATUS_SEPARATION;
        const roles = Object.keys(STATUS_TO_HUE).map((r) => `--${r}`);
        for (let i = 0; i < roles.length; i++) {
          for (let j = i + 1; j < roles.length; j++) {
            const ni = roles[i];
            const nj = roles[j];
            const a = ctx.register[ni];
            const b = ctx.register[nj];
            if (!a || !b)
              continue;
            const d = oklabDistance(a, b);
            if (d < MIN_DE) {
              return { name, ok: false, detail: `${ni} vs ${nj} \u0394E=${d.toFixed(4)} (min ${MIN_DE})` };
            }
          }
        }
        return { name, ok: true };
      }
    ];
  }
  var PRODUCED_TOKENS = PRODUCES;
  var TOKEN_CATEGORIES = CATEGORIES;
  var SHARED_KNOBS = [
    "scheme",
    "surfaceRamp",
    "accentStrategy",
    "accentShiftStep",
    "accentSplit",
    "contrastBand",
    "vibrancy",
    "typeScale",
    "radiusScale",
    "density",
    "cues",
    "fonts",
    "anchors"
  ];
  var SHARED_KNOB_SPECS = [
    {
      name: "scheme",
      kind: "select",
      label: "Scheme",
      options: [
        { value: "dark", label: "dark" },
        { value: "light", label: "light" }
      ]
    },
    {
      name: "contrastBand",
      kind: "select",
      label: "Contrast band",
      default: "aa",
      options: [
        { value: "aa", label: "AA" },
        { value: "aaa", label: "AAA" }
      ]
    },
    {
      name: "density",
      kind: "select",
      label: "Density",
      default: "normal",
      options: [
        { value: "compact", label: "compact" },
        { value: "normal", label: "normal" },
        { value: "comfortable", label: "comfortable" }
      ]
    },
    {
      name: "cues",
      kind: "select",
      label: "Cues",
      default: "color",
      options: [
        { value: "color", label: "color only" },
        { value: "redundant", label: "redundant markers" }
      ]
    },
    {
      name: "accentStrategy",
      kind: "select",
      label: "Accent strategy",
      options: [
        { value: "fan", label: "fan (flanks + complement)" },
        { value: "step", label: "step (even hue wheel)" },
        { value: "shade", label: "shade (one hue, four depths)" },
        { value: "duo", label: "duo (two brands + their shades)" }
      ]
    },
    { name: "vibrancy", kind: "range", label: "Vibrancy", min: 0, max: 1, step: 0.05, default: 0.5 },
    { name: "typeScale", kind: "range", label: "Type scale", min: 1.05, max: 1.6, step: 0.01, default: 1.2 },
    { name: "radiusScale", kind: "range", label: "Radius scale", min: 0, max: 3, step: 0.1, default: 1 },
    // INFO: slider defaults reference the engine's own constants; `surfaceRamp` is signed with a
    // scheme-derived sign, so it declares a per-scheme default.
    {
      name: "surfaceRamp",
      kind: "range",
      label: "Surface ramp",
      min: -0.06,
      max: 0.06,
      step: 5e-3,
      default: DEFAULT_SURFACE_STEP,
      defaultByScheme: { dark: defaultSurfaceRamp("dark"), light: defaultSurfaceRamp("light") }
    },
    { name: "accentSplit", kind: "range", label: "Accent split", min: 0, max: 90, step: 1, default: DEFAULT_ACCENT_SPLIT, unit: "\xB0" },
    { name: "accentShiftStep", kind: "range", label: "Accent shift step", min: 0, max: 180, step: 5, default: DEFAULT_SHIFT_STEP, unit: "\xB0" },
    { name: "anchors", kind: "composite", label: "Anchors" },
    { name: "fonts", kind: "composite", label: "Fonts" }
  ];
  var SHARED_KNOB_SPEC_BY_NAME = new Map(SHARED_KNOB_SPECS.map((spec2) => [spec2.name, spec2]));
  function resolveKnobSpecs(names, extra = []) {
    const byName = new Map(extra.map((spec2) => [spec2.name, spec2]));
    const out = [];
    for (const name of names) {
      const spec2 = byName.get(name) ?? SHARED_KNOB_SPEC_BY_NAME.get(name) ?? { name, kind: "text", undeclared: true };
      out.push(spec2);
    }
    return out;
  }
  function statedSchemes(preset) {
    const own = schemeOf(toOklchColor(preset.defaultAnchors.bg));
    const stated = Object.keys(preset.anchorsByScheme ?? {});
    return [.../* @__PURE__ */ new Set([own, ...stated])];
  }
  var DEFAULT_ANCHORS = {
    bg: "#25272e",
    fg: "#e2e0e0"
  };
  var PRESET_DEFAULTS = {
    knobs: SHARED_KNOBS,
    defaultAnchors: DEFAULT_ANCHORS,
    contrastFloor: 4.7,
    declaredTextOnFillFloor: 4.5,
    declaredFocusRingFloor: 3,
    defaultVibrancy: 0.5,
    accentChromaMul: 1,
    statusChromaMul: 1,
    paletteChromaMul: 1,
    neutralChroma: 0.01,
    elevationStrengthMul: 1,
    elevationAlphaBoost: 0,
    accentTintChromaMul: 0.3
  };

  // packages/xtyle/dist/authoring.js
  function toLineage(nodes) {
    return nodes.map(({ name, value, refs }) => refs && refs.length ? { name, value, refs } : { name, value });
  }
  function registerExports(graph, traced, manifest, invariants) {
    xript.exports.register("graph", (...args) => toLineage(graph(args[0] ?? {})));
    xript.exports.register("traced", (...args) => traced(args[0] ?? {}));
    xript.exports.register("manifest", () => ({ ...manifest, invariantCount: invariants.length }));
    xript.exports.register("invariants", (...args) => invariants.map((invariant) => invariant(args[0])));
  }
  function tracePreset(preset, buildPasses, input) {
    return runPipeline(buildPasses(preset, input), (passIndex) => buildPassContext(preset, input, passIndex)).trace;
  }
  function toPreset(spec2) {
    const chroma = spec2.chroma ?? {};
    const elevation = spec2.elevation ?? {};
    const contrast2 = spec2.contrast ?? {};
    const preset = {
      id: spec2.id,
      knobs: spec2.knobs ?? SHARED_KNOBS,
      knobSpecs: spec2.knobSpecs,
      // INFO: merge over the full default so a spec naming only some anchors still yields complete
      // bg/fg; derivation reads both, so a partial defaultAnchors would crash with no anchor overrides
      defaultAnchors: spec2.anchors ? { ...DEFAULT_ANCHORS, ...spec2.anchors } : DEFAULT_ANCHORS,
      contrastFloor: contrast2.floor ?? PRESET_DEFAULTS.contrastFloor,
      declaredTextOnFillFloor: contrast2.textOnFill ?? PRESET_DEFAULTS.declaredTextOnFillFloor,
      declaredFocusRingFloor: contrast2.focusRing ?? PRESET_DEFAULTS.declaredFocusRingFloor,
      defaultVibrancy: spec2.vibrancy ?? PRESET_DEFAULTS.defaultVibrancy,
      accentChromaMul: chroma.accent ?? PRESET_DEFAULTS.accentChromaMul,
      statusChromaMul: chroma.status ?? PRESET_DEFAULTS.statusChromaMul,
      paletteChromaMul: chroma.palette ?? PRESET_DEFAULTS.paletteChromaMul,
      neutralChroma: chroma.neutral ?? PRESET_DEFAULTS.neutralChroma,
      elevationStrengthMul: elevation.strength ?? PRESET_DEFAULTS.elevationStrengthMul,
      elevationAlphaBoost: elevation.alphaBoost ?? PRESET_DEFAULTS.elevationAlphaBoost,
      accentTintChromaMul: chroma.accentTint ?? PRESET_DEFAULTS.accentTintChromaMul
    };
    if (spec2.anchorsByScheme) {
      const byScheme = {};
      for (const [scheme, stated] of Object.entries(spec2.anchorsByScheme)) {
        if (stated)
          byScheme[scheme] = { ...preset.defaultAnchors, ...stated };
      }
      preset.anchorsByScheme = byScheme;
    }
    if (spec2.accentStrategy)
      preset.accentStrategy = spec2.accentStrategy;
    if (spec2.extreme)
      preset.extreme = true;
    return preset;
  }
  function defineXtyleAlgorithm(spec2) {
    const preset = toPreset(spec2);
    const buildPasses = spec2.passes ?? ((p, input) => [settlePass(p, input)]);
    const singlePass = buildPasses(preset, {}).length === 1;
    const finalNodes = (input) => singlePass ? buildGraph(preset, input) : registerToNodes(runPipeline(buildPasses(preset, input), (passIndex) => buildPassContext(preset, input, passIndex)).register);
    registerExports(finalNodes, (input) => tracePreset(preset, buildPasses, input), {
      since: PACK_SINCE,
      produces: spec2.adds ? [.../* @__PURE__ */ new Set([...PRODUCED_TOKENS, ...spec2.adds.tokens])] : PRODUCED_TOKENS,
      producedSince: PRODUCED_SINCE,
      categories: spec2.adds ? { ...TOKEN_CATEGORIES, ...spec2.adds.categories } : TOKEN_CATEGORIES,
      knobs: preset.knobs,
      knobSpecs: resolveKnobSpecs(preset.knobs, preset.knobSpecs),
      passNames: buildPasses(preset, {}).map((pass) => pass.name),
      focusRingFloor: preset.declaredFocusRingFloor,
      schemes: statedSchemes(preset)
    }, makeInvariants(preset));
  }

  // algorithms/xtyle-quiet/src/preset.ts
  var spec = {
    id: "xtyle-quiet",
    vibrancy: 0.12,
    chroma: { accent: 0.5, status: 0.55, palette: 0.6, neutral: 5e-3, accentTint: 0.18 },
    elevation: { strength: 0.6, alphaBoost: -0.04 },
    anchorsByScheme: { light: { bg: "#ededeb", fg: "#26262a" } }
  };

  // algorithms/xtyle-quiet/src/mod.ts
  defineXtyleAlgorithm(spec);
})();
