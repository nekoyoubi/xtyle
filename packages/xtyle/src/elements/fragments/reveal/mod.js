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

  // packages/xtyle/src/vocab.ts
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

  // packages/xtyle/src/icons.ts
  var stroke = (d) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  var dot = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="1.8" fill="currentColor"/>`;
  var fill = (d) => `<path d="${d}" fill="currentColor"/>`;
  var bar = (x, w) => `<rect x="${x}" y="5" width="${w}" height="14" rx="1" fill="currentColor"/>`;
  var circle = stroke("M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z");
  var ICONS = {
    "chevron-up": stroke("M18 15l-6-6-6 6"),
    "chevron-down": stroke("M6 9l6 6 6-6"),
    "chevron-left": stroke("M15 18l-6-6 6-6"),
    "chevron-right": stroke("M9 6l6 6-6 6"),
    "chevron-expand": stroke("M8 9l4-4 4 4") + stroke("M16 15l-4 4-4-4"),
    "arrow-up": stroke("M12 19V5") + stroke("M6 11l6-6 6 6"),
    "arrow-down": stroke("M12 5v14") + stroke("M6 13l6 6 6-6"),
    "arrow-left": stroke("M19 12H5") + stroke("M11 6l-6 6 6 6"),
    "arrow-right": stroke("M5 12h14") + stroke("M13 6l6 6-6 6"),
    close: stroke("M18 6L6 18") + stroke("M6 6l12 12"),
    check: stroke("M20 6L9 17l-5-5"),
    plus: stroke("M12 5v14") + stroke("M5 12h14"),
    minus: stroke("M5 12h14"),
    menu: stroke("M4 6h16") + stroke("M4 12h16") + stroke("M4 18h16"),
    "more-vertical": dot(12, 5) + dot(12, 12) + dot(12, 19),
    "more-horizontal": dot(5, 12) + dot(12, 12) + dot(19, 12),
    search: stroke("M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z") + stroke("M20 20l-3.6-3.6"),
    info: circle + stroke("M12 11v5") + stroke("M12 8h.01"),
    warning: stroke("M12 3L2 20h20L12 3z") + stroke("M12 10v4") + stroke("M12 17h.01"),
    error: circle + stroke("M15 9l-6 6") + stroke("M9 9l6 6"),
    success: circle + stroke("M8.5 12l2.5 2.5L16 9"),
    "external-link": stroke("M14 4h6v6") + stroke("M20 4l-9 9") + stroke("M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"),
    maximize: stroke("M15 3h6v6") + stroke("M9 21H3v-6") + stroke("M21 3l-7 7") + stroke("M3 21l7-7"),
    dot: `<circle cx="12" cy="12" r="4" fill="currentColor"/>`,
    loader: stroke("M12 3a9 9 0 1 0 9 9"),
    play: fill("M8 5v14l11-7z"),
    pause: bar(7, 3.2) + bar(13.8, 3.2),
    stop: `<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>`,
    "skip-forward": fill("M6 5l9 7-9 7z") + bar(16, 2.6),
    "skip-back": fill("M18 5l-9 7 9 7z") + bar(5.4, 2.6),
    volume: fill("M11 5L6 9H3v6h3l5 4V5z") + stroke("M15.5 8.5a5 5 0 0 1 0 7") + stroke("M18.5 6a9 9 0 0 1 0 12"),
    "volume-off": fill("M11 5L6 9H3v6h3l5 4V5z") + stroke("M22 9l-6 6") + stroke("M16 9l6 6"),
    gear: stroke("M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z") + stroke(
      "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
    ),
    folder: stroke("M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"),
    pencil: stroke("M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"),
    trash: stroke("M3 6h18") + stroke("M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6") + stroke("M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"),
    eye: stroke("M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z") + stroke("M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"),
    copy: stroke("M10 8h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z") + stroke("M6 16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"),
    palette: stroke(
      "M12 3a9 9 0 1 0 0 18c.9 0 1.5-.7 1.5-1.5 0-.4-.15-.72-.4-1-.24-.27-.35-.6-.35-1 0-.8.7-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.4-4-8-9-8z"
    ) + dot(8.5, 10.5) + dot(12, 8) + dot(15.5, 10.5),
    bookmark: stroke("M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"),
    download: stroke("M12 3v12") + stroke("M7 10l5 5 5-5") + stroke("M4 20h16")
  };
  var ICON_NAMES = Object.keys(ICONS);
  function hasIcon(name) {
    return Object.prototype.hasOwnProperty.call(ICONS, name);
  }
  function escapeAttr2(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function iconClass(opts) {
    const size = opts.size ?? "md";
    return [
      "xtyle-icon",
      size !== "md" && `xtyle-icon--${size}`,
      opts.tone && `xtyle-icon--${opts.tone}`,
      opts.spin && "xtyle-icon--spin",
      opts.class
    ].filter(Boolean).join(" ");
  }
  var MISSING = stroke("M5 5h14v14H5z");
  function renderIcon(name, opts = {}) {
    const body = opts.body ?? (hasIcon(name) ? ICONS[name] : MISSING);
    const part = opts.part ? ` part="${escapeAttr2(opts.part)}"` : "";
    const a11y = opts.label ? `role="img" aria-label="${escapeAttr2(opts.label)}"` : `aria-hidden="true"`;
    const title = opts.label ? `<title>${escapeAttr2(opts.label)}</title>` : "";
    return `<svg${part} class="${iconClass(opts)}" viewBox="0 0 24 24" width="1em" height="1em" focusable="false" ${a11y}>${title}${body}</svg>`;
  }

  // packages/xtyle/src/elements/fragments/reveal/mod.ts
  var DIRECTIONS = ["start", "end", "top", "bottom"];
  var liveDirections = (b) => {
    if (b.directions && b.directions.length > 0) return b.directions;
    const live = [];
    if (b.hasStart) live.push("start");
    if (b.hasEnd) live.push("end");
    if (b.hasTop) live.push("top");
    if (b.hasBottom) live.push("bottom");
    return live;
  };
  function revealClass(b) {
    const classes = ["xtyle-reveal"];
    if (b.disabled) classes.push("xtyle-reveal--disabled");
    if (b.grouped) classes.push("xtyle-reveal--grouped");
    if (b.bleed) classes.push("xtyle-reveal--bleed");
    if (b.open) classes.push("xtyle-reveal--open", `xtyle-reveal--open-${b.open}`);
    if (b.shaped) {
      classes.push("xtyle-reveal--shaped");
      if (b.contained) classes.push("xtyle-reveal--contained");
    }
    for (const direction of liveDirections(b)) classes.push(`xtyle-reveal--has-${direction}`);
    return classes.join(" ");
  }
  function bellyHtml(direction, b) {
    const live = liveDirections(b).indexOf(direction) !== -1;
    const hidden = live ? "" : " hidden";
    const inert = b.open === direction ? "" : " inert";
    const tone = b.tones ? b.tones[direction] : null;
    const toned = tone ? ` xtyle-reveal__belly--toned xtyle-reveal__belly--${tone}` : "";
    return `<div class="xtyle-reveal__belly xtyle-reveal__belly--${direction}${toned}" part="belly belly-${direction}" data-belly="${direction}" data-slot="${direction}"${hidden}${inert}><slot name="${direction}"></slot></div>`;
  }
  function gripMark(direction, b) {
    const style = b.gripStyles && b.gripStyles[direction] || "glyph";
    if (style === "bar") return '<span class="xtyle-reveal__grip-bar"></span>';
    if (style === "dots") {
      return '<span class="xtyle-reveal__grip-dots"><span></span><span></span><span></span></span>';
    }
    const name = b.grips && b.grips[direction] || "chevron-right";
    const body = b.gripBodies ? b.gripBodies[direction] : null;
    return `<xtyle-icon class="xtyle-reveal__grip-icon" name="${escapeAttr(name)}" aria-hidden="true">` + renderIcon(name, { body }) + "</xtyle-icon>";
  }
  function gripHtml(direction, b) {
    if (b.gripStyles && b.gripStyles[direction] === "none") return "";
    const tone = b.tones ? b.tones[direction] : null;
    const toned = tone ? ` xtyle-reveal__grip--${tone}` : "";
    const style = b.gripStyles && b.gripStyles[direction] || "glyph";
    return `<button type="button" class="xtyle-reveal__grip xtyle-reveal__grip--${direction} xtyle-reveal__grip--${style}${toned}" part="grip grip-${direction}" data-grip="${direction}" tabindex="-1" aria-hidden="true">` + gripMark(direction, b) + "</button>";
  }
  function lidHtml(b) {
    const label = b.label ? ` aria-label="${escapeAttr(b.label)}"` : "";
    const tabindex = b.disabled ? "-1" : "0";
    const grips = liveDirections(b).map((direction) => gripHtml(direction, b)).join("");
    return `<div class="xtyle-reveal__lid" part="lid" tabindex="${tabindex}" role="${b.control ? "button" : "group"}"${label} aria-expanded="${escapeAttr(b.open ? "true" : "false")}"><div class="xtyle-reveal__content" part="content" data-slot><slot></slot></div>` + grips + "</div>";
  }
  function revealHtml(b) {
    const bellies = DIRECTIONS.map((direction) => bellyHtml(direction, b)).join("");
    return `<div part="reveal" class="${revealClass(b)}" data-open="${escapeAttr(b.open ?? "")}">${bellies}${lidHtml(b)}</div>`;
  }
  hooks.fragment.mount("reveal", (bindings, ops) => {
    ops.replaceChildren("[data-reveal]", revealHtml(bindings));
  });
  hooks.fragment.update("reveal", (bindings, ops) => {
    ops.setAttr(".xtyle-reveal", "class", revealClass(bindings));
    ops.setAttr(".xtyle-reveal", "data-open", bindings.open ?? "");
    ops.setAttr(".xtyle-reveal__lid", "role", bindings.control ? "button" : "group");
    ops.setAttr(".xtyle-reveal__lid", "aria-expanded", bindings.open ? "true" : "false");
    ops.setAttr(".xtyle-reveal__lid", "tabindex", bindings.disabled ? "-1" : "0");
    for (const direction of DIRECTIONS) {
      const live = liveDirections(bindings).indexOf(direction) !== -1;
      ops.toggle(`.xtyle-reveal__belly--${direction}`, live);
      const tone = bindings.tones ? bindings.tones[direction] : null;
      ops.setAttr(
        `.xtyle-reveal__belly--${direction}`,
        "class",
        `xtyle-reveal__belly xtyle-reveal__belly--${direction}${tone ? ` xtyle-reveal__belly--toned xtyle-reveal__belly--${tone}` : ""}`
      );
    }
  });
  var ARROW_DIRECTION = {
    ArrowRight: "start",
    ArrowLeft: "end",
    ArrowDown: "top",
    ArrowUp: "bottom"
  };
  xript.exports.register("keydown", (...args) => {
    const payload = args[0] ?? {};
    const context = args[1] ?? {};
    const live = context.directions ?? [];
    if (payload.key === "Escape" && context.open) return { conceal: true, preventDefault: true };
    if (payload.key === "Enter" || payload.key === " " || payload.key === "Spacebar") {
      const target = context.open ?? (live.length === 1 ? live[0] : void 0);
      if (target) return { commit: target, preventDefault: true };
      return {};
    }
    const wanted = payload.key ? ARROW_DIRECTION[payload.key] : void 0;
    if (wanted && live.indexOf(wanted) !== -1) return { reveal: wanted, preventDefault: true };
    return {};
  });
  xript.exports.register("grip", (...args) => {
    const payload = args[0] ?? {};
    const direction = payload.dataset ? payload.dataset.grip : void 0;
    return direction ? { reveal: direction, preventDefault: true } : {};
  });
})();
