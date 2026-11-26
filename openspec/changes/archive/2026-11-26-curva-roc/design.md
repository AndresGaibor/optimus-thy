# Diseño: curva ROC y distribución de probabilidades con tabla equivalente

## Contexto real del código

- `frontend/src/screens/researcher/RocScreen.tsx` (158 líneas) compone `DemoRoleLayout` +
  `ScreenFrame` + `ResearcherLayout`, dibuja la curva con un `RocPlot` local (`viewBox 0 0 380 300`,
  diagonal `var(--border)` punteada, ejes `var(--muted-foreground)`, curva `var(--brand)`) y la
  distribución con un `svg`/`rect` por intervalo (`var(--info)` y `var(--brand)`), con leyenda
  escrita y recuento `negativos / positivos` al lado.
- Los datos vienen de `frontend/src/screens/fixtures/investigador-extra.ts`:
  `DemoRocPoint {fpr,tpr}`, `DemoProbabilityBin {rango,negativos,positivos}` y
  `DemoRocScenario {titulo,auc,nota,curva,distribucion}`.
- `ModelMetrics.tsx` es otra pantalla (acuerdo modelo/decisión) y no participa de esta historia.

## Decisiones

1. **Dos organismos con la geometría existente.** `RocCurve` y `ProbabilityDistribution` viven en
   `components/organisms/` y copian el dibujo actual para no cambiar el aspecto; el valor añadido es
   la tabla equivalente y que el SVG deje de vivir en la pantalla.
2. **Tokens, no variables literales.** Los trazos pasan a `currentColor` con clases
   (`text-primary`, `text-muted-foreground`) y las series a `TONE_CLASSES` de `tones.ts`, así que el
   sistema de diseño sigue siendo el dueño del color.
3. **Tabla equivalente en `<details>`.** Existe siempre, se abre con teclado y no duplica a la vista
   lo que ya muestra el gráfico.
4. **Sin dependencias nuevas.** El SVG a mano basta; no se añade librería de gráficos.

## API

```ts
export interface RocCurveProps {
  points: { fpr: number; tpr: number }[];
  auc: number;
  caption: string;
  className?: string;
}

export interface ProbabilityDistributionProps {
  bins: { rango: string; negativos: number; positivos: number }[];
  caption: string;
  className?: string;
}
```

Los tipos del sistema de diseño son estructurales; no importa los fixtures de pantallas.

## Riesgos

- `tamanos`: límite de 220 líneas por archivo; `RocScreen` queda holgada al perder el SVG.
- El catálogo exige cinco secciones JSDoc y `play`/`expect` donde hay interacción (el `<details>`).
