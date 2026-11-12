import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Marca del producto usada en el título de la pestaña. */
export const MARCA = 'OPTIMUS-THY';

/** Título mostrado cuando la ruta no coincide con ninguna pantalla conocida. */
export const TITULO_POR_DEFECTO = `${MARCA} · Gestión clínica de tiroides`;

type ParTitulo = readonly [patron: string, seccion: string];

/**
 * Rutas con título propio. Cada par asocia un patrón por segmentos con el nombre
 * de la sección; el título final se compone como `sección · OPTIMUS-THY`.
 *
 * Un segmento que empieza por `:` coincide con cualquier segmento no vacío
 * (identificadores dinámicos). La tabla se ordena una sola vez al cargar el
 * módulo: gana el patrón con más segmentos y, a igual número, el literal vence
 * al dinámico.
 *
 * Solo se documentan las pantallas reales del producto; las que hoy son
 * marcadores de posición quedan fuera y caen en el título por defecto.
 */
const TITULOS_POR_RUTA: ReadonlyArray<ParTitulo> = [
  ['/login/recuperar', 'Recuperar contraseña'],
  ['/login', 'Acceso'],
  ['/medico/pacientes', 'Pacientes'],
  ['/medico', 'Panel clínico'],
  ['/administrador/usuarios', 'Usuarios'],
  ['/administrador/roles', 'Roles y permisos'],
  ['/administrador', 'Panel del administrador'],
];

/**
 * Patrones ordenados de más específico a menos específico: más segmentos
 * primero y, a igual número de segmentos, más literales primero.
 */
const TITULOS: ReadonlyArray<ParTitulo> = [...TITULOS_POR_RUTA].sort((a, b) => {
  const segA = a[0].split('/').filter((s) => s.length > 0);
  const segB = b[0].split('/').filter((s) => s.length > 0);
  const diferenciaSegmentos = segB.length - segA.length;
  if (diferenciaSegmentos !== 0) return diferenciaSegmentos;
  const literalesA = segA.filter((s) => !s.startsWith(':')).length;
  const literalesB = segB.filter((s) => !s.startsWith(':')).length;
  return literalesB - literalesA;
});
/**
 * Normaliza una ruta: colapsa barras repetidas, quita barras finales y
 * garantiza que `/` quede como `/`.
 */
function normalizar(ruta: string): string {
  const colapsada = ruta.replace(/\/+/g, '/');
  const sinBarraFinal = colapsada.replace(/\/+$/, '');
  return sinBarraFinal === '' ? '/' : sinBarraFinal;
}

/**
 * Comprueba si una ruta normalizada coincide con un patrón por segmentos.
 * Los segmentos dinámicos (`:param`) aceptan cualquier segmento no vacío.
 */
function coincide(rutaNormalizada: string, patron: string): boolean {
  const segRuta = rutaNormalizada.split('/').filter((s) => s.length > 0);
  const segPatron = patron.split('/').filter((s) => s.length > 0);
  if (segRuta.length !== segPatron.length) return false;
  return segPatron.every((seg, i) => seg.startsWith(':') || seg === segRuta[i]);
}

/**
 * Resuelve el título de pestaña para una ruta dada. Devuelve el nombre de la
 * sección acompañado de la marca, o el título por defecto si no hay coincidencia.
 */
export function tituloPara(ruta: string): string {
  const rutaNormalizada = normalizar(ruta);
  for (const [patron, seccion] of TITULOS) {
    if (coincide(rutaNormalizada, patron)) {
      return `${seccion} · ${MARCA}`;
    }
  }
  return TITULO_POR_DEFECTO;
}

/**
 * ## Cuándo usarlo
 * Para que la pestaña del navegador identifique la pantalla activa del producto;
 * se monta una sola vez dentro del enrutador, junto al árbol de rutas.
 * ## Cuándo no usarlo
 * No lo uses para mostrar títulos visibles dentro de la interfaz ni para
 * distinguir pantallas que aún son marcadores de posición sin ruta propia.
 * ## Anatomía
 * - No renderiza interfaz: devuelve `null` y solo fija `document.title`.
 * - La tabla de rutas asocia un patrón por segmentos con el nombre de la sección;
 *   el título final es `sección · OPTIMUS-THY`.
 * - Un segmento `:param` coincide con cualquier segmento no vacío.
 * ## Accesibilidad
 * No introduce nodos en el árbol accesible ni altera el foco; la información
 * viaja al título del documento, que los lectores de pantalla anuncian al
 * cambiar de pestaña.
 * ## Responsive
 * No tiene representación visual ni medidas propias: el resultado es idéntico
 * en cualquier ancho y no depende del punto de corte.
 */
export function TituloPagina() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = tituloPara(pathname);
  }, [pathname]);

  return null;
}
