import type { DemoModelMetric } from './types';

export interface DemoModelComparison {
  base: DemoModelMetric & { version: string };
  candidata: DemoModelMetric & { version: string };
}

export interface DemoRocPoint {
  fpr: number;
  tpr: number;
}

export interface DemoProbabilityBin {
  rango: string;
  negativos: number;
  positivos: number;
}

export interface DemoRocScenario {
  titulo: string;
  auc: number;
  nota: string;
  curva: DemoRocPoint[];
  distribucion: DemoProbabilityBin[];
}

const comparison: DemoModelComparison = {
  base: {
    modelo: 'Modelo demo A',
    version: 'v1.2.0',
    accuracy: 91.2,
    precision: 89.4,
    recall: 92.1,
    f1: 90.7,
    auc: 0.94,
    casos: 84,
  },
  candidata: {
    modelo: 'Modelo demo A',
    version: 'v1.3.0',
    accuracy: 92.8,
    precision: 91.1,
    recall: 93.0,
    f1: 92.0,
    auc: 0.96,
    casos: 84,
  },
};

const buenDesempeno: DemoRocScenario = {
  titulo: 'Buen desempeño',
  auc: 0.96,
  nota: 'Curva y distribución ilustrativas, sin métricas reales.',
  curva: [
    { fpr: 0, tpr: 0 },
    { fpr: 0.02, tpr: 0.42 },
    { fpr: 0.05, tpr: 0.68 },
    { fpr: 0.1, tpr: 0.84 },
    { fpr: 0.18, tpr: 0.92 },
    { fpr: 0.32, tpr: 0.97 },
    { fpr: 0.55, tpr: 0.99 },
    { fpr: 1, tpr: 1 },
  ],
  distribucion: [
    { rango: '0.0–0.2', negativos: 28, positivos: 1 },
    { rango: '0.2–0.4', negativos: 14, positivos: 3 },
    { rango: '0.4–0.6', negativos: 5, positivos: 6 },
    { rango: '0.6–0.8', negativos: 2, positivos: 12 },
    { rango: '0.8–1.0', negativos: 1, positivos: 28 },
  ],
};

const bajoDesempeno: DemoRocScenario = {
  titulo: 'Bajo desempeño',
  auc: 0.61,
  nota: 'Curva y distribución ilustrativas, sin métricas reales.',
  curva: [
    { fpr: 0, tpr: 0 },
    { fpr: 0.12, tpr: 0.18 },
    { fpr: 0.25, tpr: 0.33 },
    { fpr: 0.4, tpr: 0.48 },
    { fpr: 0.58, tpr: 0.62 },
    { fpr: 0.76, tpr: 0.79 },
    { fpr: 1, tpr: 1 },
  ],
  distribucion: [
    { rango: '0.0–0.2', negativos: 16, positivos: 8 },
    { rango: '0.2–0.4', negativos: 12, positivos: 10 },
    { rango: '0.4–0.6', negativos: 10, positivos: 11 },
    { rango: '0.6–0.8', negativos: 8, positivos: 12 },
    { rango: '0.8–1.0', negativos: 4, positivos: 9 },
  ],
};

export const investigadorExtraFixtures = {
  comparison,
  buenDesempeno,
  bajoDesempeno,
};
