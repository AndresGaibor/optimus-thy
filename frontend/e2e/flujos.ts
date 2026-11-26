#!/usr/bin/env bun
import { chromium, type Browser, type Page } from 'playwright';
import { once } from 'events';
import { createServer } from 'net';
import type { AuthSession } from '../src/api/auth';
import { datos, ids, sesionDe } from './flujos.datos';

const args = process.argv.slice(2);
const valor = (nombre: string): string | undefined => {
  const indice = args.indexOf(nombre);
  if (indice < 0) return undefined;
  const valor = args[indice + 1];
  if (!valor || valor.startsWith('--')) throw new Error(`Falta el valor de ${nombre}.`);
  return valor;
};

if (args.includes('--ayuda') || args.includes('-h')) {
  console.log(`Uso: bun e2e/flujos.ts [--base <url>] [--ayuda]

Ejecuta los recorridos E2E médico e investigador contra el build de producción.
La API se simula en el navegador; --base permite usar una aplicación ya servida.`);
  process.exit(0);
}

const frontendDir = import.meta.dir.replace(/\/e2e$/, '');
const baseExterna = valor('--base')?.replace(/\/$/, '');
let base = baseExterna ?? '';
type PreviewProcess = { exitCode: number | null; kill: () => void; exited: Promise<number> };
let servidor: PreviewProcess | null = null;
let navegador: Browser | null = null;
let correctos = 0;
let ejecutados = 0;
const nombres = ['Médico: paciente e inferencia', 'Investigador: métricas y datasets'];

async function puertoLibre(): Promise<number> {
  const temporal = createServer();
  temporal.listen(0, '127.0.0.1');
  await once(temporal, 'listening');
  const direccion = temporal.address();
  if (!direccion || typeof direccion === 'string') throw new Error('No se pudo obtener un puerto libre.');
  temporal.close();
  await once(temporal, 'close');
  return direccion.port;
}

