(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // node_modules/culori/src/rgb/parseNumber.js
  var parseNumber = (color, len) => {
    if (typeof color !== "number") return;
    if (len === 3) {
      return {
        mode: "rgb",
        r: (color >> 8 & 15 | color >> 4 & 240) / 255,
        g: (color >> 4 & 15 | color & 240) / 255,
        b: (color & 15 | color << 4 & 240) / 255
      };
    }
    if (len === 4) {
      return {
        mode: "rgb",
        r: (color >> 12 & 15 | color >> 8 & 240) / 255,
        g: (color >> 8 & 15 | color >> 4 & 240) / 255,
        b: (color >> 4 & 15 | color & 240) / 255,
        alpha: (color & 15 | color << 4 & 240) / 255
      };
    }
    if (len === 6) {
      return {
        mode: "rgb",
        r: (color >> 16 & 255) / 255,
        g: (color >> 8 & 255) / 255,
        b: (color & 255) / 255
      };
    }
    if (len === 8) {
      return {
        mode: "rgb",
        r: (color >> 24 & 255) / 255,
        g: (color >> 16 & 255) / 255,
        b: (color >> 8 & 255) / 255,
        alpha: (color & 255) / 255
      };
    }
  };
  var parseNumber_default = parseNumber;

  // node_modules/culori/src/colors/named.js
  var named = {
    aliceblue: 15792383,
    antiquewhite: 16444375,
    aqua: 65535,
    aquamarine: 8388564,
    azure: 15794175,
    beige: 16119260,
    bisque: 16770244,
    black: 0,
    blanchedalmond: 16772045,
    blue: 255,
    blueviolet: 9055202,
    brown: 10824234,
    burlywood: 14596231,
    cadetblue: 6266528,
    chartreuse: 8388352,
    chocolate: 13789470,
    coral: 16744272,
    cornflowerblue: 6591981,
    cornsilk: 16775388,
    crimson: 14423100,
    cyan: 65535,
    darkblue: 139,
    darkcyan: 35723,
    darkgoldenrod: 12092939,
    darkgray: 11119017,
    darkgreen: 25600,
    darkgrey: 11119017,
    darkkhaki: 12433259,
    darkmagenta: 9109643,
    darkolivegreen: 5597999,
    darkorange: 16747520,
    darkorchid: 10040012,
    darkred: 9109504,
    darksalmon: 15308410,
    darkseagreen: 9419919,
    darkslateblue: 4734347,
    darkslategray: 3100495,
    darkslategrey: 3100495,
    darkturquoise: 52945,
    darkviolet: 9699539,
    deeppink: 16716947,
    deepskyblue: 49151,
    dimgray: 6908265,
    dimgrey: 6908265,
    dodgerblue: 2003199,
    firebrick: 11674146,
    floralwhite: 16775920,
    forestgreen: 2263842,
    fuchsia: 16711935,
    gainsboro: 14474460,
    ghostwhite: 16316671,
    gold: 16766720,
    goldenrod: 14329120,
    gray: 8421504,
    green: 32768,
    greenyellow: 11403055,
    grey: 8421504,
    honeydew: 15794160,
    hotpink: 16738740,
    indianred: 13458524,
    indigo: 4915330,
    ivory: 16777200,
    khaki: 15787660,
    lavender: 15132410,
    lavenderblush: 16773365,
    lawngreen: 8190976,
    lemonchiffon: 16775885,
    lightblue: 11393254,
    lightcoral: 15761536,
    lightcyan: 14745599,
    lightgoldenrodyellow: 16448210,
    lightgray: 13882323,
    lightgreen: 9498256,
    lightgrey: 13882323,
    lightpink: 16758465,
    lightsalmon: 16752762,
    lightseagreen: 2142890,
    lightskyblue: 8900346,
    lightslategray: 7833753,
    lightslategrey: 7833753,
    lightsteelblue: 11584734,
    lightyellow: 16777184,
    lime: 65280,
    limegreen: 3329330,
    linen: 16445670,
    magenta: 16711935,
    maroon: 8388608,
    mediumaquamarine: 6737322,
    mediumblue: 205,
    mediumorchid: 12211667,
    mediumpurple: 9662683,
    mediumseagreen: 3978097,
    mediumslateblue: 8087790,
    mediumspringgreen: 64154,
    mediumturquoise: 4772300,
    mediumvioletred: 13047173,
    midnightblue: 1644912,
    mintcream: 16121850,
    mistyrose: 16770273,
    moccasin: 16770229,
    navajowhite: 16768685,
    navy: 128,
    oldlace: 16643558,
    olive: 8421376,
    olivedrab: 7048739,
    orange: 16753920,
    orangered: 16729344,
    orchid: 14315734,
    palegoldenrod: 15657130,
    palegreen: 10025880,
    paleturquoise: 11529966,
    palevioletred: 14381203,
    papayawhip: 16773077,
    peachpuff: 16767673,
    peru: 13468991,
    pink: 16761035,
    plum: 14524637,
    powderblue: 11591910,
    purple: 8388736,
    // Added in CSS Colors Level 4:
    // https://drafts.csswg.org/css-color/#changes-from-3
    rebeccapurple: 6697881,
    red: 16711680,
    rosybrown: 12357519,
    royalblue: 4286945,
    saddlebrown: 9127187,
    salmon: 16416882,
    sandybrown: 16032864,
    seagreen: 3050327,
    seashell: 16774638,
    sienna: 10506797,
    silver: 12632256,
    skyblue: 8900331,
    slateblue: 6970061,
    slategray: 7372944,
    slategrey: 7372944,
    snow: 16775930,
    springgreen: 65407,
    steelblue: 4620980,
    tan: 13808780,
    teal: 32896,
    thistle: 14204888,
    tomato: 16737095,
    turquoise: 4251856,
    violet: 15631086,
    wheat: 16113331,
    white: 16777215,
    whitesmoke: 16119285,
    yellow: 16776960,
    yellowgreen: 10145074
  };
  var named_default = named;

  // node_modules/culori/src/rgb/parseNamed.js
  var parseNamed = (color) => {
    return parseNumber_default(named_default[color.toLowerCase()], 6);
  };
  var parseNamed_default = parseNamed;

  // node_modules/culori/src/rgb/parseHex.js
  var hex = /^#?([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})$/i;
  var parseHex = (color) => {
    let match;
    return (match = color.match(hex)) ? parseNumber_default(parseInt(match[1], 16), match[1].length) : void 0;
  };
  var parseHex_default = parseHex;

  // node_modules/culori/src/util/regex.js
  var num = "([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)";
  var num_none = `(?:${num}|none)`;
  var per = `${num}%`;
  var per_none = `(?:${num}%|none)`;
  var num_per = `(?:${num}%|${num})`;
  var num_per_none = `(?:${num}%|${num}|none)`;
  var hue = `(?:${num}(deg|grad|rad|turn)|${num})`;
  var hue_none = `(?:${num}(deg|grad|rad|turn)|${num}|none)`;
  var c = `\\s*,\\s*`;
  var rx_num_per_none = new RegExp("^" + num_per_none + "$");

  // node_modules/culori/src/rgb/parseRgbLegacy.js
  var rgb_num_old = new RegExp(
    `^rgba?\\(\\s*${num}${c}${num}${c}${num}\\s*(?:,\\s*${num_per}\\s*)?\\)$`
  );
  var rgb_per_old = new RegExp(
    `^rgba?\\(\\s*${per}${c}${per}${c}${per}\\s*(?:,\\s*${num_per}\\s*)?\\)$`
  );
  var parseRgbLegacy = (color) => {
    let res = { mode: "rgb" };
    let match;
    if (match = color.match(rgb_num_old)) {
      if (match[1] !== void 0) {
        res.r = match[1] / 255;
      }
      if (match[2] !== void 0) {
        res.g = match[2] / 255;
      }
      if (match[3] !== void 0) {
        res.b = match[3] / 255;
      }
    } else if (match = color.match(rgb_per_old)) {
      if (match[1] !== void 0) {
        res.r = match[1] / 100;
      }
      if (match[2] !== void 0) {
        res.g = match[2] / 100;
      }
      if (match[3] !== void 0) {
        res.b = match[3] / 100;
      }
    } else {
      return void 0;
    }
    if (match[4] !== void 0) {
      res.alpha = Math.max(0, Math.min(1, match[4] / 100));
    } else if (match[5] !== void 0) {
      res.alpha = Math.max(0, Math.min(1, +match[5]));
    }
    return res;
  };
  var parseRgbLegacy_default = parseRgbLegacy;

  // node_modules/culori/src/_prepare.js
  var prepare = (color, mode) => color === void 0 ? void 0 : typeof color !== "object" ? parse_default(color) : color.mode !== void 0 ? color : mode ? { ...color, mode } : void 0;
  var prepare_default = prepare;

  // node_modules/culori/src/converter.js
  var converter = (target_mode = "rgb") => (color) => (color = prepare_default(color, target_mode)) !== void 0 ? (
    // if the color's mode corresponds to our target mode
    color.mode === target_mode ? (
      // then just return the color
      color
    ) : (
      // otherwise check to see if we have a dedicated
      // converter for the target mode
      converters[color.mode][target_mode] ? (
        // and return its result...
        converters[color.mode][target_mode](color)
      ) : (
        // ...otherwise pass through RGB as an intermediary step.
        // if the target mode is RGB...
        target_mode === "rgb" ? (
          // just return the RGB
          converters[color.mode].rgb(color)
        ) : (
          // otherwise convert color.mode -> RGB -> target_mode
          converters.rgb[target_mode](converters[color.mode].rgb(color))
        )
      )
    )
  ) : void 0;
  var converter_default = converter;

  // node_modules/culori/src/modes.js
  var converters = {};
  var modes = {};
  var parsers = [];
  var colorProfiles = {};
  var identity = (v) => v;
  var useMode = (definition29) => {
    converters[definition29.mode] = {
      ...converters[definition29.mode],
      ...definition29.toMode
    };
    Object.keys(definition29.fromMode || {}).forEach((k4) => {
      if (!converters[k4]) {
        converters[k4] = {};
      }
      converters[k4][definition29.mode] = definition29.fromMode[k4];
    });
    if (!definition29.ranges) {
      definition29.ranges = {};
    }
    if (!definition29.difference) {
      definition29.difference = {};
    }
    definition29.channels.forEach((channel) => {
      if (definition29.ranges[channel] === void 0) {
        definition29.ranges[channel] = [0, 1];
      }
      if (!definition29.interpolate[channel]) {
        throw new Error(`Missing interpolator for: ${channel}`);
      }
      if (typeof definition29.interpolate[channel] === "function") {
        definition29.interpolate[channel] = {
          use: definition29.interpolate[channel]
        };
      }
      if (!definition29.interpolate[channel].fixup) {
        definition29.interpolate[channel].fixup = identity;
      }
    });
    modes[definition29.mode] = definition29;
    (definition29.parse || []).forEach((parser) => {
      useParser(parser, definition29.mode);
    });
    return converter_default(definition29.mode);
  };
  var getMode = (mode) => modes[mode];
  var useParser = (parser, mode) => {
    if (typeof parser === "string") {
      if (!mode) {
        throw new Error(`'mode' required when 'parser' is a string`);
      }
      colorProfiles[parser] = mode;
    } else if (typeof parser === "function") {
      if (parsers.indexOf(parser) < 0) {
        parsers.push(parser);
      }
    }
  };

  // node_modules/culori/src/parse.js
  var IdentStartCodePoint = /[^\x00-\x7F]|[a-zA-Z_]/;
  var IdentCodePoint = /[^\x00-\x7F]|[-\w]/;
  var Tok = {
    Function: "function",
    Ident: "ident",
    Number: "number",
    Percentage: "percentage",
    ParenClose: ")",
    None: "none",
    Hue: "hue",
    Alpha: "alpha"
  };
  var _i = 0;
  function is_num(chars) {
    let ch = chars[_i];
    let ch1 = chars[_i + 1];
    if (ch === "-" || ch === "+") {
      return /\d/.test(ch1) || ch1 === "." && /\d/.test(chars[_i + 2]);
    }
    if (ch === ".") {
      return /\d/.test(ch1);
    }
    return /\d/.test(ch);
  }
  function is_ident(chars) {
    if (_i >= chars.length) {
      return false;
    }
    let ch = chars[_i];
    if (IdentStartCodePoint.test(ch)) {
      return true;
    }
    if (ch === "-") {
      if (chars.length - _i < 2) {
        return false;
      }
      let ch1 = chars[_i + 1];
      if (ch1 === "-" || IdentStartCodePoint.test(ch1)) {
        return true;
      }
      return false;
    }
    return false;
  }
  var huenits = {
    deg: 1,
    rad: 180 / Math.PI,
    grad: 9 / 10,
    turn: 360
  };
  function num2(chars) {
    let value = "";
    if (chars[_i] === "-" || chars[_i] === "+") {
      value += chars[_i++];
    }
    value += digits(chars);
    if (chars[_i] === "." && /\d/.test(chars[_i + 1])) {
      value += chars[_i++] + digits(chars);
    }
    if (chars[_i] === "e" || chars[_i] === "E") {
      if ((chars[_i + 1] === "-" || chars[_i + 1] === "+") && /\d/.test(chars[_i + 2])) {
        value += chars[_i++] + chars[_i++] + digits(chars);
      } else if (/\d/.test(chars[_i + 1])) {
        value += chars[_i++] + digits(chars);
      }
    }
    if (is_ident(chars)) {
      let id = ident(chars);
      if (id === "deg" || id === "rad" || id === "turn" || id === "grad") {
        return { type: Tok.Hue, value: value * huenits[id] };
      }
      return void 0;
    }
    if (chars[_i] === "%") {
      _i++;
      return { type: Tok.Percentage, value: +value };
    }
    return { type: Tok.Number, value: +value };
  }
  function digits(chars) {
    let v = "";
    while (/\d/.test(chars[_i])) {
      v += chars[_i++];
    }
    return v;
  }
  function ident(chars) {
    let v = "";
    while (_i < chars.length && IdentCodePoint.test(chars[_i])) {
      v += chars[_i++];
    }
    return v;
  }
  function identlike(chars) {
    let v = ident(chars);
    if (chars[_i] === "(") {
      _i++;
      return { type: Tok.Function, value: v };
    }
    if (v === "none") {
      return { type: Tok.None, value: void 0 };
    }
    return { type: Tok.Ident, value: v };
  }
  function tokenize(str = "") {
    let chars = str.trim();
    let tokens = [];
    let ch;
    _i = 0;
    while (_i < chars.length) {
      ch = chars[_i++];
      if (ch === "\n" || ch === "	" || ch === " ") {
        while (_i < chars.length && (chars[_i] === "\n" || chars[_i] === "	" || chars[_i] === " ")) {
          _i++;
        }
        continue;
      }
      if (ch === ",") {
        return void 0;
      }
      if (ch === ")") {
        tokens.push({ type: Tok.ParenClose });
        continue;
      }
      if (ch === "+") {
        _i--;
        if (is_num(chars)) {
          tokens.push(num2(chars));
          continue;
        }
        return void 0;
      }
      if (ch === "-") {
        _i--;
        if (is_num(chars)) {
          tokens.push(num2(chars));
          continue;
        }
        if (is_ident(chars)) {
          tokens.push({ type: Tok.Ident, value: ident(chars) });
          continue;
        }
        return void 0;
      }
      if (ch === ".") {
        _i--;
        if (is_num(chars)) {
          tokens.push(num2(chars));
          continue;
        }
        return void 0;
      }
      if (ch === "/") {
        while (_i < chars.length && (chars[_i] === "\n" || chars[_i] === "	" || chars[_i] === " ")) {
          _i++;
        }
        let alpha2;
        if (is_num(chars)) {
          alpha2 = num2(chars);
          if (alpha2.type !== Tok.Hue) {
            tokens.push({ type: Tok.Alpha, value: alpha2 });
            continue;
          }
        }
        if (is_ident(chars)) {
          if (ident(chars) === "none") {
            tokens.push({
              type: Tok.Alpha,
              value: { type: Tok.None, value: void 0 }
            });
            continue;
          }
        }
        return void 0;
      }
      if (/\d/.test(ch)) {
        _i--;
        tokens.push(num2(chars));
        continue;
      }
      if (IdentStartCodePoint.test(ch)) {
        _i--;
        tokens.push(identlike(chars));
        continue;
      }
      return void 0;
    }
    return tokens;
  }
  function parseColorSyntax(tokens) {
    tokens._i = 0;
    let token = tokens[tokens._i++];
    if (!token || token.type !== Tok.Function || token.value !== "color") {
      return void 0;
    }
    token = tokens[tokens._i++];
    if (token.type !== Tok.Ident) {
      return void 0;
    }
    const mode = colorProfiles[token.value];
    if (!mode) {
      return void 0;
    }
    const res = { mode };
    const coords = consumeCoords(tokens, false);
    if (!coords) {
      return void 0;
    }
    const channels = getMode(mode).channels;
    for (let ii = 0, c2, ch; ii < channels.length; ii++) {
      c2 = coords[ii];
      ch = channels[ii];
      if (c2.type !== Tok.None) {
        res[ch] = c2.type === Tok.Number ? c2.value : c2.value / 100;
        if (ch === "alpha") {
          res[ch] = Math.max(0, Math.min(1, res[ch]));
        }
      }
    }
    return res;
  }
  function consumeCoords(tokens, includeHue) {
    const coords = [];
    let token;
    while (tokens._i < tokens.length) {
      token = tokens[tokens._i++];
      if (token.type === Tok.None || token.type === Tok.Number || token.type === Tok.Alpha || token.type === Tok.Percentage || includeHue && token.type === Tok.Hue) {
        coords.push(token);
        continue;
      }
      if (token.type === Tok.ParenClose) {
        if (tokens._i < tokens.length) {
          return void 0;
        }
        continue;
      }
      return void 0;
    }
    if (coords.length < 3 || coords.length > 4) {
      return void 0;
    }
    if (coords.length === 4) {
      if (coords[3].type !== Tok.Alpha) {
        return void 0;
      }
      coords[3] = coords[3].value;
    }
    if (coords.length === 3) {
      coords.push({ type: Tok.None, value: void 0 });
    }
    return coords.every((c2) => c2.type !== Tok.Alpha) ? coords : void 0;
  }
  function parseModernSyntax(tokens, includeHue) {
    tokens._i = 0;
    let token = tokens[tokens._i++];
    if (!token || token.type !== Tok.Function) {
      return void 0;
    }
    let coords = consumeCoords(tokens, includeHue);
    if (!coords) {
      return void 0;
    }
    coords.unshift(token.value);
    return coords;
  }
  var parse = (color) => {
    if (typeof color !== "string") {
      return void 0;
    }
    const tokens = tokenize(color);
    const parsed = tokens ? parseModernSyntax(tokens, true) : void 0;
    let result = void 0;
    let i = 0;
    let len = parsers.length;
    while (i < len) {
      if ((result = parsers[i++](color, parsed)) !== void 0) {
        return result;
      }
    }
    return tokens ? parseColorSyntax(tokens) : void 0;
  };
  var parse_default = parse;

  // node_modules/culori/src/rgb/parseRgb.js
  function parseRgb(color, parsed) {
    if (!parsed || parsed[0] !== "rgb" && parsed[0] !== "rgba") {
      return void 0;
    }
    const res = { mode: "rgb" };
    const [, r2, g, b, alpha2] = parsed;
    if (r2.type === Tok.Hue || g.type === Tok.Hue || b.type === Tok.Hue) {
      return void 0;
    }
    if (r2.type !== Tok.None) {
      res.r = r2.type === Tok.Number ? r2.value / 255 : r2.value / 100;
    }
    if (g.type !== Tok.None) {
      res.g = g.type === Tok.Number ? g.value / 255 : g.value / 100;
    }
    if (b.type !== Tok.None) {
      res.b = b.type === Tok.Number ? b.value / 255 : b.value / 100;
    }
    if (alpha2.type !== Tok.None) {
      res.alpha = Math.min(
        1,
        Math.max(
          0,
          alpha2.type === Tok.Number ? alpha2.value : alpha2.value / 100
        )
      );
    }
    return res;
  }
  var parseRgb_default = parseRgb;

  // node_modules/culori/src/rgb/parseTransparent.js
  var parseTransparent = (c2) => c2 === "transparent" ? { mode: "rgb", r: 0, g: 0, b: 0, alpha: 0 } : void 0;
  var parseTransparent_default = parseTransparent;

  // node_modules/culori/src/interpolate/lerp.js
  var lerp = (a, b, t) => a + t * (b - a);

  // node_modules/culori/src/interpolate/piecewise.js
  var get_classes = (arr) => {
    let classes = [];
    for (let i = 0; i < arr.length - 1; i++) {
      let a = arr[i];
      let b = arr[i + 1];
      if (a === void 0 && b === void 0) {
        classes.push(void 0);
      } else if (a !== void 0 && b !== void 0) {
        classes.push([a, b]);
      } else {
        classes.push(a !== void 0 ? [a, a] : [b, b]);
      }
    }
    return classes;
  };
  var interpolatorPiecewise = (interpolator) => (arr) => {
    let classes = get_classes(arr);
    return (t) => {
      let cls = t * classes.length;
      let idx = t >= 1 ? classes.length - 1 : Math.max(Math.floor(cls), 0);
      let pair = classes[idx];
      return pair === void 0 ? void 0 : interpolator(pair[0], pair[1], cls - idx);
    };
  };

  // node_modules/culori/src/interpolate/linear.js
  var interpolatorLinear = interpolatorPiecewise(lerp);

  // node_modules/culori/src/fixup/alpha.js
  var fixupAlpha = (arr) => {
    let some_defined = false;
    let res = arr.map((v) => {
      if (v !== void 0) {
        some_defined = true;
        return v;
      }
      return 1;
    });
    return some_defined ? res : arr;
  };

  // node_modules/culori/src/rgb/definition.js
  var definition = {
    mode: "rgb",
    channels: ["r", "g", "b", "alpha"],
    parse: [
      parseRgb_default,
      parseHex_default,
      parseRgbLegacy_default,
      parseNamed_default,
      parseTransparent_default,
      "srgb"
    ],
    serialize: "srgb",
    interpolate: {
      r: interpolatorLinear,
      g: interpolatorLinear,
      b: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    },
    gamut: true,
    white: { r: 1, g: 1, b: 1 },
    black: { r: 0, g: 0, b: 0 }
  };
  var definition_default = definition;

  // node_modules/culori/src/a98/convertA98ToXyz65.js
  var linearize = (v = 0) => Math.pow(Math.abs(v), 563 / 256) * Math.sign(v);
  var convertA98ToXyz65 = (a982) => {
    let r2 = linearize(a982.r);
    let g = linearize(a982.g);
    let b = linearize(a982.b);
    let res = {
      mode: "xyz65",
      x: 0.5766690429101305 * r2 + 0.1855582379065463 * g + 0.1882286462349947 * b,
      y: 0.297344975250536 * r2 + 0.6273635662554661 * g + 0.0752914584939979 * b,
      z: 0.0270313613864123 * r2 + 0.0706888525358272 * g + 0.9913375368376386 * b
    };
    if (a982.alpha !== void 0) {
      res.alpha = a982.alpha;
    }
    return res;
  };
  var convertA98ToXyz65_default = convertA98ToXyz65;

  // node_modules/culori/src/a98/convertXyz65ToA98.js
  var gamma = (v) => Math.pow(Math.abs(v), 256 / 563) * Math.sign(v);
  var convertXyz65ToA98 = ({ x, y, z, alpha: alpha2 }) => {
    if (x === void 0) x = 0;
    if (y === void 0) y = 0;
    if (z === void 0) z = 0;
    let res = {
      mode: "a98",
      r: gamma(
        x * 2.0415879038107465 - y * 0.5650069742788597 - 0.3447313507783297 * z
      ),
      g: gamma(
        x * -0.9692436362808798 + y * 1.8759675015077206 + 0.0415550574071756 * z
      ),
      b: gamma(
        x * 0.0134442806320312 - y * 0.1183623922310184 + 1.0151749943912058 * z
      )
    };
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertXyz65ToA98_default = convertXyz65ToA98;

  // node_modules/culori/src/lrgb/convertRgbToLrgb.js
  var fn = (c2 = 0) => {
    const abs2 = Math.abs(c2);
    if (abs2 <= 0.04045) {
      return c2 / 12.92;
    }
    return (Math.sign(c2) || 1) * Math.pow((abs2 + 0.055) / 1.055, 2.4);
  };
  var convertRgbToLrgb = ({ r: r2, g, b, alpha: alpha2 }) => {
    let res = {
      mode: "lrgb",
      r: fn(r2),
      g: fn(g),
      b: fn(b)
    };
    if (alpha2 !== void 0) res.alpha = alpha2;
    return res;
  };
  var convertRgbToLrgb_default = convertRgbToLrgb;

  // node_modules/culori/src/xyz65/convertRgbToXyz65.js
  var convertRgbToXyz65 = (rgb4) => {
    let { r: r2, g, b, alpha: alpha2 } = convertRgbToLrgb_default(rgb4);
    let res = {
      mode: "xyz65",
      x: 0.4123907992659593 * r2 + 0.357584339383878 * g + 0.1804807884018343 * b,
      y: 0.2126390058715102 * r2 + 0.715168678767756 * g + 0.0721923153607337 * b,
      z: 0.0193308187155918 * r2 + 0.119194779794626 * g + 0.9505321522496607 * b
    };
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertRgbToXyz65_default = convertRgbToXyz65;

  // node_modules/culori/src/lrgb/convertLrgbToRgb.js
  var fn2 = (c2 = 0) => {
    const abs2 = Math.abs(c2);
    if (abs2 > 31308e-7) {
      return (Math.sign(c2) || 1) * (1.055 * Math.pow(abs2, 1 / 2.4) - 0.055);
    }
    return c2 * 12.92;
  };
  var convertLrgbToRgb = ({ r: r2, g, b, alpha: alpha2 }, mode = "rgb") => {
    let res = {
      mode,
      r: fn2(r2),
      g: fn2(g),
      b: fn2(b)
    };
    if (alpha2 !== void 0) res.alpha = alpha2;
    return res;
  };
  var convertLrgbToRgb_default = convertLrgbToRgb;

  // node_modules/culori/src/xyz65/convertXyz65ToRgb.js
  var convertXyz65ToRgb = ({ x, y, z, alpha: alpha2 }) => {
    if (x === void 0) x = 0;
    if (y === void 0) y = 0;
    if (z === void 0) z = 0;
    let res = convertLrgbToRgb_default({
      r: x * 3.2409699419045226 - y * 1.537383177570094 - 0.4986107602930034 * z,
      g: x * -0.9692436362808796 + y * 1.8759675015077204 + 0.0415550574071756 * z,
      b: x * 0.0556300796969936 - y * 0.2039769588889765 + 1.0569715142428784 * z
    });
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertXyz65ToRgb_default = convertXyz65ToRgb;

  // node_modules/culori/src/a98/definition.js
  var definition2 = {
    ...definition_default,
    mode: "a98",
    parse: ["a98-rgb"],
    serialize: "a98-rgb",
    fromMode: {
      rgb: (color) => convertXyz65ToA98_default(convertRgbToXyz65_default(color)),
      xyz65: convertXyz65ToA98_default
    },
    toMode: {
      rgb: (color) => convertXyz65ToRgb_default(convertA98ToXyz65_default(color)),
      xyz65: convertA98ToXyz65_default
    }
  };
  var definition_default2 = definition2;

  // node_modules/culori/src/util/normalizeHue.js
  var normalizeHue = (hue3) => (hue3 = hue3 % 360) < 0 ? hue3 + 360 : hue3;
  var normalizeHue_default = normalizeHue;

  // node_modules/culori/src/fixup/hue.js
  var hue2 = (hues, fn5) => {
    return hues.map((hue3, idx, arr) => {
      if (hue3 === void 0) {
        return hue3;
      }
      let normalized = normalizeHue_default(hue3);
      if (idx === 0 || hues[idx - 1] === void 0) {
        return normalized;
      }
      return fn5(normalized - normalizeHue_default(arr[idx - 1]));
    }).reduce((acc, curr) => {
      if (!acc.length || curr === void 0 || acc[acc.length - 1] === void 0) {
        acc.push(curr);
        return acc;
      }
      acc.push(curr + acc[acc.length - 1]);
      return acc;
    }, []);
  };
  var fixupHueShorter = (arr) => hue2(arr, (d) => Math.abs(d) <= 180 ? d : d - 360 * Math.sign(d));

  // node_modules/culori/src/cubehelix/constants.js
  var M = [-0.14861, 1.78277, -0.29227, -0.90649, 1.97294, 0];
  var degToRad = Math.PI / 180;
  var radToDeg = 180 / Math.PI;

  // node_modules/culori/src/cubehelix/convertRgbToCubehelix.js
  var DE = M[3] * M[4];
  var BE = M[1] * M[4];
  var BCAD = M[1] * M[2] - M[0] * M[3];
  var convertRgbToCubehelix = ({ r: r2, g, b, alpha: alpha2 }) => {
    if (r2 === void 0) r2 = 0;
    if (g === void 0) g = 0;
    if (b === void 0) b = 0;
    let l = (BCAD * b + r2 * DE - g * BE) / (BCAD + DE - BE);
    let x = b - l;
    let y = (M[4] * (g - l) - M[2] * x) / M[3];
    let res = {
      mode: "cubehelix",
      l,
      s: l === 0 || l === 1 ? void 0 : Math.sqrt(x * x + y * y) / (M[4] * l * (1 - l))
    };
    if (res.s) res.h = Math.atan2(y, x) * radToDeg - 120;
    if (alpha2 !== void 0) res.alpha = alpha2;
    return res;
  };
  var convertRgbToCubehelix_default = convertRgbToCubehelix;

  // node_modules/culori/src/cubehelix/convertCubehelixToRgb.js
  var convertCubehelixToRgb = ({ h, s, l, alpha: alpha2 }) => {
    let res = { mode: "rgb" };
    h = (h === void 0 ? 0 : h + 120) * degToRad;
    if (l === void 0) l = 0;
    let amp = s === void 0 ? 0 : s * l * (1 - l);
    let cosh = Math.cos(h);
    let sinh = Math.sin(h);
    res.r = l + amp * (M[0] * cosh + M[1] * sinh);
    res.g = l + amp * (M[2] * cosh + M[3] * sinh);
    res.b = l + amp * (M[4] * cosh + M[5] * sinh);
    if (alpha2 !== void 0) res.alpha = alpha2;
    return res;
  };
  var convertCubehelixToRgb_default = convertCubehelixToRgb;

  // node_modules/culori/src/difference.js
  var differenceHueSaturation = (std, smp) => {
    if (std.h === void 0 || smp.h === void 0 || !std.s || !smp.s) {
      return 0;
    }
    let std_h = normalizeHue_default(std.h);
    let smp_h = normalizeHue_default(smp.h);
    let dH = Math.sin((smp_h - std_h + 360) / 2 * Math.PI / 180);
    return 2 * Math.sqrt(std.s * smp.s) * dH;
  };
  var differenceHueNaive = (std, smp) => {
    if (std.h === void 0 || smp.h === void 0) {
      return 0;
    }
    let std_h = normalizeHue_default(std.h);
    let smp_h = normalizeHue_default(smp.h);
    if (Math.abs(smp_h - std_h) > 180) {
      return std_h - (smp_h - 360 * Math.sign(smp_h - std_h));
    }
    return smp_h - std_h;
  };
  var differenceHueChroma = (std, smp) => {
    if (std.h === void 0 || smp.h === void 0 || !std.c || !smp.c) {
      return 0;
    }
    let std_h = normalizeHue_default(std.h);
    let smp_h = normalizeHue_default(smp.h);
    let dH = Math.sin((smp_h - std_h + 360) / 2 * Math.PI / 180);
    return 2 * Math.sqrt(std.c * smp.c) * dH;
  };

  // node_modules/culori/src/average.js
  var averageAngle = (val) => {
    let sum = val.reduce(
      (sum2, val2) => {
        if (val2 !== void 0) {
          let rad = val2 * Math.PI / 180;
          sum2.sin += Math.sin(rad);
          sum2.cos += Math.cos(rad);
        }
        return sum2;
      },
      { sin: 0, cos: 0 }
    );
    let angle = Math.atan2(sum.sin, sum.cos) * 180 / Math.PI;
    return angle < 0 ? 360 + angle : angle;
  };

  // node_modules/culori/src/cubehelix/definition.js
  var definition3 = {
    mode: "cubehelix",
    channels: ["h", "s", "l", "alpha"],
    parse: ["--cubehelix"],
    serialize: "--cubehelix",
    ranges: {
      h: [0, 360],
      s: [0, 4.614],
      l: [0, 1]
    },
    fromMode: {
      rgb: convertRgbToCubehelix_default
    },
    toMode: {
      rgb: convertCubehelixToRgb_default
    },
    interpolate: {
      h: {
        use: interpolatorLinear,
        fixup: fixupHueShorter
      },
      s: interpolatorLinear,
      l: interpolatorLinear,
      alpha: {
        use: interpolatorLinear,
        fixup: fixupAlpha
      }
    },
    difference: {
      h: differenceHueSaturation
    },
    average: {
      h: averageAngle
    }
  };
  var definition_default3 = definition3;

  // node_modules/culori/src/lch/convertLabToLch.js
  var convertLabToLch = ({ l, a, b, alpha: alpha2 }, mode = "lch") => {
    if (a === void 0) a = 0;
    if (b === void 0) b = 0;
    let c2 = Math.sqrt(a * a + b * b);
    let res = { mode, l, c: c2 };
    if (c2) res.h = normalizeHue_default(Math.atan2(b, a) * 180 / Math.PI);
    if (alpha2 !== void 0) res.alpha = alpha2;
    return res;
  };
  var convertLabToLch_default = convertLabToLch;

  // node_modules/culori/src/lch/convertLchToLab.js
  var convertLchToLab = ({ l, c: c2, h, alpha: alpha2 }, mode = "lab") => {
    if (h === void 0) h = 0;
    let res = {
      mode,
      l,
      a: c2 ? c2 * Math.cos(h / 180 * Math.PI) : 0,
      b: c2 ? c2 * Math.sin(h / 180 * Math.PI) : 0
    };
    if (alpha2 !== void 0) res.alpha = alpha2;
    return res;
  };
  var convertLchToLab_default = convertLchToLab;

  // node_modules/culori/src/xyz65/constants.js
  var k = Math.pow(29, 3) / Math.pow(3, 3);
  var e = Math.pow(6, 3) / Math.pow(29, 3);

  // node_modules/culori/src/constants.js
  var D50 = {
    X: 0.3457 / 0.3585,
    Y: 1,
    Z: (1 - 0.3457 - 0.3585) / 0.3585
  };
  var D65 = {
    X: 0.3127 / 0.329,
    Y: 1,
    Z: (1 - 0.3127 - 0.329) / 0.329
  };
  var k2 = Math.pow(29, 3) / Math.pow(3, 3);
  var e2 = Math.pow(6, 3) / Math.pow(29, 3);

  // node_modules/culori/src/lab65/convertLab65ToXyz65.js
  var fn3 = (v) => Math.pow(v, 3) > e ? Math.pow(v, 3) : (116 * v - 16) / k;
  var convertLab65ToXyz65 = ({ l, a, b, alpha: alpha2 }) => {
    if (l === void 0) l = 0;
    if (a === void 0) a = 0;
    if (b === void 0) b = 0;
    let fy = (l + 16) / 116;
    let fx = a / 500 + fy;
    let fz = fy - b / 200;
    let res = {
      mode: "xyz65",
      x: fn3(fx) * D65.X,
      y: fn3(fy) * D65.Y,
      z: fn3(fz) * D65.Z
    };
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertLab65ToXyz65_default = convertLab65ToXyz65;

  // node_modules/culori/src/lab65/convertLab65ToRgb.js
  var convertLab65ToRgb = (lab2) => convertXyz65ToRgb_default(convertLab65ToXyz65_default(lab2));
  var convertLab65ToRgb_default = convertLab65ToRgb;

  // node_modules/culori/src/lab65/convertXyz65ToLab65.js
  var f = (value) => value > e ? Math.cbrt(value) : (k * value + 16) / 116;
  var convertXyz65ToLab65 = ({ x, y, z, alpha: alpha2 }) => {
    if (x === void 0) x = 0;
    if (y === void 0) y = 0;
    if (z === void 0) z = 0;
    let f0 = f(x / D65.X);
    let f1 = f(y / D65.Y);
    let f22 = f(z / D65.Z);
    let res = {
      mode: "lab65",
      l: 116 * f1 - 16,
      a: 500 * (f0 - f1),
      b: 200 * (f1 - f22)
    };
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertXyz65ToLab65_default = convertXyz65ToLab65;

  // node_modules/culori/src/lab65/convertRgbToLab65.js
  var convertRgbToLab65 = (rgb4) => {
    let res = convertXyz65ToLab65_default(convertRgbToXyz65_default(rgb4));
    if (rgb4.r === rgb4.b && rgb4.b === rgb4.g) {
      res.a = res.b = 0;
    }
    return res;
  };
  var convertRgbToLab65_default = convertRgbToLab65;

  // node_modules/culori/src/dlch/constants.js
  var kE = 1;
  var kCH = 1;
  var \u03B8 = 26 / 180 * Math.PI;
  var cos\u03B8 = Math.cos(\u03B8);
  var sin\u03B8 = Math.sin(\u03B8);
  var factor = 100 / Math.log(139 / 100);

  // node_modules/culori/src/dlch/convertDlchToLab65.js
  var convertDlchToLab65 = ({ l, c: c2, h, alpha: alpha2 }) => {
    if (l === void 0) l = 0;
    if (c2 === void 0) c2 = 0;
    if (h === void 0) h = 0;
    let res = {
      mode: "lab65",
      l: (Math.exp(l * kE / factor) - 1) / 39e-4
    };
    let G = (Math.exp(0.0435 * c2 * kCH * kE) - 1) / 0.075;
    let e4 = G * Math.cos(h / 180 * Math.PI - \u03B8);
    let f3 = G * Math.sin(h / 180 * Math.PI - \u03B8);
    res.a = e4 * cos\u03B8 - f3 / 0.83 * sin\u03B8;
    res.b = e4 * sin\u03B8 + f3 / 0.83 * cos\u03B8;
    if (alpha2 !== void 0) res.alpha = alpha2;
    return res;
  };
  var convertDlchToLab65_default = convertDlchToLab65;

  // node_modules/culori/src/dlch/convertLab65ToDlch.js
  var convertLab65ToDlch = ({ l, a, b, alpha: alpha2 }) => {
    if (l === void 0) l = 0;
    if (a === void 0) a = 0;
    if (b === void 0) b = 0;
    let e4 = a * cos\u03B8 + b * sin\u03B8;
    let f3 = 0.83 * (b * cos\u03B8 - a * sin\u03B8);
    let G = Math.sqrt(e4 * e4 + f3 * f3);
    let res = {
      mode: "dlch",
      l: factor / kE * Math.log(1 + 39e-4 * l),
      c: Math.log(1 + 0.075 * G) / (0.0435 * kCH * kE)
    };
    if (res.c) {
      res.h = normalizeHue_default((Math.atan2(f3, e4) + \u03B8) / Math.PI * 180);
    }
    if (alpha2 !== void 0) res.alpha = alpha2;
    return res;
  };
  var convertLab65ToDlch_default = convertLab65ToDlch;

  // node_modules/culori/src/dlab/definition.js
  var convertDlabToLab65 = (c2) => convertDlchToLab65_default(convertLabToLch_default(c2, "dlch"));
  var convertLab65ToDlab = (c2) => convertLchToLab_default(convertLab65ToDlch_default(c2), "dlab");
  var definition4 = {
    mode: "dlab",
    parse: ["--din99o-lab"],
    serialize: "--din99o-lab",
    toMode: {
      lab65: convertDlabToLab65,
      rgb: (c2) => convertLab65ToRgb_default(convertDlabToLab65(c2))
    },
    fromMode: {
      lab65: convertLab65ToDlab,
      rgb: (c2) => convertLab65ToDlab(convertRgbToLab65_default(c2))
    },
    channels: ["l", "a", "b", "alpha"],
    ranges: {
      l: [0, 100],
      a: [-40.09, 45.501],
      b: [-40.469, 44.344]
    },
    interpolate: {
      l: interpolatorLinear,
      a: interpolatorLinear,
      b: interpolatorLinear,
      alpha: {
        use: interpolatorLinear,
        fixup: fixupAlpha
      }
    }
  };
  var definition_default4 = definition4;

  // node_modules/culori/src/dlch/definition.js
  var definition5 = {
    mode: "dlch",
    parse: ["--din99o-lch"],
    serialize: "--din99o-lch",
    toMode: {
      lab65: convertDlchToLab65_default,
      dlab: (c2) => convertLchToLab_default(c2, "dlab"),
      rgb: (c2) => convertLab65ToRgb_default(convertDlchToLab65_default(c2))
    },
    fromMode: {
      lab65: convertLab65ToDlch_default,
      dlab: (c2) => convertLabToLch_default(c2, "dlch"),
      rgb: (c2) => convertLab65ToDlch_default(convertRgbToLab65_default(c2))
    },
    channels: ["l", "c", "h", "alpha"],
    ranges: {
      l: [0, 100],
      c: [0, 51.484],
      h: [0, 360]
    },
    interpolate: {
      l: interpolatorLinear,
      c: interpolatorLinear,
      h: {
        use: interpolatorLinear,
        fixup: fixupHueShorter
      },
      alpha: {
        use: interpolatorLinear,
        fixup: fixupAlpha
      }
    },
    difference: {
      h: differenceHueChroma
    },
    average: {
      h: averageAngle
    }
  };
  var definition_default5 = definition5;

  // node_modules/culori/src/hsi/convertHsiToRgb.js
  function convertHsiToRgb({ h, s, i, alpha: alpha2 }) {
    h = normalizeHue_default(h !== void 0 ? h : 0);
    if (s === void 0) s = 0;
    if (i === void 0) i = 0;
    let f3 = Math.abs(h / 60 % 2 - 1);
    let res;
    switch (Math.floor(h / 60)) {
      case 0:
        res = {
          r: i * (1 + s * (3 / (2 - f3) - 1)),
          g: i * (1 + s * (3 * (1 - f3) / (2 - f3) - 1)),
          b: i * (1 - s)
        };
        break;
      case 1:
        res = {
          r: i * (1 + s * (3 * (1 - f3) / (2 - f3) - 1)),
          g: i * (1 + s * (3 / (2 - f3) - 1)),
          b: i * (1 - s)
        };
        break;
      case 2:
        res = {
          r: i * (1 - s),
          g: i * (1 + s * (3 / (2 - f3) - 1)),
          b: i * (1 + s * (3 * (1 - f3) / (2 - f3) - 1))
        };
        break;
      case 3:
        res = {
          r: i * (1 - s),
          g: i * (1 + s * (3 * (1 - f3) / (2 - f3) - 1)),
          b: i * (1 + s * (3 / (2 - f3) - 1))
        };
        break;
      case 4:
        res = {
          r: i * (1 + s * (3 * (1 - f3) / (2 - f3) - 1)),
          g: i * (1 - s),
          b: i * (1 + s * (3 / (2 - f3) - 1))
        };
        break;
      case 5:
        res = {
          r: i * (1 + s * (3 / (2 - f3) - 1)),
          g: i * (1 - s),
          b: i * (1 + s * (3 * (1 - f3) / (2 - f3) - 1))
        };
        break;
      default:
        res = { r: i * (1 - s), g: i * (1 - s), b: i * (1 - s) };
    }
    res.mode = "rgb";
    if (alpha2 !== void 0) res.alpha = alpha2;
    return res;
  }

  // node_modules/culori/src/hsi/convertRgbToHsi.js
  function convertRgbToHsi({ r: r2, g, b, alpha: alpha2 }) {
    if (r2 === void 0) r2 = 0;
    if (g === void 0) g = 0;
    if (b === void 0) b = 0;
    let M3 = Math.max(r2, g, b), m = Math.min(r2, g, b);
    let res = {
      mode: "hsi",
      s: r2 + g + b === 0 ? 0 : 1 - 3 * m / (r2 + g + b),
      i: (r2 + g + b) / 3
    };
    if (M3 - m !== 0)
      res.h = (M3 === r2 ? (g - b) / (M3 - m) + (g < b) * 6 : M3 === g ? (b - r2) / (M3 - m) + 2 : (r2 - g) / (M3 - m) + 4) * 60;
    if (alpha2 !== void 0) res.alpha = alpha2;
    return res;
  }

  // node_modules/culori/src/hsi/definition.js
  var definition6 = {
    mode: "hsi",
    toMode: {
      rgb: convertHsiToRgb
    },
    parse: ["--hsi"],
    serialize: "--hsi",
    fromMode: {
      rgb: convertRgbToHsi
    },
    channels: ["h", "s", "i", "alpha"],
    ranges: {
      h: [0, 360]
    },
    gamut: "rgb",
    interpolate: {
      h: { use: interpolatorLinear, fixup: fixupHueShorter },
      s: interpolatorLinear,
      i: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    },
    difference: {
      h: differenceHueSaturation
    },
    average: {
      h: averageAngle
    }
  };
  var definition_default6 = definition6;

  // node_modules/culori/src/hsl/convertHslToRgb.js
  function convertHslToRgb({ h, s, l, alpha: alpha2 }) {
    h = normalizeHue_default(h !== void 0 ? h : 0);
    if (s === void 0) s = 0;
    if (l === void 0) l = 0;
    let m1 = l + s * (l < 0.5 ? l : 1 - l);
    let m2 = m1 - (m1 - l) * 2 * Math.abs(h / 60 % 2 - 1);
    let res;
    switch (Math.floor(h / 60)) {
      case 0:
        res = { r: m1, g: m2, b: 2 * l - m1 };
        break;
      case 1:
        res = { r: m2, g: m1, b: 2 * l - m1 };
        break;
      case 2:
        res = { r: 2 * l - m1, g: m1, b: m2 };
        break;
      case 3:
        res = { r: 2 * l - m1, g: m2, b: m1 };
        break;
      case 4:
        res = { r: m2, g: 2 * l - m1, b: m1 };
        break;
      case 5:
        res = { r: m1, g: 2 * l - m1, b: m2 };
        break;
      default:
        res = { r: 2 * l - m1, g: 2 * l - m1, b: 2 * l - m1 };
    }
    res.mode = "rgb";
    if (alpha2 !== void 0) res.alpha = alpha2;
    return res;
  }

  // node_modules/culori/src/hsl/convertRgbToHsl.js
  function convertRgbToHsl({ r: r2, g, b, alpha: alpha2 }) {
    if (r2 === void 0) r2 = 0;
    if (g === void 0) g = 0;
    if (b === void 0) b = 0;
    let M3 = Math.max(r2, g, b), m = Math.min(r2, g, b);
    let res = {
      mode: "hsl",
      s: M3 === m ? 0 : (M3 - m) / (1 - Math.abs(M3 + m - 1)),
      l: 0.5 * (M3 + m)
    };
    if (M3 - m !== 0)
      res.h = (M3 === r2 ? (g - b) / (M3 - m) + (g < b) * 6 : M3 === g ? (b - r2) / (M3 - m) + 2 : (r2 - g) / (M3 - m) + 4) * 60;
    if (alpha2 !== void 0) res.alpha = alpha2;
    return res;
  }

  // node_modules/culori/src/util/hue.js
  var hueToDeg = (val, unit) => {
    switch (unit) {
      case "deg":
        return +val;
      case "rad":
        return val / Math.PI * 180;
      case "grad":
        return val / 10 * 9;
      case "turn":
        return val * 360;
    }
  };
  var hue_default = hueToDeg;

  // node_modules/culori/src/hsl/parseHslLegacy.js
  var hsl_old = new RegExp(
    `^hsla?\\(\\s*${hue}${c}${per}${c}${per}\\s*(?:,\\s*${num_per}\\s*)?\\)$`
  );
  var parseHslLegacy = (color) => {
    let match = color.match(hsl_old);
    if (!match) return;
    let res = { mode: "hsl" };
    if (match[3] !== void 0) {
      res.h = +match[3];
    } else if (match[1] !== void 0 && match[2] !== void 0) {
      res.h = hue_default(match[1], match[2]);
    }
    if (match[4] !== void 0) {
      res.s = Math.min(Math.max(0, match[4] / 100), 1);
    }
    if (match[5] !== void 0) {
      res.l = Math.min(Math.max(0, match[5] / 100), 1);
    }
    if (match[6] !== void 0) {
      res.alpha = Math.max(0, Math.min(1, match[6] / 100));
    } else if (match[7] !== void 0) {
      res.alpha = Math.max(0, Math.min(1, +match[7]));
    }
    return res;
  };
  var parseHslLegacy_default = parseHslLegacy;

  // node_modules/culori/src/hsl/parseHsl.js
  function parseHsl(color, parsed) {
    if (!parsed || parsed[0] !== "hsl" && parsed[0] !== "hsla") {
      return void 0;
    }
    const res = { mode: "hsl" };
    const [, h, s, l, alpha2] = parsed;
    if (h.type !== Tok.None) {
      if (h.type === Tok.Percentage) {
        return void 0;
      }
      res.h = h.value;
    }
    if (s.type !== Tok.None) {
      if (s.type === Tok.Hue) {
        return void 0;
      }
      res.s = s.value / 100;
    }
    if (l.type !== Tok.None) {
      if (l.type === Tok.Hue) {
        return void 0;
      }
      res.l = l.value / 100;
    }
    if (alpha2.type !== Tok.None) {
      res.alpha = Math.min(
        1,
        Math.max(
          0,
          alpha2.type === Tok.Number ? alpha2.value : alpha2.value / 100
        )
      );
    }
    return res;
  }
  var parseHsl_default = parseHsl;

  // node_modules/culori/src/hsl/definition.js
  var definition7 = {
    mode: "hsl",
    toMode: {
      rgb: convertHslToRgb
    },
    fromMode: {
      rgb: convertRgbToHsl
    },
    channels: ["h", "s", "l", "alpha"],
    ranges: {
      h: [0, 360]
    },
    gamut: "rgb",
    parse: [parseHsl_default, parseHslLegacy_default],
    serialize: (c2) => `hsl(${c2.h !== void 0 ? c2.h : "none"} ${c2.s !== void 0 ? c2.s * 100 + "%" : "none"} ${c2.l !== void 0 ? c2.l * 100 + "%" : "none"}${c2.alpha < 1 ? ` / ${c2.alpha}` : ""})`,
    interpolate: {
      h: { use: interpolatorLinear, fixup: fixupHueShorter },
      s: interpolatorLinear,
      l: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    },
    difference: {
      h: differenceHueSaturation
    },
    average: {
      h: averageAngle
    }
  };
  var definition_default7 = definition7;

  // node_modules/culori/src/hsv/convertHsvToRgb.js
  function convertHsvToRgb({ h, s, v, alpha: alpha2 }) {
    h = normalizeHue_default(h !== void 0 ? h : 0);
    if (s === void 0) s = 0;
    if (v === void 0) v = 0;
    let f3 = Math.abs(h / 60 % 2 - 1);
    let res;
    switch (Math.floor(h / 60)) {
      case 0:
        res = { r: v, g: v * (1 - s * f3), b: v * (1 - s) };
        break;
      case 1:
        res = { r: v * (1 - s * f3), g: v, b: v * (1 - s) };
        break;
      case 2:
        res = { r: v * (1 - s), g: v, b: v * (1 - s * f3) };
        break;
      case 3:
        res = { r: v * (1 - s), g: v * (1 - s * f3), b: v };
        break;
      case 4:
        res = { r: v * (1 - s * f3), g: v * (1 - s), b: v };
        break;
      case 5:
        res = { r: v, g: v * (1 - s), b: v * (1 - s * f3) };
        break;
      default:
        res = { r: v * (1 - s), g: v * (1 - s), b: v * (1 - s) };
    }
    res.mode = "rgb";
    if (alpha2 !== void 0) res.alpha = alpha2;
    return res;
  }

  // node_modules/culori/src/hsv/convertRgbToHsv.js
  function convertRgbToHsv({ r: r2, g, b, alpha: alpha2 }) {
    if (r2 === void 0) r2 = 0;
    if (g === void 0) g = 0;
    if (b === void 0) b = 0;
    let M3 = Math.max(r2, g, b), m = Math.min(r2, g, b);
    let res = {
      mode: "hsv",
      s: M3 === 0 ? 0 : 1 - m / M3,
      v: M3
    };
    if (M3 - m !== 0)
      res.h = (M3 === r2 ? (g - b) / (M3 - m) + (g < b) * 6 : M3 === g ? (b - r2) / (M3 - m) + 2 : (r2 - g) / (M3 - m) + 4) * 60;
    if (alpha2 !== void 0) res.alpha = alpha2;
    return res;
  }

  // node_modules/culori/src/hsv/definition.js
  var definition8 = {
    mode: "hsv",
    toMode: {
      rgb: convertHsvToRgb
    },
    parse: ["--hsv"],
    serialize: "--hsv",
    fromMode: {
      rgb: convertRgbToHsv
    },
    channels: ["h", "s", "v", "alpha"],
    ranges: {
      h: [0, 360]
    },
    gamut: "rgb",
    interpolate: {
      h: { use: interpolatorLinear, fixup: fixupHueShorter },
      s: interpolatorLinear,
      v: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    },
    difference: {
      h: differenceHueSaturation
    },
    average: {
      h: averageAngle
    }
  };
  var definition_default8 = definition8;

  // node_modules/culori/src/hwb/convertHwbToRgb.js
  function convertHwbToRgb({ h, w, b, alpha: alpha2 }) {
    if (w === void 0) w = 0;
    if (b === void 0) b = 0;
    if (w + b > 1) {
      let s = w + b;
      w /= s;
      b /= s;
    }
    return convertHsvToRgb({
      h,
      s: b === 1 ? 1 : 1 - w / (1 - b),
      v: 1 - b,
      alpha: alpha2
    });
  }

  // node_modules/culori/src/hwb/convertRgbToHwb.js
  function convertRgbToHwb(rgba) {
    let hsv2 = convertRgbToHsv(rgba);
    if (hsv2 === void 0) return void 0;
    let s = hsv2.s !== void 0 ? hsv2.s : 0;
    let v = hsv2.v !== void 0 ? hsv2.v : 0;
    let res = {
      mode: "hwb",
      w: (1 - s) * v,
      b: 1 - v
    };
    if (hsv2.h !== void 0) res.h = hsv2.h;
    if (hsv2.alpha !== void 0) res.alpha = hsv2.alpha;
    return res;
  }

  // node_modules/culori/src/hwb/parseHwb.js
  function ParseHwb(color, parsed) {
    if (!parsed || parsed[0] !== "hwb") {
      return void 0;
    }
    const res = { mode: "hwb" };
    const [, h, w, b, alpha2] = parsed;
    if (h.type !== Tok.None) {
      if (h.type === Tok.Percentage) {
        return void 0;
      }
      res.h = h.value;
    }
    if (w.type !== Tok.None) {
      if (w.type === Tok.Hue) {
        return void 0;
      }
      res.w = w.value / 100;
    }
    if (b.type !== Tok.None) {
      if (b.type === Tok.Hue) {
        return void 0;
      }
      res.b = b.value / 100;
    }
    if (alpha2.type !== Tok.None) {
      res.alpha = Math.min(
        1,
        Math.max(
          0,
          alpha2.type === Tok.Number ? alpha2.value : alpha2.value / 100
        )
      );
    }
    return res;
  }
  var parseHwb_default = ParseHwb;

  // node_modules/culori/src/hwb/definition.js
  var definition9 = {
    mode: "hwb",
    toMode: {
      rgb: convertHwbToRgb
    },
    fromMode: {
      rgb: convertRgbToHwb
    },
    channels: ["h", "w", "b", "alpha"],
    ranges: {
      h: [0, 360]
    },
    gamut: "rgb",
    parse: [parseHwb_default],
    serialize: (c2) => `hwb(${c2.h !== void 0 ? c2.h : "none"} ${c2.w !== void 0 ? c2.w * 100 + "%" : "none"} ${c2.b !== void 0 ? c2.b * 100 + "%" : "none"}${c2.alpha < 1 ? ` / ${c2.alpha}` : ""})`,
    interpolate: {
      h: { use: interpolatorLinear, fixup: fixupHueShorter },
      w: interpolatorLinear,
      b: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    },
    difference: {
      h: differenceHueNaive
    },
    average: {
      h: averageAngle
    }
  };
  var definition_default9 = definition9;

  // node_modules/culori/src/hdr/constants.js
  var YW = 203;

  // node_modules/culori/src/hdr/transfer.js
  var M1 = 0.1593017578125;
  var M2 = 78.84375;
  var C1 = 0.8359375;
  var C2 = 18.8515625;
  var C3 = 18.6875;
  function transferPqDecode(v) {
    if (v < 0) return 0;
    const c2 = Math.pow(v, 1 / M2);
    return 1e4 * Math.pow(Math.max(0, c2 - C1) / (C2 - C3 * c2), 1 / M1);
  }
  function transferPqEncode(v) {
    if (v < 0) return 0;
    const c2 = Math.pow(v / 1e4, M1);
    return Math.pow((C1 + C2 * c2) / (1 + C3 * c2), M2);
  }

  // node_modules/culori/src/itp/convertItpToXyz65.js
  var toRel = (c2) => Math.max(c2 / YW, 0);
  var convertItpToXyz65 = ({ i, t, p: p4, alpha: alpha2 }) => {
    if (i === void 0) i = 0;
    if (t === void 0) t = 0;
    if (p4 === void 0) p4 = 0;
    const l = transferPqDecode(
      i + 0.008609037037932761 * t + 0.11102962500302593 * p4
    );
    const m = transferPqDecode(
      i - 0.00860903703793275 * t - 0.11102962500302599 * p4
    );
    const s = transferPqDecode(
      i + 0.5600313357106791 * t - 0.32062717498731885 * p4
    );
    const res = {
      mode: "xyz65",
      x: toRel(
        2.070152218389422 * l - 1.3263473389671556 * m + 0.2066510476294051 * s
      ),
      y: toRel(
        0.3647385209748074 * l + 0.680566024947227 * m - 0.0453045459220346 * s
      ),
      z: toRel(
        -0.049747207535812 * l - 0.0492609666966138 * m + 1.1880659249923042 * s
      )
    };
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertItpToXyz65_default = convertItpToXyz65;

  // node_modules/culori/src/itp/convertXyz65ToItp.js
  var toAbs = (c2 = 0) => Math.max(c2 * YW, 0);
  var convertXyz65ToItp = ({ x, y, z, alpha: alpha2 }) => {
    const absX = toAbs(x);
    const absY = toAbs(y);
    const absZ = toAbs(z);
    const l = transferPqEncode(
      0.3592832590121217 * absX + 0.6976051147779502 * absY - 0.0358915932320289 * absZ
    );
    const m = transferPqEncode(
      -0.1920808463704995 * absX + 1.1004767970374323 * absY + 0.0753748658519118 * absZ
    );
    const s = transferPqEncode(
      0.0070797844607477 * absX + 0.0748396662186366 * absY + 0.8433265453898765 * absZ
    );
    const i = 0.5 * l + 0.5 * m;
    const t = 1.61376953125 * l - 3.323486328125 * m + 1.709716796875 * s;
    const p4 = 4.378173828125 * l - 4.24560546875 * m - 0.132568359375 * s;
    const res = { mode: "itp", i, t, p: p4 };
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertXyz65ToItp_default = convertXyz65ToItp;

  // node_modules/culori/src/itp/definition.js
  var definition10 = {
    mode: "itp",
    channels: ["i", "t", "p", "alpha"],
    parse: ["--ictcp"],
    serialize: "--ictcp",
    toMode: {
      xyz65: convertItpToXyz65_default,
      rgb: (color) => convertXyz65ToRgb_default(convertItpToXyz65_default(color))
    },
    fromMode: {
      xyz65: convertXyz65ToItp_default,
      rgb: (color) => convertXyz65ToItp_default(convertRgbToXyz65_default(color))
    },
    ranges: {
      i: [0, 0.581],
      t: [-0.369, 0.272],
      p: [-0.164, 0.331]
    },
    interpolate: {
      i: interpolatorLinear,
      t: interpolatorLinear,
      p: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    }
  };
  var definition_default10 = definition10;

  // node_modules/culori/src/jab/convertXyz65ToJab.js
  var p = 134.03437499999998;
  var d0 = 16295499532821565e-27;
  var jabPqEncode = (v) => {
    if (v < 0) return 0;
    let vn3 = Math.pow(v / 1e4, M1);
    return Math.pow((C1 + C2 * vn3) / (1 + C3 * vn3), p);
  };
  var abs = (v = 0) => Math.max(v * 203, 0);
  var convertXyz65ToJab = ({ x, y, z, alpha: alpha2 }) => {
    x = abs(x);
    y = abs(y);
    z = abs(z);
    let xp = 1.15 * x - 0.15 * z;
    let yp = 0.66 * y + 0.34 * x;
    let l = jabPqEncode(0.41478972 * xp + 0.579999 * yp + 0.014648 * z);
    let m = jabPqEncode(-0.20151 * xp + 1.120649 * yp + 0.0531008 * z);
    let s = jabPqEncode(-0.0166008 * xp + 0.2648 * yp + 0.6684799 * z);
    let i = (l + m) / 2;
    let res = {
      mode: "jab",
      j: 0.44 * i / (1 - 0.56 * i) - d0,
      a: 3.524 * l - 4.066708 * m + 0.542708 * s,
      b: 0.199076 * l + 1.096799 * m - 1.295875 * s
    };
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertXyz65ToJab_default = convertXyz65ToJab;

  // node_modules/culori/src/jab/convertJabToXyz65.js
  var p2 = 134.03437499999998;
  var d02 = 16295499532821565e-27;
  var jabPqDecode = (v) => {
    if (v < 0) return 0;
    let vp = Math.pow(v, 1 / p2);
    return 1e4 * Math.pow((C1 - vp) / (C3 * vp - C2), 1 / M1);
  };
  var rel = (v) => v / 203;
  var convertJabToXyz65 = ({ j, a, b, alpha: alpha2 }) => {
    if (j === void 0) j = 0;
    if (a === void 0) a = 0;
    if (b === void 0) b = 0;
    let i = (j + d02) / (0.44 + 0.56 * (j + d02));
    let l = jabPqDecode(i + 0.13860504 * a + 0.058047316 * b);
    let m = jabPqDecode(i - 0.13860504 * a - 0.058047316 * b);
    let s = jabPqDecode(i - 0.096019242 * a - 0.8118919 * b);
    let res = {
      mode: "xyz65",
      x: rel(
        1.661373024652174 * l - 0.914523081304348 * m + 0.23136208173913045 * s
      ),
      y: rel(
        -0.3250758611844533 * l + 1.571847026732543 * m - 0.21825383453227928 * s
      ),
      z: rel(-0.090982811 * l - 0.31272829 * m + 1.5227666 * s)
    };
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertJabToXyz65_default = convertJabToXyz65;

  // node_modules/culori/src/jab/convertRgbToJab.js
  var convertRgbToJab = (rgb4) => {
    let res = convertXyz65ToJab_default(convertRgbToXyz65_default(rgb4));
    if (rgb4.r === rgb4.b && rgb4.b === rgb4.g) {
      res.a = res.b = 0;
    }
    return res;
  };
  var convertRgbToJab_default = convertRgbToJab;

  // node_modules/culori/src/jab/convertJabToRgb.js
  var convertJabToRgb = (color) => convertXyz65ToRgb_default(convertJabToXyz65_default(color));
  var convertJabToRgb_default = convertJabToRgb;

  // node_modules/culori/src/jab/definition.js
  var definition11 = {
    mode: "jab",
    channels: ["j", "a", "b", "alpha"],
    parse: ["--jzazbz"],
    serialize: "--jzazbz",
    fromMode: {
      rgb: convertRgbToJab_default,
      xyz65: convertXyz65ToJab_default
    },
    toMode: {
      rgb: convertJabToRgb_default,
      xyz65: convertJabToXyz65_default
    },
    ranges: {
      j: [0, 0.222],
      a: [-0.109, 0.129],
      b: [-0.185, 0.134]
    },
    interpolate: {
      j: interpolatorLinear,
      a: interpolatorLinear,
      b: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    }
  };
  var definition_default11 = definition11;

  // node_modules/culori/src/jch/convertJabToJch.js
  var convertJabToJch = ({ j, a, b, alpha: alpha2 }) => {
    if (a === void 0) a = 0;
    if (b === void 0) b = 0;
    let c2 = Math.sqrt(a * a + b * b);
    let res = {
      mode: "jch",
      j,
      c: c2
    };
    if (c2) {
      res.h = normalizeHue_default(Math.atan2(b, a) * 180 / Math.PI);
    }
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertJabToJch_default = convertJabToJch;

  // node_modules/culori/src/jch/convertJchToJab.js
  var convertJchToJab = ({ j, c: c2, h, alpha: alpha2 }) => {
    if (h === void 0) h = 0;
    let res = {
      mode: "jab",
      j,
      a: c2 ? c2 * Math.cos(h / 180 * Math.PI) : 0,
      b: c2 ? c2 * Math.sin(h / 180 * Math.PI) : 0
    };
    if (alpha2 !== void 0) res.alpha = alpha2;
    return res;
  };
  var convertJchToJab_default = convertJchToJab;

  // node_modules/culori/src/jch/definition.js
  var definition12 = {
    mode: "jch",
    parse: ["--jzczhz"],
    serialize: "--jzczhz",
    toMode: {
      jab: convertJchToJab_default,
      rgb: (c2) => convertJabToRgb_default(convertJchToJab_default(c2))
    },
    fromMode: {
      rgb: (c2) => convertJabToJch_default(convertRgbToJab_default(c2)),
      jab: convertJabToJch_default
    },
    channels: ["j", "c", "h", "alpha"],
    ranges: {
      j: [0, 0.221],
      c: [0, 0.19],
      h: [0, 360]
    },
    interpolate: {
      h: { use: interpolatorLinear, fixup: fixupHueShorter },
      c: interpolatorLinear,
      j: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    },
    difference: {
      h: differenceHueChroma
    },
    average: {
      h: averageAngle
    }
  };
  var definition_default12 = definition12;

  // node_modules/culori/src/xyz50/constants.js
  var k3 = Math.pow(29, 3) / Math.pow(3, 3);
  var e3 = Math.pow(6, 3) / Math.pow(29, 3);

  // node_modules/culori/src/lab/convertLabToXyz50.js
  var fn4 = (v) => Math.pow(v, 3) > e3 ? Math.pow(v, 3) : (116 * v - 16) / k3;
  var convertLabToXyz50 = ({ l, a, b, alpha: alpha2 }) => {
    if (l === void 0) l = 0;
    if (a === void 0) a = 0;
    if (b === void 0) b = 0;
    let fy = (l + 16) / 116;
    let fx = a / 500 + fy;
    let fz = fy - b / 200;
    let res = {
      mode: "xyz50",
      x: fn4(fx) * D50.X,
      y: fn4(fy) * D50.Y,
      z: fn4(fz) * D50.Z
    };
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertLabToXyz50_default = convertLabToXyz50;

  // node_modules/culori/src/xyz50/convertXyz50ToRgb.js
  var convertXyz50ToRgb = ({ x, y, z, alpha: alpha2 }) => {
    if (x === void 0) x = 0;
    if (y === void 0) y = 0;
    if (z === void 0) z = 0;
    let res = convertLrgbToRgb_default({
      r: x * 3.1341359569958707 - y * 1.6173863321612538 - 0.4906619460083532 * z,
      g: x * -0.978795502912089 + y * 1.916254567259524 + 0.03344273116131949 * z,
      b: x * 0.07195537988411677 - y * 0.2289768264158322 + 1.405386058324125 * z
    });
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertXyz50ToRgb_default = convertXyz50ToRgb;

  // node_modules/culori/src/lab/convertLabToRgb.js
  var convertLabToRgb = (lab2) => convertXyz50ToRgb_default(convertLabToXyz50_default(lab2));
  var convertLabToRgb_default = convertLabToRgb;

  // node_modules/culori/src/xyz50/convertRgbToXyz50.js
  var convertRgbToXyz50 = (rgb4) => {
    let { r: r2, g, b, alpha: alpha2 } = convertRgbToLrgb_default(rgb4);
    let res = {
      mode: "xyz50",
      x: 0.436065742824811 * r2 + 0.3851514688337912 * g + 0.14307845442264197 * b,
      y: 0.22249319175623702 * r2 + 0.7168870538238823 * g + 0.06061979053616537 * b,
      z: 0.013923904500943465 * r2 + 0.09708128566574634 * g + 0.7140993584005155 * b
    };
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertRgbToXyz50_default = convertRgbToXyz50;

  // node_modules/culori/src/lab/convertXyz50ToLab.js
  var f2 = (value) => value > e3 ? Math.cbrt(value) : (k3 * value + 16) / 116;
  var convertXyz50ToLab = ({ x, y, z, alpha: alpha2 }) => {
    if (x === void 0) x = 0;
    if (y === void 0) y = 0;
    if (z === void 0) z = 0;
    let f0 = f2(x / D50.X);
    let f1 = f2(y / D50.Y);
    let f22 = f2(z / D50.Z);
    let res = {
      mode: "lab",
      l: 116 * f1 - 16,
      a: 500 * (f0 - f1),
      b: 200 * (f1 - f22)
    };
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertXyz50ToLab_default = convertXyz50ToLab;

  // node_modules/culori/src/lab/convertRgbToLab.js
  var convertRgbToLab = (rgb4) => {
    let res = convertXyz50ToLab_default(convertRgbToXyz50_default(rgb4));
    if (rgb4.r === rgb4.b && rgb4.b === rgb4.g) {
      res.a = res.b = 0;
    }
    return res;
  };
  var convertRgbToLab_default = convertRgbToLab;

  // node_modules/culori/src/lab/parseLab.js
  function parseLab(color, parsed) {
    if (!parsed || parsed[0] !== "lab") {
      return void 0;
    }
    const res = { mode: "lab" };
    const [, l, a, b, alpha2] = parsed;
    if (l.type === Tok.Hue || a.type === Tok.Hue || b.type === Tok.Hue) {
      return void 0;
    }
    if (l.type !== Tok.None) {
      res.l = Math.min(Math.max(0, l.value), 100);
    }
    if (a.type !== Tok.None) {
      res.a = a.type === Tok.Number ? a.value : a.value * 125 / 100;
    }
    if (b.type !== Tok.None) {
      res.b = b.type === Tok.Number ? b.value : b.value * 125 / 100;
    }
    if (alpha2.type !== Tok.None) {
      res.alpha = Math.min(
        1,
        Math.max(
          0,
          alpha2.type === Tok.Number ? alpha2.value : alpha2.value / 100
        )
      );
    }
    return res;
  }
  var parseLab_default = parseLab;

  // node_modules/culori/src/lab/definition.js
  var definition13 = {
    mode: "lab",
    toMode: {
      xyz50: convertLabToXyz50_default,
      rgb: convertLabToRgb_default
    },
    fromMode: {
      xyz50: convertXyz50ToLab_default,
      rgb: convertRgbToLab_default
    },
    channels: ["l", "a", "b", "alpha"],
    ranges: {
      l: [0, 100],
      a: [-125, 125],
      b: [-125, 125]
    },
    parse: [parseLab_default],
    serialize: (c2) => `lab(${c2.l !== void 0 ? c2.l : "none"} ${c2.a !== void 0 ? c2.a : "none"} ${c2.b !== void 0 ? c2.b : "none"}${c2.alpha < 1 ? ` / ${c2.alpha}` : ""})`,
    interpolate: {
      l: interpolatorLinear,
      a: interpolatorLinear,
      b: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    }
  };
  var definition_default13 = definition13;

  // node_modules/culori/src/lab65/definition.js
  var definition14 = {
    ...definition_default13,
    mode: "lab65",
    parse: ["--lab-d65"],
    serialize: "--lab-d65",
    toMode: {
      xyz65: convertLab65ToXyz65_default,
      rgb: convertLab65ToRgb_default
    },
    fromMode: {
      xyz65: convertXyz65ToLab65_default,
      rgb: convertRgbToLab65_default
    },
    ranges: {
      l: [0, 100],
      a: [-125, 125],
      b: [-125, 125]
    }
  };
  var definition_default14 = definition14;

  // node_modules/culori/src/lch/parseLch.js
  function parseLch(color, parsed) {
    if (!parsed || parsed[0] !== "lch") {
      return void 0;
    }
    const res = { mode: "lch" };
    const [, l, c2, h, alpha2] = parsed;
    if (l.type !== Tok.None) {
      if (l.type === Tok.Hue) {
        return void 0;
      }
      res.l = Math.min(Math.max(0, l.value), 100);
    }
    if (c2.type !== Tok.None) {
      res.c = Math.max(
        0,
        c2.type === Tok.Number ? c2.value : c2.value * 150 / 100
      );
    }
    if (h.type !== Tok.None) {
      if (h.type === Tok.Percentage) {
        return void 0;
      }
      res.h = h.value;
    }
    if (alpha2.type !== Tok.None) {
      res.alpha = Math.min(
        1,
        Math.max(
          0,
          alpha2.type === Tok.Number ? alpha2.value : alpha2.value / 100
        )
      );
    }
    return res;
  }
  var parseLch_default = parseLch;

  // node_modules/culori/src/lch/definition.js
  var definition15 = {
    mode: "lch",
    toMode: {
      lab: convertLchToLab_default,
      rgb: (c2) => convertLabToRgb_default(convertLchToLab_default(c2))
    },
    fromMode: {
      rgb: (c2) => convertLabToLch_default(convertRgbToLab_default(c2)),
      lab: convertLabToLch_default
    },
    channels: ["l", "c", "h", "alpha"],
    ranges: {
      l: [0, 100],
      c: [0, 150],
      h: [0, 360]
    },
    parse: [parseLch_default],
    serialize: (c2) => `lch(${c2.l !== void 0 ? c2.l : "none"} ${c2.c !== void 0 ? c2.c : "none"} ${c2.h !== void 0 ? c2.h : "none"}${c2.alpha < 1 ? ` / ${c2.alpha}` : ""})`,
    interpolate: {
      h: { use: interpolatorLinear, fixup: fixupHueShorter },
      c: interpolatorLinear,
      l: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    },
    difference: {
      h: differenceHueChroma
    },
    average: {
      h: averageAngle
    }
  };
  var definition_default15 = definition15;

  // node_modules/culori/src/lch65/definition.js
  var definition16 = {
    ...definition_default15,
    mode: "lch65",
    parse: ["--lch-d65"],
    serialize: "--lch-d65",
    toMode: {
      lab65: (c2) => convertLchToLab_default(c2, "lab65"),
      rgb: (c2) => convertLab65ToRgb_default(convertLchToLab_default(c2, "lab65"))
    },
    fromMode: {
      rgb: (c2) => convertLabToLch_default(convertRgbToLab65_default(c2), "lch65"),
      lab65: (c2) => convertLabToLch_default(c2, "lch65")
    },
    ranges: {
      l: [0, 100],
      c: [0, 150],
      h: [0, 360]
    }
  };
  var definition_default16 = definition16;

  // node_modules/culori/src/lchuv/convertLuvToLchuv.js
  var convertLuvToLchuv = ({ l, u, v, alpha: alpha2 }) => {
    if (u === void 0) u = 0;
    if (v === void 0) v = 0;
    let c2 = Math.sqrt(u * u + v * v);
    let res = {
      mode: "lchuv",
      l,
      c: c2
    };
    if (c2) {
      res.h = normalizeHue_default(Math.atan2(v, u) * 180 / Math.PI);
    }
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertLuvToLchuv_default = convertLuvToLchuv;

  // node_modules/culori/src/lchuv/convertLchuvToLuv.js
  var convertLchuvToLuv = ({ l, c: c2, h, alpha: alpha2 }) => {
    if (h === void 0) h = 0;
    let res = {
      mode: "luv",
      l,
      u: c2 ? c2 * Math.cos(h / 180 * Math.PI) : 0,
      v: c2 ? c2 * Math.sin(h / 180 * Math.PI) : 0
    };
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertLchuvToLuv_default = convertLchuvToLuv;

  // node_modules/culori/src/luv/convertXyz50ToLuv.js
  var u_fn = (x, y, z) => 4 * x / (x + 15 * y + 3 * z);
  var v_fn = (x, y, z) => 9 * y / (x + 15 * y + 3 * z);
  var un = u_fn(D50.X, D50.Y, D50.Z);
  var vn = v_fn(D50.X, D50.Y, D50.Z);
  var l_fn = (value) => value <= e3 ? k3 * value : 116 * Math.cbrt(value) - 16;
  var convertXyz50ToLuv = ({ x, y, z, alpha: alpha2 }) => {
    if (x === void 0) x = 0;
    if (y === void 0) y = 0;
    if (z === void 0) z = 0;
    let l = l_fn(y / D50.Y);
    let u = u_fn(x, y, z);
    let v = v_fn(x, y, z);
    if (!isFinite(u) || !isFinite(v)) {
      l = u = v = 0;
    } else {
      u = 13 * l * (u - un);
      v = 13 * l * (v - vn);
    }
    let res = {
      mode: "luv",
      l,
      u,
      v
    };
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertXyz50ToLuv_default = convertXyz50ToLuv;

  // node_modules/culori/src/luv/convertLuvToXyz50.js
  var u_fn2 = (x, y, z) => 4 * x / (x + 15 * y + 3 * z);
  var v_fn2 = (x, y, z) => 9 * y / (x + 15 * y + 3 * z);
  var un2 = u_fn2(D50.X, D50.Y, D50.Z);
  var vn2 = v_fn2(D50.X, D50.Y, D50.Z);
  var convertLuvToXyz50 = ({ l, u, v, alpha: alpha2 }) => {
    if (l === void 0) l = 0;
    if (l === 0) {
      return { mode: "xyz50", x: 0, y: 0, z: 0 };
    }
    if (u === void 0) u = 0;
    if (v === void 0) v = 0;
    let up = u / (13 * l) + un2;
    let vp = v / (13 * l) + vn2;
    let y = D50.Y * (l <= 8 ? l / k3 : Math.pow((l + 16) / 116, 3));
    let x = y * (9 * up) / (4 * vp);
    let z = y * (12 - 3 * up - 20 * vp) / (4 * vp);
    let res = { mode: "xyz50", x, y, z };
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertLuvToXyz50_default = convertLuvToXyz50;

  // node_modules/culori/src/lchuv/definition.js
  var convertRgbToLchuv = (rgb4) => convertLuvToLchuv_default(convertXyz50ToLuv_default(convertRgbToXyz50_default(rgb4)));
  var convertLchuvToRgb = (lchuv2) => convertXyz50ToRgb_default(convertLuvToXyz50_default(convertLchuvToLuv_default(lchuv2)));
  var definition17 = {
    mode: "lchuv",
    toMode: {
      luv: convertLchuvToLuv_default,
      rgb: convertLchuvToRgb
    },
    fromMode: {
      rgb: convertRgbToLchuv,
      luv: convertLuvToLchuv_default
    },
    channels: ["l", "c", "h", "alpha"],
    parse: ["--lchuv"],
    serialize: "--lchuv",
    ranges: {
      l: [0, 100],
      c: [0, 176.956],
      h: [0, 360]
    },
    interpolate: {
      h: { use: interpolatorLinear, fixup: fixupHueShorter },
      c: interpolatorLinear,
      l: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    },
    difference: {
      h: differenceHueChroma
    },
    average: {
      h: averageAngle
    }
  };
  var definition_default17 = definition17;

  // node_modules/culori/src/lrgb/definition.js
  var definition18 = {
    ...definition_default,
    mode: "lrgb",
    toMode: {
      rgb: convertLrgbToRgb_default
    },
    fromMode: {
      rgb: convertRgbToLrgb_default
    },
    parse: ["srgb-linear"],
    serialize: "srgb-linear"
  };
  var definition_default18 = definition18;

  // node_modules/culori/src/luv/definition.js
  var definition19 = {
    mode: "luv",
    toMode: {
      xyz50: convertLuvToXyz50_default,
      rgb: (luv2) => convertXyz50ToRgb_default(convertLuvToXyz50_default(luv2))
    },
    fromMode: {
      xyz50: convertXyz50ToLuv_default,
      rgb: (rgb4) => convertXyz50ToLuv_default(convertRgbToXyz50_default(rgb4))
    },
    channels: ["l", "u", "v", "alpha"],
    parse: ["--luv"],
    serialize: "--luv",
    ranges: {
      l: [0, 100],
      u: [-84.936, 175.042],
      v: [-125.882, 87.243]
    },
    interpolate: {
      l: interpolatorLinear,
      u: interpolatorLinear,
      v: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    }
  };
  var definition_default19 = definition19;

  // node_modules/culori/src/oklab/convertLrgbToOklab.js
  var convertLrgbToOklab = ({ r: r2, g, b, alpha: alpha2 }) => {
    if (r2 === void 0) r2 = 0;
    if (g === void 0) g = 0;
    if (b === void 0) b = 0;
    let L = Math.cbrt(
      0.412221469470763 * r2 + 0.5363325372617348 * g + 0.0514459932675022 * b
    );
    let M3 = Math.cbrt(
      0.2119034958178252 * r2 + 0.6806995506452344 * g + 0.1073969535369406 * b
    );
    let S = Math.cbrt(
      0.0883024591900564 * r2 + 0.2817188391361215 * g + 0.6299787016738222 * b
    );
    let res = {
      mode: "oklab",
      l: 0.210454268309314 * L + 0.7936177747023054 * M3 - 0.0040720430116193 * S,
      a: 1.9779985324311684 * L - 2.42859224204858 * M3 + 0.450593709617411 * S,
      b: 0.0259040424655478 * L + 0.7827717124575296 * M3 - 0.8086757549230774 * S
    };
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertLrgbToOklab_default = convertLrgbToOklab;

  // node_modules/culori/src/oklab/convertRgbToOklab.js
  var convertRgbToOklab = (rgb4) => {
    let res = convertLrgbToOklab_default(convertRgbToLrgb_default(rgb4));
    if (rgb4.r === rgb4.b && rgb4.b === rgb4.g) {
      res.a = res.b = 0;
    }
    return res;
  };
  var convertRgbToOklab_default = convertRgbToOklab;

  // node_modules/culori/src/oklab/convertOklabToLrgb.js
  var convertOklabToLrgb = ({ l, a, b, alpha: alpha2 }) => {
    if (l === void 0) l = 0;
    if (a === void 0) a = 0;
    if (b === void 0) b = 0;
    let L = Math.pow(l + 0.3963377773761749 * a + 0.2158037573099136 * b, 3);
    let M3 = Math.pow(l - 0.1055613458156586 * a - 0.0638541728258133 * b, 3);
    let S = Math.pow(l - 0.0894841775298119 * a - 1.2914855480194092 * b, 3);
    let res = {
      mode: "lrgb",
      r: 4.076741636075957 * L - 3.3077115392580616 * M3 + 0.2309699031821044 * S,
      g: -1.2684379732850317 * L + 2.6097573492876887 * M3 - 0.3413193760026573 * S,
      b: -0.0041960761386756 * L - 0.7034186179359362 * M3 + 1.7076146940746117 * S
    };
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertOklabToLrgb_default = convertOklabToLrgb;

  // node_modules/culori/src/oklab/convertOklabToRgb.js
  var convertOklabToRgb = (c2) => convertLrgbToRgb_default(convertOklabToLrgb_default(c2));
  var convertOklabToRgb_default = convertOklabToRgb;

  // node_modules/culori/src/okhsl/helpers.js
  function toe(x) {
    const k_1 = 0.206;
    const k_2 = 0.03;
    const k_3 = (1 + k_1) / (1 + k_2);
    return 0.5 * (k_3 * x - k_1 + Math.sqrt((k_3 * x - k_1) * (k_3 * x - k_1) + 4 * k_2 * k_3 * x));
  }
  function toe_inv(x) {
    const k_1 = 0.206;
    const k_2 = 0.03;
    const k_3 = (1 + k_1) / (1 + k_2);
    return (x * x + k_1 * x) / (k_3 * (x + k_2));
  }
  function compute_max_saturation(a, b) {
    let k0, k1, k22, k32, k4, wl, wm, ws;
    if (-1.88170328 * a - 0.80936493 * b > 1) {
      k0 = 1.19086277;
      k1 = 1.76576728;
      k22 = 0.59662641;
      k32 = 0.75515197;
      k4 = 0.56771245;
      wl = 4.0767416621;
      wm = -3.3077115913;
      ws = 0.2309699292;
    } else if (1.81444104 * a - 1.19445276 * b > 1) {
      k0 = 0.73956515;
      k1 = -0.45954404;
      k22 = 0.08285427;
      k32 = 0.1254107;
      k4 = 0.14503204;
      wl = -1.2684380046;
      wm = 2.6097574011;
      ws = -0.3413193965;
    } else {
      k0 = 1.35733652;
      k1 = -915799e-8;
      k22 = -1.1513021;
      k32 = -0.50559606;
      k4 = 692167e-8;
      wl = -0.0041960863;
      wm = -0.7034186147;
      ws = 1.707614701;
    }
    let S = k0 + k1 * a + k22 * b + k32 * a * a + k4 * a * b;
    let k_l = 0.3963377774 * a + 0.2158037573 * b;
    let k_m = -0.1055613458 * a - 0.0638541728 * b;
    let k_s = -0.0894841775 * a - 1.291485548 * b;
    {
      let l_ = 1 + S * k_l;
      let m_ = 1 + S * k_m;
      let s_ = 1 + S * k_s;
      let l = l_ * l_ * l_;
      let m = m_ * m_ * m_;
      let s = s_ * s_ * s_;
      let l_dS = 3 * k_l * l_ * l_;
      let m_dS = 3 * k_m * m_ * m_;
      let s_dS = 3 * k_s * s_ * s_;
      let l_dS2 = 6 * k_l * k_l * l_;
      let m_dS2 = 6 * k_m * k_m * m_;
      let s_dS2 = 6 * k_s * k_s * s_;
      let f3 = wl * l + wm * m + ws * s;
      let f1 = wl * l_dS + wm * m_dS + ws * s_dS;
      let f22 = wl * l_dS2 + wm * m_dS2 + ws * s_dS2;
      S = S - f3 * f1 / (f1 * f1 - 0.5 * f3 * f22);
    }
    return S;
  }
  function find_cusp(a, b) {
    let S_cusp = compute_max_saturation(a, b);
    let rgb4 = convertOklabToLrgb_default({ l: 1, a: S_cusp * a, b: S_cusp * b });
    let L_cusp = Math.cbrt(1 / Math.max(rgb4.r, rgb4.g, rgb4.b));
    let C_cusp = L_cusp * S_cusp;
    return [L_cusp, C_cusp];
  }
  function find_gamut_intersection(a, b, L1, C12, L0, cusp = null) {
    if (!cusp) {
      cusp = find_cusp(a, b);
    }
    let t;
    if ((L1 - L0) * cusp[1] - (cusp[0] - L0) * C12 <= 0) {
      t = cusp[1] * L0 / (C12 * cusp[0] + cusp[1] * (L0 - L1));
    } else {
      t = cusp[1] * (L0 - 1) / (C12 * (cusp[0] - 1) + cusp[1] * (L0 - L1));
      {
        let dL = L1 - L0;
        let dC = C12;
        let k_l = 0.3963377774 * a + 0.2158037573 * b;
        let k_m = -0.1055613458 * a - 0.0638541728 * b;
        let k_s = -0.0894841775 * a - 1.291485548 * b;
        let l_dt = dL + dC * k_l;
        let m_dt = dL + dC * k_m;
        let s_dt = dL + dC * k_s;
        {
          let L = L0 * (1 - t) + t * L1;
          let C = t * C12;
          let l_ = L + C * k_l;
          let m_ = L + C * k_m;
          let s_ = L + C * k_s;
          let l = l_ * l_ * l_;
          let m = m_ * m_ * m_;
          let s = s_ * s_ * s_;
          let ldt = 3 * l_dt * l_ * l_;
          let mdt = 3 * m_dt * m_ * m_;
          let sdt = 3 * s_dt * s_ * s_;
          let ldt2 = 6 * l_dt * l_dt * l_;
          let mdt2 = 6 * m_dt * m_dt * m_;
          let sdt2 = 6 * s_dt * s_dt * s_;
          let r2 = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s - 1;
          let r1 = 4.0767416621 * ldt - 3.3077115913 * mdt + 0.2309699292 * sdt;
          let r22 = 4.0767416621 * ldt2 - 3.3077115913 * mdt2 + 0.2309699292 * sdt2;
          let u_r = r1 / (r1 * r1 - 0.5 * r2 * r22);
          let t_r = -r2 * u_r;
          let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s - 1;
          let g1 = -1.2684380046 * ldt + 2.6097574011 * mdt - 0.3413193965 * sdt;
          let g2 = -1.2684380046 * ldt2 + 2.6097574011 * mdt2 - 0.3413193965 * sdt2;
          let u_g = g1 / (g1 * g1 - 0.5 * g * g2);
          let t_g = -g * u_g;
          let b2 = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s - 1;
          let b1 = -0.0041960863 * ldt - 0.7034186147 * mdt + 1.707614701 * sdt;
          let b22 = -0.0041960863 * ldt2 - 0.7034186147 * mdt2 + 1.707614701 * sdt2;
          let u_b = b1 / (b1 * b1 - 0.5 * b2 * b22);
          let t_b = -b2 * u_b;
          t_r = u_r >= 0 ? t_r : 1e6;
          t_g = u_g >= 0 ? t_g : 1e6;
          t_b = u_b >= 0 ? t_b : 1e6;
          t += Math.min(t_r, Math.min(t_g, t_b));
        }
      }
    }
    return t;
  }
  function get_ST_max(a_, b_, cusp = null) {
    if (!cusp) {
      cusp = find_cusp(a_, b_);
    }
    let L = cusp[0];
    let C = cusp[1];
    return [C / L, C / (1 - L)];
  }
  function get_Cs(L, a_, b_) {
    let cusp = find_cusp(a_, b_);
    let C_max = find_gamut_intersection(a_, b_, L, 1, L, cusp);
    let ST_max = get_ST_max(a_, b_, cusp);
    let S_mid = 0.11516993 + 1 / (7.4477897 + 4.1590124 * b_ + a_ * (-2.19557347 + 1.75198401 * b_ + a_ * (-2.13704948 - 10.02301043 * b_ + a_ * (-4.24894561 + 5.38770819 * b_ + 4.69891013 * a_))));
    let T_mid = 0.11239642 + 1 / (1.6132032 - 0.68124379 * b_ + a_ * (0.40370612 + 0.90148123 * b_ + a_ * (-0.27087943 + 0.6122399 * b_ + a_ * (299215e-8 - 0.45399568 * b_ - 0.14661872 * a_))));
    let k4 = C_max / Math.min(L * ST_max[0], (1 - L) * ST_max[1]);
    let C_a = L * S_mid;
    let C_b = (1 - L) * T_mid;
    let C_mid = 0.9 * k4 * Math.sqrt(
      Math.sqrt(
        1 / (1 / (C_a * C_a * C_a * C_a) + 1 / (C_b * C_b * C_b * C_b))
      )
    );
    C_a = L * 0.4;
    C_b = (1 - L) * 0.8;
    let C_0 = Math.sqrt(1 / (1 / (C_a * C_a) + 1 / (C_b * C_b)));
    return [C_0, C_mid, C_max];
  }

  // node_modules/culori/src/okhsl/convertOklabToOkhsl.js
  function convertOklabToOkhsl(lab2) {
    const l = lab2.l !== void 0 ? lab2.l : 0;
    const a = lab2.a !== void 0 ? lab2.a : 0;
    const b = lab2.b !== void 0 ? lab2.b : 0;
    const ret = { mode: "okhsl", l: toe(l) };
    if (lab2.alpha !== void 0) {
      ret.alpha = lab2.alpha;
    }
    let c2 = Math.sqrt(a * a + b * b);
    if (!c2) {
      ret.s = 0;
      return ret;
    }
    let [C_0, C_mid, C_max] = get_Cs(l, a / c2, b / c2);
    let s;
    if (c2 < C_mid) {
      let k_0 = 0;
      let k_1 = 0.8 * C_0;
      let k_2 = 1 - k_1 / C_mid;
      let t = (c2 - k_0) / (k_1 + k_2 * (c2 - k_0));
      s = t * 0.8;
    } else {
      let k_0 = C_mid;
      let k_1 = 0.2 * C_mid * C_mid * 1.25 * 1.25 / C_0;
      let k_2 = 1 - k_1 / (C_max - C_mid);
      let t = (c2 - k_0) / (k_1 + k_2 * (c2 - k_0));
      s = 0.8 + 0.2 * t;
    }
    if (s) {
      ret.s = s;
      ret.h = normalizeHue_default(Math.atan2(b, a) * 180 / Math.PI);
    }
    return ret;
  }

  // node_modules/culori/src/okhsl/convertOkhslToOklab.js
  function convertOkhslToOklab(hsl3) {
    let h = hsl3.h !== void 0 ? hsl3.h : 0;
    let s = hsl3.s !== void 0 ? hsl3.s : 0;
    let l = hsl3.l !== void 0 ? hsl3.l : 0;
    const ret = { mode: "oklab", l: toe_inv(l) };
    if (hsl3.alpha !== void 0) {
      ret.alpha = hsl3.alpha;
    }
    if (!s || l === 1) {
      ret.a = ret.b = 0;
      return ret;
    }
    let a_ = Math.cos(h / 180 * Math.PI);
    let b_ = Math.sin(h / 180 * Math.PI);
    let [C_0, C_mid, C_max] = get_Cs(ret.l, a_, b_);
    let t, k_0, k_1, k_2;
    if (s < 0.8) {
      t = 1.25 * s;
      k_0 = 0;
      k_1 = 0.8 * C_0;
      k_2 = 1 - k_1 / C_mid;
    } else {
      t = 5 * (s - 0.8);
      k_0 = C_mid;
      k_1 = 0.2 * C_mid * C_mid * 1.25 * 1.25 / C_0;
      k_2 = 1 - k_1 / (C_max - C_mid);
    }
    let C = k_0 + t * k_1 / (1 - k_2 * t);
    ret.a = C * a_;
    ret.b = C * b_;
    return ret;
  }

  // node_modules/culori/src/okhsl/modeOkhsl.js
  var modeOkhsl = {
    ...definition_default7,
    mode: "okhsl",
    channels: ["h", "s", "l", "alpha"],
    parse: ["--okhsl"],
    serialize: "--okhsl",
    fromMode: {
      oklab: convertOklabToOkhsl,
      rgb: (c2) => convertOklabToOkhsl(convertRgbToOklab_default(c2))
    },
    toMode: {
      oklab: convertOkhslToOklab,
      rgb: (c2) => convertOklabToRgb_default(convertOkhslToOklab(c2))
    }
  };
  var modeOkhsl_default = modeOkhsl;

  // node_modules/culori/src/okhsv/convertOklabToOkhsv.js
  function convertOklabToOkhsv(lab2) {
    let l = lab2.l !== void 0 ? lab2.l : 0;
    let a = lab2.a !== void 0 ? lab2.a : 0;
    let b = lab2.b !== void 0 ? lab2.b : 0;
    let c2 = Math.sqrt(a * a + b * b);
    let a_ = c2 ? a / c2 : 1;
    let b_ = c2 ? b / c2 : 1;
    let [S_max, T] = get_ST_max(a_, b_);
    let S_0 = 0.5;
    let k4 = 1 - S_0 / S_max;
    let t = T / (c2 + l * T);
    let L_v = t * l;
    let C_v = t * c2;
    let L_vt = toe_inv(L_v);
    let C_vt = C_v * L_vt / L_v;
    let rgb_scale = convertOklabToLrgb_default({ l: L_vt, a: a_ * C_vt, b: b_ * C_vt });
    let scale_L = Math.cbrt(
      1 / Math.max(rgb_scale.r, rgb_scale.g, rgb_scale.b, 0)
    );
    l = l / scale_L;
    c2 = c2 / scale_L * toe(l) / l;
    l = toe(l);
    const ret = {
      mode: "okhsv",
      s: c2 ? (S_0 + T) * C_v / (T * S_0 + T * k4 * C_v) : 0,
      v: l ? l / L_v : 0
    };
    if (ret.s) {
      ret.h = normalizeHue_default(Math.atan2(b, a) * 180 / Math.PI);
    }
    if (lab2.alpha !== void 0) {
      ret.alpha = lab2.alpha;
    }
    return ret;
  }

  // node_modules/culori/src/okhsv/convertOkhsvToOklab.js
  function convertOkhsvToOklab(hsv2) {
    const ret = { mode: "oklab" };
    if (hsv2.alpha !== void 0) {
      ret.alpha = hsv2.alpha;
    }
    const h = hsv2.h !== void 0 ? hsv2.h : 0;
    const s = hsv2.s !== void 0 ? hsv2.s : 0;
    const v = hsv2.v !== void 0 ? hsv2.v : 0;
    const a_ = Math.cos(h / 180 * Math.PI);
    const b_ = Math.sin(h / 180 * Math.PI);
    const [S_max, T] = get_ST_max(a_, b_);
    const S_0 = 0.5;
    const k4 = 1 - S_0 / S_max;
    const L_v = 1 - s * S_0 / (S_0 + T - T * k4 * s);
    const C_v = s * T * S_0 / (S_0 + T - T * k4 * s);
    const L_vt = toe_inv(L_v);
    const C_vt = C_v * L_vt / L_v;
    const rgb_scale = convertOklabToLrgb_default({
      l: L_vt,
      a: a_ * C_vt,
      b: b_ * C_vt
    });
    const scale_L = Math.cbrt(
      1 / Math.max(rgb_scale.r, rgb_scale.g, rgb_scale.b, 0)
    );
    const L_new = toe_inv(v * L_v);
    const C = C_v * L_new / L_v;
    ret.l = L_new * scale_L;
    ret.a = C * a_ * scale_L;
    ret.b = C * b_ * scale_L;
    return ret;
  }

  // node_modules/culori/src/okhsv/modeOkhsv.js
  var modeOkhsv = {
    ...definition_default8,
    mode: "okhsv",
    channels: ["h", "s", "v", "alpha"],
    parse: ["--okhsv"],
    serialize: "--okhsv",
    fromMode: {
      oklab: convertOklabToOkhsv,
      rgb: (c2) => convertOklabToOkhsv(convertRgbToOklab_default(c2))
    },
    toMode: {
      oklab: convertOkhsvToOklab,
      rgb: (c2) => convertOklabToRgb_default(convertOkhsvToOklab(c2))
    }
  };
  var modeOkhsv_default = modeOkhsv;

  // node_modules/culori/src/oklab/parseOklab.js
  function parseOklab(color, parsed) {
    if (!parsed || parsed[0] !== "oklab") {
      return void 0;
    }
    const res = { mode: "oklab" };
    const [, l, a, b, alpha2] = parsed;
    if (l.type === Tok.Hue || a.type === Tok.Hue || b.type === Tok.Hue) {
      return void 0;
    }
    if (l.type !== Tok.None) {
      res.l = Math.min(
        Math.max(0, l.type === Tok.Number ? l.value : l.value / 100),
        1
      );
    }
    if (a.type !== Tok.None) {
      res.a = a.type === Tok.Number ? a.value : a.value * 0.4 / 100;
    }
    if (b.type !== Tok.None) {
      res.b = b.type === Tok.Number ? b.value : b.value * 0.4 / 100;
    }
    if (alpha2.type !== Tok.None) {
      res.alpha = Math.min(
        1,
        Math.max(
          0,
          alpha2.type === Tok.Number ? alpha2.value : alpha2.value / 100
        )
      );
    }
    return res;
  }
  var parseOklab_default = parseOklab;

  // node_modules/culori/src/oklab/definition.js
  var definition20 = {
    ...definition_default13,
    mode: "oklab",
    toMode: {
      lrgb: convertOklabToLrgb_default,
      rgb: convertOklabToRgb_default
    },
    fromMode: {
      lrgb: convertLrgbToOklab_default,
      rgb: convertRgbToOklab_default
    },
    ranges: {
      l: [0, 1],
      a: [-0.4, 0.4],
      b: [-0.4, 0.4]
    },
    parse: [parseOklab_default],
    serialize: (c2) => `oklab(${c2.l !== void 0 ? c2.l : "none"} ${c2.a !== void 0 ? c2.a : "none"} ${c2.b !== void 0 ? c2.b : "none"}${c2.alpha < 1 ? ` / ${c2.alpha}` : ""})`
  };
  var definition_default20 = definition20;

  // node_modules/culori/src/oklch/parseOklch.js
  function parseOklch(color, parsed) {
    if (!parsed || parsed[0] !== "oklch") {
      return void 0;
    }
    const res = { mode: "oklch" };
    const [, l, c2, h, alpha2] = parsed;
    if (l.type !== Tok.None) {
      if (l.type === Tok.Hue) {
        return void 0;
      }
      res.l = Math.min(
        Math.max(0, l.type === Tok.Number ? l.value : l.value / 100),
        1
      );
    }
    if (c2.type !== Tok.None) {
      res.c = Math.max(
        0,
        c2.type === Tok.Number ? c2.value : c2.value * 0.4 / 100
      );
    }
    if (h.type !== Tok.None) {
      if (h.type === Tok.Percentage) {
        return void 0;
      }
      res.h = h.value;
    }
    if (alpha2.type !== Tok.None) {
      res.alpha = Math.min(
        1,
        Math.max(
          0,
          alpha2.type === Tok.Number ? alpha2.value : alpha2.value / 100
        )
      );
    }
    return res;
  }
  var parseOklch_default = parseOklch;

  // node_modules/culori/src/oklch/definition.js
  var definition21 = {
    ...definition_default15,
    mode: "oklch",
    toMode: {
      oklab: (c2) => convertLchToLab_default(c2, "oklab"),
      rgb: (c2) => convertOklabToRgb_default(convertLchToLab_default(c2, "oklab"))
    },
    fromMode: {
      rgb: (c2) => convertLabToLch_default(convertRgbToOklab_default(c2), "oklch"),
      oklab: (c2) => convertLabToLch_default(c2, "oklch")
    },
    parse: [parseOklch_default],
    serialize: (c2) => `oklch(${c2.l !== void 0 ? c2.l : "none"} ${c2.c !== void 0 ? c2.c : "none"} ${c2.h !== void 0 ? c2.h : "none"}${c2.alpha < 1 ? ` / ${c2.alpha}` : ""})`,
    ranges: {
      l: [0, 1],
      c: [0, 0.4],
      h: [0, 360]
    }
  };
  var definition_default21 = definition21;

  // node_modules/culori/src/p3/convertP3ToXyz65.js
  var convertP3ToXyz65 = (rgb4) => {
    let { r: r2, g, b, alpha: alpha2 } = convertRgbToLrgb_default(rgb4);
    let res = {
      mode: "xyz65",
      x: 0.486570948648216 * r2 + 0.265667693169093 * g + 0.1982172852343625 * b,
      y: 0.2289745640697487 * r2 + 0.6917385218365062 * g + 0.079286914093745 * b,
      z: 0 * r2 + 0.0451133818589026 * g + 1.043944368900976 * b
    };
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertP3ToXyz65_default = convertP3ToXyz65;

  // node_modules/culori/src/p3/convertXyz65ToP3.js
  var convertXyz65ToP3 = ({ x, y, z, alpha: alpha2 }) => {
    if (x === void 0) x = 0;
    if (y === void 0) y = 0;
    if (z === void 0) z = 0;
    let res = convertLrgbToRgb_default(
      {
        r: x * 2.4934969119414263 - y * 0.9313836179191242 - 0.402710784450717 * z,
        g: x * -0.8294889695615749 + y * 1.7626640603183465 + 0.0236246858419436 * z,
        b: x * 0.0358458302437845 - y * 0.0761723892680418 + 0.9568845240076871 * z
      },
      "p3"
    );
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertXyz65ToP3_default = convertXyz65ToP3;

  // node_modules/culori/src/p3/definition.js
  var definition22 = {
    ...definition_default,
    mode: "p3",
    parse: ["display-p3"],
    serialize: "display-p3",
    fromMode: {
      rgb: (color) => convertXyz65ToP3_default(convertRgbToXyz65_default(color)),
      xyz65: convertXyz65ToP3_default
    },
    toMode: {
      rgb: (color) => convertXyz65ToRgb_default(convertP3ToXyz65_default(color)),
      xyz65: convertP3ToXyz65_default
    }
  };
  var definition_default22 = definition22;

  // node_modules/culori/src/prophoto/convertXyz50ToProphoto.js
  var gamma2 = (v) => {
    let abs2 = Math.abs(v);
    if (abs2 >= 1 / 512) {
      return Math.sign(v) * Math.pow(abs2, 1 / 1.8);
    }
    return 16 * v;
  };
  var convertXyz50ToProphoto = ({ x, y, z, alpha: alpha2 }) => {
    if (x === void 0) x = 0;
    if (y === void 0) y = 0;
    if (z === void 0) z = 0;
    let res = {
      mode: "prophoto",
      r: gamma2(
        x * 1.3457868816471585 - y * 0.2555720873797946 - 0.0511018649755453 * z
      ),
      g: gamma2(
        x * -0.5446307051249019 + y * 1.5082477428451466 + 0.0205274474364214 * z
      ),
      b: gamma2(x * 0 + y * 0 + 1.2119675456389452 * z)
    };
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertXyz50ToProphoto_default = convertXyz50ToProphoto;

  // node_modules/culori/src/prophoto/convertProphotoToXyz50.js
  var linearize2 = (v = 0) => {
    let abs2 = Math.abs(v);
    if (abs2 >= 16 / 512) {
      return Math.sign(v) * Math.pow(abs2, 1.8);
    }
    return v / 16;
  };
  var convertProphotoToXyz50 = (prophoto2) => {
    let r2 = linearize2(prophoto2.r);
    let g = linearize2(prophoto2.g);
    let b = linearize2(prophoto2.b);
    let res = {
      mode: "xyz50",
      x: 0.7977666449006423 * r2 + 0.1351812974005331 * g + 0.0313477341283922 * b,
      y: 0.2880748288194013 * r2 + 0.7118352342418731 * g + 899369387256e-16 * b,
      z: 0 * r2 + 0 * g + 0.8251046025104602 * b
    };
    if (prophoto2.alpha !== void 0) {
      res.alpha = prophoto2.alpha;
    }
    return res;
  };
  var convertProphotoToXyz50_default = convertProphotoToXyz50;

  // node_modules/culori/src/prophoto/definition.js
  var definition23 = {
    ...definition_default,
    mode: "prophoto",
    parse: ["prophoto-rgb"],
    serialize: "prophoto-rgb",
    fromMode: {
      xyz50: convertXyz50ToProphoto_default,
      rgb: (color) => convertXyz50ToProphoto_default(convertRgbToXyz50_default(color))
    },
    toMode: {
      xyz50: convertProphotoToXyz50_default,
      rgb: (color) => convertXyz50ToRgb_default(convertProphotoToXyz50_default(color))
    }
  };
  var definition_default23 = definition23;

  // node_modules/culori/src/rec2020/convertXyz65ToRec2020.js
  var \u03B1 = 1.09929682680944;
  var \u03B2 = 0.018053968510807;
  var gamma3 = (v) => {
    const abs2 = Math.abs(v);
    if (abs2 > \u03B2) {
      return (Math.sign(v) || 1) * (\u03B1 * Math.pow(abs2, 0.45) - (\u03B1 - 1));
    }
    return 4.5 * v;
  };
  var convertXyz65ToRec2020 = ({ x, y, z, alpha: alpha2 }) => {
    if (x === void 0) x = 0;
    if (y === void 0) y = 0;
    if (z === void 0) z = 0;
    let res = {
      mode: "rec2020",
      r: gamma3(
        x * 1.7166511879712683 - y * 0.3556707837763925 - 0.2533662813736599 * z
      ),
      g: gamma3(
        x * -0.6666843518324893 + y * 1.6164812366349395 + 0.0157685458139111 * z
      ),
      b: gamma3(
        x * 0.0176398574453108 - y * 0.0427706132578085 + 0.9421031212354739 * z
      )
    };
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertXyz65ToRec2020_default = convertXyz65ToRec2020;

  // node_modules/culori/src/rec2020/convertRec2020ToXyz65.js
  var \u03B12 = 1.09929682680944;
  var \u03B22 = 0.018053968510807;
  var linearize3 = (v = 0) => {
    let abs2 = Math.abs(v);
    if (abs2 < \u03B22 * 4.5) {
      return v / 4.5;
    }
    return (Math.sign(v) || 1) * Math.pow((abs2 + \u03B12 - 1) / \u03B12, 1 / 0.45);
  };
  var convertRec2020ToXyz65 = (rec20202) => {
    let r2 = linearize3(rec20202.r);
    let g = linearize3(rec20202.g);
    let b = linearize3(rec20202.b);
    let res = {
      mode: "xyz65",
      x: 0.6369580483012911 * r2 + 0.1446169035862083 * g + 0.1688809751641721 * b,
      y: 0.262700212011267 * r2 + 0.6779980715188708 * g + 0.059301716469862 * b,
      z: 0 * r2 + 0.0280726930490874 * g + 1.0609850577107909 * b
    };
    if (rec20202.alpha !== void 0) {
      res.alpha = rec20202.alpha;
    }
    return res;
  };
  var convertRec2020ToXyz65_default = convertRec2020ToXyz65;

  // node_modules/culori/src/rec2020/definition.js
  var definition24 = {
    ...definition_default,
    mode: "rec2020",
    fromMode: {
      xyz65: convertXyz65ToRec2020_default,
      rgb: (color) => convertXyz65ToRec2020_default(convertRgbToXyz65_default(color))
    },
    toMode: {
      xyz65: convertRec2020ToXyz65_default,
      rgb: (color) => convertXyz65ToRgb_default(convertRec2020ToXyz65_default(color))
    },
    parse: ["rec2020"],
    serialize: "rec2020"
  };
  var definition_default24 = definition24;

  // node_modules/culori/src/xyb/constants.js
  var bias = 0.0037930732552754493;
  var bias_cbrt = Math.cbrt(bias);

  // node_modules/culori/src/xyb/convertRgbToXyb.js
  var transfer = (v) => Math.cbrt(v) - bias_cbrt;
  var convertRgbToXyb = (color) => {
    const { r: r2, g, b, alpha: alpha2 } = convertRgbToLrgb_default(color);
    const l = transfer(0.3 * r2 + 0.622 * g + 0.078 * b + bias);
    const m = transfer(0.23 * r2 + 0.692 * g + 0.078 * b + bias);
    const s = transfer(
      0.2434226892454782 * r2 + 0.2047674442449682 * g + 0.5518098665095535 * b + bias
    );
    const res = {
      mode: "xyb",
      x: (l - m) / 2,
      y: (l + m) / 2,
      /* Apply default chroma from luma (subtract Y from B) */
      b: s - (l + m) / 2
    };
    if (alpha2 !== void 0) res.alpha = alpha2;
    return res;
  };
  var convertRgbToXyb_default = convertRgbToXyb;

  // node_modules/culori/src/xyb/convertXybToRgb.js
  var transfer2 = (v) => Math.pow(v + bias_cbrt, 3);
  var convertXybToRgb = ({ x, y, b, alpha: alpha2 }) => {
    if (x === void 0) x = 0;
    if (y === void 0) y = 0;
    if (b === void 0) b = 0;
    const l = transfer2(x + y) - bias;
    const m = transfer2(y - x) - bias;
    const s = transfer2(b + y) - bias;
    const res = convertLrgbToRgb_default({
      r: 11.031566904639861 * l - 9.866943908131562 * m - 0.16462299650829934 * s,
      g: -3.2541473810744237 * l + 4.418770377582723 * m - 0.16462299650829934 * s,
      b: -3.6588512867136815 * l + 2.7129230459360922 * m + 1.9459282407775895 * s
    });
    if (alpha2 !== void 0) res.alpha = alpha2;
    return res;
  };
  var convertXybToRgb_default = convertXybToRgb;

  // node_modules/culori/src/xyb/definition.js
  var definition25 = {
    mode: "xyb",
    channels: ["x", "y", "b", "alpha"],
    parse: ["--xyb"],
    serialize: "--xyb",
    toMode: {
      rgb: convertXybToRgb_default
    },
    fromMode: {
      rgb: convertRgbToXyb_default
    },
    ranges: {
      x: [-0.0154, 0.0281],
      y: [0, 0.8453],
      b: [-0.2778, 0.388]
    },
    interpolate: {
      x: interpolatorLinear,
      y: interpolatorLinear,
      b: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    }
  };
  var definition_default25 = definition25;

  // node_modules/culori/src/xyz50/definition.js
  var definition26 = {
    mode: "xyz50",
    parse: ["xyz-d50"],
    serialize: "xyz-d50",
    toMode: {
      rgb: convertXyz50ToRgb_default,
      lab: convertXyz50ToLab_default
    },
    fromMode: {
      rgb: convertRgbToXyz50_default,
      lab: convertLabToXyz50_default
    },
    channels: ["x", "y", "z", "alpha"],
    ranges: {
      x: [0, 0.964],
      y: [0, 0.999],
      z: [0, 0.825]
    },
    interpolate: {
      x: interpolatorLinear,
      y: interpolatorLinear,
      z: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    }
  };
  var definition_default26 = definition26;

  // node_modules/culori/src/xyz65/convertXyz65ToXyz50.js
  var convertXyz65ToXyz50 = (xyz652) => {
    let { x, y, z, alpha: alpha2 } = xyz652;
    if (x === void 0) x = 0;
    if (y === void 0) y = 0;
    if (z === void 0) z = 0;
    let res = {
      mode: "xyz50",
      x: 1.0479298208405488 * x + 0.0229467933410191 * y - 0.0501922295431356 * z,
      y: 0.0296278156881593 * x + 0.990434484573249 * y - 0.0170738250293851 * z,
      z: -0.0092430581525912 * x + 0.0150551448965779 * y + 0.7518742899580008 * z
    };
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertXyz65ToXyz50_default = convertXyz65ToXyz50;

  // node_modules/culori/src/xyz65/convertXyz50ToXyz65.js
  var convertXyz50ToXyz65 = (xyz502) => {
    let { x, y, z, alpha: alpha2 } = xyz502;
    if (x === void 0) x = 0;
    if (y === void 0) y = 0;
    if (z === void 0) z = 0;
    let res = {
      mode: "xyz65",
      x: 0.9554734527042182 * x - 0.0230985368742614 * y + 0.0632593086610217 * z,
      y: -0.0283697069632081 * x + 1.0099954580058226 * y + 0.021041398966943 * z,
      z: 0.0123140016883199 * x - 0.0205076964334779 * y + 1.3303659366080753 * z
    };
    if (alpha2 !== void 0) {
      res.alpha = alpha2;
    }
    return res;
  };
  var convertXyz50ToXyz65_default = convertXyz50ToXyz65;

  // node_modules/culori/src/xyz65/definition.js
  var definition27 = {
    mode: "xyz65",
    toMode: {
      rgb: convertXyz65ToRgb_default,
      xyz50: convertXyz65ToXyz50_default
    },
    fromMode: {
      rgb: convertRgbToXyz65_default,
      xyz50: convertXyz50ToXyz65_default
    },
    ranges: {
      x: [0, 0.95],
      y: [0, 1],
      z: [0, 1.088]
    },
    channels: ["x", "y", "z", "alpha"],
    parse: ["xyz", "xyz-d65"],
    serialize: "xyz-d65",
    interpolate: {
      x: interpolatorLinear,
      y: interpolatorLinear,
      z: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    }
  };
  var definition_default27 = definition27;

  // node_modules/culori/src/yiq/convertRgbToYiq.js
  var convertRgbToYiq = ({ r: r2, g, b, alpha: alpha2 }) => {
    if (r2 === void 0) r2 = 0;
    if (g === void 0) g = 0;
    if (b === void 0) b = 0;
    const res = {
      mode: "yiq",
      y: 0.29889531 * r2 + 0.58662247 * g + 0.11448223 * b,
      i: 0.59597799 * r2 - 0.2741761 * g - 0.32180189 * b,
      q: 0.21147017 * r2 - 0.52261711 * g + 0.31114694 * b
    };
    if (alpha2 !== void 0) res.alpha = alpha2;
    return res;
  };
  var convertRgbToYiq_default = convertRgbToYiq;

  // node_modules/culori/src/yiq/convertYiqToRgb.js
  var convertYiqToRgb = ({ y, i, q, alpha: alpha2 }) => {
    if (y === void 0) y = 0;
    if (i === void 0) i = 0;
    if (q === void 0) q = 0;
    const res = {
      mode: "rgb",
      r: y + 0.95608445 * i + 0.6208885 * q,
      g: y - 0.27137664 * i - 0.6486059 * q,
      b: y - 1.10561724 * i + 1.70250126 * q
    };
    if (alpha2 !== void 0) res.alpha = alpha2;
    return res;
  };
  var convertYiqToRgb_default = convertYiqToRgb;

  // node_modules/culori/src/yiq/definition.js
  var definition28 = {
    mode: "yiq",
    toMode: {
      rgb: convertYiqToRgb_default
    },
    fromMode: {
      rgb: convertRgbToYiq_default
    },
    channels: ["y", "i", "q", "alpha"],
    parse: ["--yiq"],
    serialize: "--yiq",
    ranges: {
      i: [-0.595, 0.595],
      q: [-0.522, 0.522]
    },
    interpolate: {
      y: interpolatorLinear,
      i: interpolatorLinear,
      q: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    }
  };
  var definition_default28 = definition28;

  // node_modules/culori/src/round.js
  var r = (value, precision) => Math.round(value * (precision = Math.pow(10, precision))) / precision;
  var round = (precision = 4) => (value) => typeof value === "number" ? r(value, precision) : value;
  var round_default = round;

  // node_modules/culori/src/formatter.js
  var twoDecimals = round_default(2);
  var clamp = (value) => Math.max(0, Math.min(1, value || 0));
  var fixup = (value) => Math.round(clamp(value) * 255);
  var rgb = converter_default("rgb");
  var hsl = converter_default("hsl");
  var serializeHex = (color) => {
    if (color === void 0) {
      return void 0;
    }
    let r2 = fixup(color.r);
    let g = fixup(color.g);
    let b = fixup(color.b);
    return "#" + (1 << 24 | r2 << 16 | g << 8 | b).toString(16).slice(1);
  };
  var serializeRgb = (color) => {
    if (color === void 0) {
      return void 0;
    }
    let r2 = fixup(color.r);
    let g = fixup(color.g);
    let b = fixup(color.b);
    if (color.alpha === void 0 || color.alpha === 1) {
      return `rgb(${r2}, ${g}, ${b})`;
    } else {
      return `rgba(${r2}, ${g}, ${b}, ${twoDecimals(clamp(color.alpha))})`;
    }
  };
  var formatHex = (c2) => serializeHex(rgb(c2));
  var formatRgb = (c2) => serializeRgb(rgb(c2));

  // node_modules/culori/src/clamp.js
  var rgb2 = converter_default("rgb");
  var fixup_rgb = (c2) => {
    const res = {
      mode: c2.mode,
      r: Math.max(0, Math.min(c2.r !== void 0 ? c2.r : 0, 1)),
      g: Math.max(0, Math.min(c2.g !== void 0 ? c2.g : 0, 1)),
      b: Math.max(0, Math.min(c2.b !== void 0 ? c2.b : 0, 1))
    };
    if (c2.alpha !== void 0) {
      res.alpha = c2.alpha;
    }
    return res;
  };
  var to_displayable_srgb = (c2) => fixup_rgb(rgb2(c2));
  var inrange_rgb = (c2) => {
    return c2 !== void 0 && (c2.r === void 0 || c2.r >= 0 && c2.r <= 1) && (c2.g === void 0 || c2.g >= 0 && c2.g <= 1) && (c2.b === void 0 || c2.b >= 0 && c2.b <= 1);
  };
  function displayable(color) {
    return inrange_rgb(rgb2(color));
  }
  function inGamut(mode = "rgb") {
    const { gamut } = getMode(mode);
    if (!gamut) {
      return (color) => true;
    }
    const conv = converter_default(typeof gamut === "string" ? gamut : mode);
    return (color) => inrange_rgb(conv(color));
  }
  function clampGamut(mode = "rgb") {
    const { gamut } = getMode(mode);
    if (!gamut) {
      return (color) => prepare_default(color);
    }
    const destMode = typeof gamut === "string" ? gamut : mode;
    const destConv = converter_default(destMode);
    const inDestGamut = inGamut(destMode);
    return (color) => {
      const original = prepare_default(color);
      if (!original) {
        return void 0;
      }
      const converted = destConv(original);
      if (inDestGamut(converted)) {
        return original;
      }
      const clamped = fixup_rgb(converted);
      if (original.mode === clamped.mode) {
        return clamped;
      }
      return converter_default(original.mode)(clamped);
    };
  }
  function clampChroma(color, mode = "lch", rgbGamut = "rgb") {
    color = prepare_default(color);
    let inDestinationGamut = rgbGamut === "rgb" ? displayable : inGamut(rgbGamut);
    let clipToGamut = rgbGamut === "rgb" ? to_displayable_srgb : clampGamut(rgbGamut);
    if (color === void 0 || inDestinationGamut(color)) return color;
    let conv = converter_default(color.mode);
    color = converter_default(mode)(color);
    let clamped = { ...color, c: 0 };
    if (!inDestinationGamut(clamped)) {
      return conv(clipToGamut(clamped));
    }
    let start = 0;
    let end = color.c !== void 0 ? color.c : 0;
    let range = getMode(mode).ranges.c;
    let resolution = (range[1] - range[0]) / Math.pow(2, 13);
    let _last_good_c = clamped.c;
    while (end - start > resolution) {
      clamped.c = start + (end - start) * 0.5;
      if (inDestinationGamut(clamped)) {
        _last_good_c = clamped.c;
        start = clamped.c;
      } else {
        end = clamped.c;
      }
    }
    return conv(
      inDestinationGamut(clamped) ? clamped : { ...clamped, c: _last_good_c }
    );
  }

  // node_modules/culori/src/wcag.js
  function luminance(color) {
    let c2 = converter_default("lrgb")(color);
    return 0.2126 * c2.r + 0.7152 * c2.g + 0.0722 * c2.b;
  }
  function contrast(a, b) {
    let L1 = luminance(a);
    let L2 = luminance(b);
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  }

  // node_modules/culori/src/index.js
  var a98 = useMode(definition_default2);
  var cubehelix = useMode(definition_default3);
  var dlab = useMode(definition_default4);
  var dlch = useMode(definition_default5);
  var hsi = useMode(definition_default6);
  var hsl2 = useMode(definition_default7);
  var hsv = useMode(definition_default8);
  var hwb = useMode(definition_default9);
  var itp = useMode(definition_default10);
  var jab = useMode(definition_default11);
  var jch = useMode(definition_default12);
  var lab = useMode(definition_default13);
  var lab65 = useMode(definition_default14);
  var lch = useMode(definition_default15);
  var lch65 = useMode(definition_default16);
  var lchuv = useMode(definition_default17);
  var lrgb = useMode(definition_default18);
  var luv = useMode(definition_default19);
  var okhsl = useMode(modeOkhsl_default);
  var okhsv = useMode(modeOkhsv_default);
  var oklab = useMode(definition_default20);
  var oklch = useMode(definition_default21);
  var p3 = useMode(definition_default22);
  var prophoto = useMode(definition_default23);
  var rec2020 = useMode(definition_default24);
  var rgb3 = useMode(definition_default);
  var xyb = useMode(definition_default25);
  var xyz50 = useMode(definition_default26);
  var xyz65 = useMode(definition_default27);
  var yiq = useMode(definition_default28);

  // packages/xoji/dist/color.js
  var toOklch = converter_default("oklch");
  var DEFAULT_OKLCH = { l: 0, c: 0, h: 0, alpha: 1 };
  function toOklchColor(input) {
    if (typeof input !== "string")
      return input;
    const parsed = parse_default(input);
    if (!parsed)
      throw new Error(`xoji: unparseable color "${input}"`);
    const o = toOklch(parsed);
    if (!o)
      throw new Error(`xoji: cannot convert color "${input}" to oklch`);
    return {
      l: clamp01(o.l ?? 0),
      c: Math.max(0, o.c ?? 0),
      h: o.h ?? 0,
      alpha: o.alpha ?? 1
    };
  }
  function oklch2(l, c2, h, alpha2 = 1) {
    return { l: clamp01(l), c: Math.max(0, c2), h: (h % 360 + 360) % 360, alpha: alpha2 };
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
  function contrast2(a, b) {
    const value = contrast(formatCss2(a), formatCss2(b));
    return value ?? 1;
  }
  function clampToGamut(color) {
    const mapped = clampChroma({ mode: "oklch", l: color.l, c: color.c, h: color.h, alpha: color.alpha }, "oklch", "rgb");
    return {
      l: mapped.l ?? color.l,
      c: Math.max(0, mapped.c ?? 0),
      h: mapped.h ?? color.h,
      alpha: mapped.alpha ?? color.alpha
    };
  }
  function formatCss2(input) {
    const source = typeof input === "string" ? toOklchColor(input) : input;
    const color = clampToGamut(source);
    const culoriColor = {
      mode: "oklch",
      l: color.l,
      c: color.c,
      h: color.h,
      alpha: color.alpha
    };
    if (color.alpha < 1) {
      return formatRgb(culoriColor) ?? formatHex(culoriColor) ?? "#000000";
    }
    return formatHex(culoriColor) ?? "#000000";
  }
  function schemeOf(bg) {
    return lightness(bg) < 0.5 ? "dark" : "light";
  }
  function pickReadable(fill, options, floor = 4.5) {
    let best = options[0] ?? DEFAULT_OKLCH;
    let bestContrast = -1;
    for (const option of options) {
      const ratio = contrast2(fill, option);
      if (ratio >= floor)
        return formatCss2(option);
      if (ratio > bestContrast) {
        bestContrast = ratio;
        best = option;
      }
    }
    return formatCss2(best);
  }
  function clamp01(value) {
    if (Number.isNaN(value))
      return 0;
    return Math.min(1, Math.max(0, value));
  }

  // packages/xoji/dist/graph.js
  var CycleError = class extends Error {
    constructor(cycle) {
      super(`xoji: cycle detected in token graph: ${cycle.join(" -> ")}`);
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

  // packages/xoji/dist/vocab.js
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

  // packages/xoji/dist/algorithms/factory.js
  var AA = 4.5;
  var AAA = 7;
  var ENFORCE = AA + 0.2;
  var SURFACE_SEPARATION = 1.5;
  var BORDER_SEPARATION = 1.5;
  var DIVIDER_SEPARATION = 1.8;
  var DEFAULT_SHIFT_STEP = 90;
  var DEFAULT_ACCENT_SPLIT = 45;
  var DERIVED_SURFACE_TINT_C = 0.02;
  var ACCENT_FAN = "split-complement";
  var ACHROMATIC_CHROMA = 0.02;
  var DERIVED_ACCENT_HUE_ROTATION = 150;
  var DERIVED_ACCENT_FALLBACK_HUE = 250;
  var DERIVED_ACCENT_L = 0.62;
  var DERIVED_ACCENT_C = 0.16;
  var ACCENT_RAMP_L_MIN = 0.1;
  var ACCENT_RAMP_L_MAX = 0.95;
  var HUE_STABLE_CHROMA = 0.1;
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
    return contrast2(TRUE_BLACK, bg) >= contrast2(TRUE_WHITE, bg) ? TRUE_BLACK : TRUE_WHITE;
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
    brown: { h: 50, c: 0.08 },
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
  var SURFACES = ["--body-bg", "--bg-0", "--bg-1", "--bg-2", "--bg-3"];
  var PANEL_REF_INDEX = SURFACES.indexOf("--bg-2");
  var PANEL_SURFACES = ["--bg-1", "--bg-2"];
  var TEXT_STEPS = ["xs", "sm", "body", "lg", "xl", "2xl", "3xl", "4xl", "5xl"];
  var LEADING_STEPS = ["tight", "normal", "loose"];
  var WEIGHT_STEPS = ["normal", "medium", "semibold", "bold"];
  var RADIUS_STEPS = ["none", "sm", "md", "lg", "full"];
  var BORDER_STEPS = ["thin", "normal", "thick"];
  var DURATION_STEPS = ["fast", "base", "slow"];
  var EASE_STEPS = ["standard", "emphasized"];
  var SPACE_STEPS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  var ELEVATION_STEPS = [0, 1, 2, 3, 4, 5];
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
    for (const hue3 of Object.keys(PALETTE_HUES)) {
      add(`--color-${hue3}`, "color");
      for (const stop of PALETTE_STOPS)
        add(`--color-${hue3}-${stop}`, "color");
      add(`--${hue3}`, "color");
      add(`--${hue3}-bg`, "color");
      add(`--${hue3}-fg`, "color");
      add(`--${hue3}-text`, "color");
      add(`--${hue3}-vivid`, "color");
    }
    for (const t of CODE_SURFACES)
      add(t, "color");
    for (const role of CODE_SCOPES)
      add(`--code-${role}`, "color");
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
    for (const step of ELEVATION_STEPS)
      add(`--elevation-${step}`, "shadow");
    for (const step of SPACE_STEPS)
      add(`--space-${step}`, "length");
    return { produces, categories };
  }
  var { produces: PRODUCES, categories: CATEGORIES } = buildProduces();
  var KEYWORD_DOMAINS = {
    "--selection-cue": ["tint", "marker"]
  };
  function stepLightness(base, scheme, step, index) {
    const direction = scheme === "dark" ? 1 : -1;
    return base + direction * step * index;
  }
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
    return contrast2(formatCss2(fg), bgCss);
  }
  function enforceContrastFloor(fg, bg, scheme, floor = ENFORCE) {
    const bgCss = formatCss2(bg);
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
    return Math.max(contrast2(TEXT_LIGHT, bg), contrast2(TEXT_DARK, bg));
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
  function fillWithTextHeadroom(l, c2, h, floor = ENFORCE) {
    const seed = oklch2(l, c2, h);
    if (bestPoleContrast(seed) >= floor)
      return seed;
    let fallback = seed;
    for (let i = 1; i <= 100; i++) {
      const down = oklch2(l - l * i / 100, c2, h);
      if (bestPoleContrast(down) >= floor)
        return down;
      const up = oklch2(l + (1 - l) * i / 100, c2, h);
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
    if (contrast2(formatCss2(fg), bgCss) >= target)
      return fg;
    const poleL = towardLight ? 1 : 0;
    let best = fg;
    for (let i = 1; i <= 100; i++) {
      const candidate = clampToGamut(oklch2(fg.l + (poleL - fg.l) * (i / 100), fg.c, fg.h));
      best = candidate;
      if (contrast2(formatCss2(candidate), bgCss) >= target)
        return candidate;
    }
    return best;
  }
  function separateFillFromSurface(fill, surface, separation, textFloor) {
    const surfaceCss = formatCss2(surface);
    if (contrast2(formatCss2(fill), surfaceCss) >= separation)
      return fill;
    const headroom = Math.min(textFloor, bestPoleContrast(fill));
    const poleL = surface.l < 0.5 ? 1 : 0;
    let best = fill;
    for (let i = 1; i <= 100; i++) {
      const candidate = clampToGamut(oklch2(fill.l + (poleL - fill.l) * (i / 100), fill.c, fill.h));
      best = candidate;
      if (contrast2(formatCss2(candidate), surfaceCss) >= separation && bestPoleContrast(candidate) >= headroom - 0.01) {
        return candidate;
      }
    }
    return best;
  }
  function borderForContrast(seed, surface, minContrast) {
    const surfaceCss = formatCss2(surface);
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
  function readableOnTint(tint, hue3, floor, inkChroma) {
    const tintCss = formatCss2(tint);
    const towardDark = contrast2("#000000", tintCss) >= contrast2("#ffffff", tintCss);
    const targetL = towardDark ? 0 : 1;
    const seedChroma = inkChroma ?? (towardDark ? 0.06 : 0.04);
    const seed = oklch2(tint.l + (towardDark ? -0.4 : 0.4), seedChroma, hue3);
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const css = formatCss2({
        l: seed.l + (targetL - seed.l) * t,
        c: seed.c * (1 - t),
        h: hue3,
        alpha: 1
      });
      if (contrast2(css, tintCss) >= floor)
        return css;
    }
    return towardDark ? "#000000" : "#ffffff";
  }
  function readableHuedOnTintAndPanel(tint, hue3, tintFloor, panels, panelFloor, seedChroma) {
    const tintCss = formatCss2(tint);
    const panelCss = panels.map((p4) => formatCss2(p4));
    const sweep = (towardDark) => {
      const targetL = towardDark ? 0 : 1;
      const seed = towardDark ? oklch2(tint.l - 0.4, seedChroma, hue3) : oklch2(tint.l + 0.4, seedChroma * 0.667, hue3);
      const out = [];
      for (let i = 0; i <= 100; i++) {
        const t = i / 100;
        out.push(formatCss2({
          l: seed.l + (targetL - seed.l) * t,
          c: seed.c * (1 - t),
          h: hue3,
          alpha: 1
        }));
      }
      return out;
    };
    const minPanel = (css) => panelCss.length === 0 ? Infinity : Math.min(...panelCss.map((p4) => contrast2(css, p4)));
    let best = null;
    let bestMin = -1;
    for (const towardDark of [true, false]) {
      for (const css of sweep(towardDark)) {
        if (contrast2(css, tintCss) < tintFloor)
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
    return best ?? readableOnTint(tint, hue3, tintFloor);
  }
  function vividOnPanel(hue3, panels, floor, targetChroma) {
    const panelCss = panels.map((p4) => formatCss2(p4));
    const minPanel = (css) => panelCss.length === 0 ? Infinity : Math.min(...panelCss.map((p4) => contrast2(css, p4)));
    const avgL = panels.reduce((sum, p4) => sum + p4.l, 0) / Math.max(1, panels.length);
    const towardLight = avgL < 0.5;
    let best = null;
    let bestChroma = -1;
    for (let i = 0; i <= 80; i++) {
      const t = i / 80;
      const l = towardLight ? 0.5 + t * 0.45 : 0.5 - t * 0.42;
      const chroma = clampToGamut(oklch2(l, targetChroma, hue3)).c;
      const css = formatCss2(oklch2(l, chroma, hue3));
      if (minPanel(css) >= floor && chroma > bestChroma) {
        bestChroma = chroma;
        best = css;
      }
    }
    return best ?? (towardLight ? "#ffffff" : "#000000");
  }
  function deriveAccentAnchor(bg, fg) {
    const sourceHue = bg.c >= ACHROMATIC_CHROMA ? bg.h : fg.c >= ACHROMATIC_CHROMA ? fg.h : void 0;
    const hue3 = sourceHue === void 0 ? DERIVED_ACCENT_FALLBACK_HUE : ((sourceHue + DERIVED_ACCENT_HUE_ROTATION) % 360 + 360) % 360;
    return clampToGamut(oklch2(DERIVED_ACCENT_L, DERIVED_ACCENT_C, hue3));
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
  function paletteRamp(register, hue3, spec2, scheme, vibrancy, floor, preset, accent, panels, pinnedBase) {
    const set = (suffix, color) => {
      register[suffix ? `--color-${hue3}-${suffix}` : `--color-${hue3}`] = formatCss2(color);
    };
    const family = (solid, bg, fg, text, vivid) => {
      register[`--${hue3}`] = solid;
      register[`--${hue3}-bg`] = bg;
      register[`--${hue3}-fg`] = fg;
      register[`--${hue3}-text`] = text;
      register[`--${hue3}-vivid`] = vivid;
    };
    const grayscale = (lights, chroma2) => {
      const stops2 = lights.map((l) => oklch2(l, chroma2, 0));
      const baseStop = stops2[2];
      const subtleStop2 = stops2[0];
      const strongStop2 = liftStopForContrast(stops2[3], formatCss2(subtleStop2), AA + 0.2, stops2[3].l >= subtleStop2.l);
      const contrast4 = readableOnTint(baseStop, 0, AA + 0.3, 0);
      set("", baseStop);
      set("subtle", subtleStop2);
      set("muted", stops2[1]);
      set("base", baseStop);
      set("strong", strongStop2);
      register[`--color-${hue3}-contrast`] = contrast4;
      family(formatCss2(baseStop), formatCss2(subtleStop2), contrast4, readableOnTint(subtleStop2, 0, AA + 0.2, 0), vividOnPanel(0, panels, floor, 0));
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
      grayscale([0.4, 0.55, 0.68, 0.82], 5e-3);
      return;
    }
    const accentChromaFactor = Math.max(0.5, Math.min(1.6, accent.c / NEUTRAL_ACCENT_CHROMA));
    const chroma = spec2.c * accentChromaFactor * (0.6 + vibrancy * 0.7) * preset.paletteChromaMul;
    const baseL = scheme === "dark" ? 0.7 : 0.55;
    const lBias = Math.max(-0.06, Math.min(0.06, (accent.l - baseL) * 0.25));
    const ladderL = (scheme === "dark" ? [0.45, 0.58, baseL, 0.82] : [0.78, 0.66, baseL, 0.42]).map((l) => Math.max(0.05, Math.min(0.97, l + lBias)));
    const ladderC = [chroma * 0.7, chroma * 0.9, chroma, chroma * 0.85];
    const stops = ladderL.map((l, i) => clampToGamut(oklch2(l, ladderC[i], spec2.h)));
    const base = stops[2];
    const solidBase = pinnedBase ?? base;
    const subtleStop = stops[0];
    const strongStop = liftStopForContrast(stops[3], formatCss2(subtleStop), AA + 0.2, stops[3].l >= subtleStop.l);
    const contrast3 = readableOnTint(solidBase, spec2.h, Math.max(floor, AA + 0.3));
    set("", base);
    set("subtle", subtleStop);
    set("muted", stops[1]);
    set("base", base);
    set("strong", strongStop);
    register[`--color-${hue3}-contrast`] = contrast3;
    const bg0p = panels[0];
    const washL = scheme === "dark" ? Math.max(0.2, bg0p.l + 0.08) : Math.min(0.92, bg0p.l - 0.04);
    const bgTint = ensureTextHeadroom(oklch2(washL, chroma * 0.35, spec2.h), scheme, AA + 0.3);
    const bgText = readableHuedOnTintAndPanel(bgTint, spec2.h, AA + 0.3, panels.slice(1), AA + 0.05, chroma);
    family(formatCss2(solidBase), formatCss2(bgTint), contrast3, bgText, vividOnPanel(spec2.h, panels, floor, chroma));
  }
  function schemeFromFg(fg) {
    return fg.l >= 0.5 ? "dark" : "light";
  }
  function deriveSurface(scheme, hue3, chroma, depth, floor) {
    const l = scheme === "dark" ? depth : 1 - depth;
    return ensureTextHeadroom(oklch2(l, chroma, hue3), scheme, floor);
  }
  function completeAnchors(preset, opts) {
    const pin = opts.constraints ?? {};
    const givenBg = parsePin(pin["--bg-0"]);
    const givenFg = parsePin(pin["--fg-0"]);
    const givenAccent = parsePin(pin["--accent"]);
    const defBg = toOklchColor(preset.defaultAnchors.bg);
    const defFg = toOklchColor(preset.defaultAnchors.fg);
    const defScheme = schemeOf(defBg);
    const surfaceDepth = defScheme === "dark" ? defBg.l : 1 - defBg.l;
    const floor = Math.max(ENFORCE, preset.contrastFloor);
    const inferredScheme = givenBg ? schemeOf(givenBg) : givenFg ? schemeFromFg(givenFg) : defScheme;
    const scheme = opts.knobs?.scheme ?? inferredScheme;
    let bg;
    if (givenBg) {
      bg = scheme === schemeOf(givenBg) ? givenBg : withLightness(givenBg, 1 - givenBg.l);
    } else if (givenAccent || givenFg) {
      const hue3 = givenAccent?.h ?? givenFg.h;
      const tint = givenAccent ? DERIVED_SURFACE_TINT_C : 5e-3;
      bg = deriveSurface(scheme, hue3, tint, surfaceDepth, floor);
    } else {
      bg = scheme === defScheme ? defBg : withLightness(defBg, 1 - defBg.l);
    }
    const fg = givenFg ?? defFg;
    const accentExplicit = givenAccent !== null || preset.defaultAnchors.accent !== void 0;
    const accent = givenAccent ?? (preset.defaultAnchors.accent ? toOklchColor(preset.defaultAnchors.accent) : deriveAccentAnchor(bg, fg));
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
  function buildGraph(preset, opts) {
    const completed = completeAnchors(preset, opts);
    const bg = completed.bg;
    const fgAnchor = completed.fg;
    const pinned = opts.constraints ?? {};
    const accent = pinned["--accent"] ? toOklchColor(pinned["--accent"]) : completed.accent;
    const scheme = completed.scheme;
    const knobs = opts.knobs ?? {};
    const shiftStep = typeof knobs.accentShiftStep === "number" ? knobs.accentShiftStep : DEFAULT_SHIFT_STEP;
    const accentSplit = typeof knobs.accentSplit === "number" ? knobs.accentSplit : DEFAULT_ACCENT_SPLIT;
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
    const surfaceStep = 0.045;
    const nodes = [];
    const lit = (name, value, refs) => {
      nodes.push(refs && refs.length ? { name, value, refs } : { name, value });
    };
    const pinKeys = new Set(Object.keys(pinned));
    const refIfPinned = (...names) => names.filter((n) => pinKeys.has(n));
    lit("--scheme", scheme);
    const bg0 = pinned["--bg-0"] ? toOklchColor(pinned["--bg-0"]) : extreme ? oklch2(scheme === "dark" ? 0 : 1, 0, 0) : ensureTextHeadroom(withLightness(bg, stepLightness(bg.l, scheme, surfaceStep, 1)), scheme, floor);
    const pageFloor = (fill) => separateFillFromSurface(fill, bg0, SURFACE_SEPARATION, floor);
    const direction = scheme === "dark" ? 1 : -1;
    const surfaceColors = SURFACES.map((_, index) => withLightness(bg0, bg0.l + direction * surfaceStep * (index - 1)));
    SURFACES.forEach((name, index) => {
      lit(name, formatCss2(surfaceColors[index]), refIfPinned("--bg-0"));
    });
    lit("--bg-sunken", formatCss2(withLightness(bg0, bg0.l - direction * surfaceStep * 2)), refIfPinned("--bg-0"));
    lit("--scrim", formatCss2(oklch2(scheme === "dark" ? 0 : 0.1, 0, 0, 0.6)));
    const overlayBase = withLightness(bg0, scheme === "dark" ? bg0.l + 0.07 : bg0.l + 0.03);
    lit("--surface-overlay", formatCss2(overlayBase), refIfPinned("--bg-0"));
    lit("--surface-overlay-border", formatCss2(withAlpha(withLightness(bg0, scheme === "dark" ? bg0.l + 0.25 : bg0.l - 0.2), 0.6)), refIfPinned("--bg-0"));
    const fg0 = pinned["--fg-0"] ? toOklchColor(pinned["--fg-0"]) : extreme ? bestTruePole(formatCss2(bg0)) : enforceContrastFloor(withLightness(fgAnchor, scheme === "dark" ? Math.max(fgAnchor.l, 0.9) : Math.min(fgAnchor.l, 0.2)), bg0, scheme, floor);
    lit("--fg-0", formatCss2(fg0), refIfPinned("--bg-0", "--fg-0"));
    const fgBg0Css = formatCss2(bg0);
    const fg0Contrast = emittedContrast(fg0, fgBg0Css);
    const panelRef = surfaceColors[PANEL_REF_INDEX];
    const panelRefCss = formatCss2(panelRef);
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
      const sameSidePanels = panelSurfaces.filter((p4) => p4.l < 0.5 === textLight);
      if (sameSidePanels.length === 0)
        return onBg0;
      const panelCss = sameSidePanels.map((p4) => formatCss2(p4));
      const minPanel = (c2) => Math.min(...panelCss.map((p4) => emittedContrast(c2, p4)));
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
      const bg0Css = formatCss2(bg0);
      const sameSidePanels = panelSurfaces.filter((p4) => p4.l < 0.5 === textLight);
      const refsCss = [bg0Css, ...sameSidePanels.map((p4) => formatCss2(p4))];
      const minRef = (c2) => Math.min(...refsCss.map((r2) => emittedContrast(c2, r2)));
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
      lit(`--fg-${i}`, formatCss2(reduced), ["--fg-0", ...refIfPinned("--bg-0")]);
    }
    lit("--fg-disabled", formatCss2(withLightness(fg0, conservativeFloorL(3))), ["--fg-0", ...refIfPinned("--bg-0")]);
    const placeholderFloor = extreme ? rampFloor : Math.min(floor, fg0Contrast);
    const placeholderL = conservativeFloorL(placeholderFloor);
    lit("--placeholder", formatCss2(withLightness(fg0, placeholderL)), ["--fg-0", ...refIfPinned("--bg-0")]);
    const accentFill = pinned["--accent"] || completed.accentExplicit ? accent : pageFloor(fillWithTextHeadroom(accent.l, accent.c * (0.6 + vibrancy * 0.8) * preset.accentChromaMul, accent.h, floor));
    const accentValue = pinned["--accent"] ?? formatCss2(accentFill);
    lit("--accent", accentValue, refIfPinned("--accent"));
    lit("--accent-fg", pickReadable(accentFill, TEXT_POLES, floor), ["--accent"]);
    const accentTextColor = enforceChromaticOnPanels(accentFill);
    const accentTextCss = formatCss2(accentTextColor);
    const accentTint = liftStopForContrast(oklch2(scheme === "dark" ? Math.max(0.2, bg0.l + 0.08) : Math.min(0.92, bg0.l - 0.04), accentFill.c * preset.accentTintChromaMul, accentFill.h), accentTextCss, AA + 0.2, accentTextColor.l < 0.5);
    lit("--accent-bg", formatCss2(accentTint), ["--accent", ...refIfPinned("--bg-0")]);
    lit("--accent-text", accentTextCss, ["--accent", ...refIfPinned("--bg-0")]);
    lit("--accent-vivid", vividOnPanel(accentFill.h, [bg0, ...panelSurfaces], floor, accentFill.c), ["--accent", ...refIfPinned("--bg-0")]);
    const pinnedNeutral = parsePin(pinned["--neutral"]);
    const neutralFill = pinnedNeutral ?? pageFloor(fillWithTextHeadroom(scheme === "dark" ? 0.6 : 0.5, preset.neutralChroma, accentFill.h, floor));
    const neutralTintHue = Number.isFinite(neutralFill.h) ? neutralFill.h : accentFill.h;
    lit("--neutral", formatCss2(neutralFill), ["--accent", ...refIfPinned("--neutral")]);
    const neutralTextColor = enforceOnPanels(neutralFill);
    const neutralTextCss = formatCss2(neutralTextColor);
    const neutralTint = liftStopForContrast(oklch2(scheme === "dark" ? Math.max(0.2, bg0.l + 0.06) : Math.min(0.92, bg0.l - 0.04), 5e-3, neutralTintHue), neutralTextCss, AA + 0.2, neutralTextColor.l < 0.5);
    lit("--neutral-bg", formatCss2(neutralTint), ["--accent", ...refIfPinned("--bg-0")]);
    lit("--neutral-fg", pickReadable(neutralFill, TEXT_POLES, floor), ["--neutral"]);
    lit("--neutral-text", neutralTextCss, ["--neutral", ...refIfPinned("--bg-0")]);
    lit("--neutral-vivid", neutralTextCss, ["--neutral-text", ...refIfPinned("--bg-0")]);
    const lineSeed = extreme ? oklch2(scheme === "dark" ? 0.7 : 0.3, 0, 0) : withLightness(bg0, scheme === "dark" ? bg0.l + 0.12 : bg0.l - 0.12);
    lit("--line", formatCss2(borderForContrast(lineSeed, bg0, BORDER_SEPARATION)), refIfPinned("--bg-0"));
    const line2Seed = extreme ? oklch2(scheme === "dark" ? 0.85 : 0.15, 0, 0) : withLightness(bg0, scheme === "dark" ? bg0.l + 0.2 : bg0.l - 0.2);
    lit("--line-2", formatCss2(borderForContrast(line2Seed, bg0, DIVIDER_SEPARATION)), refIfPinned("--bg-0"));
    lit("--ring", formatCss2(withAlpha(accentFill, 0.7)), ["--accent"]);
    lit("--ring-bg", formatCss2(withAlpha(accentFill, 0.18)), ["--accent"]);
    const fieldBg = withLightness(bg0, scheme === "dark" ? bg0.l - 0.03 : bg0.l + 0.02);
    lit("--field-bg", formatCss2(fieldBg), refIfPinned("--bg-0"));
    const fieldBorderSeed = extreme ? oklch2(scheme === "dark" ? 0.8 : 0.2, 0, 0) : withLightness(bg0, scheme === "dark" ? bg0.l + 0.16 : bg0.l - 0.16);
    lit("--field-border", formatCss2(borderForContrast(fieldBorderSeed, fieldBg, BORDER_SEPARATION)), refIfPinned("--bg-0"));
    lit("--accent-hover", formatCss2(withLightness(accentFill, accentFill.l + (scheme === "dark" ? 0.06 : -0.06))), ["--accent"]);
    lit("--accent-active", formatCss2(withLightness(accentFill, accentFill.l + (scheme === "dark" ? -0.06 : 0.06))), ["--accent"]);
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
      return formatCss2({ ...color, c: Math.min(color.c, maxC) });
    };
    const a1 = accentDisplay;
    const rotate = (deg) => ({ dL: 0, dC: 0, dH: deg });
    const fanned = (n, derived) => pinned[`--accent-${n}`] ? toOklchColor(pinned[`--accent-${n}`]) : derived;
    let a2;
    let a3;
    let a4;
    if (ACCENT_FAN === "split-complement") {
      const mirrorOf = (c2) => applyAccentDelta(a1, rotate(-hueDelta(a1.h, c2.h)));
      const a2Pin = pinned["--accent-2"];
      const a3Pin = pinned["--accent-3"];
      let a2Derived = applyAccentDelta(a1, rotate(-accentSplit));
      let a3Derived = applyAccentDelta(a1, rotate(accentSplit));
      if (a2Pin && !a3Pin)
        a3Derived = mirrorOf(toOklchColor(a2Pin));
      else if (a3Pin && !a2Pin)
        a2Derived = mirrorOf(toOklchColor(a3Pin));
      a2 = fanned("2", a2Derived);
      a3 = fanned("3", a3Derived);
      a4 = fanned("4", applyAccentDelta(a1, rotate(180)));
    } else {
      a2 = fanned("2", applyAccentDelta(a1, rotate(shiftStep)));
      a3 = fanned("3", applyAccentDelta(a2, accentDelta(a1, a2)));
      a4 = fanned("4", applyAccentDelta(a3, accentDelta(a2, a3)));
    }
    lit("--accent-2", emitAccent(a2), ["--accent", "--accent-shift-step"]);
    lit("--accent-3", emitAccent(a3), ["--accent-2", "--accent"]);
    lit("--accent-4", emitAccent(a4), ["--accent-3", "--accent-2"]);
    lit("--accent-shift-step", String(shiftStep));
    const emitAccentFamily = (n, raw) => {
      const color = toOklchColor(emitAccent(raw));
      lit(`--accent-${n}-fg`, pickReadable(color, TEXT_POLES, floor), [`--accent-${n}`]);
      const tint = oklch2(scheme === "dark" ? Math.max(0.2, bg0.l + 0.08) : Math.min(0.92, bg0.l - 0.04), color.c * preset.accentTintChromaMul, color.h);
      lit(`--accent-${n}-bg`, formatCss2(tint), [`--accent-${n}`, ...refIfPinned("--bg-0")]);
      lit(`--accent-${n}-text`, readableHuedOnTintAndPanel(tint, color.h, AA + 0.3, panelSurfaces, AA + 0.05, color.c), [`--accent-${n}-bg`, ...refIfPinned("--bg-0")]);
      lit(`--accent-${n}-vivid`, vividOnPanel(color.h, [bg0, ...panelSurfaces], floor, color.c), [`--accent-${n}`, ...refIfPinned("--bg-0")]);
    };
    emitAccentFamily("2", a2);
    emitAccentFamily("3", a3);
    emitAccentFamily("4", a4);
    lit("--selection-cue", extreme || knobs.cues === "redundant" ? "marker" : "tint");
    const statusChroma = Math.max(0.12, accent.c) * (0.6 + vibrancy * 0.7) * preset.statusChromaMul;
    for (const role of Object.keys(STATUS_TO_HUE)) {
      const namedHue = resolveStatusHue(role, pinned);
      const pinnedFill = parseChromaticPin(pinned[`--${role}`]);
      const roleHue = pinnedFill ? pinnedFill.h : namedHue;
      const fillL = scheme === "dark" ? 0.62 : 0.52;
      const fill = pinnedFill ?? pageFloor(fillWithTextHeadroom(fillL, statusChroma, roleHue, floor));
      const tintL = scheme === "dark" ? Math.min(0.3, bg0.l + 0.08) : Math.min(0.92, bg0.l - 0.04);
      const tint = ensureTextHeadroom(oklch2(tintL, statusChroma * 0.35, roleHue), scheme, AA + 0.3);
      const fillRefs = refIfPinned("--accent", `--${role}`);
      lit(`--${role}`, formatCss2(fill), fillRefs);
      lit(`--${role}-bg`, formatCss2(tint), [`--${role}`, ...refIfPinned("--bg-0")]);
      lit(`--${role}-fg`, pickReadable(fill, TEXT_POLES, floor), [`--${role}`]);
      lit(`--${role}-text`, readableHuedOnTintAndPanel(tint, roleHue, AA + 0.3, panelSurfaces, AA + 0.05, statusChroma), [`--${role}-bg`, ...refIfPinned("--bg-0")]);
      lit(`--${role}-vivid`, vividOnPanel(roleHue, [bg0, ...panelSurfaces], floor, statusChroma), [`--${role}`, ...refIfPinned("--bg-0")]);
    }
    const overlayL = scheme === "dark" ? 1 : 0;
    const extremeDist = scheme === "dark" ? bg0.l : 1 - bg0.l;
    const overlayBoost = 1 + Math.max(0, (0.15 - extremeDist) / 0.15) * 0.8;
    const overlay = (a) => formatCss2(oklch2(overlayL, 0, 0, Math.min(0.4, a * overlayBoost)));
    lit("--state-hover", overlay(0.06));
    lit("--state-press", overlay(0.12));
    lit("--state-selected", overlay(0.16));
    lit("--state-disabled", overlay(0.08));
    lit("--state-drag", overlay(0.1));
    lit("--selection", formatCss2(withAlpha(accentFill, 0.3)), ["--accent"]);
    lit("--highlight", formatCss2(withAlpha(oklch2(scheme === "dark" ? 0.85 : 0.9, 0.16, paletteHueAngle("yellow")), 0.35)));
    lit("--link", formatCss2(enforceChromaticOnPanels(accent)), ["--accent", ...refIfPinned("--bg-0")]);
    lit("--link-hover", formatCss2(enforceChromaticOnPanels(withLightness(accent, accent.l + (scheme === "dark" ? 0.08 : -0.08)))), ["--link", ...refIfPinned("--bg-0")]);
    for (const [hue3, spec2] of Object.entries(PALETTE_HUES)) {
      const pinnedBase = typeof spec2 === "object" ? parseChromaticPin(pinned[`--${hue3}`] ?? pinned[`--color-${hue3}-base`] ?? pinned[`--color-${hue3}`]) : null;
      const effectiveSpec = pinnedBase && typeof spec2 === "object" ? { h: pinnedBase.h, c: pinnedBase.c } : spec2;
      const ramp = {};
      paletteRamp(ramp, hue3, effectiveSpec, scheme, vibrancy, floor, preset, accent, [bg0, ...panelSurfaces], pinnedBase ?? void 0);
      lit(`--color-${hue3}`, ramp[`--color-${hue3}`]);
      for (const stop of PALETTE_STOPS) {
        lit(`--color-${hue3}-${stop}`, ramp[`--color-${hue3}-${stop}`], [
          `--color-${hue3}`
        ]);
      }
      lit(`--${hue3}`, ramp[`--${hue3}`], [`--color-${hue3}-base`]);
      lit(`--${hue3}-bg`, ramp[`--${hue3}-bg`], [`--color-${hue3}-subtle`]);
      lit(`--${hue3}-fg`, ramp[`--${hue3}-fg`], [`--color-${hue3}-base`]);
      lit(`--${hue3}-text`, ramp[`--${hue3}-text`], [`--color-${hue3}-subtle`]);
      lit(`--${hue3}-vivid`, ramp[`--${hue3}-vivid`], [
        `--color-${hue3}-base`,
        ...refIfPinned("--bg-0")
      ]);
    }
    const codeBg = ensureTextHeadroom(withLightness(bg0, scheme === "dark" ? bg0.l - 0.02 : bg0.l + 0.012), scheme, floor);
    const codeBgCss = formatCss2(codeBg);
    lit("--code-bg", codeBgCss, refIfPinned("--bg-0"));
    const codeFg = enforceContrastFloor(fg0, codeBg, scheme, floor);
    const codeFgCss = formatCss2(codeFg);
    lit("--code-fg", codeFgCss, ["--fg-0", ...refIfPinned("--bg-0")]);
    lit("--code-line-highlight", formatCss2(withAlpha(accentFill, 0.1)), ["--accent"]);
    lit("--code-selection", formatCss2(withAlpha(accentFill, 0.3)), ["--accent"]);
    const codeTowardLight = contrast2("#ffffff", codeBgCss) >= contrast2("#000000", codeBgCss);
    const codePole = codeTowardLight ? 1 : 0;
    const codeFloor = AA;
    const readableHuedOnCode = (l, c2, h, fl) => {
      const seed = oklch2(l, c2, h);
      let best = seed;
      let bestContrast = emittedContrast(seed, codeBgCss);
      if (bestContrast >= fl)
        return seed;
      for (let i = 1; i <= 100; i++) {
        const cand = withLightness(seed, seed.l + (codePole - seed.l) * (i / 100));
        const ct = emittedContrast(cand, codeBgCss);
        if (ct >= fl)
          return cand;
        if (ct > bestContrast) {
          bestContrast = ct;
          best = cand;
        }
      }
      return best;
    };
    const codeChroma = Math.max(0.08, Math.max(0.1, accent.c) * (0.7 + vibrancy * 0.7) * preset.paletteChromaMul);
    const codeBaseHue = Number.isFinite(accent.h) ? accent.h : DERIVED_ACCENT_FALLBACK_HUE;
    const codeBaseL = codeTowardLight ? 0.76 : 0.46;
    const codePoleL = codeTowardLight ? 1 : 0;
    const aaEdgeL = lightnessForContrast(oklch2(codePoleL, 0, 0), codeBg, codeBgCss, codeFloor);
    const bandLo = aaEdgeL + (codePoleL - aaEdgeL) * 0.06;
    const bandHi = codePoleL - (codePoleL - aaEdgeL) * 0.32;
    CODE_VIVID_ROLES.forEach((role, rank) => {
      const hue3 = ((codeBaseHue + CODE_HUE_RANK[rank] * 45) % 360 + 360) % 360;
      const bandL = bandLo + (bandHi - bandLo) * (rank / 7);
      const fill = readableHuedOnCode(bandL, codeChroma, hue3, codeFloor);
      lit(`--code-${role}`, formatCss2(fill), ["--accent", "--code-bg"]);
    });
    const commentFloor = Math.max(3, codeFloor * 0.62);
    const commentL = codeTowardLight ? 0.6 : 0.56;
    lit("--code-comment", formatCss2(readableHuedOnCode(commentL, Math.min(0.03, codeChroma * 0.3), codeBaseHue, commentFloor)), ["--accent", "--code-bg"]);
    lit("--code-operator", formatCss2(readableHuedOnCode(codeBaseL, codeChroma * 0.5, codeBaseHue, codeFloor)), ["--accent", "--code-bg"]);
    lit("--code-punctuation", formatCss2(enforceContrastFloor(withLightness(codeFg, codeFg.l + (codePole - codeFg.l) * 0.18), codeBg, scheme, codeFloor)), ["--code-fg", "--code-bg"]);
    lit("--code-variable", codeFgCss, ["--code-fg"]);
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
    const elevationStrings = {};
    for (const level of ELEVATION_STEPS) {
      const value = shadowString(scheme, level, vibrancy, preset);
      elevationStrings[level] = value;
      lit(`--elevation-${level}`, value);
    }
    lit("--shadow", elevationStrings[3], ["--elevation-3"]);
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
    const ceiling = Math.max(contrast2("#000000", bgCss), contrast2("#ffffff", bgCss));
    return Math.min(declaredFloor, ceiling - CEILING_EPSILON);
  }
  function oklabDist(a, b) {
    const x = toOklchColor(a);
    const y = toOklchColor(b);
    const rad = Math.PI / 180;
    const ax = x.c * Math.cos(x.h * rad);
    const ay = x.c * Math.sin(x.h * rad);
    const bx = y.c * Math.cos(y.h * rad);
    const by = y.c * Math.sin(y.h * rad);
    return Math.hypot(x.l - y.l, ax - bx, ay - by);
  }
  function makeInvariants(preset) {
    const onFillFloor = preset.declaredTextOnFillFloor;
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
        const ratio = fg0 && bg0 ? contrast2(fg0, bg0) : 0;
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
          const ratio = fg ? contrast2(fg, bg0) : 0;
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
          if (contrast2(fg, fill) < required - 0.01) {
            return {
              name: `on-fill text clears ${onFillFloor >= AAA - 0.01 ? "AAA" : "AA"}`,
              ok: false,
              detail: `${fgName} on ${fillName} = ${contrast2(fg, fill).toFixed(2)} (floor ${required.toFixed(2)}${pinned ? " best-achievable" : ""})`
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
          if (contrast2(fg, fill) < AA - 0.01) {
            return {
              name: "text-on-tint clears AA",
              ok: false,
              detail: `${fgName} on ${fillName} = ${contrast2(fg, fill).toFixed(2)}`
            };
          }
        }
        return { name: "text-on-tint clears AA", ok: true };
      },
      (ctx) => {
        const name = "achromatic tone inks stay neutral";
        const achromatic = ["gray", "white", "black"];
        for (const hue3 of achromatic) {
          for (const token of [`--${hue3}-fg`, `--${hue3}-text`, `--color-${hue3}-contrast`]) {
            const value = ctx.register[token];
            if (!value)
              continue;
            const c2 = toOklchColor(value).c;
            if (c2 >= ACHROMATIC_CHROMA) {
              return { name, ok: false, detail: `${token} = ${value} (chroma ${c2.toFixed(3)} \u2265 ${ACHROMATIC_CHROMA})` };
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
          const poleCeiling = contrast2(themePole, bg);
          const required = Math.min(AA, poleCeiling - CEILING_EPSILON);
          const fg0Reach = (() => {
            const v = ctx.register["--fg-0"];
            return v ? contrast2(v, bg) : Infinity;
          })();
          const inkReach = (source) => {
            const v = ctx.register[source];
            if (!v)
              return Infinity;
            const ink = toOklchColor(v);
            const targetL = textLight ? 1 : 0;
            let reach = contrast2(v, bg);
            for (let i = 1; i <= 100; i++) {
              const t = i / 100;
              const candidate = withLightness(ink, ink.l + (targetL - ink.l) * t);
              if (contrast2(formatCss2(candidate), bg0) < inkFloor - 0.01)
                break;
              reach = Math.max(reach, contrast2(formatCss2(candidate), bg));
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
            const ratio = contrast2(fg, bg);
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
              const whiteJoint = contrast2("#ffffff", tintBg) >= AA && contrast2("#ffffff", bg) >= AA;
              const blackJoint = contrast2("#000000", tintBg) >= AA && contrast2("#000000", bg) >= AA;
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
        const fills = ["--accent", "--neutral", ...Object.keys(STATUS_TO_HUE).map((r2) => `--${r2}`)];
        for (const token of fills) {
          if (ctx.constraints[token])
            continue;
          const fill = ctx.register[token];
          if (!fill)
            continue;
          const ratio = contrast2(fill, bg0);
          if (ratio < SURFACE_SEPARATION - 0.05) {
            return { name, ok: false, detail: `${token} = ${ratio.toFixed(2)} on --bg-0 (floor ${SURFACE_SEPARATION})` };
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
          const ratio = contrast2(border, bg);
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
          const ratio = contrast2(link, bg0);
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
        const name = "unpinned accent ramp holds its fan at constant L/C";
        const accentValue = ctx.register["--accent"];
        if (!accentValue) {
          return { name, ok: true };
        }
        const accent = toOklchColor(accentValue);
        if (accent.c < HUE_STABLE_CHROMA) {
          return { name, ok: true };
        }
        const step = typeof ctx.knobs.accentShiftStep === "number" ? ctx.knobs.accentShiftStep : DEFAULT_SHIFT_STEP;
        const split = typeof ctx.knobs.accentSplit === "number" ? ctx.knobs.accentSplit : DEFAULT_ACCENT_SPLIT;
        const accent2Value = ctx.register["--accent-2"];
        const accent3Value = ctx.register["--accent-3"];
        const pinnedAccent2 = ctx.constraints["--accent-2"] && accent2Value ? toOklchColor(accent2Value) : null;
        const pinnedAccent3 = ctx.constraints["--accent-3"] && accent3Value ? toOklchColor(accent3Value) : null;
        const fanOffset = (n) => ACCENT_FAN === "split-complement" ? n === 2 ? pinnedAccent3 ? -hueDelta(accent.h, pinnedAccent3.h) : -split : n === 3 ? pinnedAccent2 ? -hueDelta(accent.h, pinnedAccent2.h) : split : 180 : step * (n - 1);
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
        for (const [hue3, spec2] of Object.entries(PALETTE_HUES)) {
          const stops = PALETTE_STOPS.filter((s) => s !== "contrast").map((stop) => ctx.register[`--color-${hue3}-${stop}`]);
          const ls = stops.map((v) => v ? toOklchColor(v).l : Number.NaN);
          if (ls.some((l) => Number.isNaN(l))) {
            return {
              name: "palette ramps monotonic in OKLCH lightness",
              ok: false,
              detail: `--color-${hue3} ramp has a non-color stop`
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
                detail: `--color-${hue3} ramp l[${i}]=${cur} not strictly ${ascending ? ">" : "<"} ${prev}`
              };
            }
          }
          const base = ctx.register[`--color-${hue3}-base`];
          const contrastStop = ctx.register[`--color-${hue3}-contrast`];
          if (base && contrastStop && contrast2(base, contrastStop) < AA - 0.01) {
            return {
              name: "palette ramps monotonic in OKLCH lightness",
              ok: false,
              detail: `--color-${hue3}-contrast on -base = ${contrast2(base, contrastStop).toFixed(2)}`
            };
          }
          if (spec2 !== "white" && spec2 !== "black") {
            const subtle = ctx.register[`--color-${hue3}-subtle`];
            const strong = ctx.register[`--color-${hue3}-strong`];
            if (subtle && strong && contrast2(subtle, strong) < AA - 0.01) {
              return {
                name: "palette ramps monotonic in OKLCH lightness",
                ok: false,
                detail: `--color-${hue3}-strong on -subtle = ${contrast2(subtle, strong).toFixed(2)}`
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
                  detail: `--color-${hue3}-base h=${o.h.toFixed(1)} strayed from ${spec2.h}`
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
          if (contrast2(solid, fg) < AA - 0.01) {
            return { name, ok: false, detail: `--${tone}-fg on --${tone} = ${contrast2(solid, fg).toFixed(2)}` };
          }
          if (contrast2(bg, text) < AA - 0.01) {
            return { name, ok: false, detail: `--${tone}-text on --${tone}-bg = ${contrast2(bg, text).toFixed(2)}` };
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
          const ratio = v ? contrast2(v, codeBg) : 0;
          if (ratio < readFloor - 0.05) {
            return { name, ok: false, detail: `--code-${role} on --code-bg = ${ratio.toFixed(2)} (floor ${readFloor.toFixed(2)})` };
          }
        }
        const commentRatio = contrast2(ctx.register["--code-comment"] ?? "#000", codeBg);
        if (commentRatio < commentFloor - 0.05) {
          return { name, ok: false, detail: `--code-comment on --code-bg = ${commentRatio.toFixed(2)} (floor ${commentFloor.toFixed(2)})` };
        }
        return { name, ok: true };
      },
      (ctx) => {
        const name = "code scopes mutually distinguishable";
        const MIN_DE = 6e-3;
        const distinct = [...CODE_VIVID_ROLES, "comment"].map((r2) => `--code-${r2}`);
        for (let i = 0; i < distinct.length; i++) {
          for (let j = i + 1; j < distinct.length; j++) {
            const ni = distinct[i];
            const nj = distinct[j];
            const a = ctx.register[ni];
            const b = ctx.register[nj];
            if (!a || !b)
              continue;
            const d = oklabDist(a, b);
            if (d < MIN_DE) {
              return { name, ok: false, detail: `${ni} vs ${nj} \u0394E=${d.toFixed(4)} (min ${MIN_DE})` };
            }
          }
        }
        return { name, ok: true };
      },
      (ctx) => {
        const name = "status roles mutually distinguishable";
        const MIN_DE = 0.02;
        const roles = Object.keys(STATUS_TO_HUE).map((r2) => `--${r2}`);
        for (let i = 0; i < roles.length; i++) {
          for (let j = i + 1; j < roles.length; j++) {
            const ni = roles[i];
            const nj = roles[j];
            const a = ctx.register[ni];
            const b = ctx.register[nj];
            if (!a || !b)
              continue;
            const d = oklabDist(a, b);
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
  var DEFAULT_ANCHORS = {
    bg: "#0f1115",
    fg: "#e8eaed"
  };

  // packages/xoji/dist/authoring.js
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
    const contrast3 = spec2.contrast ?? {};
    const preset = {
      id: spec2.id,
      knobs: spec2.knobs ?? SHARED_KNOBS,
      // Merge over the full default so a spec that names only some anchors (e.g. just `bg` and
      // `accent`) still yields a complete `bg`/`fg` default — derivation reads both, so a partial
      // `defaultAnchors` would crash when invoked with no anchor overrides.
      defaultAnchors: spec2.anchors ? { ...DEFAULT_ANCHORS, ...spec2.anchors } : DEFAULT_ANCHORS,
      contrastFloor: contrast3.floor ?? 4.7,
      declaredTextOnFillFloor: contrast3.textOnFill ?? 4.5,
      defaultVibrancy: spec2.vibrancy ?? 0.5,
      accentChromaMul: chroma.accent ?? 1,
      statusChromaMul: chroma.status ?? 1,
      paletteChromaMul: chroma.palette ?? 1,
      neutralChroma: chroma.neutral ?? 0.01,
      elevationStrengthMul: elevation.strength ?? 1,
      elevationAlphaBoost: elevation.alphaBoost ?? 0,
      accentTintChromaMul: chroma.accentTint ?? 0.3
    };
    if (spec2.extreme)
      preset.extreme = true;
    return preset;
  }
  function defineXojiAlgorithm(spec2) {
    const preset = toPreset(spec2);
    const buildPasses = spec2.passes ?? ((p4, input) => [settlePass(p4, input)]);
    const singlePass = buildPasses(preset, {}).length === 1;
    const finalNodes = (input) => singlePass ? buildGraph(preset, input) : registerToNodes(runPipeline(buildPasses(preset, input), (passIndex) => buildPassContext(preset, input, passIndex)).register);
    registerExports(finalNodes, (input) => tracePreset(preset, buildPasses, input), {
      produces: PRODUCED_TOKENS,
      categories: TOKEN_CATEGORIES,
      knobs: preset.knobs,
      passNames: buildPasses(preset, {}).map((pass) => pass.name)
    }, makeInvariants(preset));
  }

  // algorithms/xoji-loud/src/preset.ts
  var spec = {
    id: "xoji-loud",
    vibrancy: 0.9,
    chroma: { accent: 1.6, status: 1.5, palette: 1.5, neutral: 0.02, accentTint: 0.5 },
    elevation: { strength: 1.6, alphaBoost: 0.12 }
  };

  // algorithms/xoji-loud/src/mod.ts
  defineXojiAlgorithm(spec);
})();
