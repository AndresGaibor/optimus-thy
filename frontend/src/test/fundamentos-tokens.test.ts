import { readFileSync } from 'node:fs';
import { fileURLToPath, URL as NodeURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const exactTokenFiles = import.meta.glob<string>('../styles/tokens.css', {
  eager: true,
  query: '?raw',
  import: 'default',
});
const foundationFiles = import.meta.glob<string>('../design-system/foundations/*.mdx', {
  eager: true,
  query: '?raw',
  import: 'default',
});
const movementFiles = import.meta.glob<string>(
  '../design-system/foundations/Movimiento.stories.tsx',
  {
    eager: true,
    query: '?raw',
    import: 'default',
  },
);

const corpus = [...Object.values(foundationFiles), ...Object.values(movementFiles)].join('\n');
const tokensCss =
  Object.values(exactTokenFiles).find((file) => file.includes(':root')) ??
  readFileSync(fileURLToPath(new NodeURL('../styles/tokens.css', import.meta.url)), 'utf8');
const rootBlock = tokensCss.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
const declarations = [...rootBlock.matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm)].map(
  ([, name, value]) => ({ name: name!, value: value!.trim() }),
);

const groups = [
  { name: 'primitivas', pattern: /^--primitive-/ },
  { name: 'espaciado', pattern: /^--space-/ },
  { name: 'elevación', pattern: /^--elevation-/ },
  { name: 'movimiento', pattern: /^--(?:duration-|motion-ease-)/ },
  { name: 'tipografía', pattern: /^--type-(?:size-|line-height-)/ },
  {
    name: 'dimensiones',
    pattern: /^--(?:control-radius|card-radius|panel-radius|sidebar-width|content-max-width)$/,
  },
];

describe('Documentación de tokens de fundamentos', () => {
  it('extrae las declaraciones del bloque :root', () => {
    expect(declarations.length, 'No se encontraron tokens en :root').toBeGreaterThan(0);
  });

  for (const group of groups) {
    it(`documenta nombres y valores del grupo ${group.name}`, () => {
      const missing = declarations
        .filter(({ name }) => group.pattern.test(name))
        .filter(
          ({ name, value }) =>
            !corpus.includes(name) ||
            (!value.startsWith('var(') && !value.startsWith('calc(') && !corpus.includes(value)),
        )
        .map(({ name }) => name);

      expect(missing, `Variables sin documentar en ${group.name}: ${missing.join(', ')}`).toEqual(
        [],
      );
    });
  }
});
