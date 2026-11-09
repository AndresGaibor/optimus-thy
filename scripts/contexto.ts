// CLI de contexto del monorepo (sin dependencias). Uso: bun scripts/contexto.ts <cmd>
import { basename, join, relative, sep } from "node:path";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const ROOT = process.cwd();
const EX = new Set(["node_modules","dist",".git",".codegraph","catalogo-static",".venv","__pycache__",".mypy_cache",".pytest_cache",".ruff_cache","coverage",".storybook-cache"]);
const BIN = /\.(png|jpe?g|gif|webp|ico|pdf|woff2?|ttf|eot|mp4|webm|zip|gz|tar|keras|h5|pt|pth|onnx|ckpt|pyc|lock)$/i;
const json = process.argv.includes("--json");
const [cmd, ...rest] = process.argv.slice(2).filter((a) => a !== "--json");

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (EX.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (!BIN.test(e.name)) out.push(p);
  }
  return out;
}
const lines = (p: string) => { try { return readFileSync(p, "utf8").split(/\n/).length; } catch { return 0; } };
const rel = (p: string) => relative(ROOT, p).split(sep).join("/");
const isTest = (p: string) => /(^|\/)(tests?|__tests__)\//.test(p) || /\.(test|spec)\.[^.]+$/.test(p);
const areaTerms: Record<string, string[]> = {
  pacientes: ["paciente"], roles: ["role", "rol", "permis"], usuarios: ["usuario", "user"],
  inferencia: ["/ia/", "inferen", "pipeline", "model"], tokens: ["token", "theme", "css-var"],
  storybook: ["storybook", ".stories"], ocr: ["/ocr/"], ia: ["/ia/"],
};
const hit = (p: string, terms: string[]) => { const r = rel(p).toLowerCase(); return terms.some((t) => r.includes(t)); };

function task(area: string) {
  const terms = areaTerms[area.toLowerCase()] ?? [area.toLowerCase()];
  const all = walk(ROOT);
  const archivos = all.filter((p) => !isTest(p) && hit(p, terms)).sort((a, b) => a.length - b.length)
    .slice(0, 8).map((p) => ({ archivo: rel(p), lineas: lines(p) })).filter((f) => existsSync(join(ROOT, f.archivo)));
  const tests = all.filter((p) => isTest(p) && hit(p, terms))
    .slice(0, 3).map((p) => ({ archivo: rel(p), lineas: lines(p) })).filter((f) => existsSync(join(ROOT, f.archivo)));
  return { area, archivos, tests };
}

function owner(ruta: string) {
  const r = ruta.replace(/^\.\//, "");
  const capa =
    r.startsWith("frontend/src/design-system/") ? "frontend/design-system" :
    r.startsWith("frontend/src/screens/") ? "frontend/screens" :
    r.startsWith("frontend/src/pages/") ? "frontend/pages" :
    r.startsWith("frontend/src/api/") ? "frontend/api" :
    r.startsWith("frontend/") ? "frontend" :
    r.startsWith("backend/app/") || r.startsWith("backend/") ? "backend/app" :
    r.startsWith("ia/app/") || r.startsWith("ia/") ? "ia/app" :
    r.startsWith("ocr/app/") || r.startsWith("ocr/") ? "ocr/app" :
    /^(docker|infra\/|compose)/.test(r) ? "infra" : r.startsWith("docs/") ? "docs" : "desconocida";
  const cmds: Record<string, string> = {
    frontend: "cd frontend && bun run lint && bun run format:check && bun run typecheck && bun run test && bun run build && bun run catalogo:build && bun run ui:check && bun run tamanos",
    "frontend/design-system": "cd frontend && bun run lint && bun run typecheck && bun run test && bun run build && bun run ui:check && bun run tamanos",
    "frontend/screens": "cd frontend && bun run lint && bun run typecheck && bun run test && bun run build && bun run ui:check && bun run tamanos",
    "frontend/pages": "cd frontend && bun run lint && bun run typecheck && bun run test && bun run build && bun run ui:check && bun run tamanos",
    "frontend/api": "cd frontend && bun run lint && bun run typecheck && bun run test && bun run build && bun run ui:check && bun run tamanos",
    "backend/app": "cd backend && ruff format --check . && ruff check . && mypy app && REQUIRE_TEST_DB=1 pytest",
    "ia/app": "cd ia && pytest", "ocr/app": "cd ocr && pytest",
    infra: "docker compose config", docs: "(sin comando automatizado)", desconocida: "(sin comando mapeado)",
  };
  return { ruta: r, capa, verificacion: cmds[capa] };
}

function testFor(ruta: string) {
  const base = basename(ruta).replace(/\.(py|tsx?|jsx?)$/, "").replace(/^test_/, "");
  const tests = [...new Set(walk(ROOT).filter(isTest).map(rel).filter((r) => {
    const b = basename(r).replace(/\.(test|spec)\.[^.]+$/, "").replace(/^test_/, "");
    return b === base || rel(r).toLowerCase().includes(base.toLowerCase());
  }))].map((archivo) => ({ archivo, lineas: lines(join(ROOT, archivo)) }));
  return { ruta, tests };
}

type TaskOut = { area: string; archivos: { archivo: string; lineas: number }[]; tests: { archivo: string; lineas: number }[] };
type OwnerOut = { ruta: string; capa: string; verificacion: string };
type TestOut = { ruta: string; tests: { archivo: string; lineas: number }[] };
type Out = TaskOut | OwnerOut | TestOut | string;
const out = (v: Out) => console.log(json ? JSON.stringify(v, null, 2)
  : typeof v === "string" ? v
  : "archivos" in v ? `área: ${v.area}\narchivos (<=8):\n${v.archivos.map((f)=>` - ${f.archivo} (${f.lineas} líneas)`).join("\n")||" (ninguno)"}\ntests (<=3):\n${v.tests.map((f)=>` - ${f.archivo} (${f.lineas} líneas)`).join("\n")||" (ninguno)"}`
  : "capa" in v ? `ruta: ${v.ruta}\ncapa: ${v.capa}\nverificación: ${v.verificacion}`
  : `ruta: ${v.ruta}\ntests relacionados:\n${v.tests.map((f)=>` - ${f.archivo} (${f.lineas} líneas)`).join("\n")||" (ninguno)"}`);

if (cmd === "task" && rest[0]) out(task(rest[0]));
else if (cmd === "owner" && rest[0]) out(owner(rest[0]));
else if (cmd === "test" && rest[0]) out(testFor(rest[0]));
else out("contexto.ts - índice rápido de contexto\n  bun scripts/contexto.ts task pacientes\n  bun scripts/contexto.ts owner frontend/src/screens/doctor/ImagesScreen.tsx\n  bun scripts/contexto.ts test backend/app/api/pacientes.py\n  opción: --json");
