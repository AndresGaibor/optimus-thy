"""Adaptadores reales de YOLO11, BGAU-Net y Swin Transformer (HT-062).

Los pesos llegan por ``IA_MODELOS_DIR`` (ver ``ConfiguracionIA``): no se
versionan ni se empaquetan con el servicio. ``torch``, ``timm``,
``ultralytics`` y ``tensorflow`` se importan dentro de cada constructor para
que el servicio arranque sin ellos y para que su ausencia se informe como
``ModeloNoDisponible`` con código estable, nunca como una inferencia inventada.

Reproducen ``base.py`` sin rutas fijas: el detector devuelve las cajas, el
segmentador la máscara del tamaño de la imagen y el clasificador las dos
probabilidades del nódulo.
"""

from __future__ import annotations

from collections.abc import Sequence
from pathlib import Path
from typing import Any

import numpy as np

from app.config import ConfiguracionIA
from app.contrato import Caja
from app.geometria import recortar_caja
from app.modelos import (
    MOTIVO_ARCHIVO,
    MOTIVO_LIBRERIA,
    Deteccion,
    ModeloNoDisponible,
    ProbabilidadesNodulo,
)

TAMANO_ENTRADA_BGAUNET = (512, 512)
"""Alto y ancho que espera BGAU-Net (``BGAUNET_TARGET_SIZE`` de ``base.py``)."""

UMBRAL_BGAUNET = 0.50
CLASE_POSITIVA_BGAUNET = 1

MEDIA_IMAGEN = (0.485, 0.456, 0.406)
DESVIACION_IMAGEN = (0.229, 0.224, 0.225)

MODELO_SWIN_POR_DEFECTO = "swin_tiny_patch4_window7_224.ms_in22k_ft_in1k"
TAMANO_SWIN_POR_DEFECTO = 224
CLASE_BENIGNA = 0
CLASE_MALIGNA = 1


def _exigir_archivo(modelo: str, ruta: Path) -> None:
    if not ruta.is_file():
        raise ModeloNoDisponible(modelo, MOTIVO_ARCHIVO, f"Falta el archivo de pesos {ruta}.")


def _dispositivo_torch(torch: Any, dispositivo: str) -> Any:
    """Resuelve ``auto`` como en ``base.py``: GPU si existe, si no CPU."""
    if dispositivo == "auto":
        return torch.device("cuda" if torch.cuda.is_available() else "cpu")
    if dispositivo.isdigit():
        return torch.device(f"cuda:{dispositivo}")
    return torch.device(dispositivo)


def _dispositivo_yolo(torch: Any, dispositivo: str) -> Any:
    if dispositivo == "auto":
        return 0 if torch.cuda.is_available() else "cpu"
    return dispositivo


class DetectorYolo:
    """YOLO11: cajas candidatas de nódulos sobre la imagen BGR completa."""

    def __init__(self, ruta: Path, dispositivo: str = "auto") -> None:
        _exigir_archivo("detector", ruta)
        try:
            from ultralytics import YOLO
        except ImportError as error:
            raise ModeloNoDisponible(
                "detector", MOTIVO_LIBRERIA, "Falta la librería ultralytics para cargar YOLO11."
            ) from error
        self._modelo = YOLO(str(ruta))
        self._dispositivo = dispositivo

    def detectar(self, imagen: np.ndarray, config: ConfiguracionIA) -> Sequence[Deteccion]:
        import torch

        resultados = self._modelo.predict(
            source=imagen,
            imgsz=config.yolo_tamano,
            conf=config.yolo_confianza,
            iou=config.yolo_iou,
            device=_dispositivo_yolo(torch, self._dispositivo),
            verbose=False,
            save=False,
        )

        detecciones: list[Deteccion] = []
        for resultado in resultados:
            cajas = getattr(resultado, "boxes", None)
            if cajas is None or len(cajas) == 0:
                continue
            coordenadas = cajas.xyxy.detach().cpu().numpy()
            confianzas = cajas.conf.detach().cpu().numpy()
            for coordenada, confianza in zip(coordenadas, confianzas, strict=False):
                xmin, ymin, xmax, ymax = (int(round(float(valor))) for valor in coordenada[:4])
                detecciones.append(
                    Deteccion(
                        caja=Caja(xmin=xmin, ymin=ymin, xmax=xmax, ymax=ymax),
                        confianza=float(confianza),
                    )
                )
        return tuple(detecciones)


