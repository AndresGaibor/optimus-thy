#!/usr/bin/env bun
// Errores de consola WebSocket/HMR/Vite y pageerror WebSocket/HMR se informan como ruido; los demás pageerror y consola sí fallan.
// Para evidencia sin HMR, ejecutar `bun run catalogo:build` y servir `catalogo-static`.
import { chromium, type Browser, type Page } from 'playwright';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, join } from 'path';

type Item = { id?: string; ruta?: string; titulo?: string; estado?: string; critica?: boolean };
type Res = { ancho: number; alto: number };
type Informe = {
  id: string;
  archivo: string;
  dimensiones: string;
  texto: number;
  errores: string[];
  ruido: string[];
  fallo?: string;
};

const args = process.argv.slice(2);
const valor = (n: string, d = ''): string => {
  const i = args.indexOf(n);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : d;
};
if (args.includes('--ayuda') || args.includes('-h')) {
  console.log(`Uso: bun e2e/capturar.ts [opciones]
  --base <url>         Catálogo Storybook (def: http://127.0.0.1:6104)
  --app <url>          Captura la app en lugar del catálogo
  --criticas           Solo historias marcadas como críticas
  --aprobar            Guarda las capturas como línea base
  --comparar           Compara las capturas con la línea base local
  --anchos 1440x900,1366x768
  --salida <dir>       (def: test-results/capturas)
  --tema claro|oscuro  (def: claro, modo catálogo)
  --rutas /a,/b        Rutas protegidas (modo app, requiere QA_CORREO/QA_PASSWORD)
  --json               Informe JSON
Ejemplos:
  bun e2e/capturar.ts --solo pantallas-médico-pacientes-hu-031--con-pacientes,pantallas-médico-resultados--default
  bun e2e/capturar.ts --todo --anchos 1440x900,1366x768`);
  process.exit(0);
}

const base = valor('--base', 'http://127.0.0.1:6104').replace(/\/$/, '');
const appUrl = valor('--app');
const tema = valor('--tema', 'claro');
const salida = valor('--salida', 'test-results/capturas');
const jsonOut = args.includes('--json');
const anchos: Res[] = valor('--anchos', '1440x900,1366x768')
  .split(',')
  .map((s) => {
    const [w, h] = s.split('x').map(Number);
    return { ancho: w, alto: h };
  });
const manifiesto = JSON.parse(
  readFileSync(join(import.meta.dir, 'capturas.json'), 'utf8'),
) as Item[];
let items: Item[];
if (appUrl) {
  const rutasProt = valor('--rutas') ? valor('--rutas').split(',').filter(Boolean) : [];
  items = args.includes('--solo')
    ? valor('--solo')
        .split(',')
        .map((ruta) => ({ id: ruta, ruta }))
    : [
        { id: '/', ruta: '/' },
        { id: '/login', ruta: '/login' },
        ...rutasProt.map((ruta) => ({ id: ruta, ruta })),
      ];
} else if (args.includes('--solo')) {
  items = valor('--solo')
    .split(',')
    .map((id) => manifiesto.find((item) => item.id === id) ?? { id });
} else {
  items = args.includes('--criticas')
    ? manifiesto.filter((item) => item.critica === true)
    : manifiesto; // --todo o sin argumento de selección
}

