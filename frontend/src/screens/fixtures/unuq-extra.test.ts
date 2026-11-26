import { describe, expect, it } from 'vitest';

import {
  calcularPuntajeUnuq,
  contribucionUnuq,
  resumirAtributosUnuq,
  sumaContribucionesUnuq,
  unuqItems,
  unuqItemsInvertidos,
} from './unuq-extra';

const respuestas = (valor: number) => unuqItems.map(() => valor);

describe('puntuación UnUQ', () => {
  it('devuelve 0 sin respuestas', () => {
    expect(calcularPuntajeUnuq([])).toBe(0);
  });

  it('puntúa 50 con todas las respuestas en el punto medio', () => {
    expect(calcularPuntajeUnuq(respuestas(3))).toBe(50);
  });

  it('puntúa 68 con todo en 5 y 32 con todo en 1 por los siete ítems invertidos', () => {
    expect(calcularPuntajeUnuq(respuestas(5))).toBe(68);
    expect(calcularPuntajeUnuq(respuestas(1))).toBe(32);
  });

  it('invierte los siete ítems negativos', () => {
    expect([...unuqItemsInvertidos]).toEqual([3, 6, 8, 13, 16, 18, 22]);
    expect(contribucionUnuq(1, 5)).toBe(4);
    expect(contribucionUnuq(3, 5)).toBe(0);
    expect(contribucionUnuq(3, 1)).toBe(4);
  });

  it('puntúa 73 con todo en 5 salvo el último ítem invertido en 1', () => {
    const valores = respuestas(5);
    valores[21] = 1;
    expect(sumaContribucionesUnuq(valores)).toBe(64);
    expect(calcularPuntajeUnuq(valores)).toBe(73);
  });

  it('puntúa 27 con todo en 1 salvo el último ítem invertido en 5', () => {
    const valores = respuestas(1);
    valores[21] = 5;
    expect(sumaContribucionesUnuq(valores)).toBe(24);
    expect(calcularPuntajeUnuq(valores)).toBe(27);
  });
});

describe('desglose por atributo', () => {
  it('reparte los 22 ítems en siete atributos con peso 1/7', () => {
    const resumen = resumirAtributosUnuq(respuestas(4));
    expect(resumen).toHaveLength(7);
    expect(resumen.map((r) => r.atributo)).toEqual([
      'Efectividad',
      'Eficiencia',
      'Satisfacción',
      'Aprendizaje y memoria',
      'Accesibilidad',
      'Usabilidad',
      'Aceptación',
    ]);
    expect(resumen.every((r) => Math.abs(r.peso - 1 / 7) < 1e-9)).toBe(true);
  });

  it('calcula Efectividad con su ítem invertido en escala 0–4', () => {
    const efectividad = resumirAtributosUnuq(respuestas(4))[0]!;
    expect(efectividad.promedio).toBe(2.33);
    expect(efectividad.puntaje).toBe(58);
  });

  it('puntúa 100 en todos los atributos cuando los 22 ítems están en el extremo favorable', () => {
    const favorables = unuqItems.map((item) => (unuqItemsInvertidos.has(item.id) ? 1 : 5));
    expect(calcularPuntajeUnuq(favorables)).toBe(100);
    expect(resumirAtributosUnuq(favorables).every((r) => r.puntaje === 100)).toBe(true);
  });
});