class SegmentadorBgauNet:
    """BGAU-Net: máscara binaria ``uint8`` del tamaño de la imagen."""

    def __init__(self, ruta: Path, dispositivo: str = "auto") -> None:
        _exigir_archivo("segmentador", ruta)
        try:
            import tensorflow as tf
        except ImportError as error:
            raise ModeloNoDisponible(
                "segmentador",
                MOTIVO_LIBRERIA,
                "Falta la librería tensorflow para cargar BGAU-Net.",
            ) from error
        self._tf = tf
        self._dispositivo = dispositivo
        try:
            self._modelo = tf.keras.models.load_model(
                str(ruta),
                custom_objects=_objetos_personalizados(tf),
                compile=False,
            )
        except (OSError, ValueError) as error:
            raise ModeloNoDisponible(
                "segmentador", MOTIVO_ARCHIVO, f"No se pudo cargar BGAU-Net: {error}"
            ) from error

    def segmentar(self, imagen: np.ndarray, caja: Caja, config: ConfiguracionIA) -> np.ndarray:
        import cv2

        alto, ancho = imagen.shape[:2]
        if imagen.ndim == 3:
            rgb = cv2.cvtColor(imagen, cv2.COLOR_BGR2RGB)
        else:
            rgb = cv2.cvtColor(imagen, cv2.COLOR_GRAY2RGB)

        alto_red, ancho_red = TAMANO_ENTRADA_BGAUNET
        redimensionada = cv2.resize(rgb, (ancho_red, alto_red), interpolation=cv2.INTER_LINEAR)
        entrada_imagen = redimensionada.astype(np.float32) / 255.0

        mascara_caja = np.zeros((alto, ancho), dtype=np.uint8)
        dentro = recortar_caja(caja, ancho, alto)
        mascara_caja[dentro.ymin : dentro.ymax, dentro.xmin : dentro.xmax] = 255
        caja_redimensionada = cv2.resize(
            mascara_caja, (ancho_red, alto_red), interpolation=cv2.INTER_NEAREST
        )
        entrada_caja = (caja_redimensionada > 127).astype(np.float32)[..., np.newaxis]

        red = np.concatenate([entrada_imagen, entrada_caja], axis=-1)
        tensor = self._tf.convert_to_tensor(red[np.newaxis, ...], dtype=self._tf.float32)
        salida = self._tf.convert_to_tensor(_salida_principal(self._modelo(tensor, training=False)))
        if salida.shape.rank != 4:
            raise ValueError(
                "La salida principal de BGAU-Net debe tener cuatro dimensiones "
                f"[batch, alto, ancho, clases]. Forma obtenida: {salida.shape}"
            )

        if int(salida.shape[-1]) == 1:
            probabilidad = self._tf.math.sigmoid(salida[0, ..., 0])
            pequena = (probabilidad >= UMBRAL_BGAUNET).numpy().astype(np.uint8)
        else:
            clase = self._tf.argmax(self._tf.nn.softmax(salida, axis=-1)[0], axis=-1)
            pequena = (clase == CLASE_POSITIVA_BGAUNET).numpy().astype(np.uint8)

        return cv2.resize(pequena * 255, (ancho, alto), interpolation=cv2.INTER_NEAREST)


