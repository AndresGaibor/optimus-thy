const archivos = import.meta.glob('../design-system/components/**/*.tsx', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const encabezados = [
  '## Cuándo usarlo',
  '## Cuándo no usarlo',
  '## Anatomía',
  '## Accesibilidad',
  '## Responsive',
];

const componentesPorCarpeta = Object.entries(archivos)
  .filter(([archivo]) => !archivo.endsWith('.stories.tsx'))
  .reduce<Record<string, string[]>>((grupos, [archivo, contenido]) => {
    const carpeta = archivo.split('/').at(-2);
    if (!carpeta) return grupos;

    const declaraciones = [
      ...contenido.matchAll(/export\s+(function|const)\s+([A-Za-z_$][\w$]*)\b/g),
    ];
    for (const [indice, declaracion] of declaraciones.entries()) {
      const nombre = declaracion[2];
      if (!nombre || !/^[A-Z][A-Za-z0-9]*$/.test(nombre)) continue;

      const indiceDeclaracion = declaracion.index ?? 0;
      const inicio = indiceDeclaracion + declaracion[0].length;
      const fin = declaraciones[indice + 1]?.index ?? contenido.length;
      const cuerpo = contenido.slice(inicio, fin);
      // Solo se documentan componentes PascalCase declarados como función, forwardRef/memo o flecha;
      // las constantes en MAYÚSCULAS_CON_GUIONES y los re-exports de identificadores ajenos quedan fuera.
      const esComponente =
        declaracion[1] === 'function' ||
        /^\s*(?::[^=]+)?=\s*(?:forwardRef|memo)\b/.test(cuerpo) ||
        /^\s*(?::[^=]+)?=\s*(?:async\s*)?(?:\([^)]*\)|[\w$]+)\s*=>/.test(cuerpo);
      if (!esComponente) continue;

      const jsdoc = contenido.slice(0, indiceDeclaracion).match(/\/\*\*([\s\S]*?)\*\/\s*$/)?.[1];
      const faltantes = jsdoc
        ? encabezados.filter((encabezado) => !jsdoc.includes(encabezado))
        : [];
      if (!jsdoc || faltantes.length > 0) {
        const detalle = jsdoc
          ? `${nombre} → ${faltantes.join(', ')}`
          : `${nombre} → sin bloque JSDoc`;
        (grupos[carpeta] ??= []).push(`${archivo} → ${detalle}`);
      }
    }

    return grupos;
  }, {});

for (const carpeta of ['atoms', 'molecules', 'organisms']) {
  test(`componentes de ${carpeta} documentados`, () => {
    const faltantes = componentesPorCarpeta[carpeta] ?? [];
    expect(faltantes, `Componentes sin documentar en ${carpeta}:\n${faltantes.join('\n')}`).toEqual(
      [],
    );
  });
}

test('el glob encuentra al menos 44 componentes', () => {
  expect(
    Object.keys(archivos).filter((archivo) => !archivo.endsWith('.stories.tsx')).length,
  ).toBeGreaterThanOrEqual(44);
});
