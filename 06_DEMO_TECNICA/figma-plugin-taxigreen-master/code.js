// Taxi Green Master Figma Generator
// Genera un archivo Figma nuevo, completo y navegable desde cero.
// Fuente: DISEÑO_UI_DETALLADO.md + vision_final_perfecta.md + vision_final_taxigreen_refinada.md.

(async function () {
  var RESET_FILE = true;
  var PREFIX = "TG Master/";

  if (typeof figma.loadAllPagesAsync === "function") {
    await figma.loadAllPagesAsync();
  }

  var C = {
    brand900: "#0B3B1F",
    brand800: "#0F5530",
    brand700: "#137A43",
    brand600: "#1A9756",
    brand500: "#22B96B",
    brand400: "#5CCE92",
    brand300: "#8FDFB5",
    brand200: "#C2EFD6",
    brand100: "#E4F8EE",
    brand50: "#F4FCF8",
    productInk: "#0B0952",
    productInkSoft: "#171463",
    productAccent: "#227FDE",
    productAccent600: "#1769C2",
    productAccent50: "#EAF3FF",
    productAccent100: "#D7EAFF",
    productAccent200: "#BBD9FF",
    sitePrimary: "#78CA5C",
    siteSecondary: "#199E1C",
    siteDeep: "#3D9A67",
    taxiYellow: "#CEBC2C",
    siteYellow: "#EBBD00",
    gray950: "#0A0F0C",
    gray900: "#111815",
    gray800: "#1F2A24",
    gray700: "#384842",
    gray600: "#56685F",
    gray500: "#7A8C82",
    gray400: "#A0AFA6",
    gray300: "#C2CDC6",
    gray200: "#DDE4E0",
    gray150: "#E8EDEA",
    gray100: "#F1F4F2",
    gray50: "#F7F9F8",
    white: "#FFFFFF",
    success700: "#0F7A3A",
    success500: "#16A34A",
    success200: "#BBF7D0",
    success50: "#ECFDF3",
    warning700: "#9A6700",
    warning500: "#D97706",
    warning200: "#FED7AA",
    warning50: "#FFFBEB",
    danger700: "#B42318",
    danger500: "#E0341C",
    danger200: "#FECDCA",
    danger50: "#FEF3F2",
    info700: "#1849A9",
    info500: "#2563EB",
    info200: "#BFDBFE",
    info50: "#EFF6FF",
    care700: "#5B21B6",
    care500: "#7C3AED",
    care300: "#C4B5FD",
    care100: "#EDE9FE",
    care50: "#F5F3FF",
    tripPending: "#F59E0B",
    tripAssigned: "#22B96B",
    tripOnboard: "#1A9756",
    tripCompleted: "#0F5530",
    tripCanceled: "#E0341C",
    tripIncident: "#7C3AED",
    whatsappBg: "#ECE5DD",
    whatsappOut: "#DCF8C6",
    mapWater: "#D6E5EC",
    runway: "#27352F",
    runwayDark: "#A7B7AE",
    airportSand: "#EEF1EA",
    premiumSurface: "#FBFCFA",
    premiumInk: "#07120C",
    nightPanel: "#111C17",
    canvasWarm: "#F4F7F2",
    canvasMint: "#EEF8F1",
    canvasOps: "#F2F6F3",
    canvasChannel: "#F3F8EF",
    canvasPassenger: "#F5F8F4"
  };

  var FONT = {
    regular: { family: "Inter", style: "Regular" },
    medium: { family: "Inter", style: "Medium" },
    semibold: { family: "Inter", style: "Semi Bold" },
    bold: { family: "Inter", style: "Bold" },
    extrabold: { family: "Inter", style: "Extra Bold" }
  };

  var registry = {};
  var actionNodes = [];
  var pageIndex = {};
  var BACK_ACTION = "__BACK__";
  var CLOSE_ACTION = "__CLOSE__";

  async function loadFonts() {
    var fonts = [FONT.regular, FONT.medium, FONT.semibold, FONT.bold, FONT.extrabold];
    for (var i = 0; i < fonts.length; i += 1) {
      try {
        await figma.loadFontAsync(fonts[i]);
      } catch (e) {}
    }
  }

  function rgb(hex) {
    var v = hex.replace("#", "");
    if (v.length === 3) v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
    var n = parseInt(v, 16);
    return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
  }

  function paint(hex) {
    if (!hex || hex === "TRANSPARENT") return [];
    return [{ type: "SOLID", color: rgb(hex) }];
  }

  function shadow(level) {
    var c = rgb("#0F1E14");
    var conf = {
      xs: { y: 1, blur: 2, a: 0.06 },
      sm: { y: 2, blur: 8, a: 0.08 },
      md: { y: 8, blur: 20, a: 0.10 },
      lg: { y: 18, blur: 36, a: 0.14 },
      xl: { y: 28, blur: 56, a: 0.16 }
    }[level || "sm"];
    return [{
      type: "DROP_SHADOW",
      color: { r: c.r, g: c.g, b: c.b, a: conf.a },
      offset: { x: 0, y: conf.y },
      radius: conf.blur,
      spread: 0,
      visible: true,
      blendMode: "NORMAL"
    }];
  }

  function layout(node, o) {
    if (!o) return;
    node.layoutMode = o.mode || "VERTICAL";
    node.primaryAxisSizingMode = o.primary || "FIXED";
    node.counterAxisSizingMode = o.counter || "FIXED";
    node.primaryAxisAlignItems = o.align || "MIN";
    node.counterAxisAlignItems = o.cross || "MIN";
    node.itemSpacing = o.gap || 0;
    node.paddingTop = o.pt !== undefined ? o.pt : (o.p !== undefined ? o.p : 0);
    node.paddingRight = o.pr !== undefined ? o.pr : (o.px !== undefined ? o.px : (o.p !== undefined ? o.p : 0));
    node.paddingBottom = o.pb !== undefined ? o.pb : (o.p !== undefined ? o.p : 0);
    node.paddingLeft = o.pl !== undefined ? o.pl : (o.px !== undefined ? o.px : (o.p !== undefined ? o.p : 0));
  }

  function frame(name, w, h, o) {
    o = o || {};
    var n = figma.createFrame();
    n.name = PREFIX + name;
    n.resize(w, h);
    n.x = o.x || 0;
    n.y = o.y || 0;
    n.cornerRadius = o.radius !== undefined ? o.radius : 0;
    n.clipsContent = o.clip !== undefined ? o.clip : true;
    n.fills = paint(o.fill || C.white);
    if (o.stroke) {
      n.strokes = paint(o.stroke);
      n.strokeWeight = o.strokeWeight || 1;
    }
    if (o.shadow) n.effects = shadow(o.shadow);
    layout(n, o.layout);
    return n;
  }

  function component(parent, name, w, h, o) {
    o = o || {};
    var n = figma.createComponent();
    n.name = PREFIX + "Component/" + name;
    n.resize(w, h);
    n.x = o.x || 0;
    n.y = o.y || 0;
    n.cornerRadius = o.radius !== undefined ? o.radius : 0;
    n.clipsContent = o.clip !== undefined ? o.clip : false;
    n.fills = paint(o.fill || C.white);
    if (o.stroke) {
      n.strokes = paint(o.stroke);
      n.strokeWeight = o.strokeWeight || 1;
    }
    if (o.shadow) n.effects = shadow(o.shadow);
    layout(n, o.layout);
    if (parent) parent.appendChild(n);
    return n;
  }

  function rect(parent, name, w, h, o) {
    o = o || {};
    var n = figma.createRectangle();
    n.name = name;
    n.resize(w, h);
    n.x = o.x || 0;
    n.y = o.y || 0;
    n.cornerRadius = o.radius !== undefined ? o.radius : 0;
    n.fills = paint(o.fill || C.gray100);
    if (o.stroke) {
      n.strokes = paint(o.stroke);
      n.strokeWeight = o.strokeWeight || 1;
    }
    if (o.opacity !== undefined) n.opacity = o.opacity;
    parent.appendChild(n);
    return n;
  }

  function ellipse(parent, name, size, o) {
    o = o || {};
    var n = figma.createEllipse();
    n.name = name;
    n.resize(size, size);
    n.x = o.x || 0;
    n.y = o.y || 0;
    n.fills = paint(o.fill || C.brand700);
    if (o.stroke) {
      n.strokes = paint(o.stroke);
      n.strokeWeight = o.strokeWeight || 1;
    }
    if (o.opacity !== undefined) n.opacity = o.opacity;
    parent.appendChild(n);
    return n;
  }

  function txt(parent, copy, o) {
    o = o || {};
    var n = figma.createText();
    n.name = o.name || "Text";
    n.fontName = o.font || FONT.regular;
    n.characters = copy || "";
    n.fontSize = o.size || 15;
    n.lineHeight = { unit: "PIXELS", value: o.lh || Math.round((o.size || 15) * 1.42) };
    n.fills = paint(o.color || C.gray700);
    n.textAutoResize = o.fixed ? "HEIGHT" : "WIDTH_AND_HEIGHT";
    if (o.align) n.textAlignHorizontal = o.align;
    if (o.width) n.resize(o.width, o.height || 1);
    if (o.x !== undefined) n.x = o.x;
    if (o.y !== undefined) n.y = o.y;
    parent.appendChild(n);
    return n;
  }

  function registerScreen(id, node, aliases) {
    registry[id] = node;
    for (var i = 0; i < (aliases || []).length; i += 1) {
      registry[aliases[i]] = node;
    }
  }

  function registerAction(node, spec) {
    if (!spec) return;
    if (typeof spec === "string") {
      actionNodes.push({ node: node, target: spec });
      return;
    }
    actionNodes.push({
      node: node,
      target: spec.target || null,
      action: spec.action || null,
      navigation: spec.navigation || spec.nav || "NAVIGATE",
      transition: spec.transition,
      overlayRelativePosition: spec.overlayRelativePosition,
      resetScrollPosition: spec.resetScrollPosition,
      closeOnOutsideClick: spec.closeOnOutsideClick
    });
  }

  function navAction(target, navigation, transition) {
    return {
      target: target,
      navigation: navigation || "NAVIGATE",
      transition: transition
    };
  }

  function group(parent, name, w, h, o) {
    o = o || {};
    var n = frame(name, w, h, {
      fill: o.fill || "TRANSPARENT",
      radius: o.radius !== undefined ? o.radius : 0,
      stroke: o.stroke,
      shadow: o.shadow,
      clip: o.clip !== undefined ? o.clip : false,
      layout: o.layout
    });
    parent.appendChild(n);
    return n;
  }

  function row(parent, name, w, h, gap) {
    return group(parent, name, w, h, { layout: { mode: "HORIZONTAL", gap: gap || 8, cross: "CENTER" } });
  }

  function stack(parent, name, w, h, gap) {
    return group(parent, name, w, h, { layout: { mode: "VERTICAL", gap: gap || 8, cross: "MIN" } });
  }

  function logo(parent, size, labelMode) {
    var wrap = group(parent, "Logo Taxi Green", labelMode ? 250 : size, size, {
      layout: { mode: "HORIZONTAL", gap: 12, cross: "CENTER" }
    });
    var mark = frame("Logo Mark", size, size, { fill: C.brand700, radius: size / 2, clip: true, shadow: "sm" });
    wrap.appendChild(mark);
    ellipse(mark, "logo inner light", size * 0.96, {
      x: size * 0.02,
      y: size * 0.02,
      fill: C.brand600,
      opacity: 0.42
    });
    var wedge = rect(mark, "logo long shadow", size * 0.52, size * 1.28, {
      x: size * 0.58,
      y: size * 0.30,
      fill: C.brand800,
      opacity: 0.38
    });
    wedge.rotation = 29;
    var wedge2 = rect(mark, "logo left shadow", size * 0.26, size * 0.62, {
      x: size * 0.08,
      y: size * 0.58,
      fill: C.brand800,
      opacity: 0.22
    });
    wedge2.rotation = 42;
    txt(mark, "G", {
      x: size * 0.16,
      y: size * 0.14,
      size: size * 0.58,
      lh: size * 0.66,
      font: FONT.extrabold,
      color: C.white
    });
    txt(mark, ">", {
      x: size * 0.60,
      y: size * 0.13,
      size: size * 0.62,
      lh: size * 0.68,
      font: FONT.extrabold,
      color: C.siteYellow
    });
    if (labelMode) {
      var s = stack(wrap, "Logo label", 172, size, 0);
      txt(s, "Taxi Green", { size: 22, lh: 28, font: FONT.extrabold, color: C.brand900 });
      txt(s, "Airport Ops Premium", { size: 12, lh: 16, font: FONT.medium, color: C.gray600 });
    }
    return wrap;
  }

  function button(parent, label, variant, w, h, targetId) {
    var variants = {
      primary: { fill: C.productAccent, text: C.white, stroke: null },
      secondary: { fill: C.productAccent50, text: C.productInk, stroke: C.productAccent200 },
      ghost: { fill: C.white, text: C.gray700, stroke: C.gray200 },
      care: { fill: C.care500, text: C.white, stroke: null },
      careSoft: { fill: C.care50, text: C.care700, stroke: C.care300 },
      warning: { fill: C.warning50, text: C.warning700, stroke: C.warning200 },
      danger: { fill: C.danger500, text: C.white, stroke: null },
      destructive: { fill: C.danger50, text: C.danger700, stroke: C.danger200 },
      dark: { fill: C.gray950, text: C.white, stroke: null }
    };
    var v = variants[variant || "primary"] || variants.primary;
    var n = frame("Button/" + label, w || 160, h || 44, {
      fill: v.fill,
      radius: 10,
      stroke: v.stroke,
      clip: false,
      layout: { mode: "HORIZONTAL", align: "CENTER", cross: "CENTER", gap: 8 }
    });
    n.primaryAxisAlignItems = "CENTER";
    n.counterAxisAlignItems = "CENTER";
    parent.appendChild(n);
    txt(n, label, { size: 14, lh: 20, font: FONT.semibold, color: v.text, align: "CENTER" });
    registerAction(n, targetId);
    return n;
  }

  function badge(parent, label, variant, w) {
    var v = {
      brand: { fill: C.productAccent50, text: C.productInk, stroke: C.productAccent200 },
      success: { fill: C.success50, text: C.success700, stroke: C.success200 },
      warning: { fill: C.warning50, text: C.warning700, stroke: C.warning200 },
      danger: { fill: C.danger50, text: C.danger700, stroke: C.danger200 },
      care: { fill: C.care100, text: C.care700, stroke: C.care300 },
      info: { fill: C.info50, text: C.info700, stroke: C.info200 },
      gray: { fill: C.gray100, text: C.gray700, stroke: C.gray200 }
    }[variant || "gray"];
    var n = frame("Badge/" + label, w || 110, 28, {
      fill: v.fill,
      radius: 999,
      stroke: v.stroke,
      layout: { mode: "HORIZONTAL", align: "CENTER", cross: "CENTER" }
    });
    n.primaryAxisAlignItems = "CENTER";
    n.counterAxisAlignItems = "CENTER";
    parent.appendChild(n);
    txt(n, label, { size: 11, lh: 16, font: FONT.semibold, color: v.text, align: "CENTER" });
    return n;
  }

  function card(parent, title, w, h, o) {
    o = o || {};
    var n = frame("Card/" + title, w, h, {
      fill: o.fill || C.white,
      radius: o.radius !== undefined ? o.radius : 12,
      stroke: o.stroke || C.gray200,
      shadow: o.shadow,
      clip: false,
      layout: o.layout || { mode: "VERTICAL", p: o.p !== undefined ? o.p : 16, gap: o.gap || 10 }
    });
    parent.appendChild(n);
    return n;
  }

  function field(parent, label, value, w) {
    var f = stack(parent, "Field/" + label, w || 300, 62, 5);
    txt(f, label, { size: 11, lh: 16, font: FONT.semibold, color: C.gray500 });
    var box = frame("Input/" + label, w || 300, 38, {
      fill: C.gray50,
      radius: 8,
      stroke: C.gray200,
      layout: { mode: "HORIZONTAL", px: 12, cross: "CENTER" }
    });
    f.appendChild(box);
    txt(box, value, { size: 13, lh: 18, font: FONT.medium, color: C.gray800, width: (w || 300) - 24, fixed: true });
    return f;
  }

  function miniMap(parent, name, w, h, dark) {
    var m = frame("Map/" + name, w, h, {
      fill: dark ? "#0F1916" : C.airportSand,
      radius: 12,
      stroke: dark ? C.gray800 : C.gray200,
      clip: true
    });
    parent.appendChild(m);
    rect(m, "coast water", w * 0.36, h + 80, {
      x: -w * 0.08,
      y: -40,
      fill: dark ? "#102C32" : C.mapWater,
      opacity: dark ? 0.70 : 0.95
    });
    var coast = rect(m, "coast line", 4, h + 90, {
      x: w * 0.28,
      y: -45,
      fill: dark ? C.brand500 : C.white,
      opacity: dark ? 0.45 : 0.88,
      radius: 999
    });
    coast.rotation = -11;
    var runway = rect(m, "runway Jorge Chavez", w * 0.42, 14, {
      x: w * 0.50,
      y: h * 0.15,
      fill: dark ? C.runwayDark : C.runway,
      radius: 999,
      opacity: dark ? 0.80 : 0.92
    });
    runway.rotation = -9;
    txt(m, "Jorge Chavez", {
      x: w * 0.53,
      y: h * 0.20,
      size: 10,
      lh: 14,
      font: FONT.semibold,
      color: dark ? C.gray200 : C.gray700
    });
    var road = dark ? "#28352F" : C.white;
    for (var i = 0; i < 7; i += 1) {
      var hroad = rect(m, "avenue h " + i, w + 90, i === 3 ? 5 : 3, {
        x: -40,
        y: 28 + i * Math.max(26, h / 6),
        fill: road,
        opacity: dark ? 0.58 : 0.96,
        radius: 999
      });
      hroad.rotation = i % 2 ? -8 : 12;
      var vroad = rect(m, "avenue v " + i, i === 4 ? 5 : 3, h + 80, {
        x: 38 + i * Math.max(32, w / 7),
        y: -30,
        fill: road,
        opacity: dark ? 0.55 : 0.88,
        radius: 999
      });
      vroad.rotation = i % 2 ? 12 : -10;
    }
    var routeShadow = rect(m, "route shadow", w * 0.62, 10, {
      x: w * 0.22,
      y: h * 0.55,
      fill: dark ? "#07120C" : C.white,
      radius: 999,
      opacity: 0.62
    });
    routeShadow.rotation = -17;
    var route = rect(m, "route live", w * 0.62, 6, {
      x: w * 0.22,
      y: h * 0.55,
      fill: dark ? C.productAccent : C.productAccent,
      radius: 999
    });
    route.rotation = -17;
    ellipse(m, "pickup halo", 44, { x: w * 0.21, y: h * 0.60, fill: C.brand500, opacity: 0.13 });
    ellipse(m, "passenger pin", 18, { x: w * 0.25, y: h * 0.66, fill: C.white, stroke: C.brand700, strokeWeight: 4 });
    ellipse(m, "driver halo", 48, { x: w * 0.57, y: h * 0.30, fill: C.brand500, opacity: 0.20 });
    ellipse(m, "driver pin", 26, { x: w * 0.61, y: h * 0.34, fill: C.productAccent, stroke: C.white, strokeWeight: 3 });
    ellipse(m, "dest pin", 22, { x: w * 0.82, y: h * 0.46, fill: C.siteYellow, stroke: C.white, strokeWeight: 3 });
    txt(m, "8 min", {
      x: w * 0.58,
      y: h * 0.23,
      size: 11,
      lh: 14,
      font: FONT.bold,
      color: dark ? C.white : C.productInk
    });
    return m;
  }

  function qrCode(parent, label, size) {
    var q = frame("QR/" + label, size, size, {
      fill: C.white,
      radius: 10,
      stroke: C.gray200,
      clip: true
    });
    parent.appendChild(q);
    var pattern = [
      "111010111",
      "101000101",
      "111111101",
      "001010010",
      "111001111",
      "100101001",
      "101111101",
      "101000101",
      "111011111"
    ];
    var cell = Math.floor((size - 18) / 9);
    for (var y = 0; y < pattern.length; y += 1) {
      for (var x = 0; x < pattern[y].length; x += 1) {
        if (pattern[y][x] === "1") {
          rect(q, "qr cell", cell - 1, cell - 1, {
            x: 9 + x * cell,
            y: 9 + y * cell,
            fill: C.gray950,
            radius: 2
          });
        }
      }
    }
    return q;
  }

  function renderDriverPreview(parent, w, compact) {
    var wrap = row(parent, "DriverCard", w, compact ? 92 : 118, 12);
    var avatar = frame("Driver photo", compact ? 54 : 72, compact ? 54 : 72, {
      fill: C.productAccent50,
      radius: 999,
      stroke: C.productAccent200,
      clip: false
    });
    wrap.appendChild(avatar);
    txt(avatar, "JP", { x: compact ? 13 : 17, y: compact ? 14 : 20, size: compact ? 18 : 24, lh: compact ? 22 : 28, font: FONT.extrabold, color: C.productInk });
    ellipse(avatar, "estado en linea", compact ? 11 : 13, { x: compact ? 40 : 55, y: compact ? 40 : 55, fill: C.success500, stroke: C.white, strokeWeight: 2 });
    var copy = stack(wrap, "Driver copy", w - (compact ? 154 : 182), compact ? 88 : 108, 3);
    txt(copy, "Juan Carlos Perez Quispe", { size: compact ? 15 : 18, lh: compact ? 20 : 24, font: FONT.bold, color: C.gray950, width: w - (compact ? 168 : 194), fixed: true });
    txt(copy, "4.9 estrellas · 487 viajes · en cola 47 min", { size: 12, lh: 18, color: C.gray600, width: w - (compact ? 168 : 194), fixed: true });
    txt(copy, "Estado: asignado por Carla M. · contacto secundario", { size: 11, lh: 16, color: C.gray500, width: w - (compact ? 168 : 194), fixed: true });
    var actions = row(copy, "Driver contact actions", w - (compact ? 168 : 194), 24, 6);
    badge(actions, "Llamar", "gray", 68);
    badge(actions, "Mensaje", "gray", 82);
    var eta = stack(wrap, "ETA", 74, compact ? 78 : 98, 0);
    eta.counterAxisAlignItems = "CENTER";
    txt(eta, "8", { size: compact ? 28 : 36, lh: compact ? 32 : 40, font: FONT.extrabold, color: C.productAccent, align: "CENTER" });
    txt(eta, "min", { size: 11, lh: 14, font: FONT.semibold, color: C.gray500, align: "CENTER" });
  }

  function renderVehiclePreview(parent, w, compact) {
    var wrap = stack(parent, "VehicleCard", w, compact ? 142 : 176, 9);
    var photo = frame("Vehicle photo 16x9", w, compact ? 72 : 92, {
      fill: C.gray100,
      radius: 10,
      stroke: C.gray200,
      clip: true
    });
    wrap.appendChild(photo);
    rect(photo, "auto body", w * 0.62, compact ? 24 : 30, { x: w * 0.18, y: compact ? 34 : 46, fill: C.white, radius: 999, stroke: C.gray300 });
    rect(photo, "auto window", w * 0.28, compact ? 16 : 20, { x: w * 0.34, y: compact ? 22 : 32, fill: C.mapWater, radius: 8 });
    ellipse(photo, "wheel left", compact ? 14 : 18, { x: w * 0.28, y: compact ? 53 : 69, fill: C.gray900 });
    ellipse(photo, "wheel right", compact ? 14 : 18, { x: w * 0.62, y: compact ? 53 : 69, fill: C.gray900 });
    var main = row(wrap, "Vehicle main", w, 32, 8);
    txt(main, "ABC-123", { size: compact ? 17 : 20, lh: compact ? 22 : 26, font: FONT.extrabold, color: C.gray950, width: 92, fixed: true });
    txt(main, "Toyota Yaris", { size: compact ? 14 : 16, lh: 22, font: FONT.bold, color: C.gray800, width: w - 190, fixed: true });
    badge(main, "Sedan", "brand", 78);
    txt(wrap, "Blanco · 4 pasajeros · 2 maletas · unidad verificada", { size: 12, lh: 18, color: C.gray600, width: w, fixed: true });
  }

  function renderDriverVehiclePreview(parent, w, compact) {
    var wrap = stack(parent, "Driver + Vehicle cards", w, compact ? 164 : 294, 10);
    renderDriverPreview(wrap, w, compact);
    if (compact) {
      var mini = row(wrap, "Vehicle mini", w, 58, 10);
      rect(mini, "car photo mini", 78, 48, { fill: C.gray100, radius: 8, stroke: C.gray200 });
      var copy = stack(mini, "Vehicle mini copy", w - 150, 52, 2);
      txt(copy, "ABC-123 · Toyota Yaris", { size: 13, lh: 18, font: FONT.bold, color: C.gray950, width: w - 154, fixed: true });
      txt(copy, "Sedan blanco · 4 pax · foto de auto verificada", { size: 11, lh: 16, color: C.gray600, width: w - 154, fixed: true });
      badge(mini, "Sedan", "brand", 66);
    } else {
      renderVehiclePreview(wrap, w, compact);
    }
  }

  function renderRatingTriplePreview(parent, w, compact) {
    var wrap = stack(parent, "RatingTripleCard", w, compact ? 118 : 146, 8);
    var rows = ["Servicio", "Conductor", "Unidad"];
    for (var i = 0; i < rows.length; i += 1) {
      var rr = row(wrap, "Rating/" + rows[i], w, 28, 10);
      txt(rr, rows[i], { size: 12, lh: 18, font: FONT.semibold, color: C.gray700, width: 86, fixed: true });
      txt(rr, "*****", { size: 18, lh: 22, font: FONT.bold, color: C.siteYellow, width: 104, fixed: true });
      txt(rr, i === 2 ? "Limpieza OK" : "5/5", { size: 12, lh: 18, color: C.gray500, width: w - 220, fixed: true });
    }
    txt(wrap, "Si un eje baja de 3, aparece motivo: espera, trato, limpieza, ruta u otro.", { size: 11, lh: 16, color: C.gray600, width: w, fixed: true });
  }

  function renderAssignmentApprovalPanel(parent, w, compact) {
    var wrap = stack(parent, "AssignmentApprovalPanel", w, compact ? 178 : 220, 10);
    var banner = row(wrap, "Human control banner", w, 32, 8);
    badge(banner, "Reglas", "brand", 80);
    txt(banner, "Borrador. Nada se despacha sin aprobacion humana.", { size: 12, lh: 18, font: FONT.semibold, color: C.productInk, width: w - 96, fixed: true });
    renderDriverPreview(wrap, w, true);
    var reason = row(wrap, "Reason score", w, 34, 8);
    badge(reason, "Score 92", "success", 86);
    txt(reason, "1ro en cola compatible · a 6 min · unidad sedan verificada.", { size: 12, lh: 18, color: C.gray700, width: w - 102, fixed: true });
  }

  function renderCopilotDualPanel(parent, w, compact) {
    var wrap = row(parent, "WhatsAppCopilotDualPanel", w, compact ? 164 : 204, 12);
    var left = stack(wrap, "WhatsApp chat side", Math.floor((w - 12) * 0.48), compact ? 156 : 196, 8);
    renderChat(left, [
      { side: "in", text: "Concierge Hotel Costa Verde: huesped llega 03:45, LA2456, 2 pax, recojo en Jorge Chavez y destino Av. Pardo 123, Miraflores." },
      { side: "out", text: "Necesito direccion exacta y correo para el comprobante." }
    ], Math.floor((w - 12) * 0.48), compact ? 130 : 168);
    var right = stack(wrap, "Copilot extraction side", Math.floor((w - 12) * 0.52), compact ? 156 : 196, 8);
    badge(right, "Borrador · humano aprueba", "warning", 170);
    renderCopilotPreview(right, Math.floor((w - 12) * 0.52), true);
  }

  function renderDriverHistorySummary(parent, w, compact) {
    var wrap = stack(parent, "DriverHistorySummary", w, compact ? 146 : 182, 8);
    var rows = [
      ["Viajes atendidos", "128"],
      ["Cobrados / procesados", "119"],
      ["Pendientes", "9"],
      ["Importe facturado", "S/ 8,420.00"],
      ["Comision empresa", "S/ 1,684.00"],
      ["Neto a cobrar", "S/ 6,736.00"]
    ];
    for (var i = 0; i < rows.length; i += 1) {
      var rr = row(wrap, "History/" + i, w, 22, 8);
      txt(rr, rows[i][0], { size: 11, lh: 16, color: C.gray600, width: w - 128, fixed: true });
      txt(rr, rows[i][1], { size: 12, lh: 18, font: i === rows.length - 1 ? FONT.extrabold : FONT.semibold, color: i === rows.length - 1 ? C.productAccent : C.gray950, width: 120, fixed: true });
    }
  }

  function renderDriverQueuePreview(parent, w, compact) {
    var wrap = stack(parent, "DriverQueueList", w, compact ? 118 : 148, 8);
    var rows = [
      ["1", "Juan C. Perez", "47 min", "Sedan ABC-123"],
      ["2", "Rosa Mendoza", "41 min", "Van BCD-441"],
      ["3", "Pedro Rojas", "36 min", "Sedan XYZ-987"]
    ];
    for (var i = 0; i < rows.length; i += 1) {
      var rr = row(wrap, "Queue/" + i, w, 32, 8);
      badge(rr, rows[i][0], i === 0 ? "success" : "gray", 36);
      txt(rr, rows[i][1], { size: 12, lh: 18, font: FONT.semibold, color: C.gray900, width: 116, fixed: true });
      txt(rr, rows[i][2], { size: 12, lh: 18, color: C.warning700, width: 58, fixed: true });
      txt(rr, rows[i][3], { size: 12, lh: 18, color: C.gray600, width: w - 242, fixed: true });
    }
  }

  function renderVoucherPreview(parent, w, compact) {
    var wrap = row(parent, "Voucher preview", w, compact ? 104 : 132, 14);
    var q = qrCode(wrap, "TG-0341", compact ? 76 : 96);
    q.layoutAlign = "CENTER";
    var copy = stack(wrap, "Voucher copy", w - (compact ? 100 : 122), compact ? 100 : 124, 5);
    txt(copy, "Voucher TG-0341", { size: compact ? 16 : 18, lh: compact ? 21 : 24, font: FONT.bold, color: C.gray950 });
    txt(copy, "LA2456 - 03:45 - Salida 3 · F2", { size: 12, lh: 18, color: C.gray700, width: w - 124, fixed: true });
    txt(copy, "Pasajero sin app: abre /p/tg-0341 y ve placa, conductor, ETA y comprobante.", { size: 11, lh: 16, color: C.gray600, width: w - 124, fixed: true });
    badge(copy, "QR verificable", "success", 118);
  }

  function renderTripPreview(parent, w, compact) {
    var wrap = stack(parent, "Trip preview", w, compact ? 126 : 150, 10);
    var rail = row(wrap, "Trip rail", w, 34, 7);
    var steps = ["Creada", "Asignada", "En camino", "En viaje", "Cerrada"];
    for (var i = 0; i < steps.length; i += 1) {
      var pill = badge(rail, steps[i], i < 4 ? "brand" : "gray", compact ? 62 : 82);
      if (i === 1) pill.fills = paint(C.success50);
    }
    renderDriverPreview(wrap, w, true);
  }

  function renderIncidentPreview(parent, w, compact) {
    var wrap = stack(parent, "Incident preview", w, compact ? 118 : 142, 8);
    var top = row(wrap, "Incident top", w, 36, 8);
    badge(top, "Objeto perdido", "care", 126);
    badge(top, "SLA 2h", "warning", 80);
    badge(top, "Carla M.", "gray", 84);
    var line = row(wrap, "Human line", w, 28, 8);
    ellipse(line, "care dot", 10, { fill: C.care500 });
    txt(line, "Un humano revisa, conductor confirma hallazgo y pasajero valida cierre.", { size: 12, lh: 18, color: C.gray700, width: w - 28, fixed: true });
    var progress = frame("Incident progress bg", w, 8, { fill: C.care100, radius: 999, clip: true });
    wrap.appendChild(progress);
    rect(progress, "Incident progress fill", Math.round(w * 0.72), 8, { fill: C.care500, radius: 999 });
  }

  function renderCopilotPreview(parent, w, compact) {
    var wrap = stack(parent, "Copilot extraction", w, compact ? 126 : 152, 8);
    var rows = [
      ["Canal", "Solicitante hotel por WhatsApp", C.brand700],
      ["Vuelo", "LA2456 - 98%", C.success500],
      ["Dato faltante", "direccion exacta", C.warning500],
      ["Decision", "pedir dato, no crear solo", C.info500]
    ];
    for (var i = 0; i < rows.length; i += 1) {
      var rr = row(wrap, "Extraction/" + rows[i][0], w, 24, 8);
      rect(rr, "state", 5, 22, { fill: rows[i][2], radius: 999 });
      txt(rr, rows[i][0], { size: 11, lh: 16, font: FONT.semibold, color: C.gray500, width: 82, fixed: true });
      txt(rr, rows[i][1], { size: 12, lh: 18, font: FONT.medium, color: C.gray800, width: w - 106, fixed: true });
    }
  }

  function renderOpsPreview(parent, w, compact) {
    var wrap = stack(parent, "Ops preview", w, compact ? 132 : 162, 8);
    var rows = [
      ["TG-0341", "Sin asignar", "Juan P. sugerido", "warning"],
      ["LA2456", "12 pax", "10/12 cubierto", "brand"],
      ["INC-0142", "Objeto perdido", "Carla revisa", "care"]
    ];
    for (var i = 0; i < rows.length; i += 1) {
      var rr = row(wrap, "Ops row " + i, w, 34, 10);
      badge(rr, rows[i][0], rows[i][3], 82);
      txt(rr, rows[i][1], { size: 12, lh: 18, font: FONT.semibold, color: C.gray800, width: 120, fixed: true });
      txt(rr, rows[i][2], { size: 12, lh: 18, color: C.gray600, width: w - 226, fixed: true });
    }
  }

  function renderChannelPreview(parent, w, compact) {
    var wrap = stack(parent, "Channel entry preview", w, compact ? 138 : 168, 10);
    var channels = [
      ["WhatsApp solicitante", "Flujo protagonista", "brand"],
      ["Web publica", "CTA a WhatsApp", "info"],
      ["QR counter", "Link pasajero", "success"],
      ["Counter walk-in", "Apoyo presencial", "warning"]
    ];
    for (var i = 0; i < channels.length; i += 1) {
      var rr = row(wrap, "Channel/" + channels[i][0], w, 30, 8);
      badge(rr, channels[i][0], channels[i][2], compact ? 118 : 140);
      txt(rr, channels[i][1], { size: 12, lh: 18, color: C.gray700, width: w - (compact ? 134 : 156), fixed: true });
    }
  }

  function screenTitle(parent, screen, w) {
    if (screen.status) badge(parent, screen.status, screen.statusVariant || "brand", screen.statusW || 130);
    txt(parent, screen.title, { size: screen.kind === "desktop" ? 26 : 25, lh: screen.kind === "desktop" ? 34 : 32, font: FONT.extrabold, color: C.gray950, width: w, fixed: true });
    if (screen.subtitle) txt(parent, screen.subtitle, { size: 14, lh: 21, color: C.gray600, width: w, fixed: true });
  }

  function mobileNavTarget(screen, item) {
    if (screen.driver) {
      return {
        Inicio: "driver.2B",
        Historial: "driver.2H",
        Yo: "driver.2I"
      }[item];
    }
    return {
      Inicio: "pwa.passenger.1A",
      Reservas: "pwa.passenger.1H",
      Ayuda: "pwa.passenger.1I",
      Yo: "pwa.passenger.1J"
    }[item];
  }

  function desktopTopTarget(screen, item) {
    if (screen.id.indexOf("company.") === 0) {
      return {
        Hoy: "company.5B",
        Reservas: "company.11B",
        Mapa: "company.11A",
        Conductores: "company.11C",
        Reportes: "company.11A"
      }[item];
    }
    if (screen.id.indexOf("counter.") === 0) {
      return {
        Hoy: "counter.4B",
        Reservas: "counter.4C",
        Mapa: "dispatch.3D",
        Conductores: "counter.10B",
        Reportes: "wellbeing.13F"
      }[item];
    }
    return {
      Hoy: "dispatch.3B",
      Reservas: "dispatch.3C",
      Mapa: "dispatch.3D",
      Conductores: "dispatch.3E",
      Reportes: "dispatch.3G"
    }[item];
  }

  function desktopSideTarget(screen, item) {
    return {
      Operación: "dispatch.3B",
      Ingesta: "dispatch.3F",
      Vuelos: "counter.4B",
      Incidencias: "wellbeing.13F",
      Facturación: "company.11D",
      Ajustes: "dispatch.3H"
    }[item];
  }

  function renderSection(parent, section, w, compact) {
    var h = section.h || (compact ? 104 : 132);
    var bg = section.variant === "success" ? C.success50 : section.variant === "care" ? C.care50 : section.variant === "warning" ? C.warning50 : section.variant === "danger" ? C.danger50 : section.variant === "brand" ? C.productAccent50 : section.variant === "info" ? C.info50 : C.white;
    var stroke = section.variant === "success" ? C.success200 : section.variant === "care" ? C.care300 : section.variant === "warning" ? C.warning200 : section.variant === "danger" ? C.danger200 : section.variant === "brand" ? C.productAccent200 : section.variant === "info" ? C.info200 : C.gray200;
    var c = card(parent, section.title || "Sección", w, h, { fill: bg, stroke: stroke, p: compact ? 12 : 16, gap: 8 });
    if (section.kicker) txt(c, section.kicker, { size: 11, lh: 16, font: FONT.semibold, color: C.gray500 });
    if (section.title) txt(c, section.title, { size: compact ? 15 : 17, lh: compact ? 20 : 24, font: FONT.bold, color: section.variant === "success" ? C.success700 : section.variant === "care" ? C.care700 : section.variant === "danger" ? C.danger700 : section.variant === "warning" ? C.warning700 : section.variant === "brand" ? C.productInk : C.gray950, width: w - 32, fixed: true });
    if (section.text) txt(c, section.text, { size: 13, lh: 19, color: C.gray700, width: w - 32, fixed: true });
    if (section.visual === "driver") renderDriverPreview(c, w - 32, compact);
    if (section.visual === "vehicle") renderVehiclePreview(c, w - 32, compact);
    if (section.visual === "driverVehicle") renderDriverVehiclePreview(c, w - 32, compact);
    if (section.visual === "ratingTriple") renderRatingTriplePreview(c, w - 32, compact);
    if (section.visual === "approval") renderAssignmentApprovalPanel(c, w - 32, compact);
    if (section.visual === "copilotDual") renderCopilotDualPanel(c, w - 32, compact);
    if (section.visual === "history") renderDriverHistorySummary(c, w - 32, compact);
    if (section.visual === "queue") renderDriverQueuePreview(c, w - 32, compact);
    if (section.visual === "voucher") renderVoucherPreview(c, w - 32, compact);
    if (section.visual === "trip") renderTripPreview(c, w - 32, compact);
    if (section.visual === "incident") renderIncidentPreview(c, w - 32, compact);
    if (section.visual === "copilot") renderCopilotPreview(c, w - 32, compact);
    if (section.visual === "ops") renderOpsPreview(c, w - 32, compact);
    if (section.visual === "channels") renderChannelPreview(c, w - 32, compact);
    if (section.fields) {
      for (var i = 0; i < section.fields.length; i += 1) {
        field(c, section.fields[i][0], section.fields[i][1], w - 32);
      }
    }
    if (section.items) {
      for (var j = 0; j < section.items.length; j += 1) {
        var rr = row(c, "Item/" + j, w - 32, 22, 8);
        ellipse(rr, "dot", 8, { fill: section.variant === "care" ? C.care500 : section.variant === "warning" ? C.warning500 : section.variant === "danger" ? C.danger500 : C.brand700 });
        txt(rr, section.items[j], { size: 12, lh: 18, color: C.gray700, width: w - 54, fixed: true });
      }
    }
    if (section.chips) {
      var chipRow = row(c, "Chips", w - 32, 34, 8);
      for (var k = 0; k < section.chips.length; k += 1) badge(chipRow, section.chips[k], section.variant || "gray", Math.min(150, 64 + section.chips[k].length * 7));
    }
    if (section.map) miniMap(c, section.title || "map", w - 32, section.mapH || 170, section.dark);
    if (section.chat) renderChat(c, section.chat, w - 32, section.h ? section.h - 70 : 170);
    if (section.timeline) {
      for (var t = 0; t < section.timeline.length; t += 1) {
        var tr = row(c, "Timeline/" + t, w - 32, 26, 8);
        ellipse(tr, "step", 10, { fill: t < section.done ? C.brand500 : C.gray300 });
        txt(tr, section.timeline[t], { size: 12, lh: 18, color: C.gray700, width: w - 54, fixed: true });
      }
    }
    return c;
  }

  function renderChat(parent, messages, w, h) {
    var box = frame("Chat", w, h, {
      fill: C.whatsappBg,
      radius: 12,
      stroke: C.gray200,
      layout: { mode: "VERTICAL", p: 12, gap: 10 }
    });
    parent.appendChild(box);
    for (var i = 0; i < messages.length; i += 1) {
      var m = messages[i];
      var bubble = frame("Bubble/" + i, w * 0.78, Math.max(56, Math.ceil(m.text.length / 42) * 22 + 22), {
        fill: m.side === "out" ? C.whatsappOut : C.white,
        radius: 12,
        layout: { mode: "VERTICAL", p: 10, gap: 4 }
      });
      if (m.side === "out") bubble.x = w * 0.18;
      box.appendChild(bubble);
      txt(bubble, m.text, { size: 12, lh: 18, color: C.gray800, width: w * 0.78 - 20, fixed: true });
    }
  }

  function mobileShell(screen, x, y) {
    var W = 375;
    var H = 812;
    var navH = screen.nav !== false ? 72 : 0;
    var headerH = 64;
    var progressH = screen.progress !== undefined ? 4 : 0;
    var btnCount = (screen.actions && screen.actions.length) ? screen.actions.length : 0;
    // Each button: 46px tall. Gap between buttons: 6px. Padding top+bottom: 8px each.
    var actionAreaH = btnCount > 0 ? (btnCount * 46 + (btnCount - 1) * 6 + 16) : 0;
    var bodyY = headerH + progressH + 8;
    var actY = H - navH - actionAreaH;
    var bodyH = actY - bodyY;

    var root = frame(screen.name, W, H, {
      x: x,
      y: y,
      fill: screen.fill || (screen.id.indexOf("wellbeing.") === 0 ? C.care50 : screen.driver ? C.canvasMint : C.canvasPassenger),
      radius: 28,
      stroke: C.gray200,
      shadow: "md",
      clip: true
    });
    registerScreen(screen.id, root, screen.aliases);

    // ── Header ──────────────────────────────────────────────────────────────
    var header = frame("Header", W, headerH, {
      fill: screen.headerFill || C.white,
      stroke: screen.headerStroke || C.gray200,
      layout: { mode: "HORIZONTAL", px: 16, gap: 10, cross: "CENTER" }
    });
    root.appendChild(header);
    if (screen.back) {
      var backBtn = frame("Button/Back", 40, 40, {
        fill: C.white,
        radius: 10,
        stroke: C.gray200,
        clip: false,
        layout: { mode: "HORIZONTAL", align: "CENTER", cross: "CENTER" }
      });
      header.appendChild(backBtn);
      txt(backBtn, "<", { size: 22, lh: 24, font: FONT.bold, color: C.gray700, align: "CENTER" });
      registerAction(backBtn, { action: BACK_ACTION });
    } else {
      logo(header, 34, false);
    }
    var ht = stack(header, "Header copy", 220, 42, 0);
    ht.layoutGrow = 1;
    txt(ht, screen.header || "Taxi Green", { size: 14, lh: 18, font: FONT.bold, color: C.gray950 });
    txt(ht, screen.subheader || "Copiloto operativo", { size: 11, lh: 16, color: C.gray500 });
    if (screen.headerBadge) badge(header, screen.headerBadge, screen.headerBadgeVariant || "brand", screen.headerBadgeW || 96);

    // ── Progress bar (wizard steps only) ────────────────────────────────────
    if (progressH > 0) {
      rect(root, "Progress bg", W, progressH, { x: 0, y: headerH, fill: C.gray200 });
      rect(root, "Progress fill", Math.round(W * screen.progress), progressH, { x: 0, y: headerH, fill: C.productAccent });
    }

    // ── Body — auto-layout vertical, clip:false so sections may overflow ────
    // Overflow is intentional: actions frame (white bg) covers it from below.
    var body = frame("Body", W - 32, bodyH, {
      x: 16,
      y: bodyY,
      fill: "TRANSPARENT",
      clip: false,
      layout: { mode: "VERTICAL", gap: 16, pt: 16 }
    });
    root.appendChild(body);
    screenTitle(body, screen, W - 32);
    for (var i = 0; i < (screen.sections || []).length; i += 1) {
      renderSection(body, screen.sections[i], W - 32, true);
    }

    // ── Actions — appended to root (NOT body) so z-order renders above overflow
    // White background occludes any body content that spills below bodyH.
    if (btnCount > 0) {
      var actions = frame("Actions", W, actionAreaH, {
        x: 0,
        y: actY,
        fill: C.white,
        stroke: C.gray150,
        clip: false,
        layout: { mode: "VERTICAL", p: 8, gap: 6 }
      });
      root.appendChild(actions);
      for (var a = 0; a < screen.actions.length; a += 1) {
        button(actions, screen.actions[a].label, screen.actions[a].variant || (a === 0 ? "primary" : "ghost"), W - 16, 46, screen.actions[a].target);
      }
    }

    // ── Bottom nav — topmost layer; always visible above actions ────────────
    if (screen.nav !== false) {
      var nav = frame("Bottom nav", W, 72, {
        x: 0,
        y: H - 72,
        fill: C.white,
        stroke: C.gray200,
        layout: { mode: "HORIZONTAL", px: 12, gap: 8, cross: "CENTER" }
      });
      root.appendChild(nav);
      var items = screen.driver ? ["Inicio", "Historial", "Yo"] : ["Inicio", "Reservas", "Ayuda", "Yo"];
      for (var n = 0; n < items.length; n += 1) {
        var ni = stack(nav, "Nav/" + items[n], screen.driver ? 108 : 80, 48, 2);
        ni.counterAxisAlignItems = "CENTER";
        var active = items[n] === (screen.activeNav || "Inicio");
        txt(ni, active ? "●" : "○", { size: 12, lh: 14, font: FONT.bold, color: active ? C.brand700 : C.gray400 });
        txt(ni, items[n], { size: 11, lh: 14, font: FONT.medium, color: active ? C.brand700 : C.gray500 });
        registerAction(ni, mobileNavTarget(screen, items[n]));
      }
    }
    return root;
  }

  function desktopShell(screen, x, y, w, h) {
    w = w || 1440;
    h = h || 900;
    var root = frame(screen.name, w, h, {
      x: x,
      y: y,
      fill: screen.canvas || (screen.id.indexOf("whatsapp.") === 0 ? C.canvasChannel : screen.id.indexOf("wellbeing.") === 0 ? C.care50 : screen.id.indexOf("counter.") === 0 ? C.canvasWarm : C.canvasOps),
      stroke: C.gray200,
      clip: true
    });
    registerScreen(screen.id, root, screen.aliases);
    var top = frame("Top nav", w, 72, {
      fill: C.premiumSurface,
      stroke: C.gray200,
      layout: { mode: "HORIZONTAL", px: 28, gap: 18, cross: "CENTER" }
    });
    root.appendChild(top);
    logo(top, 40, true);
    var tabs = ["Hoy", "Reservas", "Mapa", "Conductores", "Reportes"];
    for (var i = 0; i < tabs.length; i += 1) {
      var tab = badge(top, tabs[i], tabs[i] === (screen.activeTab || "Hoy") ? "brand" : "gray", tabs[i].length > 9 ? 126 : 92);
      registerAction(tab, desktopTopTarget(screen, tabs[i]));
    }
    var search = frame("Search", 300, 40, { fill: C.gray50, radius: 10, stroke: C.gray200, layout: { mode: "HORIZONTAL", px: 12, cross: "CENTER" } });
    search.layoutGrow = 1;
    top.appendChild(search);
    txt(search, "Buscar reserva, conductor, pasajero, vuelo", { size: 13, lh: 18, color: C.gray500 });
    badge(top, "Carla · Admin", "gray", 118);
    var side = frame("Side nav", 232, h - 72, {
      x: 0,
      y: 72,
      fill: C.premiumSurface,
      stroke: C.gray200,
      layout: { mode: "VERTICAL", p: 16, gap: 8 }
    });
    root.appendChild(side);
    var sideItems = screen.sideItems || ["Operación", "Ingesta", "Vuelos", "Incidencias", "Facturación", "Ajustes"];
    for (var s = 0; s < sideItems.length; s += 1) {
      var active = sideItems[s] === (screen.sideActive || "Operación");
      var sr = frame("Side/" + sideItems[s], 200, 42, {
        fill: active ? C.productAccent50 : C.white,
        radius: 8,
        stroke: active ? C.productAccent200 : C.white,
        layout: { mode: "HORIZONTAL", px: 10, gap: 9, cross: "CENTER" }
      });
      side.appendChild(sr);
      rect(sr, "side dot", 4, 24, { fill: active ? C.productAccent : C.gray200, radius: 999 });
      txt(sr, sideItems[s], { size: 13, lh: 18, font: active ? FONT.semibold : FONT.medium, color: active ? C.productInk : C.gray700 });
      registerAction(sr, desktopSideTarget(screen, sideItems[s]));
    }
    var body = frame("Workspace", w - 280, h - 116, {
      x: 260,
      y: 96,
      fill: "TRANSPARENT",
      clip: false,
      layout: { mode: "VERTICAL", gap: 20, pt: 20 }
    });
    root.appendChild(body);
    screenTitle(body, screen, w - 300);
    renderDesktopContent(body, screen, w - 300, h - 210);
    return root;
  }

  function renderDesktopContent(body, screen, w, h) {
    if (screen.kpis) {
      var krow = row(body, "KPI row", w, 126, 14);
      for (var i = 0; i < screen.kpis.length; i += 1) {
        var k = card(krow, "KPI/" + screen.kpis[i][0], Math.floor((w - 42) / 4), 126, { p: 16, shadow: "xs" });
        txt(k, screen.kpis[i][0], { size: 12, lh: 16, font: FONT.semibold, color: C.gray500 });
        txt(k, screen.kpis[i][1], { size: 34, lh: 40, font: FONT.extrabold, color: screen.kpis[i][3] || C.brand700 });
        txt(k, screen.kpis[i][2], { size: 12, lh: 18, color: C.gray600 });
      }
    }
    if (screen.mapFull) {
      miniMap(body, screen.title, w, Math.min(620, h), true);
    } else if (screen.sections) {
      var grid = row(body, "Desktop grid", w, h, 16);
      grid.counterAxisAlignItems = "MIN";
      var colW = screen.oneColumn ? w : Math.floor((w - 16) / 2);
      var left = stack(grid, "Left column", colW, h, 14);
      var right = screen.oneColumn ? null : stack(grid, "Right column", colW, h, 14);
      for (var j = 0; j < screen.sections.length; j += 1) {
        renderSection(j % 2 === 0 || screen.oneColumn ? left : right, screen.sections[j], colW, false);
      }
    }
    if (screen.actions && screen.actions.length) {
      var ar = row(body, "Desktop actions", w, 50, 10);
      for (var a = 0; a < screen.actions.length; a += 1) button(ar, screen.actions[a].label, screen.actions[a].variant || "primary", 190, 44, screen.actions[a].target);
    }
  }

  function cleanFile() {
    if (!RESET_FILE) return;
    var pages = figma.root.children.slice();
    var first = pages[0] || figma.createPage();
    for (var i = 1; i < pages.length; i += 1) pages[i].remove();
    var children = first.children.slice();
    for (var c = 0; c < children.length; c += 1) children[c].remove();
    first.name = "00 Cover";
  }

  async function page(name, reuseFirst) {
    var p;
    if (reuseFirst) p = figma.root.children[0];
    else {
      p = figma.createPage();
      p.name = name;
    }
    p.name = name;
    pageIndex[name] = p;
    await figma.setCurrentPageAsync(p);
    return p;
  }

  function createPaintAndTextStyles() {
    var colors = ["productInk", "productAccent", "productAccent50", "brand900", "brand800", "brand700", "brand500", "brand100", "brand50", "gray950", "gray700", "gray500", "gray200", "gray50", "success500", "warning500", "danger500", "info500", "care500", "taxiYellow"];
    for (var i = 0; i < colors.length; i += 1) {
      try {
        var ps = figma.createPaintStyle();
        ps.name = "Taxi Green/" + colors[i];
        ps.paints = paint(C[colors[i]]);
      } catch (e) {}
    }
    var type = [
      ["display/xl", 56, 64, FONT.extrabold],
      ["display/lg", 44, 52, FONT.extrabold],
      ["display/md", 36, 44, FONT.bold],
      ["heading/xl", 24, 32, FONT.bold],
      ["heading/lg", 20, 28, FONT.semibold],
      ["heading/md", 18, 26, FONT.semibold],
      ["body/md", 15, 22, FONT.regular],
      ["body/sm", 13, 20, FONT.regular],
      ["button/md", 14, 20, FONT.semibold]
    ];
    for (var t = 0; t < type.length; t += 1) {
      try {
        var ts = figma.createTextStyle();
        ts.name = "Taxi Green/" + type[t][0];
        ts.fontName = type[t][3];
        ts.fontSize = type[t][1];
        ts.lineHeight = { unit: "PIXELS", value: type[t][2] };
      } catch (e2) {}
    }
  }

  function createDesignVariables() {
    try {
      if (!figma.variables || !figma.variables.createVariableCollection) return;
      var collection = figma.variables.createVariableCollection("Taxi Green / Light");
      var modeId = collection.modes && collection.modes[0] ? collection.modes[0].modeId : null;
      if (!modeId) return;
    var vars = [
        ["color/product/ink", "productInk"],
        ["color/product/accent", "productAccent"],
        ["color/product/accent-50", "productAccent50"],
        ["color/brand/900", "brand900"],
        ["color/brand/700", "brand700"],
        ["color/brand/500", "brand500"],
        ["color/brand/50", "brand50"],
        ["color/accent/yellow", "siteYellow"],
        ["color/surface/premium", "premiumSurface"],
        ["color/care/500", "care500"],
        ["color/warning/500", "warning500"],
        ["color/danger/500", "danger500"],
        ["color/gray/950", "gray950"],
        ["color/gray/50", "gray50"]
      ];
      for (var i = 0; i < vars.length; i += 1) {
        var variable = figma.variables.createVariable(vars[i][0], collection, "COLOR");
        var c = rgb(C[vars[i][1]]);
        variable.setValueForMode(modeId, { r: c.r, g: c.g, b: c.b, a: 1 });
      }
    } catch (e) {}
  }

  function createCover() {
    var root = frame("Cover", 1440, 900, { fill: C.gray950, clip: false });
    registerScreen("cover.00", root);
    rect(root, "premium top band", 1440, 118, { x: 0, y: 0, fill: C.nightPanel, opacity: 0.72 });
    rect(root, "airport ops rail", 1440, 8, { x: 0, y: 118, fill: C.siteYellow });
    var map = miniMap(root, "Cover airport operation", 520, 500, true);
    map.x = 850;
    map.y = 190;
    map.opacity = 0.92;
    var lg = logo(root, 76, true);
    lg.x = 56;
    lg.y = 42;
    badge(root, "Demo comercial v4", "warning", 150).x = 1148;
    root.children[root.children.length - 1].y = 52;
    badge(root, "Humano en control", "brand", 160).x = 1148;
    root.children[root.children.length - 1].y = 88;
    txt(root, "Taxi Green Airport Ops Premium", {
      x: 56,
      y: 178,
      size: 58,
      lh: 66,
      font: FONT.extrabold,
      color: C.white,
      width: 760,
      fixed: true
    });
    txt(root, "No es una app tipo Uber. Es una operacion aeroportuaria trazable con humano en control.", {
      x: 58,
      y: 324,
      size: 20,
      lh: 30,
      color: C.gray200,
      width: 760,
      fixed: true
    });
    txt(root, "Ruta demo: solicitante hotel/concierge por WhatsApp -> copiloto extrae datos -> operador aprueba -> conductor recoge en aeropuerto -> pasajero ve tracking sin app -> comprobante -> objeto olvidado resuelto.", {
      x: 58,
      y: 392,
      size: 15,
      lh: 23,
      color: C.gray300,
      width: 760,
      fixed: true
    });
    var promise = row(root, "Commercial promises", 760, 42, 10);
    promise.x = 58;
    promise.y = 474;
    badge(promise, "Canal primero", "brand", 126);
    badge(promise, "Pasajero sin app", "info", 138);
    badge(promise, "Trazabilidad", "success", 120);
    badge(promise, "Soporte real", "care", 118);
    var flow = row(root, "Hero route", 1300, 218, 14);
    flow.x = 58;
    flow.y = 548;
    var cards = [
      ["01", "WhatsApp solicitante", "Hotel o concierge escribe como ya trabaja. La demo declara que WABA es simulado.", C.brand700],
      ["02", "Copiloto", "Extrae vuelo, pasajeros y destino con fallback determinista visible.", C.info500],
      ["03", "Operador", "Carla aprueba. La IA no despacha sola.", C.siteYellow],
      ["04", "Conductor", "Acepta con dos taps y sin friccion.", C.brand500],
      ["05", "Pasajero", "Tracking por link, voucher QR y comprobante.", C.success500],
      ["06", "Soporte", "Objeto perdido con SLA, humano y constancia.", C.care500]
    ];
    for (var i = 0; i < cards.length; i += 1) {
      var c = card(flow, "Cover step " + cards[i][0], 204, 208, { fill: i === 2 ? C.warning50 : C.white, stroke: i === 2 ? C.warning200 : C.gray200, p: 16, shadow: "lg" });
      var top = row(c, "Step top", 172, 30, 8);
      badge(top, cards[i][0], i === 5 ? "care" : i === 2 ? "warning" : "brand", 46);
      ellipse(top, "accent", 14, { fill: cards[i][3] });
      txt(c, cards[i][1], { size: 18, lh: 24, font: FONT.extrabold, color: C.gray950, width: 172, fixed: true });
      txt(c, cards[i][2], { size: 12, lh: 18, color: C.gray700, width: 172, fixed: true });
    }
    var scope = card(root, "Built simulated postponed", 1300, 86, { fill: C.productInk, stroke: C.productAccent, p: 18, shadow: "md", layout: { mode: "HORIZONTAL", p: 18, gap: 14, cross: "CENTER" } });
    scope.x = 58;
    scope.y = 792;
    txt(scope, "Alcance honesto", { size: 18, lh: 24, font: FONT.bold, color: C.siteYellow, width: 150, fixed: true });
    txt(scope, "Construido: ruta A-Z, app conductor, tracking, counter walk-in y objeto olvidado. Simulado: WABA, pagos y SUNAT. Enunciado/aplazado: empresa cliente, biometria, app pasajero nativa y 9 tipologias.", { size: 15, lh: 22, color: C.white, width: 890, fixed: true });
    button(scope, "Abrir mapa demo", "primary", 180, 46, "prototype.home");
  }

  function createTokens() {
    var root = frame("Design Tokens", 1440, 1700, { fill: C.gray50, clip: false, layout: { mode: "VERTICAL", p: 48, gap: 28 } });
    txt(root, "Design Tokens", { size: 44, lh: 52, font: FONT.extrabold, color: C.gray950 });
    txt(root, "Colección visual equivalente a Taxi Green Primitives y Taxi Green Semantic.", { size: 16, lh: 24, color: C.gray600, width: 820, fixed: true });
    var colorSets = [
      ["Producto / chrome", ["productInk", "productInkSoft", "productAccent", "productAccent600", "productAccent200", "productAccent100", "productAccent50", "white"]],
      ["Tenant Taxi Green", ["brand900", "brand800", "brand700", "brand600", "brand500", "brand400", "brand300", "brand200", "brand100", "brand50", "sitePrimary", "siteSecondary", "siteDeep", "taxiYellow", "siteYellow"]],
      ["Neutros", ["gray950", "gray900", "gray800", "gray700", "gray600", "gray500", "gray400", "gray300", "gray200", "gray150", "gray100", "gray50", "white"]],
      ["Semánticos", ["success700", "success500", "success50", "warning700", "warning500", "warning50", "danger700", "danger500", "danger50", "info700", "info500", "info50"]],
      ["Soporte y viaje", ["care700", "care500", "care300", "care100", "care50", "tripPending", "tripAssigned", "tripOnboard", "tripCompleted", "tripCanceled", "tripIncident"]]
    ];
    for (var s = 0; s < colorSets.length; s += 1) {
      var block = card(root, colorSets[s][0], 1344, 230, { p: 20, gap: 14 });
      txt(block, colorSets[s][0], { size: 24, lh: 30, font: FONT.bold, color: C.gray950 });
      var sw = row(block, "Swatches", 1300, 150, 12);
      for (var i = 0; i < colorSets[s][1].length; i += 1) {
        var key = colorSets[s][1][i];
        var item = stack(sw, "Swatch/" + key, 76, 130, 7);
        rect(item, key, 76, 68, { fill: C[key], radius: 8, stroke: key === "white" ? C.gray200 : null });
        txt(item, key, { size: 10, lh: 14, font: FONT.semibold, color: C.gray700, width: 76, fixed: true });
        txt(item, C[key], { size: 9, lh: 12, color: C.gray500, width: 76, fixed: true });
      }
    }
    var typeCard = card(root, "Type scale", 1344, 270, { p: 20, gap: 12 });
    txt(typeCard, "Tipografía Inter", { size: 24, lh: 30, font: FONT.bold, color: C.gray950 });
    var samples = [["display/xl", 56, 64, FONT.extrabold], ["display/lg", 44, 52, FONT.extrabold], ["display/md", 36, 44, FONT.bold], ["heading/xl", 24, 32, FONT.bold], ["body/md", 15, 22, FONT.regular], ["button/md", 14, 20, FONT.semibold]];
    for (var t = 0; t < samples.length; t += 1) {
      var tr = row(typeCard, "Type/" + samples[t][0], 1280, 34, 20);
      txt(tr, samples[t][0], { size: 12, lh: 18, font: FONT.semibold, color: C.gray500, width: 150, fixed: true });
      txt(tr, "Taxi Green ordena la operación invisible", { size: samples[t][1] > 28 ? 24 : samples[t][1], lh: samples[t][1] > 28 ? 30 : samples[t][2], font: samples[t][3], color: C.gray950 });
    }
    var rules = card(root, "Spacing radius motion", 1344, 210, { p: 20, gap: 10, fill: C.brand50, stroke: C.brand200 });
    txt(rules, "Reglas de sistema", { size: 24, lh: 30, font: FONT.bold, color: C.brand900 });
    txt(rules, "Grid de 4/8 px. Radios de 4 a 32 px. Tarjetas principales 12-16 px. Motion calm 180-240 ms, expressive 320-420 ms. Cero spinner mudo.", { size: 17, lh: 26, color: C.gray700, width: 1220, fixed: true });
  }

  function createComponents() {
    var root = frame("Components", 1440, 1860, { fill: C.gray50, clip: false, layout: { mode: "VERTICAL", p: 48, gap: 28 } });
    txt(root, "Componentes Base", { size: 44, lh: 52, font: FONT.extrabold, color: C.gray950 });
    var buttons = card(root, "Buttons", 1344, 240, { p: 20, gap: 14 });
    txt(buttons, "Botones: variantes, tamaños y estados", { size: 24, lh: 30, font: FONT.bold, color: C.gray950 });
    var br = row(buttons, "Button row", 1260, 54, 12);
    button(br, "Confirmar", "primary", 150, 46);
    button(br, "Editar", "secondary", 130, 46);
    button(br, "Reportar", "care", 140, 46);
    button(br, "Advertir", "warning", 140, 46);
    button(br, "Eliminar", "destructive", 140, 46);
    button(br, "Cancelar", "ghost", 140, 46);
    var states = row(buttons, "States row", 1260, 54, 12);
    button(states, "Default", "primary", 130, 42);
    button(states, "Hover", "secondary", 130, 42);
    button(states, "Pressed", "dark", 130, 42);
    button(states, "Loading...", "warning", 150, 42);
    button(states, "Disabled", "ghost", 140, 42);
    var inputs = card(root, "Inputs", 1344, 260, { p: 20, gap: 16 });
    txt(inputs, "Inputs, selects, switches, radios y chips", { size: 24, lh: 30, font: FONT.bold, color: C.gray950 });
    var ir = row(inputs, "Fields", 1260, 80, 16);
    field(ir, "Número de vuelo", "LA2456", 250);
    field(ir, "Destino", "Av. Pardo 123, Miraflores", 330);
    field(ir, "Correo", "gianella@empresa.pe", 300);
    var cr = row(inputs, "Controls", 1260, 46, 12);
    badge(cr, "Recojo aeropuerto", "brand", 162);
    badge(cr, "Traslado aeropuerto", "gray", 154);
    badge(cr, "Objeto perdido", "care", 132);
    badge(cr, "Seguridad", "danger", 110);
    badge(cr, "Pendiente", "warning", 110);
    var patterns = row(root, "Component cards", 1344, 360, 18);
    var names = ["Tarjeta de viaje vivo", "Tabla densa", "Bottom sheet", "Toast", "Empty state", "Skeleton"];
    for (var i = 0; i < names.length; i += 1) {
      var cc = card(patterns, names[i], 207, 330, { p: 16, shadow: "xs" });
      txt(cc, names[i], { size: 18, lh: 24, font: FONT.bold, color: C.gray950, width: 170, fixed: true });
      if (i === 0) {
        miniMap(cc, "mini", 175, 105, false);
        txt(cc, "Juan Pérez · ABC-123\nETA 8 min", { size: 13, lh: 20, color: C.gray700, width: 170, fixed: true });
      } else if (i === 1) {
        for (var r = 0; r < 4; r += 1) rect(cc, "row " + r, 175, 28, { fill: r % 2 ? C.white : C.gray100, radius: 4 });
      } else if (i === 2) {
        rect(cc, "sheet", 175, 170, { fill: C.white, radius: 20, stroke: C.gray200 });
        rect(cc, "handle", 54, 4, { x: 60, y: 14, fill: C.gray300, radius: 999 });
      } else if (i === 3) {
        rect(cc, "toast", 175, 54, { fill: C.success50, stroke: C.success200, radius: 10 });
      } else if (i === 4) {
        ellipse(cc, "empty", 72, { fill: C.brand100 });
        txt(cc, "Todo en orden por ahora.", { size: 13, lh: 18, color: C.gray600, width: 160, fixed: true });
      } else {
        for (var sk = 0; sk < 5; sk += 1) rect(cc, "skeleton " + sk, 170 - sk * 18, 14, { fill: C.gray200, radius: 999 });
      }
    }
    var modal = card(root, "Modal and table spec", 1344, 260, { p: 20, gap: 12, fill: C.info50, stroke: C.info200 });
    txt(modal, "Reglas de componentes", { size: 24, lh: 30, font: FONT.bold, color: C.info700 });
    txt(modal, "Todos usan auto-layout, 44px mínimo táctil, foco visible, etiquetas explícitas, una acción primaria por pantalla y cero modal anidado.", { size: 18, lh: 28, color: C.gray700, width: 1240, fixed: true });
    var real = card(root, "Figma components", 1344, 520, { p: 20, gap: 16, fill: C.premiumSurface, stroke: C.productAccent200 });
    txt(real, "Componentes reales Figma", { size: 24, lh: 30, font: FONT.bold, color: C.brand900 });
    txt(real, "Instancias base para el prototipo premium: boton, status chip, DriverCard, VehicleCard, AssignmentApprovalPanel, WhatsAppCopilotDualPanel, RatingTripleCard, DriverHistorySummary, voucher QR e incidencia.", { size: 14, lh: 22, color: C.gray600, width: 1180, fixed: true });
    var compRow = row(real, "Real components row", 1280, 380, 16);
    compRow.layoutWrap = "WRAP";
    var cb = component(compRow, "Button/Primary/Premium", 178, 52, { fill: C.productAccent, radius: 12, shadow: "sm", layout: { mode: "HORIZONTAL", align: "CENTER", cross: "CENTER" } });
    txt(cb, "Aprobar", { size: 14, lh: 20, font: FONT.semibold, color: C.white, align: "CENTER" });
    var chip = component(compRow, "StatusChip/Assigned", 156, 52, { fill: C.brand50, radius: 999, stroke: C.brand200, layout: { mode: "HORIZONTAL", p: 10, gap: 8, cross: "CENTER" } });
    ellipse(chip, "dot", 10, { fill: C.brand500 });
    txt(chip, "Conductor asignado", { size: 12, lh: 18, font: FONT.semibold, color: C.brand800 });
    var drv = component(compRow, "DriverCard/Premium", 300, 150, { fill: C.white, radius: 14, stroke: C.gray200, shadow: "sm", layout: { mode: "VERTICAL", p: 16, gap: 10 } });
    renderDriverPreview(drv, 268, true);
    var veh = component(compRow, "VehicleCard/Premium", 300, 170, { fill: C.white, radius: 14, stroke: C.gray200, shadow: "sm", layout: { mode: "VERTICAL", p: 14, gap: 8 } });
    renderVehiclePreview(veh, 272, true);
    var appr = component(compRow, "AssignmentApprovalPanel/HumanControl", 410, 190, { fill: C.productAccent50, radius: 14, stroke: C.productAccent200, shadow: "sm", layout: { mode: "VERTICAL", p: 14, gap: 8 } });
    renderAssignmentApprovalPanel(appr, 382, true);
    var cop = component(compRow, "WhatsAppCopilotDualPanel", 520, 210, { fill: C.white, radius: 14, stroke: C.gray200, shadow: "sm", layout: { mode: "VERTICAL", p: 14, gap: 8 } });
    renderCopilotDualPanel(cop, 492, true);
    var rating = component(compRow, "RatingTripleCard", 300, 150, { fill: C.white, radius: 14, stroke: C.gray200, shadow: "sm", layout: { mode: "VERTICAL", p: 14, gap: 8 } });
    renderRatingTriplePreview(rating, 272, true);
    var hist = component(compRow, "DriverHistorySummary", 300, 170, { fill: C.white, radius: 14, stroke: C.gray200, shadow: "sm", layout: { mode: "VERTICAL", p: 14, gap: 8 } });
    renderDriverHistorySummary(hist, 272, true);
    var vou = component(compRow, "VoucherQR/Card", 300, 150, { fill: C.white, radius: 14, stroke: C.gray200, shadow: "sm", layout: { mode: "VERTICAL", p: 14, gap: 8 } });
    renderVoucherPreview(vou, 272, true);
    var inc = component(compRow, "IncidentResolutionPanel/Care", 300, 150, { fill: C.care50, radius: 14, stroke: C.care300, shadow: "sm", layout: { mode: "VERTICAL", p: 14, gap: 8 } });
    renderIncidentPreview(inc, 272, true);
  }

  function createPatterns() {
    var root = frame("Patterns", 1440, 1250, { fill: C.gray50, clip: false, layout: { mode: "VERTICAL", p: 48, gap: 24 } });
    txt(root, "Patrones de UI y layouts", { size: 44, lh: 52, font: FONT.extrabold, color: C.gray950 });
    var grid = row(root, "Pattern grid", 1344, 860, 22);
    var p1 = card(grid, "Entrada + Link Pasajero", 315, 820, { p: 18 });
    txt(p1, "Entrada + Link Pasajero", { size: 22, lh: 30, font: FONT.bold, color: C.gray950 });
    var shell = frame("Mobile pattern", 260, 600, { fill: C.gray50, radius: 24, stroke: C.gray200, shadow: "sm" });
    p1.appendChild(shell);
    rect(shell, "header", 260, 54, { fill: C.white, stroke: C.gray200 });
    rect(shell, "content", 228, 440, { x: 16, y: 74, fill: C.brand50, radius: 12, stroke: C.brand200 });
    rect(shell, "bottom nav", 260, 64, { x: 0, y: 536, fill: C.white, stroke: C.gray200 });
    var p2 = card(grid, "App Conductor", 315, 820, { p: 18 });
    txt(p2, "App Conductor", { size: 22, lh: 30, font: FONT.bold, color: C.gray950 });
    var shell2 = frame("Driver pattern", 260, 600, { fill: C.white, radius: 24, stroke: C.gray200, shadow: "sm" });
    p2.appendChild(shell2);
    rect(shell2, "state header", 260, 64, { fill: C.brand100, stroke: C.brand700 });
    rect(shell2, "big button", 228, 72, { x: 16, y: 450, fill: C.brand700, radius: 14 });
    miniMap(shell2, "driver map", 228, 250, false).x = 16;
    shell2.children[shell2.children.length - 1].y = 92;
    var p3 = card(grid, "Web Despachador", 315, 820, { p: 18 });
    txt(p3, "Web Despachador", { size: 22, lh: 30, font: FONT.bold, color: C.gray950 });
    var desk = frame("Desktop pattern", 270, 190, { fill: C.white, radius: 10, stroke: C.gray200 });
    p3.appendChild(desk);
    rect(desk, "top", 270, 34, { fill: C.white, stroke: C.gray200 });
    rect(desk, "side", 54, 156, { x: 0, y: 34, fill: C.white, stroke: C.gray200 });
    rect(desk, "work", 196, 132, { x: 66, y: 46, fill: C.gray50, radius: 8 });
    txt(p3, "Top nav, side nav, buscador global, workspace denso y filas hover.", { size: 14, lh: 22, color: C.gray700, width: 260, fixed: true });
    var p4 = card(grid, "Counter / Empresa / Soporte", 315, 820, { p: 18 });
    txt(p4, "Patrones transversales", { size: 22, lh: 30, font: FONT.bold, color: C.gray950 });
    renderSection(p4, { title: "Counter", text: "Una pantalla sin scroll principal: vuelos próximos + asignación rápida.", variant: "brand" }, 279, true);
    renderSection(p4, { title: "Empresa", text: "Más sobrio: resumen, viajes, colaboradores y facturación.", variant: "info" }, 279, true);
    renderSection(p4, { title: "Soporte", text: "Barra persistente care/100 o danger/50 según severidad.", variant: "care" }, 279, true);
  }

  function createIcons() {
    var root = frame("Iconography & Assets", 1440, 980, { fill: C.gray50, clip: false, layout: { mode: "VERTICAL", p: 48, gap: 24 } });
    txt(root, "Iconography & Assets", { size: 44, lh: 52, font: FONT.extrabold, color: C.gray950 });
    var top = row(root, "Asset top", 1344, 320, 24);
    var logoCard = card(top, "Logo", 430, 300, { p: 24 });
    logo(logoCard, 160, true);
    txt(logoCard, "Recreación vectorial del logo.jpg: círculo verde, G blanca y flecha amarilla.", { size: 14, lh: 22, color: C.gray700, width: 360, fixed: true });
    var iconCard = card(top, "Lucide set", 430, 300, { p: 20 });
    txt(iconCard, "Íconos base", { size: 22, lh: 30, font: FONT.bold, color: C.gray950 });
    var icons = ["Car", "Plane", "MapPin", "Phone", "MessageCircle", "QrCode", "LifeBuoy", "ShieldCheck", "Building2", "BarChart3", "User", "FileText"];
    var ig = row(iconCard, "Icons", 380, 170, 12);
    ig.layoutWrap = "WRAP";
    for (var i = 0; i < icons.length; i += 1) {
      var ic = stack(ig, "Icon/" + icons[i], 82, 72, 6);
      ellipse(ic, "circle", 34, { fill: i % 4 === 0 ? C.brand100 : i % 4 === 1 ? C.info50 : i % 4 === 2 ? C.care50 : C.gray100, stroke: C.gray200 });
      txt(ic, icons[i], { size: 10, lh: 14, font: FONT.medium, color: C.gray700, width: 78, fixed: true, align: "CENTER" });
    }
    var pictCard = card(top, "Pictogramas", 430, 300, { p: 20 });
    txt(pictCard, "Pictogramas custom", { size: 22, lh: 30, font: FONT.bold, color: C.gray950 });
    txt(pictCard, "Auto verde, voucher QR, conductor esperando y objeto recuperado. Máximo 4 colores.", { size: 14, lh: 22, color: C.gray700, width: 370, fixed: true });
    var pRow = row(pictCard, "Pictos", 380, 130, 14);
    for (var p = 0; p < 4; p += 1) {
      var pic = frame("Pictogram/" + p, 84, 84, { fill: C.brand50, radius: 18, stroke: C.brand200 });
      pRow.appendChild(pic);
      if (p === 0) {
        rect(pic, "car", 62, 26, { x: 11, y: 36, fill: C.brand700, radius: 14 });
        ellipse(pic, "w1", 12, { x: 22, y: 56, fill: C.gray900 });
        ellipse(pic, "w2", 12, { x: 52, y: 56, fill: C.gray900 });
      } else if (p === 1) {
        rect(pic, "ticket", 50, 58, { x: 17, y: 13, fill: C.white, stroke: C.brand300, radius: 8 });
        rect(pic, "qr1", 12, 12, { x: 26, y: 24, fill: C.gray900, radius: 2 });
        rect(pic, "qr2", 12, 12, { x: 46, y: 24, fill: C.gray900, radius: 2 });
      } else if (p === 2) {
        ellipse(pic, "head", 24, { x: 30, y: 12, fill: C.brand700 });
        rect(pic, "body", 44, 36, { x: 20, y: 42, fill: C.brand300, radius: 18 });
      } else {
        ellipse(pic, "care", 58, { x: 13, y: 13, fill: C.care100, stroke: C.care300 });
        rect(pic, "object", 38, 26, { x: 23, y: 30, fill: C.taxiYellow, radius: 6 });
      }
    }
    var note = card(root, "Asset guidance", 1344, 180, { fill: C.brand50, stroke: C.brand200, p: 20 });
    txt(note, "Regla visual", { size: 22, lh: 30, font: FONT.bold, color: C.brand900 });
    txt(note, "Usar íconos en botones cuando exista un símbolo familiar. Reservar texto largo para acciones claras. No usar ilustraciones decorativas si el usuario necesita inspeccionar estado operativo real.", { size: 18, lh: 28, color: C.gray700, width: 1240, fixed: true });
  }

  var passengerScreens = [
    { id: "pwa.passenger.1A", name: "Canales/1.A Entrada multicanal", kind: "mobile", fill: C.canvasChannel, header: "Taxi Green", subheader: "Entrada multicanal", title: "Entrada multicanal", subtitle: "El protagonista es WhatsApp del solicitante hotel/concierge. La web publica y el QR acompanan, pero no obligan al pasajero a instalar nada.", sections: [{ title: "WhatsApp del solicitante", text: "Recepcion o concierge escribe como ya trabaja. El copiloto extrae datos, pide lo que falta y deja borrador.", variant: "brand", visual: "channels", h: 202 }, { title: "Link despues del pedido", text: "El pasajero final recibe /p/[token] con conductor, placa, ETA, mapa, voucher y soporte del viaje.", variant: "success", visual: "voucher", h: 180 }], actions: [{ label: "Comenzar por WhatsApp", target: "whatsapp.12A" }, { label: "Ya tengo reserva", variant: "secondary", target: "pwa.passenger.1G2" }] },
    { id: "pwa.passenger.1B", name: "Pasajero/1.B Tipo de viaje", kind: "mobile", back: true, header: "Reserva", subheader: "Paso 1 de 4", progress: 0.25, title: "¿Qué tipo de viaje necesitas?", sections: [{ title: "Tipo de viaje", chips: ["Recojo aeropuerto", "Traslado aeropuerto", "City", "Corporativo"], variant: "brand", h: 130 }, { title: "Recojo en aeropuerto", text: "Pensado para vuelos de llegada. Se pedirá vuelo, punto de encuentro, destino y pasajeros.", h: 104 }], actions: [{ label: "Continuar con recojo", target: "pwa.passenger.1C" }, { label: "Otro origen/destino", variant: "secondary", target: "pwa.passenger.1C_otro" }, { label: "Volver", variant: "ghost", target: "pwa.passenger.1A" }] },
    { id: "pwa.passenger.1C", name: "Pasajero/1.C Datos de vuelo", kind: "mobile", back: true, header: "Reserva", subheader: "Paso 2 de 4", progress: 0.50, title: "Datos del vuelo", sections: [{ title: "Vuelo", fields: [["Aerolínea", "LATAM"], ["Número de vuelo", "LA2456"]], h: 162 }, { title: "Viaje", fields: [["Llegada estimada", "25/05/2026 · 03:45 a.m."], ["Destino", "Av. Pardo 123, Miraflores"]], h: 162 }], actions: [{ label: "Continuar", target: "pwa.passenger.1D" }] },
    { id: "pwa.passenger.1C_otro", name: "Pasajero/1.C-otro Origen destino", kind: "mobile", back: true, header: "Reserva", subheader: "Paso 2 de 4", progress: 0.50, title: "Origen y destino", sections: [{ title: "Ruta libre", fields: [["Origen", "Hotel Costa Verde, Miraflores"], ["Destino", "Aeropuerto Jorge Chávez"]], h: 162 }, { title: "Mapa referencial", map: true, mapH: 168, h: 230 }], actions: [{ label: "Continuar", target: "pwa.passenger.1D" }] },
    { id: "pwa.passenger.1D", name: "Pasajero/1.D Datos pasajero", kind: "mobile", back: true, header: "Reserva", subheader: "Paso 3 de 4", progress: 0.75, title: "Datos del pasajero", sections: [{ title: "Contacto", fields: [["Nombre", "Gianella Caballero"], ["Teléfono", "+51 999 888 777"], ["Correo", "gianella.caballero@empresa.pe"]], h: 222 }, { title: "Preferencias", chips: ["Compartir seguimiento", "2 pasajeros", "2 maletas"], variant: "info", h: 112 }], actions: [{ label: "Continuar", target: "pwa.passenger.1E" }] },
    { id: "pwa.passenger.1E", name: "Pasajero/1.E Confirmación", kind: "mobile", back: true, header: "Reserva", subheader: "Paso 4 de 4", progress: 1.0, title: "Confirma tu reserva", sections: [{ title: "Resumen", items: ["LA2456 · 25/05 · 03:45 a.m.", "Aeropuerto Jorge Chávez -> Av. Pardo 123", "2 pasajeros · 2 maletas", "Tarifa fija S/ 65.00"], variant: "brand", h: 160 }, { title: "Comprobante", text: "Se enviará al correo registrado al finalizar el viaje.", h: 92 }], actions: [{ label: "Confirmar reserva", target: "pwa.passenger.1F" }, { label: "Editar", variant: "secondary", target: "pwa.passenger.1D" }] },
    { id: "pwa.passenger.1F", name: "Pasajero/1.F Reserva confirmada", kind: "mobile", header: "Reserva creada", subheader: "TG-20260525-0341", headerBadge: "Listo", title: "Voucher listo", subtitle: "El pasajero puede cerrar WhatsApp; el seguimiento vive en un link simple.", sections: [{ title: "Voucher generado", text: "QR y link enviados por el mismo canal. No hay descarga de app.", variant: "success", visual: "voucher", h: 220 }, { title: "Siguiente paso", text: "Despacho asigna conductor y unidad. El copiloto no decide solo.", variant: "info", h: 104 }], actions: [{ label: "Ver tracking", target: "pwa.passenger.1G1" }, { label: "Mis reservas", variant: "secondary", target: "pwa.passenger.1H" }] },
    { id: "pwa.passenger.1G1", name: "Pasajero/1.G1 Esperando asignación", kind: "mobile", header: "Reserva", subheader: "TG-0341", headerBadge: "Por confirmar", title: "Despacho esta asignando", subtitle: "Taxi Green te avisa cuando Carla confirme conductor y unidad.", sections: [{ title: "Estado vivo", text: "Vuelo LA2456 aterrizado. La cola se ordena por disponibilidad real.", variant: "brand", visual: "trip", h: 190 }, { title: "Humano en control", items: ["Carla revisa sugerencia", "Juan Perez esta a 6 min", "Sin llamadas del pasajero"], variant: "info", h: 126 }], actions: [{ label: "Ver conductor asignado", target: "pwa.passenger.1G2" }, { label: "Hablar con alguien", variant: "careSoft", target: "wellbeing.13D" }] },
    { id: "pwa.passenger.1G2", name: "Pasajero/1.G2 Conductor asignado", kind: "mobile", header: "Tu viaje", subheader: "/p/tg-0341 · LA2456", headerBadge: "En camino", title: "Juan llega en 8 min", subtitle: "Conductor, unidad, ETA y punto de encuentro en un link sobrio, sin login.", sections: [{ title: "DriverCard + VehicleCard", variant: "brand", visual: "driverVehicle", h: 246 }, { title: "Punto de encuentro", text: "Salida 3, columna F2. Mapa con ruta, halo del conductor y destino.", variant: "info", map: true, mapH: 98, h: 168 }], actions: [{ label: "Simular llegada", target: "pwa.passenger.1G3" }, { label: "Compartir mi viaje", variant: "secondary", target: "pwa.passenger.1G2" }] },
    { id: "pwa.passenger.1G3", name: "Pasajero/1.G3 Conductor llegó", kind: "mobile", headerFill: C.productAccent50, headerStroke: C.productAccent, header: "Tu conductor llego", subheader: "Salida 3 · F2", title: "Juan esta en el punto", subtitle: "Verifica foto, placa ABC-123 y Toyota Yaris blanco antes de subir.", sections: [{ title: "Vehiculo verificado", variant: "brand", visual: "driverVehicle", h: 246 }, { title: "Encuentro", text: "Confirma cuando lo veas. Si no lo encuentras, el equipo operativo ayuda sin abrir otro modulo.", variant: "info", h: 86 }], actions: [{ label: "Ya lo vi", target: "pwa.passenger.1G4" }, { label: "No lo encuentro", variant: "careSoft", target: "wellbeing.13F" }] },
    { id: "pwa.passenger.1G4", name: "Pasajero/1.G4 En viaje", kind: "mobile", header: "En viaje", subheader: "Seguimiento activo", headerBadge: "Activo", title: "Camino a Miraflores", subtitle: "La operacion mantiene trazabilidad sin invadir al pasajero.", sections: [{ title: "Ruta en vivo", map: true, mapH: 200, h: 252 }, { title: "Timeline del viaje", text: "Asignado -> en camino -> llego -> a bordo -> finalizado. ETA 04:38 a.m.; S/ 65.00.", variant: "brand", visual: "trip", h: 136 }], actions: [{ label: "Ver cierre", target: "pwa.passenger.1G5" }, { label: "Compartir", variant: "secondary", target: "pwa.passenger.1G4" }] },
    { id: "pwa.passenger.1G5", name: "Pasajero/1.G5 Viaje finalizado", kind: "mobile", header: "Llegaste", subheader: "Comprobante emitido", headerBadge: "Listo", title: "Viaje cerrado", subtitle: "Comprobante, calificacion triple y soporte del mismo viaje.", sections: [{ title: "ReceiptCard / comprobante", text: "Boleta emitida · S/ 65.00 · enviada a gianella@empresa.pe.", variant: "success", visual: "voucher", h: 176 }, { title: "RatingTripleCard", variant: "brand", visual: "ratingTriple", h: 128 }, { title: "Soporte del viaje", text: "Olvide algo abre el caso con reserva, conductor y unidad vinculados.", variant: "care", h: 70 }], actions: [{ label: "Enviar calificacion", target: "pwa.passenger.1H" }, { label: "Olvide algo", variant: "care", target: "wellbeing.13A" }] },
    { id: "pwa.passenger.1H", name: "Pasajero/1.H Mis reservas", kind: "mobile", activeNav: "Reservas", header: "Mis reservas", subheader: "Historial", title: "Tus reservas", sections: [{ title: "Próxima", text: "TG-0341 · LA2456 · 03:45 · Conductor asignado.", variant: "brand", h: 110 }, { title: "Recientes", items: ["TG-0329 · Finalizada · S/ 58.00", "TG-0318 · Finalizada · S/ 72.00"], h: 120 }], actions: [{ label: "Abrir TG-0341", target: "pwa.passenger.1G2" }, { label: "Pedir taxi", variant: "secondary", target: "pwa.passenger.1B" }] },
    { id: "pwa.passenger.1I", name: "Pasajero/1.I Ayuda y soporte", kind: "mobile", activeNav: "Ayuda", header: "Ayuda", subheader: "Soporte de viaje", title: "¿Cómo podemos ayudarte?", sections: [{ title: "Soporte del viaje", items: ["Olvidé algo en el auto", "Queja o problema del servicio", "Incidente de seguridad"], variant: "care", h: 146 }, { title: "Contacto", text: "Una persona del equipo revisa casos sensibles.", h: 92 }], actions: [{ label: "Objeto perdido", variant: "care", target: "wellbeing.13A" }, { label: "Incidente de seguridad", variant: "danger", target: "wellbeing.13E" }] },
    { id: "pwa.passenger.1J", name: "Pasajero/1.J Yo", kind: "mobile", activeNav: "Yo", header: "Yo", subheader: "Perfil", title: "Gianella Caballero", sections: [{ title: "Datos", fields: [["Teléfono", "+51 999 888 777"], ["Correo", "gianella.caballero@empresa.pe"]], h: 160 }, { title: "Preferencias", chips: ["Comprobante por correo", "Compartir seguimiento"], h: 92 }], actions: [{ label: "Cerrar sesión", variant: "destructive", target: "pwa.passenger.1A" }] }
  ];

  var driverScreens = [
    { id: "driver.2A", name: "Conductor/2.A Login", kind: "mobile", driver: true, nav: false, header: "Taxi Green", subheader: "App conductor", title: "Ingreso de turno", subtitle: "React Native/Expo en demo: PIN simple, cero friccion.", sections: [{ title: "Ingreso seguro", fields: [["Celular", "+51 9## ### ###"], ["PIN", "••••••"]], variant: "brand", h: 170 }, { title: "Promesa de adopcion", text: "Botones grandes, estado unico y GPS visible para conductores en operacion real.", h: 96 }], actions: [{ label: "Continuar", target: "driver.2B" }, { label: "Olvide mi PIN", variant: "ghost", target: "driver.2A" }] },
    { id: "driver.2B", name: "Conductor/2.B Inicio libre", kind: "mobile", driver: true, header: "Juan Perez", subheader: "En turno", title: "Libre y disponible", subtitle: "Una pantalla dominante; nada compite con la proxima asignacion.", sections: [{ title: "Estado del turno", text: "3h 25m en turno - 4 viajes - GPS activo - sonido suave.", variant: "brand", h: 112 }, { title: "Operacion viva", chips: ["Libre", "Cerca a llegadas", "Cola 47 min"], h: 100 }], actions: [{ label: "Simular nueva asignacion", target: navAction("driver.2C", "OVERLAY", { type: "SLIDE_IN", direction: "BOTTOM", easing: { type: "EASE_OUT" }, duration: 0.32 }) }, { label: "Ver historial", variant: "ghost", target: "driver.2H" }] },
    { id: "driver.2C", name: "Conductor/2.C Nueva asignacion", kind: "mobile", driver: true, headerFill: C.productAccent50, headerStroke: C.productAccent, header: "Nueva reserva", subheader: "Responder en 30s", title: "Viaje aprobado", subtitle: "Carla aprobo la sugerencia. El conductor solo decide aceptar o rechazar.", sections: [{ title: "Recoger en 8 minutos", text: "Aeropuerto Jorge Chavez, Salida 3 columna F2 -> Av. Pardo 123, Miraflores.", variant: "brand", visual: "driverVehicle", h: 272 }, { title: "Datos minimos", items: ["Vuelo LA2456 - 03:45", "2 pasajeros - 2 maletas", "Tarifa fija S/ 65.00"], h: 124 }], actions: [{ label: "Aceptar viaje", target: "driver.2D" }, { label: "Rechazar", variant: "ghost", target: { action: CLOSE_ACTION } }] },
    { id: "driver.2D", name: "Conductor/2.D Camino al pasajero", kind: "mobile", driver: true, headerFill: C.brand100, headerStroke: C.brand700, header: "Asignado", subheader: "LA2456", title: "Ve a Salida 3 · F2", subtitle: "La app reduce decisiones: ruta, ETA y siguiente accion.", sections: [{ title: "Ruta al punto", map: true, mapH: 218, h: 280 }, { title: "ETA 8 min", text: "Cuando aceptas, el pasajero final recibe link de tracking con placa y conductor.", variant: "brand", h: 104 }], actions: [{ label: "Enviar tracking al pasajero", target: "pwa.passenger.1G2" }, { label: "Continuar en conductor", variant: "secondary", target: "driver.2E" }] },
    { id: "driver.2E", name: "Conductor/2.E Esperando pasajero", kind: "mobile", driver: true, header: "Esperando", subheader: "Gianella C.", title: "Esperando a Gianella C.", sections: [{ title: "Tiempo de espera", text: "03:22", variant: "warning", h: 100 }, { title: "Acciones", chips: ["Llamar", "Mensaje", "No aparece"], h: 104 }], actions: [{ label: "El pasajero llegó", target: "driver.2F" }, { label: "No aparece — reportar", variant: "careSoft", target: "wellbeing.13D" }] },
    { id: "driver.2F", name: "Conductor/2.F Viaje en curso", kind: "mobile", driver: true, header: "En viaje", subheader: "Miraflores", title: "Ruta activa", subtitle: "El conductor no administra el viaje; solo confirma hitos.", sections: [{ title: "Ruta al destino", map: true, mapH: 230, h: 292 }, { title: "ETA 23 min", text: "Av. Pardo 123, Miraflores. Tarifa fija visible para evitar friccion.", variant: "brand", h: 100 }], actions: [{ label: "Terminar viaje", target: navAction("driver.2G", "OVERLAY", { type: "SLIDE_IN", direction: "BOTTOM", easing: { type: "EASE_OUT" }, duration: 0.32 }) }, { label: "Reportar algo", variant: "careSoft", target: "wellbeing.13D" }] },
    { id: "driver.2G", name: "Conductor/2.G Finalizar viaje", kind: "mobile", driver: true, header: "Finalizar", subheader: "S/ 65.00", title: "Cerrar viaje", subtitle: "Un cierre simple dispara comprobante y calificacion del pasajero.", sections: [{ title: "Metodo de cobro", chips: ["Efectivo", "Yape/Plin", "Tarjeta", "Voucher"], variant: "brand", h: 116 }, { title: "Comprobante", text: "Al confirmar, el pasajero recibe comprobante y acceso a soporte del viaje.", variant: "success", visual: "voucher", h: 178 }], actions: [{ label: "Confirmar fin de viaje", target: "pwa.passenger.1G5" }, { label: "Cancelar", variant: "ghost", target: { action: CLOSE_ACTION } }] },
    { id: "driver.2H", name: "Conductor/2.H Historial", kind: "mobile", driver: true, activeNav: "Historial", header: "Historial", subheader: "Hoy", title: "Viajes del turno", sections: [{ title: "Completados", items: ["TG-0329 · S/ 58.00", "TG-0338 · S/ 72.00", "TG-0341 · S/ 65.00"], h: 130 }, { title: "DriverHistorySummary", variant: "brand", visual: "history", h: 168 }], actions: [{ label: "Volver al inicio", target: "driver.2B" }] },
    { id: "driver.2I", name: "Conductor/2.I Yo", kind: "mobile", driver: true, activeNav: "Yo", header: "Yo", subheader: "Conductor", title: "Juan Pérez", sections: [{ title: "Vehículo", fields: [["Placa", "ABC-123"], ["Modelo", "Toyota Yaris blanco"]], h: 150 }, { title: "Preferencias", chips: ["Sonido suave", "Turno noche"], h: 90 }], actions: [{ label: "Cerrar sesión", variant: "destructive", target: "driver.2A" }] }
  ];

  var dispatcherScreens = [
    { id: "dispatch.3A", name: "Admin/3.A Login", kind: "desktop", activeTab: "Hoy", title: "Acceso admin operativo", subtitle: "Carla entra como administradora de turno: despacho, counter, incidencias y auditoria.", oneColumn: true, sections: [{ title: "Login sobrio", fields: [["Email", "carla@taxigreen.pe"], ["Contrasena", "********"], ["2FA", "123 456"]], h: 250 }, { title: "Actor del sistema", text: "Este no es el pasajero. Es el rol que valida sugerencias, asigna conductor y cierra trazabilidad.", variant: "info", h: 130 }], actions: [{ label: "Entrar", target: "dispatch.3B" }] },
    { id: "dispatch.3B", name: "Admin/3.B Dashboard principal", kind: "desktop", activeTab: "Hoy", sideActive: "Operación", title: "Admin operativo · torre aeroportuaria", subtitle: "Reservas, vuelos, conductores e incidencias en una operacion viva.", kpis: [["Reservas hoy", "42", "8% vs ayer", C.gray950], ["Sin asignar", "3", "requieren humano", C.warning700], ["Conductores", "18 / 24", "activos cerca", C.brand700], ["Soporte", "1", "objeto perdido", C.care700]], sections: [{ title: "Operacion viva", variant: "brand", visual: "ops", h: 220 }, { title: "Vuelo protagonista", items: ["LA2456 - 03:45 - aterrizado", "Reserva TG-0341 creada desde solicitante hotel/WhatsApp", "Pasajera final: Gianella C. - destino Miraflores"], variant: "brand", h: 176 }, { title: "Sugerencia explicable", text: "Juan Perez: 47 min en cola, a 6 min de Salida 3 F2, 4.9 de feedback y unidad verificada. Carla decide.", variant: "info", visual: "driver", h: 210 }, { title: "Riesgo controlado", text: "El copiloto no asigna solo. Si LLM falla, la regla determinista mantiene el flujo.", variant: "warning", h: 118 }], actions: [{ label: "Abrir TG-0341", target: "dispatch.3C" }, { label: "Ver WhatsApp", variant: "secondary", target: "whatsapp.12A" }, { label: "Incidencias", variant: "careSoft", target: "wellbeing.13F" }] },
    { id: "dispatch.3C", name: "Admin/3.C Reserva drawer", kind: "desktop", activeTab: "Reservas", title: "Reserva TG-0341", subtitle: "AssignmentApprovalPanel: la IA/reglas sugieren; Carla aprueba conductor y unidad por separado.", sections: [{ title: "Reserva desde WhatsApp", items: ["Solicitante: Hotel Costa Verde - WhatsApp simulado", "Recojo: LA2456 - 03:45 - Salida 3 columna F2", "Pasajera final: Gianella Caballero - +51 999 888 777", "Destino: Av. Pardo 123, Miraflores"], variant: "brand", h: 210 }, { title: "AssignmentApprovalPanel", variant: "info", visual: "approval", h: 246 }, { title: "Unidad sugerida", variant: "success", visual: "vehicle", h: 210 }, { title: "Control humano", text: "Motivo: 1ro en cola compatible, a 6 min, unidad sedan verificada. Fuente: reglas con fallback IA visible.", variant: "warning", h: 112 }], actions: [{ label: "Aprobar y enviar a Juan", target: "driver.2C" }, { label: "Asignar otro", variant: "secondary", target: "dispatch.3E" }, { label: "Ver mapa", variant: "ghost", target: "dispatch.3D" }] },
    { id: "dispatch.3D", name: "Despachador/3.D Mapa operacional", kind: "desktop", activeTab: "Mapa", title: "Mapa operacional en vivo", subtitle: "Conductores, rutas y viajes en curso en mapa nocturno.", mapFull: true, actions: [{ label: "Abrir cola de incidencias", variant: "careSoft", target: "wellbeing.13F" }] },
    { id: "dispatch.3E", name: "Despachador/3.E Conductores", kind: "desktop", activeTab: "Conductores", title: "Conductores", subtitle: "Gestion de estado, cola, unidad vigente e historial mockup de liquidacion.", sections: [{ title: "Cola de conductores", variant: "brand", visual: "queue", h: 190 }, { title: "Perfil conductor", variant: "info", visual: "driverVehicle", h: 320 }, { title: "DriverHistorySummary", variant: "success", visual: "history", h: 220 }, { title: "Mockup demo", text: "Resumen de liquidacion visual. No procesa pagos: el motor real queda para MVP.", variant: "warning", h: 110 }], actions: [{ label: "Ver detalle de liquidacion", target: "dispatch.3E" }, { label: "Exportar", variant: "secondary", target: "dispatch.3E" }] },
    { id: "dispatch.3F", name: "Despachador/3.F Ingesta multicanal", kind: "desktop", activeTab: "Hoy", sideActive: "Ingesta", title: "Bandeja de ingesta multicanal", subtitle: "El canal manda; el sistema estructura y pide aprobacion.", sections: [{ title: "Mensaje entrante", text: "Concierge Hotel Costa Verde: pasajera llega en LA2456 a las 03:45, 2 personas, recojo en Jorge Chavez y destino Miraflores.", variant: "brand", h: 138 }, { title: "Cocina del copiloto", variant: "info", visual: "copilot", h: 210 }, { title: "Demo realista", text: "WhatsApp Business API es simulado. La extraccion tiene fallback determinista para que la demo no dependa de LLM.", variant: "warning", h: 118 }], actions: [{ label: "Abrir simulador WhatsApp", target: "whatsapp.12A" }, { label: "Aprobar y crear", variant: "primary", target: "whatsapp.12C" }] },
    { id: "dispatch.3G", name: "Despachador/3.G Reportes", kind: "desktop", activeTab: "Reportes", title: "Reportes", subtitle: "Operación, financiero y soporte.", sections: [{ title: "Operación", items: ["Reservas por hora", "Tiempos de asignación", "Conductores activos"], h: 160 }, { title: "Soporte", items: ["Incidencias por categoría", "Tiempo promedio de resolución", "Cierre con confirmación positiva"], variant: "care", h: 180 }] },
    { id: "dispatch.3H", name: "Despachador/3.H Configuración", kind: "desktop", title: "Configuración", subtitle: "Usuario, contraseña, 2FA, notificaciones y zona horaria.", sections: [{ title: "Preferencias", fields: [["Sonido crítico", "Activo"], ["Zona horaria", "America/Lima"], ["2FA", "Configurado"]], h: 220 }] }
  ];

  var counterScreens = [
    { id: "counter.4A", name: "Counter/4.A Login", kind: "desktop", activeTab: "Hoy", sideActive: "Vuelos", title: "Acceso supervisor de counter", subtitle: "Ingreso rápido para el turno de aeropuerto.", oneColumn: true, sections: [{ title: "Credenciales", fields: [["Usuario", "carla.counter"], ["PIN", "••••••"], ["Counter", "Jorge Chávez · Llegadas"]], h: 250 }], actions: [{ label: "Entrar", target: "counter.4B" }] },
    { id: "counter.4B", name: "Counter/4.B Dashboard", kind: "desktop", activeTab: "Hoy", sideActive: "Vuelos", title: "Counter Jorge Chavez", subtitle: "Cobertura aeropuerto: vuelos, pasajeros esperados y apoyo presencial.", kpis: [["Vuelos atendidos", "7", "turno noche", C.gray950], ["Reservas creadas", "18", "desde counter", C.brand700], ["Pendientes", "3", "requieren apoyo", C.warning700], ["Incidencias", "1", "en soporte", C.care700]], sections: [{ title: "Torre de vuelos", variant: "brand", visual: "ops", h: 210 }, { title: "Reservas del counter", items: ["Gianella C. - Juan P. - Esperando en punto", "Luis A. - Pedro R. - Encontrado", "Ana T. - Rosa M. - En camino al auto"], h: 180 }, { title: "Apoyo sugerido", text: "Crear reserva manual para pasajero sin WhatsApp y enviar al mismo despacho.", variant: "info", h: 120 }], actions: [{ label: "Crear reserva manual", target: "counter.4C" }, { label: "Ver historial", variant: "secondary", target: "counter.4D" }, { label: "Reportar incidente", variant: "careSoft", target: "counter.13I" }] },
    { id: "counter.4C", name: "Counter/4.C Crear reserva", kind: "desktop", activeTab: "Reservas", sideActive: "Vuelos", title: "Reserva manual de counter", subtitle: "Ruta de apoyo: walk-in, tarifa cerrada y cola de aeropuerto alimentan el mismo despacho.", sections: [{ title: "Walk-in aeropuerto", fields: [["Tipo", "Recojo en aeropuerto"], ["Destino", "Av. Pardo 123, Miraflores"], ["Unidad", "Sedan · 2 pax · 2 maletas"]], variant: "brand", h: 230 }, { title: "Tarifa y voucher", items: ["Tarifa cerrada S/ 65.00", "Comprobante visual listo", "QR firmado de un solo uso"], variant: "success", visual: "voucher", h: 230 }, { title: "Cola de conductores", variant: "info", visual: "queue", h: 210 }, { title: "Regla de asignacion", text: "No gana el mas cercano: se respeta tiempo en cola, tipo de unidad y capacidad.", variant: "warning", h: 110 }], actions: [{ label: "Asignar siguiente en cola", target: "dispatch.3C" }, { label: "Cancelar", variant: "ghost", target: "counter.4B" }] },
    { id: "counter.4D", name: "Counter/4.D Historial", kind: "desktop", activeTab: "Reportes", sideActive: "Vuelos", title: "Historial del counter", subtitle: "Reservas creadas desde mostrador con filtros de turno.", sections: [{ title: "Tabla historial", items: ["TG-0341 · Gianella C. · creada 03:22 · asignada", "TG-0339 · Luis A. · creada 02:51 · finalizada", "TG-0334 · Ana T. · creada 01:40 · incidencia"], h: 220 }, { title: "Detalle seleccionado", text: "Panel lateral con datos del pasajero, vuelo, conductor y acciones de seguimiento.", variant: "brand", h: 140 }], actions: [{ label: "Volver al dashboard", target: "counter.4B" }, { label: "Abrir detalle operativo", variant: "secondary", target: "dispatch.3C" }] },
    { id: "counter.10A", name: "Counter/10.A Layout principal", kind: "desktop", activeTab: "Hoy", sideActive: "Vuelos", title: "Counter Jorge Chávez · Turno noche · Carla M.", subtitle: "Vuelos próximos y asignación rápida sin ambigüedad.", sections: [{ title: "Vuelos próximos", items: ["LA2456 · LATAM · 03:45 · 12 pax · cobertura 10/12", "LP2110 · 04:30 · 8 pax · cobertura 8/8", "AV245 · 05:10 · 5 pax · faltan 5"], variant: "brand", h: 200 }, { title: "Asignación rápida", items: ["Reserva siguiente: Gianella C. · LA2456", "Juan P. · ABC-123 · 240 m · recomendado", "Pedro R. · XYZ-987 · 320 m"], h: 200 }, { title: "Razones del copiloto", text: "1ro en cola compatible, mejor evaluación reciente y unidad disponible.", variant: "info", h: 120 }, { title: "Botones supervisor", chips: ["Asignar", "Reasignar", "Crear manual", "Reportar"], variant: "care", h: 120 }], actions: [{ label: "Iniciar recepción", target: "counter.10B" }, { label: "Reportar incidente", variant: "careSoft", target: "counter.13I" }] },
    { id: "counter.10B", name: "Counter/10.B Vuelo aterrizado", kind: "desktop", activeTab: "Hoy", sideActive: "Vuelos", title: "Recepción LA2456", subtitle: "Torre de control para pasajeros esperados.", sections: [{ title: "Pasajeros esperados", items: ["Gianella C. · Juan P. · Esperando en punto", "Luis A. · Pedro R. · Encontrado", "Ana T. · Rosa M. · En camino al auto"], h: 220 }, { title: "Acciones rápidas", chips: ["Marcar encontrado", "Reasignar", "Crear reserva manual"], variant: "brand", h: 130 }], actions: [{ label: "Marcar como encontrado", target: "dispatch.3D" }] },
    { id: "counter.13I", name: "Counter/13.I Reporte rápido", kind: "desktop", activeTab: "Hoy", sideActive: "Incidencias", title: "Reporte rápido de counter", subtitle: "Modal corto para seguridad, queja, falla de conductor u otro.", sections: [{ title: "Formulario corto", fields: [["Tipo", "Queja del pasajero"], ["Reserva vinculada", "TG-0341"], ["Prioridad", "Media"]], variant: "care", h: 230 }, { title: "Descripción", text: "Pasajero no encontró el punto de encuentro y requiere apoyo.", h: 130 }], actions: [{ label: "Enviar reporte", variant: "care", target: "wellbeing.13F" }, { label: "Cancelar", variant: "ghost", target: "counter.10A" }] }
  ];

  var companyScreens = [
    { id: "company.5A", name: "Empresa/5.A Login", kind: "desktop", activeTab: "Hoy", sideActive: "Facturación", title: "Acceso empresa cliente", subtitle: "Portal privado para viajes, gasto y vouchers corporativos.", oneColumn: true, sections: [{ title: "Credenciales corporativas", fields: [["Correo", "admin@techcorp.pe"], ["Contraseña", "••••••••"], ["Empresa", "TechCorp Perú S.A.C."]], h: 250 }], actions: [{ label: "Entrar", target: "company.5B" }] },
    { id: "company.5B", name: "Empresa/5.B Dashboard", kind: "desktop", activeTab: "Hoy", sideActive: "Facturación", title: "Dashboard empresa · TechCorp Perú S.A.C.", subtitle: "Métricas de viajes, gasto, colaboradores y próximas reservas.", kpis: [["Gasto mes", "S/ 4,820", "12% vs abril", C.gray950], ["Viajes", "32", "mayo 2026", C.brand700], ["Usuarios", "12", "autorizados", C.gray950], ["Incidencias", "1", "seguimiento", C.care700]], sections: [{ title: "Próximos viajes", items: ["Gianella C. · LA2456 · voucher TG-0341", "Juan R. · LP2110 · voucher TG-0344"], variant: "brand", h: 160 }, { title: "Control de gasto", text: "Distribución por centro de costo, colaborador y tipo de viaje.", h: 130 }, { title: "Privacidad", text: "La empresa ve estado general de incidencias, no conversaciones sensibles.", variant: "care", h: 120 }], actions: [{ label: "Reportes", target: "company.11B" }, { label: "Administrar usuarios", variant: "secondary", target: "company.11C" }, { label: "Reservar taxi", variant: "primary", target: "company.5C" }] },
    { id: "company.5C", name: "Empresa/5.C Reservar taxi", kind: "desktop", activeTab: "Reservas", sideActive: "Facturación", title: "Reservar taxi corporativo", subtitle: "Formulario rápido para crear voucher a nombre de un colaborador.", sections: [{ title: "Colaborador", fields: [["Nombre", "Gianella Caballero"], ["Centro de costo", "Marketing"], ["Correo", "gianella@techcorp.pe"]], h: 230 }, { title: "Viaje", fields: [["Origen", "Aeropuerto Jorge Chávez"], ["Destino", "Av. Pardo 123"], ["Vuelo", "LA2456"]], variant: "brand", h: 230 }, { title: "Política", items: ["Voucher autorizado", "Tarifa estimada S/ 65.00", "Factura mensual consolidada"], variant: "info", h: 150 }], actions: [{ label: "Confirmar voucher", target: "company.5B" }, { label: "Volver al inicio", variant: "ghost", target: "company.5B" }] },
    { id: "company.11A", name: "Empresa/11.A Resumen", kind: "desktop", activeTab: "Reportes", sideActive: "Facturación", title: "Resumen · TechCorp Perú S.A.C. · Mayo 2026", subtitle: "Gasto, viajes, colaboradores y próximos vouchers.", kpis: [["Gasto del mes", "S/ 4,820", "12% vs abril", C.gray950], ["Viajes", "32", "4 vs abril", C.brand700], ["Colaboradores", "12", "activos", C.gray950], ["Incidencias", "1", "en seguimiento", C.care700]], sections: [{ title: "Gasto diario", text: "Gráfico de líneas de últimos 30 días con exportación.", h: 140 }, { title: "Próximos viajes", items: ["Juan R. · LA2456 · voucher TG-0341", "María A. · LP2110 · voucher TG-0344"], h: 140 }, { title: "Últimos viajes", items: ["TG-0329 · S/ 58.00 · comprobante listo", "TG-0318 · S/ 72.00 · factura"], h: 140 }, { title: "Privacidad de incidencias", text: "La empresa ve estado general, no mensajes privados del colaborador.", variant: "care", h: 120 }], actions: [{ label: "Ver viajes", target: "company.11B" }, { label: "Facturación", variant: "secondary", target: "company.11D" }] },
    { id: "company.11B", name: "Empresa/11.B Viajes", kind: "desktop", title: "Viajes corporativos", subtitle: "Filtros por colaborador, fecha, estado y centro de costo.", sections: [{ title: "Tabla viajes", items: ["TG-0341 · Gianella C. · Marketing · S/ 65.00", "TG-0342 · Juan R. · Dirección · S/ 72.00", "TG-0330 · Ana T. · Finanzas · S/ 58.00"], h: 220 }], actions: [{ label: "Exportar Excel", variant: "secondary", target: "company.11B" }, { label: "Abrir resumen", variant: "ghost", target: "company.11A" }] },
    { id: "company.11C", name: "Empresa/11.C Colaboradores", kind: "desktop", title: "Colaboradores", subtitle: "Usuarios autorizados a pedir vouchers.", sections: [{ title: "Lista", items: ["Gianella C. · Marketing · S/ 320 mes", "Juan R. · Dirección · S/ 980 mes", "Ana T. · Finanzas · S/ 250 mes"], h: 220 }, { title: "Acciones", chips: ["Agregar", "Editar límite", "Deshabilitar"], h: 110 }] },
    { id: "company.11D", name: "Empresa/11.D Facturación", kind: "desktop", title: "Facturación", subtitle: "Comprobantes emitidos, saldo y datos fiscales.", sections: [{ title: "Comprobantes", items: ["28 PDF listos", "Saldo a pagar S/ 1,260.00", "RUC 20509138053"], variant: "brand", h: 180 }, { title: "Datos fiscales", fields: [["Razón social", "TechCorp Perú S.A.C."], ["Dirección fiscal", "Av. Principal 123"]], h: 180 }], actions: [{ label: "Solicitar nota de crédito", variant: "secondary", target: "company.11D" }] },
    { id: "company.11E", name: "Empresa/11.E Notificaciones", kind: "desktop", title: "Notificaciones", subtitle: "Bell con vouchers, comprobantes e incidencias.", sections: [{ title: "Panel bell", items: ["Voucher emitido a Juan R.", "Comprobante listo para LA2456", "Incidencia reportada por colaborador X"], h: 180 }, { title: "Incidencias del colaborador", text: "Estado general visible con detalle privado protegido.", variant: "care", h: 120 }] }
  ];

  var whatsappScreens = [
    { id: "whatsapp.12A", name: "WhatsApp/12.A Mensaje incompleto", kind: "desktop", activeTab: "Hoy", sideActive: "Ingesta", title: "Simulador WhatsApp solicitante", subtitle: "Canal del cliente primero. Transparente: esto simula WABA, no llama una red externa.", sections: [{ title: "WhatsAppCopilotDualPanel", variant: "brand", visual: "copilotDual", h: 300 }, { title: "Datos faltantes", items: ["Direccion exacta en Miraflores", "Nombre completo del pasajero", "Correo para comprobante"], variant: "warning", h: 160 }, { title: "Banner de honestidad", text: "Demo: simulador de WhatsApp. Produccion: WhatsApp Business API o canal real.", variant: "warning", h: 96 }, { title: "Humano en control", text: "Carla puede editar la respuesta antes de enviarla. El copiloto no promete al pasajero sin aprobacion.", variant: "brand", h: 96 }], actions: [{ label: "Pedir direccion exacta", target: "whatsapp.12B" }, { label: "Editar respuesta", variant: "secondary", target: "dispatch.3F" }] },
    { id: "whatsapp.12B", name: "WhatsApp/12.B Datos completos", kind: "desktop", activeTab: "Hoy", sideActive: "Ingesta", title: "Datos completos", subtitle: "La cocina del copiloto convierte conversacion en borrador operativo.", sections: [{ title: "WhatsAppCopilotDualPanel", variant: "brand", visual: "copilotDual", h: 300 }, { title: "Borrador de reserva", items: ["TG-0341 - recojo aeropuerto", "LA2456 - 03:45 - Salida 3 columna F2", "Gianella Caballero - 2 pax - 2 maletas", "Tarifa fija S/ 65.00"], variant: "success", h: 170 }, { title: "Banner de transparencia", text: "Borrador. Nada se despacha sin aprobacion humana. Fuente visible: IA o reglas.", variant: "warning", h: 112 }, { title: "Decision sugerida", text: "Aprobar reserva y generar voucher. La asignacion ocurre despues en despacho.", variant: "info", h: 112 }], actions: [{ label: "Aprobar y crear reserva", target: "whatsapp.12C" }] },
    { id: "whatsapp.12C", name: "WhatsApp/12.C Reserva creada", kind: "desktop", activeTab: "Hoy", sideActive: "Ingesta", title: "Voucher enviado por WhatsApp", subtitle: "Momento fuerte: QR, link y codigo salen por el mismo canal del solicitante.", sections: [{ title: "Mensaje enviado", chat: [{ side: "out", text: "Listo. Reserva TG-20260525-0341 para Gianella Caballero. Punto: Salida 3, columna F2. Link: taxigreen.pe/p/tg-0341. QR adjunto." }], h: 220 }, { title: "VoucherQR", text: "Codigo TG-20260525-0341 · QR visual creible · link /p/tg-0341 · sello Taxi Green · vigencia 24h.", variant: "success", visual: "voucher", h: 250 }, { title: "Datos del pasajero", items: ["Gianella Caballero", "Vuelo LA2456 - 03:45", "Destino Av. Pardo 123, Miraflores", "Punto de encuentro: Salida 3, columna F2"], variant: "brand", h: 170 }, { title: "Proximo paso", text: "Despacho asigna conductor y unidad. El copiloto acompana; el humano confirma.", variant: "info", h: 112 }], actions: [{ label: "Ver en despacho", target: "dispatch.3C" }] }
  ];

  var wellbeingScreens = [
    { id: "wellbeing.13A", name: "Soporte/13.A Objeto perdido", kind: "mobile", back: true, activeNav: "Ayuda", header: "Soporte del viaje", subheader: "Objeto perdido", title: "Olvide algo", subtitle: "El caso nace desde el mismo link /p/tg-0341. La reserva, conductor y unidad ya vienen vinculados.", sections: [{ title: "Viaje precargado", text: "TG-0341 · Juan Carlos Perez Quispe · ABC-123 · Toyota Yaris.", variant: "care", visual: "driver", h: 170 }, { title: "Captura corta", fields: [["Que se quedo", "Cartera negra de cuero"], ["Donde", "Asiento trasero o maletera"]], h: 154 }, { title: "Contacto preferido", chips: ["WhatsApp/SMS", "Llamada", "Correo"], h: 82 }], actions: [{ label: "Enviar reporte", variant: "care", target: "wellbeing.13B" }, { label: "Cancelar", variant: "ghost", target: "pwa.passenger.1G5" }] },
    { id: "wellbeing.13B", name: "Soporte/13.B Reporte recibido", kind: "mobile", header: "Caso #INC-0142", subheader: "En revision", headerBadge: "Soporte", headerBadgeVariant: "care", title: "Estamos revisandolo", subtitle: "Carla M. queda nombrada como responsable; el pasajero no recibe un ticket frio.", sections: [{ title: "Estado inicial", text: "SLA maximo 2 horas. Carla toma el caso y contacta a Juan por la cola interna.", variant: "care", visual: "incident", h: 170 }, { title: "Caso", items: ["#INC-20260525-0142", "Reportado 04:32", "Proximo: despacho contacta a Juan", "Tiempo restante 1h 58 min"], h: 138 }], actions: [{ label: "Ver en cola interna", variant: "care", target: "wellbeing.13F" }, { label: "Detalle pasajero", variant: "ghost", target: "wellbeing.13C" }] },
    { id: "wellbeing.13C", name: "Soporte/13.C Detalle incidencia", kind: "mobile", back: true, header: "Caso #INC-0142", subheader: "Objeto perdido", title: "Buenas noticias", subtitle: "El pasajero ve progreso claro, no burocracia.", sections: [{ title: "Objeto encontrado", text: "Juan encontro tu cartera. El equipo coordina entrega contigo.", variant: "success", h: 98 }, { title: "Linea de tiempo", timeline: ["04:32 reportaste el caso", "04:35 Carla lo tomo", "04:48 Juan confirmo hallazgo", "Proximo coordinar entrega"], done: 3, h: 150 }, { title: "Mensaje humano", text: "Carla M.: coordinamos entrega entre 7pm y 9pm. Te acompano hasta cerrar.", variant: "care", h: 104 }], actions: [{ label: "Confirmar recepcion", variant: "care", target: "wellbeing.13K" }] },
    { id: "wellbeing.13D", name: "Soporte/13.D Queja enunciada", kind: "mobile", back: true, header: "Reportar", subheader: "Enunciado", title: "Queja o problema", subtitle: "Capacidad de roadmap. En la demo construida, el arco fuerte es objeto olvidado.", sections: [{ title: "Categoria", chips: ["Trato", "Llego tarde", "Cobro", "Ruta", "Otro"], variant: "care", h: 112 }, { title: "Cuéntanos con tus palabras", fields: [["Descripcion", "Necesito ayuda con este viaje."]], h: 112 }], actions: [{ label: "Enviar queja", variant: "care", target: "wellbeing.13F" }, { label: "Seguridad", variant: "danger", target: "wellbeing.13E" }] },
    { id: "wellbeing.13E", name: "Soporte/13.E Seguridad", kind: "mobile", back: true, headerFill: C.danger50, headerStroke: C.danger200, header: "Seguridad", subheader: "Enunciado", title: "Incidente de seguridad", sections: [{ title: "Roadmap sensible", text: "Se muestra como capacidad futura. La demo construida de soporte es objeto olvidado.", variant: "danger", h: 106 }, { title: "¿Qué pasó?", chips: ["Me siento inseguro/a", "Conductor incorrecto", "Acoso", "Robo", "Otro grave"], variant: "danger", h: 124 }, { title: "¿Estás en el viaje ahora?", chips: ["Sí, ahora mismo", "No, ya terminó"], h: 90 }], actions: [{ label: "Enviar y pedir ayuda ahora", variant: "danger", target: "wellbeing.13F" }, { label: "Llamar 105", variant: "destructive", target: "wellbeing.13E" }] },
    { id: "wellbeing.13F", name: "Soporte/13.F Cola interna", kind: "desktop", activeTab: "Reportes", sideActive: "Incidencias", title: "Cola interna de soporte", subtitle: "Objeto olvidado como unico flujo construido; el resto queda enunciado.", sections: [{ title: "Objeto perdido protagonista", variant: "care", visual: "incident", h: 190 }, { title: "Caso activo", items: ["INC-0142 - Objeto perdido - Gianella C. - SLA 1h58 - Carla M.", "Viaje TG-0341 - Juan Carlos Perez - ABC-123", "Proximo paso: contactar conductor"], variant: "care", h: 190 }, { title: "Tipologias enunciadas", text: "Quejas y seguridad se nombran como roadmap, no se presentan como flujo equivalente.", variant: "warning", h: 118 }, { title: "Promesa comercial", text: "El problema tambien queda trazado, atendido por humano y cerrado con constancia.", variant: "info", h: 118 }], actions: [{ label: "Abrir caso Gianella", variant: "care", target: "wellbeing.13G" }, { label: "Volver a despacho", variant: "secondary", target: "dispatch.3B" }] },
    { id: "wellbeing.13G", name: "Soporte/13.G Atencion de objeto", kind: "desktop", activeTab: "Reportes", sideActive: "Incidencias", title: "Resolucion de objeto perdido", subtitle: "IncidentResolutionPanel: timeline, responsable, mensaje al conductor y constancia.", sections: [{ title: "Timeline operativo", timeline: ["Reporte recibido", "Carla toma el caso", "Solicitud lista para Juan", "Pendiente confirmacion conductor"], done: 2, h: 190 }, { title: "IncidentResolutionPanel", fields: [["Estado", "En atencion"], ["Responsable", "Carla M."], ["SLA", "1h 42 min restantes"], ["Mensaje", "Juan, revisa asiento trasero y maletera."]], variant: "care", h: 250 }, { title: "Datos del viaje", text: "Reserva TG-0341 - Gianella C. - Juan Carlos Perez Quispe - ABC-123 - Toyota Yaris - 25/05 03:45.", h: 120 }, { title: "Cierre esperado", text: "Despues de la confirmacion del conductor se genera constancia para pasajero.", variant: "info", h: 120 }], actions: [{ label: "Contactar conductor", variant: "care", target: "wellbeing.13H" }, { label: "Vista pasajero", variant: "secondary", target: "wellbeing.13C" }] },
    { id: "wellbeing.13H", name: "Soporte/13.H Confirmacion conductor", kind: "mobile", driver: true, headerFill: C.care50, headerStroke: C.care300, header: "Solicitud del equipo", subheader: "Objeto perdido", title: "Revisa tu auto", subtitle: "La solicitud es concreta y segura; no expone datos innecesarios.", sections: [{ title: "Reserva LA2456", text: "Gianella C. reporto cartera negra de cuero. Probable: asiento trasero o maletera.", variant: "care", h: 124 }, { title: "Confirmacion", fields: [["Objeto", "Cartera negra de cuero"], ["Estado", "Intacto"], ["Ubicacion", "Asiento trasero"]], h: 178 }], actions: [{ label: "Notificar hallazgo", variant: "care", target: "wellbeing.13K" }, { label: "No lo encuentro", variant: "secondary", target: "wellbeing.13G" }, { label: "Revisar mas tarde", variant: "ghost", target: { action: CLOSE_ACTION } }] },
    { id: "wellbeing.13J", name: "Soporte/13.J Empresa incidencia", kind: "desktop", activeTab: "Reportes", sideActive: "Incidencias", title: "Incidencias de colaborador", subtitle: "Visibilidad corporativa con privacidad.", sections: [{ title: "Estado general", items: ["Colaborador: Gianella C.", "Tipo: objeto perdido", "Estado: resuelto pendiente confirmación"], variant: "care", h: 160 }, { title: "Privacidad", text: "La empresa no ve mensajes sensibles entre colaborador y Taxi Green.", h: 110 }] },
    { id: "wellbeing.13K", name: "Soporte/13.K Constancia PDF", kind: "desktop", activeTab: "Reportes", title: "Constancia de cierre", subtitle: "Output PDF generado al resolver el objeto olvidado del mismo viaje.", oneColumn: true, sections: [{ title: "Constancia #INC-20260525-0142", items: ["Reserva TG-0341", "Objeto recuperado: cartera negra", "Conductor confirmo hallazgo", "Responsable: Carla M.", "QR de verificacion y sello Taxi Green"], variant: "success", visual: "voucher", h: 250 }, { title: "Cierre con soporte", text: "El pasajero recibe constancia y puede confirmar si quedo resuelto; si responde que no, se reabre.", variant: "care", visual: "incident", h: 180 }], actions: [{ label: "Ver cierre del pasajero", variant: "care", target: "wellbeing.13C" }, { label: "Volver a cola", variant: "secondary", target: "wellbeing.13F" }] }
  ];

  var stateScreens = [
    { id: "states.empty", name: "Estados/Empty", kind: "desktop", title: "Estados vacíos", subtitle: "Microcopy sobrio y CTA claro.", sections: [{ title: "Mis reservas vacío", text: "Aún no tienes reservas. Cuando agendes la primera, aparecerá aquí.", h: 120 }, { title: "Dashboard sin atención", text: "Todo en orden por ahora.", variant: "success", h: 110 }, { title: "Cola incidencias vacía", text: "No hay incidencias abiertas.", variant: "care", h: 110 }] },
    { id: "states.errors", name: "Estados/Errores", kind: "desktop", title: "Errores", subtitle: "Cero negación sin alternativa.", sections: [{ title: "Sin conexión", text: "No pudimos conectar. Vamos a reintentar en unos segundos.", variant: "warning", h: 120 }, { title: "Sesión vencida", text: "Tu sesión expiró por seguridad. Vuelve a entrar.", variant: "danger", h: 120 }, { title: "403", text: "No tienes acceso a esta sección. Contacta a tu administrador.", h: 120 }] },
    { id: "states.loading", name: "Estados/Loading", kind: "desktop", title: "Loading", subtitle: "Skeleton específico y texto del proceso.", sections: [{ title: "Procesando", text: "Buscando conductor cercano...", variant: "brand", h: 110 }, { title: "Tardando más", text: "Está tardando más de lo normal. ¿Reintentar?", variant: "warning", h: 110 }] },
    { id: "states.offline", name: "Estados/Offline", kind: "desktop", title: "Offline PWA", subtitle: "Datos cacheados y cola de acciones.", sections: [{ title: "Banner offline", text: "Sin conexión. Reintentaremos solos.", variant: "warning", h: 110 }, { title: "Acción en cola", text: "Pendiente de enviar. Se reenviará al volver la red.", h: 110 }] }
  ];

  function renderMobilePage(name, screens) {
    for (var i = 0; i < screens.length; i += 1) {
      var col = i % 4;
      var rowNum = Math.floor(i / 4);
      mobileShell(screens[i], col * 430, rowNum * 900);
    }
  }

  function renderDesktopPage(name, screens, xOffset, yOffset) {
    xOffset = xOffset || 0;
    yOffset = yOffset || 0;
    for (var i = 0; i < screens.length; i += 1) {
      var col = i % 2;
      var rowNum = Math.floor(i / 2);
      desktopShell(screens[i], xOffset + col * 1500, yOffset + rowNum * 980);
    }
  }

  function createPrototype() {
    var root = frame("Prototype Map", 1440, 1280, { fill: C.gray950, clip: false });
    registry["prototype.home"] = root;
    rect(root, "prototype header band", 1440, 128, { fill: C.nightPanel, opacity: 0.82 });
    var lg = logo(root, 70, true);
    lg.x = 52;
    lg.y = 38;
    txt(root, "Ruta protagonista A-Z", { x: 52, y: 164, size: 52, lh: 60, font: FONT.extrabold, color: C.white, width: 780, fixed: true });
    txt(root, "Una sola historia: solicitante hotel/concierge por WhatsApp, voucher, aprobacion humana, app conductor, link pasajero, comprobante y objeto olvidado.", { x: 54, y: 232, size: 18, lh: 28, color: C.gray200, width: 820, fixed: true });
    var scope = row(root, "Scope chips", 760, 40, 10);
    scope.x = 54;
    scope.y = 304;
    badge(scope, "Construido", "success", 110);
    badge(scope, "Simulado", "warning", 104);
    badge(scope, "Aplazado", "gray", 100);
    badge(scope, "Humano en control", "brand", 158);
    var hero = card(root, "Flow protagonist", 780, 760, { fill: C.white, stroke: C.productAccent200, p: 28, gap: 18, shadow: "xl" });
    hero.x = 54;
    hero.y = 390;
    badge(hero, "Flujo protagonista - 12 min", "brand", 196);
    txt(hero, "Canal -> copiloto -> admin -> conductor -> link pasajero -> soporte", { size: 32, lh: 40, font: FONT.extrabold, color: C.gray950, width: 700, fixed: true });
    txt(hero, "La demo vende una operacion formal desde el primer contacto: solicitante por canal natural, datos extraidos, aprobacion humana, recojo en aeropuerto, link sin app y resolucion de objeto perdido.", { size: 15, lh: 23, color: C.gray700, width: 700, fixed: true });
    var route = stack(hero, "Route steps", 700, 376, 6);
    var steps = [
      ["01", "Entrada multicanal", "WhatsApp del solicitante es protagonista", "pwa.passenger.1A", "brand"],
      ["02", "Dato faltante", "El copiloto pide, no inventa", "whatsapp.12A", "warning"],
      ["03", "Datos completos", "Borrador y fuente visible", "whatsapp.12B", "brand"],
      ["04", "Voucher", "QR + link + codigo por WhatsApp", "whatsapp.12C", "success"],
      ["05", "Admin operativo", "Carla aprueba conductor y unidad", "dispatch.3C", "warning"],
      ["06", "Conductor", "Acepta y dispara tracking", "driver.2C", "brand"],
      ["07", "Pasajero sin app", "DriverCard + VehicleCard + ETA", "pwa.passenger.1G2", "info"],
      ["08", "Cierre", "Comprobante + rating triple", "pwa.passenger.1G5", "success"],
      ["09", "Objeto olvidado", "Mismo link, cola interna", "wellbeing.13A", "care"],
      ["10", "Constancia", "Conductor confirma y se cierra", "wellbeing.13K", "care"]
    ];
    for (var i = 0; i < steps.length; i += 1) {
      var sr = row(route, "Narrative step " + steps[i][0], 700, 32, 8);
      badge(sr, steps[i][0], steps[i][4], 48);
      txt(sr, steps[i][1], { size: 12, lh: 17, font: FONT.bold, color: C.gray950, width: 142, fixed: true });
      txt(sr, steps[i][2], { size: 12, lh: 17, color: C.gray600, width: 348, fixed: true });
      button(sr, "Abrir", steps[i][4] === "care" ? "careSoft" : "ghost", 76, 28, steps[i][3]);
    }
    var startRow = row(hero, "Main start", 700, 54, 12);
    button(startRow, "Iniciar por canal", "primary", 190, 50, "pwa.passenger.1A");
    button(startRow, "WhatsApp directo", "secondary", 170, 50, "whatsapp.12A");
    button(startRow, "Admin operativo", "ghost", 160, 50, "dispatch.3B");
    var right = stack(root, "Prototype support", 500, 700, 16);
    right.x = 884;
    right.y = 390;
    var supportA = card(right, "Counter support", 500, 176, { fill: C.productAccent50, stroke: C.productAccent200, p: 20, shadow: "md" });
    badge(supportA, "Ruta de apoyo", "brand", 124);
    txt(supportA, "Counter walk-in aeropuerto", { size: 24, lh: 30, font: FONT.extrabold, color: C.productInk, width: 430, fixed: true });
    txt(supportA, "Aeropuerto -> destino en Lima, con cola de conductores; alimenta el mismo despacho.", { size: 14, lh: 21, color: C.gray700, width: 430, fixed: true });
    button(supportA, "Iniciar counter", "secondary", 170, 44, "counter.4A");
    var supportB = card(right, "Wellbeing support", 500, 190, { fill: C.care50, stroke: C.care300, p: 20, shadow: "md" });
    badge(supportB, "Arco final", "care", 108);
    txt(supportB, "Objeto olvidado desde /p/[token]", { size: 24, lh: 30, font: FONT.extrabold, color: C.care700, width: 430, fixed: true });
    txt(supportB, "No es otra app: es soporte del mismo viaje con responsable humano.", { size: 14, lh: 21, color: C.gray700, width: 430, fixed: true });
    button(supportB, "Abrir objeto perdido", "care", 190, 44, "wellbeing.13A");
    var supportC = card(right, "Company hook", 500, 128, { fill: C.white, stroke: C.gray200, p: 20, shadow: "md" });
    badge(supportC, "Lamina anzuelo", "gray", 128);
    txt(supportC, "Empresa cliente fuera del recorrido", { size: 21, lh: 28, font: FONT.bold, color: C.gray950, width: 430, fixed: true });
    txt(supportC, "Se enuncia como futuro corporativo; no roba la ruta principal.", { size: 13, lh: 20, color: C.gray600, width: 430, fixed: true });
    var supportD = card(right, "Commercial truth", 500, 150, { fill: C.warning50, stroke: C.warning200, p: 20, shadow: "md" });
    badge(supportD, "Demo realista", "warning", 128);
    txt(supportD, "Construido / simulado / enunciado", { size: 22, lh: 28, font: FONT.bold, color: C.warning700, width: 430, fixed: true });
    txt(supportD, "WABA, pagos y SUNAT se declaran simulados; biometria y app pasajero nativa se aplazan.", { size: 13, lh: 20, color: C.gray700, width: 430, fixed: true });
    var footer = card(root, "Prototype footer", 1330, 78, { fill: C.brand900, stroke: C.brand700, p: 18, shadow: "md", layout: { mode: "HORIZONTAL", p: 18, gap: 14, cross: "CENTER" } });
    footer.x = 54;
    footer.y = 1180;
    txt(footer, "Narrativa correcta", { size: 16, lh: 22, font: FONT.bold, color: C.siteYellow, width: 160, fixed: true });
    txt(footer, "No se vende como chatbot ni SaaS generico. Se vende como operacion aeroportuaria formal, calida y trazable.", { size: 16, lh: 24, color: C.white, width: 1080, fixed: true });
  }

  async function wirePrototype() {
    var diagnostics = { wired: 0, missing: 0, failed: 0 };
    for (var i = 0; i < actionNodes.length; i += 1) {
      var a = actionNodes[i];
      var action;
      if (a.action === BACK_ACTION) {
        action = { type: "BACK" };
      } else if (a.action === CLOSE_ACTION) {
        action = { type: "CLOSE" };
      } else {
        var target = registry[a.target];
        if (!target) {
          diagnostics.missing += 1;
          // Mark missing targets so they're visible in the layer panel for debugging
          a.node.name = a.node.name + " [sin-destino:" + a.target + "]";
          continue;
        }
        action = {
          type: "NODE",
          destinationId: target.id,
          navigation: a.navigation || "NAVIGATE",
          transition: a.transition || { type: "DISSOLVE", easing: { type: "EASE_OUT" }, duration: 0.25 },
          preserveScrollPosition: false,
          resetScrollPosition: a.resetScrollPosition !== undefined ? a.resetScrollPosition : true,
          resetInteractiveComponents: true
        };
        if (a.overlayRelativePosition) action.overlayRelativePosition = a.overlayRelativePosition;
      }
      if (!action) {
        // Mark missing targets so they're visible in the layer panel for debugging
        a.node.name = a.node.name + " [sin-accion]";
        continue;
      }
      var reaction = {
        trigger: { type: "ON_CLICK" },
        // `action` is kept for older files; `actions` is required by current Figma.
        action: action,
        actions: [action]
      };
      try {
        if (typeof a.node.setReactionsAsync === "function") {
          await a.node.setReactionsAsync([reaction]);
        } else {
          a.node.reactions = [reaction];
        }
        diagnostics.wired += 1;
        a.node.name = a.node.name + " ->" + (a.target || a.action);
      } catch (e) {
        diagnostics.failed += 1;
        a.node.name = a.node.name + " [err-reaction:" + (e.message || "?") + "]";
      }
    }
    return diagnostics;
  }

  try {
    await loadFonts();
    cleanFile();
    createPaintAndTextStyles();
    createDesignVariables();

    await page("00 Cover", true);
    createCover();
    await page("01 Design Tokens");
    createTokens();
    await page("02 Components");
    createComponents();
    await page("03 Patterns");
    createPatterns();
    await page("04 Iconography & Assets");
    createIcons();
    await page("05 Entrada y Link Pasajero");
    renderMobilePage("05 Entrada y Link Pasajero", passengerScreens);
    await page("06 App Conductor");
    renderMobilePage("06 App Conductor", driverScreens);
    await page("07 Admin Operativo");
    renderDesktopPage("07 Admin Operativo", dispatcherScreens);
    await page("08 Counter Aeropuerto");
    renderDesktopPage("08 Counter Aeropuerto", counterScreens);
    await page("09 Empresa Cliente");
    renderDesktopPage("09 Empresa Cliente", companyScreens);
    await page("10 WhatsApp Solicitante");
    renderDesktopPage("10 WhatsApp Solicitante", whatsappScreens);
    await page("11 Soporte de Viaje");
    var allWellbeingDesktop = [];
    var allWellbeingMobile = [];
    for (var wb = 0; wb < wellbeingScreens.length; wb += 1) {
      if (wellbeingScreens[wb].kind === "mobile") allWellbeingMobile.push(wellbeingScreens[wb]);
      else allWellbeingDesktop.push(wellbeingScreens[wb]);
    }
    renderMobilePage("11 Soporte mobile", allWellbeingMobile);
    renderDesktopPage("11 Soporte desktop", allWellbeingDesktop, 0, 1900);
    await page("12 Estados");
    renderDesktopPage("12 Estados", stateScreens);
    await page("13 Prototype");
    createPrototype();
    // Reload all pages into memory so setReactionsAsync can access nodes on any page.
    // In dynamic-page mode, switching pages may evict earlier pages; this ensures they're live.
    if (typeof figma.loadAllPagesAsync === "function") {
      await figma.loadAllPagesAsync();
    }
    var wireStats = await wirePrototype();
    // Register prototype flow starting points so the Play button knows where to begin.
    try {
      var proto13 = pageIndex["13 Prototype"];
      if (proto13 && registry["prototype.home"]) {
        proto13.flowStartingPoints = [{ name: "Demo A-Z Airport Ops Premium", nodeId: registry["prototype.home"].id }];
      }
      var p00 = pageIndex["00 Cover"];
      if (p00 && registry["cover.00"]) {
        p00.flowStartingPoints = [{ name: "Cover -> mapa de demo", nodeId: registry["cover.00"].id }];
      }
      var p05 = pageIndex["05 Entrada y Link Pasajero"];
      if (p05 && registry["pwa.passenger.1A"]) {
        p05.flowStartingPoints = [{ name: "Entrada multicanal", nodeId: registry["pwa.passenger.1A"].id }];
      }
      var p06 = pageIndex["06 App Conductor"];
      if (p06 && registry["driver.2A"]) {
        p06.flowStartingPoints = [{ name: "App conductor", nodeId: registry["driver.2A"].id }];
      }
      var p07 = pageIndex["07 Admin Operativo"];
      if (p07 && registry["dispatch.3A"]) {
        p07.flowStartingPoints = [{ name: "Despachador", nodeId: registry["dispatch.3A"].id }];
      }
      var p08 = pageIndex["08 Counter Aeropuerto"];
      if (p08 && registry["counter.4A"]) {
        p08.flowStartingPoints = [{ name: "Counter aeropuerto", nodeId: registry["counter.4A"].id }];
      }
      var p09 = pageIndex["09 Empresa Cliente"];
      if (p09 && registry["company.5A"]) {
        p09.flowStartingPoints = [{ name: "Empresa cliente", nodeId: registry["company.5A"].id }];
      }
      var p10 = pageIndex["10 WhatsApp Solicitante"];
      if (p10 && registry["whatsapp.12A"]) {
        p10.flowStartingPoints = [{ name: "Inicio solicitante por WhatsApp", nodeId: registry["whatsapp.12A"].id }];
      }
      var p11 = pageIndex["11 Soporte de Viaje"];
      if (p11 && registry["wellbeing.13A"]) {
        p11.flowStartingPoints = [{ name: "Soporte de viaje", nodeId: registry["wellbeing.13A"].id }];
      }
    } catch (fspErr) {}
    await figma.setCurrentPageAsync(pageIndex["13 Prototype"]);
    figma.currentPage.selection = [registry["prototype.home"]];
    figma.viewport.scrollAndZoomIntoView([registry["prototype.home"]]);
    figma.notify("Listo: " + wireStats.wired + " enlaces de prototipo cableados. Abre Prototype y pulsa Play.");
    figma.closePlugin("Taxi Green Master · 14 páginas + prototipo navegable generados.");
  } catch (err) {
    figma.notify("Error generando Taxi Green Master: " + err.message);
    throw err;
  }
})();
