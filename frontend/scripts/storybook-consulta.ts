#!/usr/bin/env bun
/**
 * Consulta del catálogo Storybook (envoltorio de `bunx storybook tools`).
 * Subcomandos: list | show --id <id> | stories --component <ruta> | changed
 * Caché en node_modules/.cache/storybook-consulta/ con TTL 10 min.
 * Usa --refresh para forzar consulta; imprime "(cache)" en stderr si sirve caché.
 */

import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TTL_MS = 10 * 60 * 1000;
const AQUÍ = dirname(fileURLToPath(import.meta.url));
const RAÍZ_FRONTEND = resolve(AQUÍ, '..');
const DIR_CACHÉ = join(RAÍZ_FRONTEND, 'node_modules', '.cache', 'storybook-consulta');

type Comando = 'list' | 'show' | 'stories' | 'changed';

function uso(): never {
  console.error(
    [
      'Uso: bun scripts/storybook-consulta.ts <comando> [opciones] [--refresh]',
      '  list                         Lista docs del catálogo',
      '  show --id <id>               Muestra documentación por id',
      '  stories --component <ruta>   Historias por archivo de componente',
      '  changed                      Historias afectadas por cambios locales',
    ].join('\n'),
  );
  process.exit(2);
}

function leerOpción(args: string[], nombre: string): string | undefined {
  const idx = args.indexOf(nombre);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

function argsHerramienta(comando: Comando, args: string[]): string[] {
  if (comando === 'list') return ['docs', 'list', '--withStoryIds'];
  if (comando === 'show') {
    const id = leerOpción(args, '--id');
    if (!id) {
      console.error('Falta --id <id>');
      process.exit(2);
    }
    return ['docs', 'show', '--id', id];
  }
  if (comando === 'stories') {
    const ruta = leerOpción(args, '--component');
    if (!ruta) {
      console.error('Falta --component <ruta>');
      process.exit(2);
    }
    const absoluta = resolve(RAÍZ_FRONTEND, ruta);
    return ['stories', 'find-by-component', '--componentPaths', absoluta];
  }
  if (comando === 'changed') return ['stories', 'changed'];
  uso();
}

function claveCaché(comando: Comando, args: string[]): string {
  const base = argsHerramienta(comando, args).join('\0');
  // Clave estable y segura para nombre de archivo.
  const hex = Array.from(new TextEncoder().encode(base))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${comando}-${hex}.txt`;
}

async function leerCaché(ruta: string, forzar: boolean): Promise<string | null> {
  if (forzar) return null;
  try {
    const info = await stat(ruta);
    if (Date.now() - info.mtimeMs > TTL_MS) return null;
    return await readFile(ruta, 'utf8');
  } catch {
    return null;
  }
}

async function ejecutar(herramienta: string[]): Promise<{ código: number; salida: string }> {
  const proc = Bun.spawn(['bunx', 'storybook', 'tools', ...herramienta], {
    cwd: RAÍZ_FRONTEND,
    stdout: 'pipe',
    stderr: 'pipe',
    env: process.env,
  });
  const [stdout, stderr, código] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (stderr) process.stderr.write(stderr);
  return { código, salida: stdout };
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const forzar = argv.includes('--refresh');
  const args = argv.filter((a) => a !== '--refresh');
  const comando = args[0] as Comando | undefined;
  if (!comando || !['list', 'show', 'stories', 'changed'].includes(comando)) uso();

  const herramienta = argsHerramienta(comando, args.slice(1));
  await mkdir(DIR_CACHÉ, { recursive: true });
  const rutaCaché = join(DIR_CACHÉ, claveCaché(comando, args.slice(1)));

  const cacheado = await leerCaché(rutaCaché, forzar);
  if (cacheado !== null) {
    process.stderr.write('(cache)\n');
    process.stdout.write(cacheado);
    return;
  }

  const { código, salida } = await ejecutar(herramienta);
  if (código === 0) {
    await writeFile(rutaCaché, salida, 'utf8');
  }
  process.stdout.write(salida);
  process.exit(código);
}

await main();
