#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const codePath = path.join(root, "code.js");
const masterPath = path.join(root, "screens.master.json");

const code = fs.readFileSync(codePath, "utf8");
const master = JSON.parse(fs.readFileSync(masterPath, "utf8"));

function findMatching(source, start, open, close) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (lineComment) {
      if (ch === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (ch === "*" && next === "/") {
        blockComment = false;
        i += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === "/" && next === "/") {
      lineComment = true;
      i += 1;
      continue;
    }
    if (ch === "/" && next === "*") {
      blockComment = true;
      i += 1;
      continue;
    }
    if (ch === "\"" || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === open) depth += 1;
    if (ch === close) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function parseTarget(actionText) {
  const direct = actionText.match(/target:\s*"([^"]+)"/);
  if (direct) return { kind: "node", target: direct[1] };
  const nav = actionText.match(/target:\s*navAction\(\s*"([^"]+)"/);
  if (nav) return { kind: "node", target: nav[1] };
  const figmaAction = actionText.match(/target:\s*\{\s*action:\s*(BACK_ACTION|CLOSE_ACTION)\s*\}/);
  if (figmaAction) return { kind: "figma", action: figmaAction[1] };
  return { kind: "missing" };
}

function parseScreens() {
  const screens = [];
  const seenStarts = new Set();
  const re = /\{\s*id:\s*"([^"]+)"/g;
  let match;

  while ((match = re.exec(code))) {
    if (seenStarts.has(match.index)) continue;
    seenStarts.add(match.index);
    const end = findMatching(code, match.index, "{", "}");
    if (end < 0) throw new Error(`No se pudo cerrar objeto de pantalla ${match[1]}`);
    const text = code.slice(match.index, end + 1);
    const screen = { id: match[1], actions: [] };

    const actionsAt = text.indexOf("actions:");
    if (actionsAt >= 0) {
      const open = text.indexOf("[", actionsAt);
      const close = findMatching(text, open, "[", "]");
      const actionsText = text.slice(open + 1, close);
      let cursor = 0;
      while (cursor < actionsText.length) {
        const nextObj = actionsText.indexOf("{", cursor);
        if (nextObj < 0) break;
        const nextClose = findMatching(actionsText, nextObj, "{", "}");
        if (nextClose < 0) break;
        const actionText = actionsText.slice(nextObj, nextClose + 1);
        const label = (actionText.match(/label:\s*"([^"]+)"/) || [null, "(sin label)"])[1];
        screen.actions.push({ label, ...parseTarget(actionText) });
        cursor = nextClose + 1;
      }
    }

    screens.push(screen);
    re.lastIndex = end + 1;
  }
  return screens;
}

function extraRegistryIds() {
  const ids = new Set();
  const registerRe = /registerScreen\(\s*"([^"]+)"/g;
  const registryRe = /registry\["([^"]+)"\]\s*=/g;
  let match;
  while ((match = registerRe.exec(code))) ids.add(match[1]);
  while ((match = registryRe.exec(code))) ids.add(match[1]);
  return ids;
}

function flattenFlowIds() {
  return (master.prototypeFlows || []).flatMap((flow) => flow.path || []);
}

