#!/usr/bin/env bun
/**
 * Comprobador de composición visual (gate UI).
 * Escanea frontend/src y aplica reglas con baseline ratchet.
 *
 * Uso (desde frontend/):
 *   bun scripts/comprobar-ui.ts           # check
 *   bun scripts/comprobar-ui.ts --actualizar
 *   bun scripts/comprobar-ui.ts --json
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, posix, resolve } from 'node:path';

type Regla =
  'control-crudo' | 'color-literal' | 'valor-arbitrario' | 'estilo-inline' | 'css-fuera-de-tokens';

interface Violacion {
  ruta: string;
  linea: number;
  regla: Regla;
  fragmento: string;
  exceptuada?: boolean;
}

type Baseline = Record<string, Partial<Record<Regla, number>>>;

const RAIZ_SRC = 'src';
const RUTA_BASELINE = 'scripts/ui-baseline.json';
const EXTENSIONES_FUENTE = new Set(['.ts', '.tsx', '.css']);
const DIRS_IGNORADOS = new Set(['node_modules', 'dist', 'catalogo-static', '.git']);

const REGLAS_CONTROLES = /<(button|input|select|textarea|dialog|details|summary)\b/g;
const REGLA_COLOR = /#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(/g;
const REGLA_ARBITRARIO =
  /\[[^\]\s]*(?:\d(?:px|rem|em|vh|vw|dvh|%|fr|ch)|[0-9]+\/[0-9]+|calc\(|var\(--)[^\]\s]*\]/g;
const REGLA_ESTILO_INLINE = /style=\{\{/g;
const EXCEPCION = /\/\/\s*ui-excepcion:\s*(.+)$/;

function normalizar(ruta: string): string {
  return ruta.split('\\').join('/');
}

function esExcluido(ruta: string): boolean {
  const n = normalizar(ruta);
  if (n.includes('src/api/schema.d.ts')) return true;
  if (n.includes('src/test/setup.ts')) return true;
  if (/\.test\.[^.]+$/.test(n) || /\.spec\.[^.]+$/.test(n)) return true;
  if (/\.stories\.[^.]+$/.test(n)) return true;
  return false;
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
    } else if (EXTENSIONES_FUENTE.has(extname(entrada.name))) {
      rutas.push(rel);
    }
  }
  rutas.sort();
  return rutas;
}

function agregarCoincidencias(
  violaciones: Violacion[],
  ruta: string,
  lineas: string[],
  re: RegExp,
  regla: Regla,
  cuando: (ruta: string) => boolean,
): void {
  if (!cuando(ruta)) return;
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i] ?? '';
    const exc = EXCEPCION.exec(linea);
    re.lastIndex = 0;
    if (!re.test(linea)) continue;
    const t = linea.trim();
    violaciones.push({
      ruta,
      linea: i + 1,
      regla,
      fragmento: exc
        ? `excepcion: ${exc[1]?.trim() ?? ''}`
        : t.length > 120
          ? `${t.slice(0, 117)}...`
          : t,
      exceptuada: Boolean(exc),
    });
  }
}

function analizarArchivo(ruta: string, contenido: string): Violacion[] {
  const v: Violacion[] = [];
  if (esExcluido(ruta)) return v;
  const lineas = contenido.split(/\r?\n/);
  const ext = extname(ruta);
  const esTs = ext === '.ts' || ext === '.tsx';
  const esTsx = ext === '.tsx';
  const esCss = ext === '.css';
  const ds = normalizar(ruta).includes('src/design-system/');

  if (esTs) {
    agregarCoincidencias(v, ruta, lineas, REGLAS_CONTROLES, 'control-crudo', () => !ds);
    agregarCoincidencias(v, ruta, lineas, REGLA_ESTILO_INLINE, 'estilo-inline', () => esTsx && !ds);
    agregarCoincidencias(v, ruta, lineas, REGLA_COLOR, 'color-literal', () => !ds);
    agregarCoincidencias(v, ruta, lineas, REGLA_ARBITRARIO, 'valor-arbitrario', () => !ds);
  }
  if (esCss) {
    agregarCoincidencias(
      v,
      ruta,
      lineas,
      REGLA_COLOR,
      'color-literal',
      () => normalizar(ruta) !== 'src/styles/tokens.css' && !ds,
    );
    if (!normalizar(ruta).startsWith('src/styles/')) {
      for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i] ?? '';
        if (!linea.trim()) continue;
        const exc = EXCEPCION.exec(linea);
        const t = linea.trim();
        v.push({
          ruta,
          linea: i + 1,
          regla: 'css-fuera-de-tokens',
          fragmento: exc
            ? `excepcion: ${exc[1]?.trim() ?? ''}`
            : t.length > 120
              ? `${t.slice(0, 117)}...`
              : t,
          exceptuada: Boolean(exc),
        });
        break;
      }
    }
  }
  return v;
}

function contarViolaciones(violaciones: Violacion[]): Baseline {
  const base: Baseline = {};
  for (const v of violaciones) {
    if (v.exceptuada) continue;
    const porArchivo = (base[v.ruta] ??= {});
    porArchivo[v.regla] = (porArchivo[v.regla] ?? 0) + 1;
  }
  return base;
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
  for (const ruta of Object.keys(base).sort()) {
    const reglas = base[ruta] ?? {};
    const reglasOrdenadas: Partial<Record<Regla, number>> = {};
    for (const regla of (Object.keys(reglas) as Regla[]).sort()) {
      reglasOrdenadas[regla] = reglas[regla];
    }
    ordenada[ruta] = reglasOrdenadas;
  }
  await writeFile(resolve(raiz, RUTA_BASELINE), `${JSON.stringify(ordenada, null, 2)}\n`, 'utf8');
}

async function ejecutar(raiz: string): Promise<{
  violaciones: Violacion[];
  activas: Violacion[];
  archivosEscaneados: string[];
}> {
  const archivos = await listarArchivos(raiz, RAIZ_SRC);
  const violaciones: Violacion[] = [];
  for (const ruta of archivos) {
    const contenido = await readFile(resolve(raiz, ruta), 'utf8');
    violaciones.push(...analizarArchivo(ruta, contenido));
  }
  const activas = violaciones.filter((v) => !v.exceptuada);
  return { violaciones, activas, archivosEscaneados: archivos };
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const raiz = process.cwd();
  const json = args.has('--json');
  const actualizar = args.has('--actualizar');
  const cmdActualizar = 'bun run ui:check --actualizar';

  const { violaciones, activas, archivosEscaneados } = await ejecutar(raiz);
  const actual = contarViolaciones(violaciones);

  if (actualizar) {
    await guardarBaseline(raiz, actual);
    const total = Object.values(actual).reduce(
      (acc, reglas) => acc + Object.values(reglas ?? {}).reduce((a, n) => a + (n ?? 0), 0),
      0,
    );
    console.log(`ui-baseline actualizado: ${total} violaciones registradas en ${RUTA_BASELINE}.`);
    return;
  }

  const base = await cargarBaseline(raiz);
  const escaneados = new Set(archivosEscaneados.map(normalizar));
  const fallos: string[] = [];

  for (const [ruta, reglas] of Object.entries(base)) {
    if (!escaneados.has(normalizar(ruta))) {
      fallos.push(
        `${ruta}: entrada de baseline sin archivo en disco (registrado=${JSON.stringify(reglas)}). Actualiza con \`${cmdActualizar}\`.`,
      );
      continue;
    }
    for (const [regla, registrado] of Object.entries(reglas ?? {}) as [Regla, number][]) {
      const n = actual[ruta]?.[regla] ?? 0;
      if (n > registrado) {
        fallos.push(
          `${ruta} [${regla}]: conteo ${n} supera baseline ${registrado} (crece). Actual: ${n}, registrado: ${registrado}.`,
        );
      } else if (n < registrado) {
        fallos.push(
          `${ruta} [${regla}]: conteo ${n} menor que baseline ${registrado} (registro obsoleto). Actual: ${n}, registrado: ${registrado}. Actualiza con \`${cmdActualizar}\`.`,
        );
      }
    }
  }

  for (const [ruta, reglas] of Object.entries(actual)) {
    for (const [regla, n] of Object.entries(reglas ?? {}) as [Regla, number][]) {
      if ((base[ruta]?.[regla] ?? 0) === 0 && n > 0) {
        fallos.push(
          `${ruta} [${regla}]: violación nueva, conteo ${n} sin registrar (registrado: 0/ausente). Actual: ${n}. Actualiza con \`${cmdActualizar}\` solo si es deuda aceptada.`,
        );
      }
    }
  }

  const exceptuadas = violaciones.filter((v) => v.exceptuada);

  if (json) {
    console.log(
      JSON.stringify(
        { ok: fallos.length === 0, fallos, activas, exceptuadas, actual, base },
        null,
        2,
      ),
    );
  } else if (fallos.length > 0) {
    console.error(`ui:check FALLÓ: ${fallos.length} problema(s) de baseline/composición.`);
    for (const f of fallos) console.error(`  ${f}`);
    if (exceptuadas.length > 0) {
      console.error(`  (${exceptuadas.length} ocurrencia(s) con ui-excepcion, listadas aparte)`);
      for (const v of exceptuadas)
        console.error(`  EXCEPCION ${v.ruta}:${v.linea}:${v.regla}: ${v.fragmento}`);
    }
  } else {
    console.log('ui:check OK (sin violaciones nuevas).');
  }

  if (fallos.length > 0) process.exit(1);
}

await main();
