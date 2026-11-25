import { useCallback, useEffect, useState } from 'react';
import {
  consultarDecision,
  DecisionExistenteError,
  registrarDecision,
  type DecisionRegistrada,
} from '../../api/decisiones';
import { Button, Callout, Dialog, Spinner } from '../../design-system';
import { DecisionRegistradaVista } from './conclusion/DecisionRegistradaVista';
import { FormularioConclusion } from './conclusion/FormularioConclusion';
import { PieConclusion } from './conclusion/PieConclusion';
import { ResumenConfirmacion } from './conclusion/ResumenConfirmacion';
import {
  CATEGORIAS,
  RESULTADOS,
  SIN_CLASIFICAR,
  type CategoriaConclusion,
  type Errores,
  type InferenciaResumen,
  type Paso,
} from './conclusion/compartidos';
import { validarConclusion } from './conclusion/validacion';

interface ConclusionMedicaProps {
  abierta: boolean;
  onAbiertaChange: (abierta: boolean) => void;
  inferencia: InferenciaResumen;
  onRegistrada?: (decision: DecisionRegistrada) => void;
}

/**
 * Conclusión del médico, separada de la predicción del modelo.
 *
 * Consulta si la inferencia ya tiene una decisión y, si no, envía la conclusión
 * al servidor. La inferencia original nunca se modifica desde aquí.
 */
export function ConclusionMedica({
  abierta,
  onAbiertaChange,
  inferencia,
  onRegistrada,
}: ConclusionMedicaProps) {
  const incrustada = inferencia.decision ?? null;
  const [paso, setPaso] = useState<Paso>(incrustada ? 'lectura' : 'consulta');
  const [decision, setDecision] = useState<DecisionRegistrada | null>(incrustada);
  const [categoria, setCategoria] = useState<CategoriaConclusion | ''>('');
  const [nota, setNota] = useState('');
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(false);
  const [errorConsulta, setErrorConsulta] = useState(false);

  const resultado = RESULTADOS[inferencia.resultado] ?? SIN_CLASIFICAR;
  const etiquetaCategoria =
    CATEGORIAS.find((opcion) => opcion.valor === categoria)?.etiqueta ?? '—';

  const cargarDecision = useCallback(async () => {
    setErrorConsulta(false);
    setPaso('consulta');
    try {
      const encontrada = await consultarDecision(inferencia.caso_id, inferencia.id);
      setDecision(encontrada);
      setPaso(encontrada ? 'lectura' : 'formulario');
    } catch {
      setErrorConsulta(true);
    }
  }, [inferencia.caso_id, inferencia.id]);

  useEffect(() => {
    if (!abierta || inferencia.decision) return;
    void cargarDecision();
  }, [abierta, inferencia.decision, cargarDecision]);

  function cambiarApertura(siguiente: boolean) {
    if (!siguiente) {
      setPaso(inferencia.decision ? 'lectura' : 'consulta');
      setCategoria('');
      setNota('');
      setErrores({});
      setErrorEnvio(false);
      setErrorConsulta(false);
    }
    onAbiertaChange(siguiente);
  }

  function revisar() {
    const siguientes = validarConclusion(categoria, nota);
    setErrores(siguientes);
    if (Object.keys(siguientes).length === 0) setPaso('confirmacion');
  }

  async function enviar() {
    if (!categoria || enviando) return;
    setEnviando(true);
    setErrorEnvio(false);
    try {
      const registrada = await registrarDecision(inferencia.caso_id, inferencia.id, {
        decision: categoria,
        observaciones: nota.trim(),
      });
      setEnviando(false);
      onRegistrada?.(registrada);
      cambiarApertura(false);
    } catch (error) {
      setEnviando(false);
      if (error instanceof DecisionExistenteError) {
        await cargarDecision();
      } else {
        setErrorEnvio(true);
      }
    }
  }

  const titulo =
    paso === 'confirmacion'
      ? 'Revisa tu conclusión'
      : paso === 'lectura'
        ? 'Conclusión registrada'
        : 'Conclusión del médico';
  const descripcion =
    paso === 'confirmacion'
      ? 'Así quedará tu conclusión antes de enviarla.'
      : paso === 'lectura'
        ? 'Ya existe una conclusión para esta inferencia; puedes consultarla, no reenviarla.'
        : paso === 'consulta'
          ? 'Comprobando si la inferencia ya tiene una conclusión registrada.'
          : 'Redacta tu criterio aparte de la predicción; la inferencia original no cambia.';

  function contenido() {
    if (paso === 'consulta') {
      return errorConsulta ? (
        <Callout tone="danger" title="No se pudo consultar la conclusión">
          No se pudo comprobar si esta inferencia ya tiene una conclusión. Reintenta.
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={() => void cargarDecision()}>
              Reintentar
            </Button>
          </div>
        </Callout>
      ) : (
        <Spinner size="lg" label="Consultando la conclusión" />
      );
    }
    if (paso === 'lectura') {
      return decision ? (
        <DecisionRegistradaVista decision={decision} resultado={resultado} />
      ) : null;
    }
    if (paso === 'formulario') {
      return (
        <FormularioConclusion
          inferencia={inferencia}
          resultado={resultado}
          categoria={categoria}
          nota={nota}
          errores={errores}
          onCategoriaChange={setCategoria}
          onNotaChange={setNota}
        />
      );
    }
    return (
      <>
        {errorEnvio ? (
          <Callout tone="danger" title="No se pudo registrar la conclusión">
            No se pudo guardar la conclusión. Revisa tu conexión e inténtalo de nuevo.
          </Callout>
        ) : null}
        <ResumenConfirmacion
          resultado={resultado}
          etiquetaCategoria={etiquetaCategoria}
          nota={nota}
        />
      </>
    );
  }

  return (
    <Dialog
      open={abierta}
      onOpenChange={cambiarApertura}
      title={titulo}
      description={descripcion}
      size="lg"
      footer={
        <PieConclusion
          paso={paso}
          enviando={enviando}
          errorEnvio={errorEnvio}
          onVolver={() => setPaso('formulario')}
          onRevisar={revisar}
          onEnviar={() => void enviar()}
        />
      }
    >
      {contenido()}
    </Dialog>
  );
}
