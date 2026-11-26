# Diseño: curva ROC y distribución de probabilidades

## Contexto del código

- `frontend/src/screens/researcher/ModelMetrics.tsx` compone la pantalla con `FilterBar`,
  `StatCard`, `ConfusionMatrix`, `TrendBars` y secciones de `ModelMetricsSections.tsx`.
- Los datos vienen de `frontend/src/screens/fixtures/researcher.ts`; los tipos, de
  `frontend/src/screens/fixtures/types.ts`. Es una superficie de demostración: nada de ella
  consulta el backend.
- `TrendBars` es el único gráfico de serie del sistema de diseño; no tiene tabla equivalente.

## Decisiones

1. **Dos organismos específicos, no un motor de gráficos.** `RocCurve` y
   `ProbabilityDistribution` viven en `components/organisms/` con barril en `index.ts`. Se
   descarta generalizar `TrendBars` (cambio de interfaz usada por otras pantallas) y se
   descarta dibujar SVG dentro de la pantalla (regla de diseño: fuera del sistema de diseño no
   hay controles ni estilos propios).
2. **SVG con tokens y texto, nunca solo color.** `RocCurve` dibuja la curva con
   `className="text-primary"` sobre `currentColor` y la diagonal con `text-muted-foreground`
   punteada; el AUC se escribe como texto. `ProbabilityDistribution` agrupa dos series con
   `TONE_CLASSES` y rotula cada valor, así que la lectura no depende del color.
3. **Tabla equivalente siempre presente.** Ambas figuras envuelven la tabla en un `<details>`
   con `<summary>` («Ver tabla equivalente»): existe, es accesible por teclado y no duplica a
   la vista el contenido que ya muestra el gráfico.
4. **Datos sintéticos declarados.** La pantalla mantiene el aviso de demostración; la fixture
   lleva 11 puntos de ROC con AUC 0,92 y seis intervalos de probabilidad con recuentos.

## API

```ts
export interface RocPoint { fpr: number; tpr: number }        // 0..1
export interface RocCurveProps {
  points: RocPoint[];
  auc: number;
  caption: string;
  className?: string;
}

export interface ProbabilityBin { bin: string; benignos: number; malignos: number }
export interface ProbabilityDistributionProps {
  bins: ProbabilityBin[];
  caption: string;
  className?: string;
}
```

## Riesgos

- `tamanos` (220 líneas por archivo): `ModelMetrics.tsx` ya está en 230. La integración debe
  extraer la sección de gráficos a `ModelMetricsSections.tsx` o a un archivo propio, no engordar
  la pantalla.
- El catálogo exige historia por componente con `tags: ['ai-generated']`, cinco secciones JSDoc
  y `play`/`expect` donde haya interacción (el `<details>` cuenta).
