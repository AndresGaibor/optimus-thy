import { API_URL } from './client';

export interface TableroAdministrador {
  volumen: {
    pacientes: number;
    casos: number;
    imagenes: number;
    inferencias: number;
    usuarios: number;
  };
  actividad: { accion: string; total: number; ultima: string }[];
  servicios: {
    nombre: 'base_datos' | 'servicio_ia' | 'almacenamiento';
    estado: 'ok' | 'degradado' | 'caido';
  }[];
}

export async function obtenerTablero(): Promise<TableroAdministrador> {
  const respuesta = await fetch(`${API_URL}/administrador/tablero`, { credentials: 'include' });
  if (!respuesta.ok) throw new Error('No se pudo cargar el tablero.');
  return (await respuesta.json()) as TableroAdministrador;
}
