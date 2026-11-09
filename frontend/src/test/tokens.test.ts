import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const tokens = readFileSync('src/styles/tokens.css', 'utf8');

function blockFor(selector: string, source = tokens): string {
  const m = source.match(new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\n\\}`));
  if (!m) return '';
  return m[1] ?? '';
}

function mediaBlockFor(query: string, source = tokens): string {
  const idx = source.search(new RegExp(query));
  if (idx < 0) return '';
  const open = source.indexOf('{', idx);
  if (open < 0) return '';
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  return '';
}

function tokenValue(block: string, token: string): string | undefined {
  const m = block.match(new RegExp(`^\\s*${token}\\s*:\\s*([^;]+);`, 'm'));
  if (!m) return undefined;
  return m[1]?.trim();
}

const root = blockFor(':root');
const dark = blockFor('\\.dark');
const theme = blockFor('@theme inline');

const typographyTokens = [
  '--font-sans',
  '--font-mono',
  '--font-weight-regular',
  '--font-weight-medium',
  '--font-weight-semibold',
  ...['display', 'headline', 'title', 'body', 'small', 'caption'].flatMap((name) => [
    `--text-${name}`,
    `--text-${name}--line-height`,
    `--text-${name}--font-weight`,
  ]),
];
const spacingTokens = [
  '--space-unit',
  '--space-field',
  '--space-card',
  '--space-section',
  '--space-gutter',
];
const shadowTokens = ['--shadow-xs', '--shadow-sm', '--shadow-md', '--shadow-panel'];
const motionTokens = [
  '--duration-fast',
  '--duration-base',
  '--duration-slow',
  '--ease-standard',
  '--ease-emphasized',
];
const clinicalTokens = [
  '--class-normal',
  '--class-normal-foreground',
  '--class-benigno',
  '--class-benigno-foreground',
  '--class-maligno',
  '--class-maligno-foreground',
];

const themeMappings: Array<[string, string]> = [
  ['--font-sans', '--font-family-sans'],
  ['--font-mono', '--font-family-mono'],
  ['--font-weight-regular', '--type-weight-regular'],
  ['--font-weight-medium', '--type-weight-medium'],
  ['--font-weight-semibold', '--type-weight-semibold'],
  ...['display', 'headline', 'title', 'body', 'small', 'caption'].flatMap(
    (name) =>
      [
        [`--text-${name}`, `--type-size-${name}`],
        [`--text-${name}--line-height`, `--type-line-height-${name}`],
        [`--text-${name}--font-weight`, `--type-weight-${name}`],
      ] as Array<[string, string]>,
  ),
  ['--spacing', '--space-unit'],
  ...['field', 'card', 'section', 'gutter'].map(
    (name) => [`--spacing-${name}`, `--space-${name}`] as [string, string],
  ),
  ...['xs', 'sm', 'md', 'panel'].map(
    (name) => [`--shadow-${name}`, `--elevation-${name}`] as [string, string],
  ),
  ['--transition-duration-fast', '--duration-fast'],
  ['--transition-duration-base', '--duration-base'],
  ['--transition-duration-slow', '--duration-slow'],
  ['--default-transition-duration', '--duration-base'],
  ['--default-transition-timing-function', '--motion-ease-standard'],
  ['--ease-standard', '--motion-ease-standard'],
  ['--ease-emphasized', '--motion-ease-emphasized'],
  ...clinicalTokens.map((token) => [`--color-${token.slice(2)}`, token] as [string, string]),
  ['--radius-control', '--control-radius'],
  ['--radius-card', '--card-radius'],
  ['--radius-panel', '--panel-radius'],
];

describe('tokens de diseño', () => {
  it('define las categorías nuevas en los temas claro y oscuro', () => {
    const categories = [
      typographyTokens,
      spacingTokens,
      shadowTokens,
      motionTokens,
      clinicalTokens,
    ];

    for (const token of categories.flat()) {
      expect(tokenValue(root, token), `${token} en :root`).toBeDefined();
      expect(tokenValue(dark, token), `${token} en .dark`).toBeDefined();
    }
  });

  it('mantiene los colores clínicos distintos de éxito y peligro en ambos temas', () => {
    for (const themeBlock of [root, dark]) {
      for (const token of ['--class-normal', '--class-benigno', '--class-maligno']) {
        expect(tokenValue(themeBlock, token)).not.toBe(tokenValue(themeBlock, '--success'));
        expect(tokenValue(themeBlock, token)).not.toBe(tokenValue(themeBlock, '--danger'));
      }
    }
  });

  it('define duraciones, curvas y los overrides de movimiento reducido', () => {
    for (const token of ['--duration-fast', '--duration-base', '--duration-slow']) {
      expect(tokenValue(root, token)).toMatch(/^\d+(?:\.\d+)?m?s$/);
    }

    expect(tokenValue(root, '--ease-standard')).toBe('var(--motion-ease-standard)');
    expect(tokenValue(root, '--ease-emphasized')).toBe('var(--motion-ease-emphasized)');
    expect(tokenValue(root, '--motion-ease-standard')).toMatch(/^cubic-bezier\(/);
    expect(tokenValue(root, '--motion-ease-emphasized')).toMatch(/^cubic-bezier\(/);

    const reducedMotion = mediaBlockFor('@media\\s*\\(prefers-reduced-motion:\\s*reduce\\)');
    expect(reducedMotion).not.toBe('');
    expect(reducedMotion).toContain('--duration-fast: 0.01ms');
    expect(reducedMotion).toContain('--duration-base: 0.01ms');
    expect(reducedMotion).toContain('--duration-slow: 0.01ms');
    for (const token of [
      '--ease-standard',
      '--ease-emphasized',
      '--motion-ease-standard',
      '--motion-ease-emphasized',
    ]) {
      expect(reducedMotion).toMatch(new RegExp(`${token}:\\s*linear`));
    }
  });

  it('mapea los tokens nuevos a las utilidades del tema Tailwind', () => {
    for (const [themeToken, sourceToken] of themeMappings) {
      expect(tokenValue(theme, themeToken), `${themeToken} en @theme inline`).toBe(
        `var(${sourceToken})`,
      );
    }
  });
});
