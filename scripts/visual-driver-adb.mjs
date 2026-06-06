// Visual QA for apps/driver through plain ADB.
//
// This is intentionally independent from Maestro's Android driver. It works well
// with BlueStacks or a physical Android device when Maestro cannot install its
// helper APKs reliably.
//
// Usage:
//   DRIVER_DEVICE_UDID=127.0.0.1:5556 pnpm visual:driver:adb
//   DRIVER_DEVICE_UDID=<adb-serial> DRIVER_APK=/path/app.apk INSTALL_APK=1 pnpm visual:driver:adb

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const UDID = process.env.DRIVER_DEVICE_UDID ?? '127.0.0.1:5556';
const APK = process.env.DRIVER_APK ?? '';
const INSTALL_APK = process.env.INSTALL_APK === '1';
const CLEAR_STATE = process.env.CLEAR_STATE !== '0';
const PIN = process.env.DRIVER_PIN ?? '1234';
const OUT = process.env.DRIVER_VISUAL_OUT ?? 'artifacts/maestro';
const APP_ID = 'pe.taxigreen.driver';

mkdirSync(OUT, { recursive: true });

function adb(args, options = {}) {
  return execFileSync('adb', ['-s', UDID, ...args], {
    encoding: options.encoding ?? 'utf8',
    stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });
}

function adbBinary(args) {
  const result = spawnSync('adb', ['-s', UDID, ...args], {
    encoding: null,
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr?.toString() || `adb ${args.join(' ')} failed`);
  }
  return result.stdout;
}

function log(message) {
  process.stdout.write(`${message}\n`);
}

function listDevices() {
  return execFileSync('adb', ['devices', '-l'], { encoding: 'utf8', env: process.env });
}

async function ensureDevice() {
  const before = listDevices();
  if (!before.includes(`${UDID}`) || !before.match(new RegExp(`${UDID.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+device`))) {
    log(`Connecting ADB device ${UDID}...`);
    execFileSync('adb', ['connect', UDID], { stdio: 'inherit', env: process.env });
    await sleep(1500);
  }

  const after = listDevices();
  if (!after.match(new RegExp(`${UDID.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+device`))) {
    throw new Error(`Device ${UDID} is not online.\n${after}`);
  }
}

function attr(node, name) {
  const match = node.match(new RegExp(`${name}="([^"]*)"`));
  return match?.[1] ?? '';
}

function parseBounds(value) {
  const match = value.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!match) return null;
  const [, x1, y1, x2, y2] = match.map(Number);
  return { x: Math.round((x1 + x2) / 2), y: Math.round((y1 + y2) / 2) };
}

function nodesFromXml(xml) {
  return [...xml.matchAll(/<node\b[^>]*>/g)].map((match) => match[0]);
}

function findNode(xml, pattern) {
  const re = pattern instanceof RegExp ? pattern : new RegExp(`^${escapeRegExp(pattern)}$`, 'i');
  return nodesFromXml(xml).find((node) => {
    const text = attr(node, 'text');
    const desc = attr(node, 'content-desc');
    return re.test(text) || re.test(desc);
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function dumpXml() {
  adb(['shell', 'uiautomator', 'dump', '/sdcard/window.xml'], { stdio: ['ignore', 'pipe', 'ignore'] });
  const xml = adb(['shell', 'cat', '/sdcard/window.xml']);
  writeFileSync(join(OUT, 'driver-adb-window.xml'), xml);
  return xml;
}

async function waitForNode(pattern, timeoutMs = 30000) {
  const started = Date.now();
  let lastXml = '';
  while (Date.now() - started < timeoutMs) {
    try {
      lastXml = await dumpXml();
      const node = findNode(lastXml, pattern);
      if (node) return { node, xml: lastXml };
    } catch {
      // UIAutomator can briefly fail while the app is launching.
    }
    await sleep(1000);
  }
  throw new Error(`Timed out waiting for ${pattern.toString()}. Last XML length: ${lastXml.length}`);
}

async function tap(pattern) {
  const { node } = await waitForNode(pattern);
  const center = parseBounds(attr(node, 'bounds'));
  if (!center) throw new Error(`Node has invalid bounds: ${node}`);
  adb(['shell', 'input', 'tap', String(center.x), String(center.y)]);
  await sleep(450);
}

function screenshot(name) {
  const file = join(OUT, `${name}.png`);
  writeFileSync(file, adbBinary(['exec-out', 'screencap', '-p']));
  log(`screenshot: ${file}`);
}

async function main() {
  await ensureDevice();

  if (INSTALL_APK) {
    if (!APK || !existsSync(APK)) throw new Error(`DRIVER_APK not found: ${APK || '<empty>'}`);
    log(`Installing ${APK}...`);
    execFileSync('adb', ['-s', UDID, 'install', '-r', '-d', APK], { stdio: 'inherit', env: process.env });
  }

  adb(['shell', 'settings', 'put', 'system', 'accelerometer_rotation', '0']);
  adb(['shell', 'settings', 'put', 'system', 'user_rotation', '0']);
  adb(['shell', 'input', 'keyevent', 'KEYCODE_WAKEUP']);

  if (CLEAR_STATE) {
    adb(['shell', 'pm', 'clear', APP_ID], { stdio: ['ignore', 'pipe', 'ignore'] });
  }

  adb(['shell', 'am', 'force-stop', APP_ID]);
  adb(['shell', 'am', 'start', '-W', '-n', `${APP_ID}/.MainActivity`], { stdio: 'inherit' });

  await waitForNode(/Ingreso de conductor|Turno conductor/, 45000);
  screenshot('driver-adb-01-login');

  let xml = await dumpXml();
  if (!findNode(xml, /Turno conductor/)) {
    for (const digit of PIN) {
      await tap(digit);
    }
    screenshot('driver-adb-02-pin');
    await tap(/Entrar/);
    await waitForNode(/Turno conductor|Error|Credenciales/i, 45000);
  }

  screenshot('driver-adb-03-home');
  xml = await dumpXml();

  if (findNode(xml, /Abrir asignaci[oó]n/i)) {
    await tap(/Abrir asignaci[oó]n/i);
    await waitForNode(/Punto de encuentro|Destino|Voy al punto|Ya llegu[eé]|Iniciar viaje|Finalizar/i, 45000);
    screenshot('driver-adb-04-asignacion');
  } else {
    log('No active assignment button found; home screenshot captured only.');
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
