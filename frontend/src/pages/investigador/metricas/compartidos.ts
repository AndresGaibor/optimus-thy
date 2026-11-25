import type { FiltrosMetricas as ConsultaMetricas } from '../../../api/metricas';

export interface FiltrosMetricas {
  desde: string;
  hasta: string;
  modelo: string;
}

export const FILTROS_METRICAS_VACIOS: FiltrosMetricas = {
  desde: '',
  hasta: '',
  modelo: '',
};

export function consultaDe(filtros: FiltrosMetricas): ConsultaMetricas {
  return {
    ...(filtros.desde ? { desde: filtros.desde } : {}),
    ...(filtros.hasta ? { hasta: filtros.hasta } : {}),
    ...(filtros.modelo ? { modelo: filtros.modelo } : {}),
  };
}

export function etiquetaResultado(resultado: string): string {
  switch (resultado) {
    case 'benigno':
      return 'Benigno';
    case 'maligno':
      return 'Maligno';
    case 'sin_nodulo':
      return 'Sin nódulo';
    default:
      return resultado;
  }
}
