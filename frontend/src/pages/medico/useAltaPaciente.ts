import { useCallback, useState } from 'react';
import { crearPaciente, esDocumentoDuplicado } from '../../api/pacientes';

/** Datos mínimos que pide el alta de un paciente. */
export interface FormularioAltaPaciente {
  nombres: string;
  apellidos: string;
  documento: string;
  fecha_nacimiento: string;
}

const FORMULARIO_VACIO: FormularioAltaPaciente = {
  nombres: '',
  apellidos: '',
  documento: '',
  fecha_nacimiento: '',
};

/**
 * Estado y envío del diálogo de alta de paciente.
 *
 * Mantiene el formulario abierto cuando el documento ya existe y expone el
 * reintento confirmado; el aviso nunca muestra el identificador del paciente
 * existente.
 */
export function useAltaPaciente(onCreado: () => void) {
  const [abierto, setAbierto] = useState(false);
  const [formulario, setFormulario] = useState<FormularioAltaPaciente>(FORMULARIO_VACIO);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [duplicado, setDuplicado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const abrir = useCallback(() => {
    setFormulario(FORMULARIO_VACIO);
    setErrores({});
    setError(null);
    setDuplicado(false);
    setAbierto(true);
  }, []);

  const cambiar = useCallback((campo: keyof FormularioAltaPaciente, valor: string) => {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }, []);

  const validar = useCallback((): boolean => {
    const encontrados: Record<string, string> = {};
    const nombres = formulario.nombres.trim();
    const apellidos = formulario.apellidos.trim();
    const documento = formulario.documento.trim();
    const fechaNacimiento = formulario.fecha_nacimiento;

    if (nombres === '') {
      encontrados.nombres = 'El nombre es obligatorio.';
    } else if (nombres.length > 120) {
      encontrados.nombres = 'El nombre no puede superar los 120 caracteres.';
    }

    if (apellidos === '') {
      encontrados.apellidos = 'Los apellidos son obligatorios.';
    } else if (apellidos.length > 120) {
      encontrados.apellidos = 'Los apellidos no pueden superar los 120 caracteres.';
    }

    if (documento === '') {
      encontrados.documento = 'El documento es obligatorio.';
    } else if (!/^[A-Za-z0-9-]{5,20}$/.test(documento)) {
      encontrados.documento =
        'El documento debe tener entre 5 y 20 caracteres alfanuméricos o guiones.';
    }

    if (fechaNacimiento === '') {
      encontrados.fecha_nacimiento = 'La fecha de nacimiento es obligatoria.';
    } else {
      const fecha = new Date(fechaNacimiento);
      const hoy = new Date();
      if (Number.isNaN(fecha.getTime())) {
        encontrados.fecha_nacimiento = 'La fecha de nacimiento no es válida.';
      } else {
        if (fecha > hoy) {
          encontrados.fecha_nacimiento = 'La fecha de nacimiento no puede ser futura.';
        }
        const año = fecha.getFullYear();
        if (año < 1900) {
          encontrados.fecha_nacimiento = 'El año de nacimiento debe ser mayor o igual a 1900.';
        }
      }
    }

    setErrores(encontrados);
    return Object.keys(encontrados).length === 0;
  }, [formulario]);

  const guardar = useCallback(
    async (confirmarDuplicado = false) => {
      if (!validar()) {
        return;
      }
      setGuardando(true);
      setError(null);
      const resultado = await crearPaciente(
        {
          nombres: formulario.nombres.trim(),
          apellidos: formulario.apellidos.trim(),
          documento: formulario.documento.trim(),
          fecha_nacimiento: formulario.fecha_nacimiento,
        },
        confirmarDuplicado,
      );
      if (!resultado.ok) {
        if (resultado.status === 409 && esDocumentoDuplicado(resultado.error)) {
          setDuplicado(true);
          setError('Ya existe un paciente con ese documento.');
        } else if (resultado.status === 422) {
          setError('Revisa los datos introducidos. Hay campos con errores.');
        } else {
          setError('No se pudo crear el paciente. Reintenta la operación.');
        }
        setGuardando(false);
        return;
      }
      setGuardando(false);
      setDuplicado(false);
      setAbierto(false);
      onCreado();
    },
    [validar, formulario, onCreado],
  );

  return {
    abierto,
    setAbierto,
    formulario,
    cambiar,
    errores,
    error,
    duplicado,
    guardando,
    abrir,
    guardar,
  };
}
