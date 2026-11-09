#!/usr/bin/env bun
/**
 * Comprobador de tamaño de archivos (gate) con baseline ratchet.
 *
 * Límites (líneas físicas, incluye comentarios y vacías):
 * - src/pages/**, src/screens/** (salvo fixtures), src/layout/**, src/design-system/** → 220
 * - src/screens/fixtures/** y src/**\/fixtures/** (datos sintéticos, no UI) → 300
 * - hooks (use*.ts(x) y src/**\/hooks/**) → 150
 * - resto de src/** → 300
 * Exentos: *.test.*, *.stories.*, src/api/schema.d.ts
 *
 * Uso (desde frontend/):
 *   bun scripts/tamanos.ts
 *   bun scripts/tamanos.ts --actualizar
 *   bun scripts/tamanos.ts --json
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, extname, posix, resolve } from 'node:path';

type Baseline = Record<string, number>;

const RAIZ_SRC = 'src';
const RUTA_BASELINE = 'scripts/tamanos-baseline.json';
const EXTENSIONES = new Set(['.ts', '.tsx']);
const DIRS_IGNORADOS = new Set(['node_modules', 'dist', 'catalogo-static', '.git']);

function normalizar(ruta: string): string {
  return ruta.split('\\').join('/');
}

function esExento(ruta: string): boolean {
  const n = normalizar(ruta);
  if (n.includes('src/api/schema.d.ts')) return true;
  if (/\.test\.[^.]+$/.test(n) || /\.spec\.[^.]+$/.test(n)) return true;
  if (/\.stories\.[^.]+$/.test(n)) return true;
  return false;
}

function limitePara(ruta: string): number {
  const n = normalizar(ruta);
  const base = basename(n);
  if (/^use.*\.(ts|tsx)$/.test(base) || n.includes('/hooks/')) return 150;
  if (n.startsWith('src/screens/fixtures/') || n.includes('/fixtures/')) return 300;
  if (
    n.startsWith('src/pages/') ||
    n.startsWith('src/screens/') ||
    n.startsWith('src/layout/') ||
    n.startsWith('src/design-system/')
  ) {
    return 220;
  }
  return 300;
}

async function listarArchivos(raiz: string, dir: string): Promise<string[]> {
  const abs = resolve(raiz, dir);
  let entradas;
  try {
    entradas = await readdir(abs, { withFileTypes: true });
  } catch {
    return [];
  }
  const rutas: string[] = [];
  for (const entrada of entradas) {
    if (DIRS_IGNORADOS.has(entrada.name)) continue;
    const rel = posix.join(normalizar(dir), entrada.name);
    if (entrada.isDirectory()) {
      rutas.push(...(await listarArchivos(raiz, rel)));
    } else if (EXTENSIONES.has(extname(entrada.name))) {
      rutas.push(rel);
    }
  }
  rutas.sort();
  return rutas;
}

interface Medicion {
  ruta: string;
  lineas: number;
  limite: number;
}

async function medir(raiz: string): Promise<Medicion[]> {
  const archivos = await listarArchivos(raiz, RAIZ_SRC);
  const mediciones: Medicion[] = [];
  for (const ruta of archivos) {
    if (esExento(ruta)) continue;
    const contenido = await readFile(resolve(raiz, ruta), 'utf8');
    const lineas = contenido.length === 0 ? 0 : contenido.split(/\r?\n/).length;
    mediciones.push({ ruta, lineas, limite: limitePara(ruta) });
  }
  return mediciones;
}

async function cargarBaseline(raiz: string): Promise<Baseline> {
  try {
    const txt = await readFile(resolve(raiz, RUTA_BASELINE), 'utf8');
    return JSON.parse(txt) as Baseline;
  } catch {
    return {};
  }
}

async function guardarBaseline(raiz: string, base: Baseline): Promise<void> {
  const ordenada: Baseline = {};
  for (const ruta of Object.keys(base).sort()) ordenada[ruta] = base[ruta] as number;
  await writeFile(resolve(raiz, RUTA_BASELINE), `${JSON.stringify(ordenada, null, 2)}\n`, 'utf8');
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const raiz = process.cwd();
  const json = args.has('--json');
  const actualizar = args.has('--actualizar');
  const cmdActualizar = 'bun run tamanos --actualizar';

  const mediciones = await medir(raiz);
  const porRuta = new Map(mediciones.map((m) => [m.ruta, m]));

  if (actualizar) {
    const base: Baseline = {};
    for (const m of mediciones) {
      if (m.lineas > m.limite) base[m.ruta] = m.lineas;
    }
    await guardarBaseline(raiz, base);
    console.log(
      `tamanos-baseline actualizado: ${Object.keys(base).length} archivo(s) registrado(s) en ${RUTA_BASELINE}.`,
    );
    for (const [ruta, lineas] of Object.entries(base).sort()) {
      console.log(`  ${ruta}: ${lineas} líneas (límite ${limitePara(ruta)})`);
    }
    return;
  }

  const base = await cargarBaseline(raiz);
  const fallos: string[] = [];

  for (const [ruta, registrado] of Object.entries(base).sort()) {
    const m = porRuta.get(ruta);
    if (!m) {
      fallos.push(
        `${ruta}: entrada de baseline sin archivo en disco (registrado: ${registrado}). Actualiza con \`${cmdActualizar}\`.`,
      );
      continue;
    }
    if (m.lineas > registrado) {
      fallos.push(
        `${ruta}: ${m.lineas} líneas supera baseline ${registrado} (límite ${m.limite}). Actual: ${m.lineas}, registrado: ${registrado}.`,
      );
    } else if (m.lineas < registrado) {
      fallos.push(
        `${ruta}: ${m.lineas} líneas menor que baseline ${registrado} (registro obsoleto, límite ${m.limite}). Actual: ${m.lineas}, registrado: ${registrado}. Actualiza con \`${cmdActualizar}\`.`,
      );
    }
  }

  for (const m of mediciones) {
    if (m.lineas <= m.limite) continue;
    if (base[m.ruta] === undefined) {
      fallos.push(
        `${m.ruta}: ${m.lineas} líneas excede límite ${m.limite} (no registrado en baseline). Actual: ${m.lineas}, registrado: ausente. Actualiza con \`${cmdActualizar}\` solo si es deuda aceptada.`,
      );
    }
  }

  const registrados = Object.entries(base).sort();
  if (json) {
    console.log(
      JSON.stringify({ ok: fallos.length === 0, fallos, registrados, baseline: base }, null, 2),
    );
  } else {
    if (fallos.length === 0) {
      console.log('tamanos OK.');
    } else {
      console.error(`tamanos FALLÓ: ${fallos.length} problema(s) de baseline/tamaño.`);
      for (const f of fallos) console.error(`  ${f}`);
    }
    console.log(`Archivos registrados en baseline (${registrados.length}):`);
    for (const [ruta, lineas] of registrados) {
      console.log(`  ${ruta}: ${lineas} (límite ${limitePara(ruta)})`);
    }
  }

  if (fallos.length > 0) process.exit(1);
}

await main();