async function iniciarPreview(): Promise<string> {
  const build = Bun.spawn(['bun', 'run', 'build'], {
    cwd: frontendDir,
    stdout: 'inherit',
    stderr: 'inherit',
    env: { ...process.env, VITE_API_URL: '/api' },
  });
  if ((await build.exited) !== 0) throw new Error('Falló el build de producción del frontend.');

  const port = await puertoLibre();
  servidor = Bun.spawn(['bunx', 'vite', 'preview', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: frontendDir,
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const url = `http://127.0.0.1:${port}`;
  for (let intento = 0; intento < 100; intento += 1) {
    if (servidor.exitCode !== null) throw new Error('El servidor de preview terminó antes de iniciar.');
    try {
      const respuesta = await fetch(url);
      if (respuesta.ok) return url;
    } catch {
      // Vite todavía está iniciando.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`El servidor de preview no respondió en ${url}.`);
}

function responder(status: number, cuerpo: unknown) {
  return { status, contentType: 'application/json', body: JSON.stringify(cuerpo) };
}

async function instalarApi(page: Page, rol: 'medico' | 'investigador'): Promise<{ inesperadas: string[] }> {
  let sesion: AuthSession | null = null;
  let inferenciaEncolada = false;
  const inesperadas: string[] = [];

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path === '/api/auth/login' && method === 'POST') {
      const body = request.postDataJSON() as { correo?: string };
      const correoEsperado = rol === 'medico' ? 'medico.e2e@example.test' : 'investigador.e2e@example.test';
      if (body.correo !== correoEsperado) {
        await route.fulfill(responder(401, { detail: 'Credenciales inválidas.' }));
        return;
      }
      sesion = sesionDe(rol);
      await route.fulfill(responder(200, sesion));
      return;
    }
    if (path === '/api/auth/me' && method === 'GET') {
      await route.fulfill(sesion ? responder(200, sesion) : responder(401, { detail: 'No autenticado.' }));
      return;
    }
    if (path === '/api/pacientes' && method === 'GET') {
      await route.fulfill(responder(200, { total: 1, items: [datos.paciente] }));
      return;
    }
    if (path === `/api/pacientes/${ids.paciente}` && method === 'GET') {
      await route.fulfill(responder(200, datos.pacienteDetalle));
      return;
    }
    if (path === `/api/casos/${ids.caso}` && method === 'GET') {
      await route.fulfill(responder(200, datos.caso));
      return;
    }
    if (path === `/api/casos/${ids.caso}/imagenes` && method === 'GET') {
      await route.fulfill(responder(200, { total: 1, items: [datos.imagen] }));
      return;
    }
    if (path === `/api/casos/${ids.caso}/consentimientos` && method === 'GET') {
      await route.fulfill(responder(200, { total: 1, items: [datos.consentimiento] }));
      return;
    }
    if (path === `/api/casos/${ids.caso}/inferencias` && method === 'GET') {
      await route.fulfill(
        responder(200, { total: inferenciaEncolada ? 1 : 0, items: inferenciaEncolada ? [datos.inferencia] : [] }),
      );
      return;
    }
    if (path === '/api/trabajos' && method === 'POST') {
      inferenciaEncolada = true;
      await route.fulfill(responder(201, datos.trabajoPendiente));
      return;
    }
    if (path === `/api/trabajos/${ids.trabajo}` && method === 'GET') {
      await route.fulfill(responder(200, datos.trabajoCompletado));
      return;
    }
    if (path === `/api/casos/${ids.caso}/cronologia` && method === 'GET') {
      await route.fulfill(responder(200, { items: [] }));
      return;
    }
    if (path === `/api/casos/${ids.caso}/ficha` && method === 'GET') {
      await route.fulfill(responder(200, datos.estadoFicha));
      return;
    }
    if (path === `/api/casos/${ids.caso}/ficha/historial` && method === 'GET') {
      await route.fulfill(responder(200, { items: [] }));
      return;
    }
    if (path === '/api/cohortes' && method === 'GET') {
      await route.fulfill(responder(200, { total: 0, items: [] }));
      return;
    }
    if (path === '/api/investigacion/metricas' && method === 'GET') {
      await route.fulfill(responder(200, [datos.metricas]));
      return;
    }
    if (path === '/api/investigacion/datasets' && method === 'GET') {
      await route.fulfill(responder(200, { total: 1, items: [datos.datasetResumen] }));
      return;
    }
    if (path === `/api/investigacion/datasets/${ids.dataset}` && method === 'GET') {
      await route.fulfill(responder(200, datos.dataset));
      return;
    }

    inesperadas.push(`${method} ${path}`);
    await route.fulfill(responder(404, { detail: 'Endpoint no simulado por flujos E2E.' }));
  });
  return { inesperadas };
}

async function flujoMedico(browser: Browser): Promise<void> {
  const page = await browser.newPage();
  const api = await instalarApi(page, 'medico');
  try {
    await page.goto(`${base}/login`);
    await page.getByLabel('Correo electrónico').fill('medico.e2e@example.test');
    await page.getByLabel('Contraseña').fill('clave-sintetica');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.getByRole('link', { name: 'Pacientes' }).click();
    await page.getByRole('table', { name: 'Pacientes registrados' }).getByText(datos.paciente.codigo).waitFor();
    await page.getByRole('button', { name: 'Ver detalle' }).click();
    const detalle = page.getByRole('dialog');
    await detalle.getByRole('heading', { name: 'Detalle del paciente' }).waitFor();
    await detalle.getByRole('button', { name: 'Abrir' }).click();
    await page.getByRole('heading', { name: `Caso ${datos.caso.codigo}` }).waitFor();
    await page.getByRole('button', { name: 'Analizar', exact: true }).click();
    await page.getByText('Confianza del detector', { exact: true }).waitFor({ timeout: 15_000 });
    await page.getByText('Resultado de IA: apoyo, no diagnóstico', { exact: true }).waitFor();
    await page.getByText('La inferencia orienta la revisión profesional y no constituye un diagnóstico.', { exact: true }).waitFor();
    const confianza = page.getByText('Confianza del detector', { exact: true }).locator('..');
    if (!(await confianza.getByText(/72/).isVisible())) throw new Error('No se mostró la confianza sintética del detector.');
    if (api.inesperadas.length) throw new Error(`Solicitudes API sin fixture: ${api.inesperadas.join(', ')}`);
  } finally {
    await page.close();
  }
}

async function flujoInvestigador(browser: Browser): Promise<void> {
  const page = await browser.newPage();
  const api = await instalarApi(page, 'investigador');
  try {
    await page.goto(`${base}/login`);
    await page.getByLabel('Correo electrónico').fill('investigador.e2e@example.test');
    await page.getByLabel('Contraseña').fill('clave-sintetica');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.getByRole('link', { name: 'Métricas' }).click();
    await page.getByRole('heading', { name: 'Métricas de acuerdo' }).waitFor();
    await page.getByRole('heading', { name: datos.metricas.modelo.nombre }).waitFor();
    await page.getByRole('link', { name: 'Datasets' }).click();
    await page.getByRole('heading', { name: 'Datasets anonimizados' }).waitFor();
    await page.getByRole('button', { name: `Abrir ${datos.datasetResumen.nombre}` }).click();
    await page.getByRole('table', { name: 'Filas anonimizadas del dataset' }).getByText('sujeto-e2e-001').waitFor();
    if (api.inesperadas.length) throw new Error(`Solicitudes API sin fixture: ${api.inesperadas.join(', ')}`);
  } finally {
    await page.close();
  }
}

async function ejecutar(nombre: string, flujo: (browser: Browser) => Promise<void>): Promise<void> {
  ejecutados += 1;
  try {
    if (!navegador) throw new Error('Chromium no está disponible.');
    await flujo(navegador);
    correctos += 1;
    console.log(`${nombre}: OK`);
  } catch (error) {
    console.error(`${nombre}: ERROR — ${error instanceof Error ? error.message : String(error)}`);
  }
}

try {
  if (!baseExterna) base = await iniciarPreview();
  navegador = await chromium.launch({ args: ['--no-sandbox'] });
  await ejecutar(nombres[0]!, flujoMedico);
  await ejecutar(nombres[1]!, flujoInvestigador);
} catch (error) {
  console.error(`E2E flujos: ERROR — ${error instanceof Error ? error.message : String(error)}`);
} finally {
  if (navegador) await navegador.close();
  if (servidor) {
    servidor.kill();
    await servidor.exited;
  }
  console.log(`Resumen: ${correctos}/${ejecutados} flujos correctos.`);
  if (ejecutados !== nombres.length || correctos !== nombres.length) process.exitCode = 1;
}
