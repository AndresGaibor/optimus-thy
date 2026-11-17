import { useCallback, useState } from 'react';
import { actualizarUsuario, type Usuario } from '../../api/usuarios';

function mensajeDeError(status: number): string {
  if (status === 403) return 'No puedes desactivar tu propia cuenta.';
  if (status === 404) return 'El usuario ya no existe. Actualiza el listado.';
  return 'No se pudo cambiar el estado del usuario. Reintenta la operación.';
}

/**
 * Gestiona el cambio de estado de un usuario con la respuesta real del servidor.
 *
 * Activar se aplica directamente; desactivar abre la confirmación. Mientras la
 * petición está en curso, `enCursoId` identifica la fila ocupada.
 */
export function useCambioEstadoUsuario(alTerminar: () => void) {
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [pendiente, setPendiente] = useState<Usuario | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [enCursoId, setEnCursoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState('');

  const aplicar = useCallback(
    async (usuario: Usuario) => {
      setEnCursoId(usuario.id);
      setError(null);
      setAviso('');
      const resultado = await actualizarUsuario(usuario.id, { activo: !usuario.activo });
      setEnCursoId(null);
      if (!resultado.ok) {
        setError(mensajeDeError(resultado.status));
        return;
      }
      setAviso(
        `Usuario ${resultado.data.correo} ${resultado.data.activo ? 'activado' : 'desactivado'}.`,
      );
      alTerminar();
    },
    [alTerminar],
  );

  const solicitar = useCallback(
    (usuario: Usuario) => {
      if (!usuario.activo) {
        void aplicar(usuario);
        return;
      }
      setPendiente(usuario);
      setDialogoAbierto(true);
    },
    [aplicar],
  );

  const confirmar = useCallback(async () => {
    if (!pendiente) return;
    setConfirmando(true);
    await aplicar(pendiente);
    setConfirmando(false);
    setDialogoAbierto(false);
    setPendiente(null);
  }, [pendiente, aplicar]);

  return {
    dialogoAbierto,
    setDialogoAbierto,
    pendiente,
    confirmando,
    enCursoId,
    error,
    aviso,
    solicitar,
    confirmar,
  };
}