class ClasificadorSwin:
    """Swin Transformer de dos ramas: probabilidades benigno/maligno."""

    def __init__(self, ruta: Path, dispositivo: str = "auto") -> None:
        _exigir_archivo("clasificador", ruta)
        try:
            import torch
            import torch.nn as nn
        except ImportError as error:
            raise ModeloNoDisponible(
                "clasificador", MOTIVO_LIBRERIA, "Falta la librería torch para cargar Swin."
            ) from error
        try:
            import timm
        except ImportError as error:
            raise ModeloNoDisponible(
                "clasificador", MOTIVO_LIBRERIA, "Falta la librería timm para cargar Swin."
            ) from error

        self._torch = torch
        self._dispositivo = _dispositivo_torch(torch, dispositivo)
        try:
            checkpoint = torch.load(str(ruta), map_location=self._dispositivo, weights_only=True)
            modelo, self._tamano = _construir_swin(torch, nn, timm, checkpoint)
            modelo.load_state_dict(_estado_sin_prefijos(checkpoint), strict=True)
        except (OSError, ValueError, RuntimeError) as error:
            raise ModeloNoDisponible(
                "clasificador", MOTIVO_ARCHIVO, f"No se pudo cargar Swin Transformer: {error}"
            ) from error

        self._modelo = modelo.to(self._dispositivo).eval()

    def clasificar(
        self,
        imagen_roi: np.ndarray,
        mascara_roi: np.ndarray,
        config: ConfiguracionIA,
    ) -> ProbabilidadesNodulo:
        import cv2
        from PIL import Image

        torch = self._torch
        tamano = self._tamano
        if imagen_roi.ndim == 3:
            rgb = cv2.cvtColor(imagen_roi, cv2.COLOR_BGR2RGB)
        else:
            rgb = cv2.cvtColor(imagen_roi, cv2.COLOR_GRAY2RGB)

        # ``prepare_swin_inputs`` de ``base.py`` reescala con PIL a través de
        # ``torchvision.transforms.Resize``, no con OpenCV. Las dos rutas no son
        # equivalentes: el remuestreo bilineal de PIL suaviza distinto y su
        # rejilla del vecino más cercano cae en otros píxeles, y con este
        # clasificador eso mueve la probabilidad maligna de 2.56e-12 a 4.02e-12.
        imagen = Image.fromarray(np.ascontiguousarray(rgb)).convert("RGB")
        imagen = np.asarray(imagen.resize((tamano, tamano), Image.BILINEAR), dtype=np.float32)
        imagen = imagen / 255.0
        normalizada = (imagen - np.asarray(MEDIA_IMAGEN, np.float32)) / np.asarray(
            DESVIACION_IMAGEN, np.float32
        )
        tensor_imagen = torch.from_numpy(normalizada.transpose(2, 0, 1)).unsqueeze(0)
        tensor_imagen = tensor_imagen.to(self._dispositivo, dtype=torch.float32)

        mascara = Image.fromarray(np.ascontiguousarray(mascara_roi)).convert("L")
        mascara = np.asarray(mascara.resize((tamano, tamano), Image.NEAREST), dtype=np.float32)
        binaria = (mascara / 255.0 > 0.5).astype(np.float32)
        tensor_mascara = torch.from_numpy(binaria).unsqueeze(0).unsqueeze(0)
        tensor_mascara = tensor_mascara.to(self._dispositivo)

        with torch.inference_mode():
            probabilidades = torch.softmax(self._modelo(tensor_imagen, tensor_mascara), dim=1)

        return ProbabilidadesNodulo(
            benigno=float(probabilidades[0, CLASE_BENIGNA].item()),
            maligno=float(probabilidades[0, CLASE_MALIGNA].item()),
        )


def _salida_principal(salidas: Any) -> Any:
    """Reproduce ``select_main_segmentation_output`` de ``base.py``."""
    if isinstance(salidas, dict):
        for nombre in ("seg_main", "main", "segmentation", "output_1"):
            if nombre in salidas:
                return salidas[nombre]
        return next(iter(salidas.values()))
    if isinstance(salidas, (list, tuple)):
        if not salidas:
            raise ValueError("La BGAU-Net no devolvió ninguna salida.")
        return salidas[0]
    return salidas


def _objetos_personalizados(tf: Any) -> dict[str, Any]:
    """Funciones que el ``.keras`` guardó como parte de la arquitectura."""
    n_clases = 2

    def una_caliente(y_true: Any, n_classes: int = n_clases) -> Any:
        y = tf.squeeze(y_true, axis=-1)
        return tf.one_hot(tf.cast(y, tf.int32), depth=n_classes)

    def dice_coef(y_true: Any, y_pred: Any, from_logits: bool = True, pos_class: int = 1) -> Any:
        eps = 1e-7
        y_prob = tf.nn.softmax(y_pred, axis=-1) if from_logits else y_pred
        y_true_oh = una_caliente(y_true)
        yt = tf.reshape(
            tf.cast(y_true_oh[..., pos_class], tf.float32), [tf.shape(y_true_oh)[0], -1]
        )
        yp = tf.reshape(tf.cast(y_prob[..., pos_class], tf.float32), [tf.shape(y_prob)[0], -1])
        interseccion = tf.reduce_sum(yt * yp, axis=1)
        denominador = tf.reduce_sum(yt, axis=1) + tf.reduce_sum(yp, axis=1)
        dice = (2.0 * interseccion + eps) / (denominador + eps)
        dice = tf.where(tf.math.is_finite(dice), dice, tf.zeros_like(dice))
        return tf.cast(tf.reduce_mean(dice), tf.float32)

    def mapa_bordes(y_true: Any) -> Any:
        y = tf.cast(y_true, tf.float32)
        sobel = tf.image.sobel_edges(y)
        magnitud = tf.sqrt(sobel[..., 0] * sobel[..., 0] + sobel[..., 1] * sobel[..., 1])
        return tf.cast(tf.squeeze(magnitud, axis=-1) > 0.0, tf.float32)

    def seg_loss(y_true: Any, y_pred: Any) -> Any:
        ce = tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True)(
            tf.cast(tf.squeeze(y_true, axis=-1), tf.int32), y_pred
        )
        total = ce + 1.0 - dice_coef(y_true, y_pred)
        return tf.cast(
            tf.where(tf.math.is_finite(total), total, tf.constant(1e3, tf.float32)),
            tf.float32,
        )

    def edge_loss(y_true: Any, y_pred_edge: Any) -> Any:
        perdida = tf.keras.losses.BinaryCrossentropy(from_logits=True)(
            mapa_bordes(y_true), y_pred_edge
        )
        return tf.cast(
            tf.where(tf.math.is_finite(perdida), perdida, tf.constant(1e3, tf.float32)),
            tf.float32,
        )

    return {"seg_loss": seg_loss, "edge_loss": edge_loss, "dice_coef": dice_coef}