function sameList(a, b) {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

const screens = parseScreens();
const screenIds = screens.map((screen) => screen.id);
const registryIds = extraRegistryIds();
for (const id of screenIds) registryIds.add(id);

const errors = [];
const warnings = [];
const idCounts = new Map();
for (const id of screenIds) idCounts.set(id, (idCounts.get(id) || 0) + 1);
for (const [id, count] of idCounts) {
  if (count > 1) errors.push(`ID duplicado en code.js: ${id} (${count} veces)`);
}

for (const flow of master.prototypeFlows || []) {
  for (const id of flow.path || []) {
    if (!registryIds.has(id)) errors.push(`screens.master.json declara target inexistente en "${flow.name}": ${id}`);
  }
}

const required = master.validation && master.validation.requiredProtagonistPath;
const protagonist = (master.prototypeFlows || [])[0] && master.prototypeFlows[0].path;
if (!required || !sameList(required, protagonist || [])) {
  errors.push("El flujo protagonista de screens.master.json no coincide exactamente con validation.requiredProtagonistPath");
}

const codeEdges = new Set();
const inbound = new Map();
for (const id of registryIds) inbound.set(id, 0);

for (const screen of screens) {
  if (screen.actions.length) {
    const primary = screen.actions[0];
    if (primary.kind === "missing") errors.push(`Accion primaria sin destino en ${screen.id}: ${primary.label}`);
  }
  for (const action of screen.actions) {
    if (action.kind === "missing") {
      errors.push(`Accion visible sin destino en ${screen.id}: ${action.label}`);
      continue;
    }
    if (action.kind === "node") {
      if (!registryIds.has(action.target)) {
        errors.push(`Target inexistente en code.js: ${screen.id} -> ${action.target} (${action.label})`);
      } else {
        codeEdges.add(`${screen.id}->${action.target}`);
        inbound.set(action.target, (inbound.get(action.target) || 0) + 1);
      }
    }
  }
}

for (const flow of master.prototypeFlows || []) {
  const pathIds = flow.path || [];
  for (let i = 0; i < pathIds.length - 1; i += 1) {
    inbound.set(pathIds[i + 1], (inbound.get(pathIds[i + 1]) || 0) + 1);
  }
}

const requiredCodeEdges = [
  ["whatsapp.12B", "whatsapp.12C"],
  ["whatsapp.12C", "dispatch.3C"],
  ["dispatch.3C", "driver.2C"],
  ["driver.2D", "pwa.passenger.1G2"],
  ["pwa.passenger.1G2", "pwa.passenger.1G3"],
  ["pwa.passenger.1G3", "pwa.passenger.1G4"],
  ["pwa.passenger.1G4", "pwa.passenger.1G5"],
  ["pwa.passenger.1G5", "wellbeing.13A"],
  ["wellbeing.13A", "wellbeing.13B"],
  ["wellbeing.13B", "wellbeing.13F"],
  ["wellbeing.13F", "wellbeing.13G"],
  ["wellbeing.13G", "wellbeing.13H"],
  ["wellbeing.13H", "wellbeing.13K"]
];
for (const [from, to] of requiredCodeEdges) {
  if (!codeEdges.has(`${from}->${to}`)) errors.push(`Falta edge obligatorio en code.js: ${from} -> ${to}`);
}

const allowedNoInbound = new Set([
  ...(master.validation && master.validation.entryScreens ? master.validation.entryScreens : []),
  ...(master.validation && master.validation.supportScreens ? master.validation.supportScreens : []),
  ...(master.validation && master.validation.archiveScreens ? master.validation.archiveScreens : [])
]);

for (const id of screenIds) {
  if ((inbound.get(id) || 0) === 0 && !allowedNoInbound.has(id)) {
    errors.push(`Pantalla sin inbound y sin rol entry/support/archive: ${id}`);
  }
}

if (master.validation && master.validation.manualFigmaChecks) {
  warnings.push(...master.validation.manualFigmaChecks);
}

if (errors.length) {
  console.error("Prototype validation FAILED");
  for (const error of errors) console.error(`- ${error}`);
  if (warnings.length) {
    console.error("\nManual checks pendientes:");
    for (const warning of warnings) console.error(`- ${warning}`);
  }
  process.exit(1);
}

console.log("Prototype validation OK");
console.log(`- Screens in code.js: ${screenIds.length}`);
console.log(`- Registry ids: ${registryIds.size}`);
console.log(`- Code edges checked: ${codeEdges.size}`);
console.log(`- Master flow ids checked: ${flattenFlowIds().length}`);
console.log("- Required protagonist route: OK");
if (warnings.length) {
  console.log("Manual Figma checks pendientes:");
  for (const warning of warnings) console.log(`- ${warning}`);
}