const cssSinAnim = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}`;

async function preparar(page: Page): Promise<void> {
  await page.addStyleTag({ content: cssSinAnim });
  await page.waitForFunction(() => document.fonts?.ready).catch(() => {});
  await page
    .waitForFunction(() => (document.body?.innerText?.trim().length ?? 0) > 0, null, {
      timeout: 10000,
    })
    .catch(() => {});
}

function dimPng(buf: Uint8Array): string {
  if (buf.length < 24) return 'desconocida';
  const ihdr = String.fromCharCode(buf[12], buf[13], buf[14], buf[15]);
  if (ihdr !== 'IHDR') return 'desconocida';
  const v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  return `${v.getUint32(16)}x${v.getUint32(20)}`; // big-endian
}

async function compararImagenes(
  page: Page,
  actual: Uint8Array,
  base: Uint8Array,
): Promise<{ fraccion: number; mismasDimensiones: boolean }> {
  const base64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');
  return page.evaluate(
    async ({ actual64, base64 }) => {
      const bitmap = async (encoded: string) => {
        const bytes = Uint8Array.from(atob(encoded), (caracter) => caracter.charCodeAt(0));
        return createImageBitmap(new Blob([bytes], { type: 'image/png' }));
      };
      const [imagenActual, imagenBase] = await Promise.all([bitmap(actual64), bitmap(base64)]);
      const mismasDimensiones =
        imagenActual.width === imagenBase.width && imagenActual.height === imagenBase.height;
      if (!mismasDimensiones) return { fraccion: 1, mismasDimensiones };
      const canvasActual = new OffscreenCanvas(imagenActual.width, imagenActual.height);
      const canvasBase = new OffscreenCanvas(imagenBase.width, imagenBase.height);
      const contextoActual = canvasActual.getContext('2d');
      const contextoBase = canvasBase.getContext('2d');
      if (!contextoActual || !contextoBase) throw new Error('No se pudo crear el contexto 2D');
      contextoActual.drawImage(imagenActual, 0, 0);
      contextoBase.drawImage(imagenBase, 0, 0);
      const pixelesActuales = contextoActual.getImageData(
        0,
        0,
        imagenActual.width,
        imagenActual.height,
      ).data;
      const pixelesBase = contextoBase.getImageData(0, 0, imagenBase.width, imagenBase.height).data;
      let diferentes = 0;
      for (let i = 0; i < pixelesActuales.length; i += 4) {
        if (
          Math.abs(pixelesActuales[i]! - pixelesBase[i]!) > 8 ||
          Math.abs(pixelesActuales[i + 1]! - pixelesBase[i + 1]!) > 8 ||
          Math.abs(pixelesActuales[i + 2]! - pixelesBase[i + 2]!) > 8 ||
          Math.abs(pixelesActuales[i + 3]! - pixelesBase[i + 3]!) > 8
        )
          diferentes++;
      }
      return {
        fraccion: diferentes / (imagenActual.width * imagenActual.height),
        mismasDimensiones,
      };
    },
    { actual64: base64(actual), base64: base64(base) },
  );
}

function nombreArchivo(id: string, res: Res): string {
  const ascii = id.normalize('NFD').replace(/\p{M}/gu, '');
  const limpio = ascii.replace(/^\//, '').replace(/[^\p{L}\p{N}_-]+/gu, '-') || 'inicio';
  return join(salida, `${limpio}--${res.ancho}x${res.alto}.png`);
}

function esTransitorio(errores: string[], fallo?: string): boolean {
  if (errores.some((e) => e.startsWith('page:'))) return false;
  const texto = [...errores, fallo ?? ''].join('\n');
  return /net::ERR_[A-Z_]+|NS_ERROR_NET|ECONNRESET|ETIMEDOUT|EPIPE/i.test(texto);
}

async function intento(browser: Browser, item: Item, res: Res): Promise<Informe> {
  const id = item.id || item.ruta || 'captura';
  const archivo = nombreArchivo(id, res);
  const errores: string[] = [];
  const ruido: string[] = [];
  const historiaError = item.estado === 'error';
  const page = await browser.newPage({ viewport: { width: res.ancho, height: res.alto } });
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const mensaje = `console: ${m.text()}`;
    if (/WebSocket|wss?:|HMR|hot-update|vite/i.test(m.text())) ruido.push(mensaje);
    // En historias de estado `error`, la respuesta de error del API simulado (MSW) es intencional.
    // GET /auth/me devuelve 401 en arranque sin sesión: intencional, se trata como ruido.
    else if (/Failed to load resource/i.test(m.text()) && /\b401\b/.test(m.text()))
      ruido.push(mensaje);
    else if (
      historiaError &&
      /Failed to load resource/i.test(m.text()) &&
      /\b[45]\d\d\b/.test(m.text())
    )
      ruido.push(mensaje);
    else errores.push(mensaje);
  });
  page.on('pageerror', (e) => {
    if (/WebSocket|wss?:|HMR|hot-update/i.test(e.message)) ruido.push(`page: ${e.message}`);
    else errores.push(`page: ${e.message}`);
  });
  try {
    const url = item.ruta
      ? `${appUrl.replace(/\/$/, '')}${item.ruta}`
      : `${base}/iframe.html?id=${id}&viewMode=story&globals=theme:${tema}`;
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    // Las historias de estado «cargando» dejan una petición abierta a propósito: se espera la red sin fallar.
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await preparar(page);
    const texto = await page.evaluate(() => document.body.innerText.trim().length);
    await page.screenshot({ path: archivo, fullPage: false });
    const dims = dimPng(readFileSync(archivo));
    const inf: Informe = { id, archivo, dimensiones: dims, texto, errores, ruido };
    if (texto === 0) inf.fallo = 'captura en blanco';
    if (errores.length) inf.fallo = (inf.fallo ? `${inf.fallo}; ` : '') + 'errores de página';
    return inf;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { id, archivo, dimensiones: 'n/a', texto: 0, errores, ruido, fallo: msg };
  } finally {
    await page.close();
  }
}

async function capturarItem(browser: Browser, item: Item, res: Res): Promise<Informe> {
  const primero = await intento(browser, item, res);
  if (!primero.fallo) return primero;
  if (!esTransitorio(primero.errores, primero.fallo)) return primero;
  return intento(browser, item, res);
}

mkdirSync(salida, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  if (appUrl) {
    const rutasProt = valor('--rutas') ? valor('--rutas').split(',').filter(Boolean) : [];
    if (rutasProt.length && !(process.env.QA_CORREO && process.env.QA_PASSWORD)) {
      console.warn('Aviso: faltan QA_CORREO/QA_PASSWORD; se omiten rutas protegidas sin fallar.');
      items = items.filter((it) => !rutasProt.includes(it.ruta ?? ''));
    } else if (rutasProt.length) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      try {
        await page.goto(`${appUrl.replace(/\/$/, '')}/login`, { waitUntil: 'networkidle' });
        await page.fill(
          'input[type="email"],input[name*="correo"],input[name*="email"]',
          process.env.QA_CORREO ?? '',
        );
        await page.fill('input[type="password"]', process.env.QA_PASSWORD ?? '');
        await page.click(
          'button[type="submit"],button:has-text("Ingresar"),button:has-text("Iniciar")',
        );
        await page.waitForLoadState('networkidle').catch(() => {});
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn('Aviso: login falló, se omiten rutas protegidas:', msg);
        items = items.filter((it) => !rutasProt.includes(it.ruta ?? ''));
      }
      await page.close();
    }
  }
  const informes: Informe[] = [];
  for (const it of items) for (const r of anchos) informes.push(await capturarItem(browser, it, r));
  if (args.includes('--aprobar')) {
    const directorioBase = join(import.meta.dir, 'linea-base');
    mkdirSync(directorioBase, { recursive: true });
    for (const informe of informes)
      if (existsSync(informe.archivo))
        copyFileSync(informe.archivo, join(directorioBase, basename(informe.archivo)));
  }
  if (args.includes('--comparar')) {
    const pagina = await browser.newPage();
    await pagina.goto('about:blank');
    const diferencias: { nombre: string; fraccion: number }[] = [];
    for (const informe of informes) {
      if (!existsSync(informe.archivo)) continue;
      const nombre = basename(informe.archivo);
      const archivoBase = join(import.meta.dir, 'linea-base', nombre);
      if (!existsSync(archivoBase)) {
        diferencias.push({ nombre, fraccion: 1 });
        informe.fallo = informe.fallo
          ? `${informe.fallo}; sin línea base: ejecuta --aprobar`
          : 'sin línea base: ejecuta --aprobar';
        continue;
      }
      const resultado = await compararImagenes(
        pagina,
        readFileSync(informe.archivo),
        readFileSync(archivoBase),
      );
      diferencias.push({ nombre, fraccion: resultado.fraccion });
      if (!resultado.mismasDimensiones || resultado.fraccion > 0.005) {
        informe.fallo = informe.fallo
          ? `${informe.fallo}; diferencia visual ${resultado.fraccion}`
          : `diferencia visual ${resultado.fraccion}`;
      }
    }
    await pagina.close();
    mkdirSync('test-results/capturas', { recursive: true });
    writeFileSync(
      join('test-results/capturas', 'diferencias.json'),
      JSON.stringify(diferencias, null, 2),
    );
  }
  if (jsonOut) console.log(JSON.stringify(informes, null, 2));
  else
    for (const i of informes)
      console.log(
        `${i.fallo ? 'FALLO' : 'OK'}  ${i.id}  ${i.dimensiones}  ${i.texto} chars  ${i.archivo}${i.errores.length ? `  [${i.errores[0]}]` : ''}${i.ruido.length ? `  ruido: ${i.ruido.length}` : ''}${i.fallo ? `  <- ${i.fallo}` : ''}`,
      );
  const fallos = informes.filter((i) => i.fallo).length;
  console.log(`\nTotal: ${informes.length}  Fallos: ${fallos}`);
  process.exit(fallos ? 1 : 0);
} finally {
  await browser.close();
}
