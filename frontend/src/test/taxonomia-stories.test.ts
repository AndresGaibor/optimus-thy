import { describe, expect, it } from 'vitest';

type MóduloHistoria = { default?: { title?: unknown; tags?: unknown } };

const RAÍCES_VÁLIDAS = [
  'Inicio/',
  'Aplicación/',
  'Sistema de diseño/',
  'Guías y calidad/',
] as const;
const SEGMENTOS_SISTEMA: Record<string, true> = {
  Fundamentos: true,
  Primitivos: true,
  Átomos: true,
  Moléculas: true,
  Organismos: true,
  Plantillas: true,
  Patrones: true,
};
const SEGMENTOS_APLICACIÓN: Record<string, true> = {
  'Mapa de pantallas': true,
  Flujos: true,
  Pública: true,
  Médico: true,
  Administrador: true,
  'Shell y navegación': true,
};
const módulos = import.meta.glob<MóduloHistoria>('../**/*.stories.tsx', { eager: true });
const mdx = import.meta.glob<string>('../**/*.mdx', {
  eager: true,
  query: '?raw',
  import: 'default',
});

function raízVálida(título: string): boolean {
  return RAÍCES_VÁLIDAS.some((r) => título.startsWith(r));
}

function segundoNivelValido(
  título: string,
  raíz: string,
  segmentos: Record<string, true>,
): boolean {
  if (!título.startsWith(raíz)) return true;
  return segmentos[título.slice(raíz.length).split('/')[0] ?? ''] === true;
}

describe('taxonomía de historias Storybook', () => {
  const entradas = Object.entries(módulos);

  it('encuentra historias en el catálogo', () => {
    expect(entradas.length).toBeGreaterThan(0);
  });
  it('las etiquetas de historias tienen una estructura válida', () => {
    for (const [archivo, módulo] of entradas) {
      const etiquetas = módulo.default?.tags;
      if (etiquetas === undefined) continue;

      expect(Array.isArray(etiquetas), `${archivo}: default.tags debe ser un array`).toBe(true);
      expect(
        (etiquetas as unknown[]).every((etiqueta) => typeof etiqueta === 'string'),
        `${archivo}: todos los elementos de default.tags deben ser strings`,
      ).toBe(true);
    }
  });

  for (const [archivo, módulo] of entradas) {
    it(`título válido: ${archivo}`, () => {
      const título = módulo.default?.title;
      expect(typeof título, `${archivo}: falta "title" en el export default`).toBe('string');
      const texto = String(título);

      expect(
        raízVálida(texto),
        `${archivo}: título "${texto}" no empieza por una raíz válida (${RAÍCES_VÁLIDAS.join(', ')})`,
      ).toBe(true);

      for (const [raíz, segmentos] of [
        ['Sistema de diseño/', SEGMENTOS_SISTEMA],
        ['Aplicación/', SEGMENTOS_APLICACIÓN],
      ] as const) {
        if (texto.startsWith(raíz)) {
          expect(
            segundoNivelValido(texto, raíz, segmentos),
            `${archivo}: título "${texto}" tiene un segundo nivel no válido bajo ${raíz}`,
          ).toBe(true);
        }
      }
    });
  }

  for (const [archivo, contenido] of Object.entries(mdx)) {
    it(`título MDX válido: ${archivo}`, () => {
      const títulos = [...contenido.matchAll(/<Meta\b([^>]*)\/>/g)]
        .map(([, atributos]) => atributos?.match(/\btitle=["']([^"']+)["']/)?.[1])
        .filter((título): título is string => título !== undefined);
      expect(títulos.length, `${archivo}: falta <Meta title="..." />`).toBeGreaterThan(0);
      for (const título of títulos) {
        expect(
          raízVálida(título),
          `${archivo}: título "${título}" no empieza por una raíz válida (${RAÍCES_VÁLIDAS.join(', ')})`,
        ).toBe(true);
      }
    });
  }

  it('no hay títulos duplicados', () => {
    const porTítulo = new Map<string, string[]>();
    for (const [archivo, módulo] of entradas) {
      const título = módulo.default?.title;
      if (typeof título !== 'string') continue;
      const lista = porTítulo.get(título) ?? [];
      lista.push(archivo);
      porTítulo.set(título, lista);
    }
    const duplicados = [...porTítulo.entries()].filter(([, archivos]) => archivos.length > 1);
    const detalle = duplicados
      .map(([título, archivos]) => `"${título}" => ${archivos.join(', ')}`)
      .join('\n');
    expect(duplicados, `Títulos duplicados:\n${detalle}`).toEqual([]);
  });
});