def _estado_sin_prefijos(checkpoint: Any) -> dict[str, Any]:
    estado = checkpoint.get("model_state_dict") if isinstance(checkpoint, dict) else checkpoint
    if estado is None:
        raise ValueError("El checkpoint de Swin no trae 'model_state_dict'.")
    for prefijo in ("module.", "_orig_mod."):
        if all(clave.startswith(prefijo) for clave in estado):
            estado = {clave[len(prefijo) :]: valor for clave, valor in estado.items()}
    return estado


def _construir_swin(torch: Any, nn: Any, timm: Any, checkpoint: Any) -> tuple[Any, int]:
    """Arma la arquitectura dual y devuelve ``(modelo, tamaño_entrada)``."""
    metadatos = checkpoint if isinstance(checkpoint, dict) else {}
    nombre = metadatos.get("model_name", MODELO_SWIN_POR_DEFECTO)
    tamano = int(metadatos.get("image_size", TAMANO_SWIN_POR_DEFECTO))
    mask_dim = int(metadatos.get("mask_dim", 256))
    fusion_dim = int(metadatos.get("fusion_dim", 512))

    class MaskBranchCNN(nn.Module):
        def __init__(self, out_dim: int = 256) -> None:
            super().__init__()
            self.features = nn.Sequential(
                nn.Conv2d(1, 32, kernel_size=3, padding=1),
                nn.BatchNorm2d(32),
                nn.ReLU(inplace=True),
                nn.MaxPool2d(2),
                nn.Conv2d(32, 64, kernel_size=3, padding=1),
                nn.BatchNorm2d(64),
                nn.ReLU(inplace=True),
                nn.MaxPool2d(2),
                nn.Conv2d(64, 128, kernel_size=3, padding=1),
                nn.BatchNorm2d(128),
                nn.ReLU(inplace=True),
                nn.MaxPool2d(2),
                nn.Conv2d(128, 256, kernel_size=3, padding=1),
                nn.BatchNorm2d(256),
                nn.ReLU(inplace=True),
                nn.AdaptiveAvgPool2d((1, 1)),
            )
            self.proj = nn.Sequential(
                nn.Flatten(),
                nn.Linear(256, out_dim),
                nn.ReLU(inplace=True),
                nn.Dropout(0.3),
            )

        def forward(self, x: Any) -> Any:
            return self.proj(self.features(x))

    class DualBranchClassifier(nn.Module):
        def __init__(
            self,
            image_backbone: Any,
            mask_backbone: Any,
            dimension_imagen: int,
            mask_dim: int,
            fusion_dim: int,
            num_classes: int = 2,
        ) -> None:
            super().__init__()
            self.image_backbone = image_backbone
            self.mask_backbone = mask_backbone
            self.classifier = nn.Sequential(
                nn.Linear(dimension_imagen + mask_dim, fusion_dim),
                nn.ReLU(inplace=True),
                nn.Dropout(0.3),
                nn.Linear(fusion_dim, 128),
                nn.ReLU(inplace=True),
                nn.Dropout(0.2),
                nn.Linear(128, num_classes),
            )

        def forward(self, image: Any, mask: Any) -> Any:
            return self.classifier(
                torch.cat([self.image_backbone(image), self.mask_backbone(mask)], dim=1)
            )

    imagen_backbone = timm.create_model(nombre, pretrained=False, num_classes=0, global_pool="avg")
    with torch.no_grad():
        dimension_imagen = int(imagen_backbone(torch.zeros(1, 3, tamano, tamano)).shape[1])

    modelo = DualBranchClassifier(
        image_backbone=imagen_backbone,
        mask_backbone=MaskBranchCNN(out_dim=mask_dim),
        dimension_imagen=dimension_imagen,
        mask_dim=mask_dim,
        fusion_dim=fusion_dim,
    )
    return modelo, tamano
