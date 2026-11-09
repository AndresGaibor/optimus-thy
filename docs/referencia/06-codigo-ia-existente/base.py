#librerías necesarias

import csv
import shutil
import sys
import traceback
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path
from xml.dom import minidom
import cv2
import numpy as np
import tensorflow as tf
import torch
import torch.nn as nn
from PIL import Image
from skimage import img_as_float
from skimage.morphology import closing, disk
from skimage.segmentation import morphological_geodesic_active_contour
from torchvision import transforms
from tqdm.auto import tqdm
from ultralytics import YOLO
import timm


#configuración

YOLO_MODEL_PATH = Path(r"C:\Users\HP\IDI-086_inference_complete\models\best_yolo.pt")
BGAUNET_MODEL_PATH = Path(r"C:\Users\HP\IDI-086_inference_complete\models\best_bgaunet.keras")
SWIN_MODEL_PATH = Path(r"C:\Users\HP\IDI-086_inference_complete\models\best_swin.pth")
INPUT_DATASET_DIR = Path(r"C:\Users\HP\IDI-086_inference_complete\data")
OUTPUT_DATASET_DIR = Path(r"C:\Users\HP\IDI-086_inference_complete\results_prediction")

CLEAR_OUTPUT_DIRECTORY = True

VALID_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}
OUTPUT_IMAGE_EXTENSION = ".jpg"
JPEG_QUALITY = 95

YOLO_IMAGE_SIZE = 768
YOLO_CONFIDENCE_THRESHOLD = 0.25
YOLO_IOU_THRESHOLD = 0.60
YOLO_DEVICE = "auto"
MAX_DETECTIONS_PER_IMAGE = 3
MIN_BOX_WIDTH = 5
MIN_BOX_HEIGHT = 5

USE_FULL_IMAGE_IF_NO_DETECTION = True
SAVE_IMAGES_WITHOUT_DETECTIONS = True
SAVE_DEBUG_IMAGES = True
SAVE_MASK_OVERLAYS = True

MGAC_MARGIN = 1.15
MGAC_NUM_ITER = 380
MGAC_SMOOTHING = 1
MGAC_BALLOON = 0
MGAC_CLOSING_RADIUS = 2

BGAUNET_TARGET_SIZE = (512, 512)
BGAUNET_FROM_LOGITS = True
BGAUNET_POSITIVE_CLASS = 1
BGAUNET_THRESHOLD = 0.50
CLIP_BGAUNET_MASK_TO_BBOX = True
KEEP_LARGEST_MASK_COMPONENT = True
BGAUNET_CLOSING_KERNEL = 5
USE_MGAC_IF_BGAUNET_EMPTY = True
MIN_BGAUNET_MASK_PIXELS = 20

SWIN_ROI_MARGIN = 0.10
DEFAULT_SWIN_MODEL_NAME = "swin_tiny_patch4_window7_224.ms_in22k_ft_in1k"
DEFAULT_SWIN_IMAGE_SIZE = 224
BENIGN_CLASS_INDEX = 0
MALIGNANT_CLASS_INDEX = 1

XML_OBJECT_NAME = "nodule"


#rutas de salida

OUTPUT_IMAGES_DIR = OUTPUT_DATASET_DIR / "images"
OUTPUT_XML_DIR = OUTPUT_DATASET_DIR / "xml"
OUTPUT_MGAC_MASKS_DIR = OUTPUT_DATASET_DIR / "masks_mgac"
OUTPUT_BGAUNET_MASKS_DIR = OUTPUT_DATASET_DIR / "masks_bgaunet"
OUTPUT_DEBUG_DIR = OUTPUT_DATASET_DIR / "debug_yolo"
OUTPUT_OVERLAYS_DIR = OUTPUT_DATASET_DIR / "overlays"
OUTPUT_NO_DETECTIONS_DIR = OUTPUT_DATASET_DIR / "no_detections"
OUTPUT_REPORTS_DIR = OUTPUT_DATASET_DIR / "reports"

RESULTS_CSV_PATH = OUTPUT_REPORTS_DIR / "resultados_prediccion.csv"
ERRORS_CSV_PATH = OUTPUT_REPORTS_DIR / "errores.csv"
NO_DETECTIONS_CSV_PATH = OUTPUT_REPORTS_DIR / "no_detections.csv"


#configuracion de cpu

#configura el crecimiento dinámico de memoria para tensorflow
def configure_tensorflow_gpu():
    gpus = tf.config.list_physical_devices("GPU")

    for gpu in gpus:
        try:
            tf.config.experimental.set_memory_growth(gpu, True)
        except RuntimeError as error:
            print(f"[ADVERTENCIA] No se pudo activar memory growth en TensorFlow: {error}")

    return gpus


TF_GPUS = configure_tensorflow_gpu()


#arquitectura para BGAU-Net

N_CLASSES = 2


#convierte las etiquetas a codificación one-hot
def _one_hot(y_true, n_classes=2):
    y = tf.squeeze(y_true, axis=-1)
    return tf.one_hot(tf.cast(y, tf.int32), depth=n_classes)


#calcula el coeficiente dice para la clase positiva
def dice_coef(y_true, y_pred, from_logits=True, pos_class=1, eps=1e-7):
    y_prob = tf.nn.softmax(y_pred, axis=-1) if from_logits else y_pred
    y_true_oh = _one_hot(y_true, n_classes=N_CLASSES)

    yt = tf.cast(y_true_oh[..., pos_class], tf.float32)
    yp = tf.cast(y_prob[..., pos_class], tf.float32)

    yt = tf.reshape(yt, [tf.shape(yt)[0], -1])
    yp = tf.reshape(yp, [tf.shape(yp)[0], -1])

    intersection = tf.reduce_sum(yt * yp, axis=1)
    denominator = tf.reduce_sum(yt, axis=1) + tf.reduce_sum(yp, axis=1)

    dice = (2.0 * intersection + eps) / (denominator + eps)
    dice = tf.where(tf.math.is_finite(dice), dice, tf.zeros_like(dice))
    return tf.cast(tf.reduce_mean(dice), tf.float32)


#genera el mapa de bordes mediante filtros sobel
def compute_edge_map(y_true):
    y = tf.cast(y_true, tf.float32)
    sobel = tf.image.sobel_edges(y)
    gx = sobel[..., 0]
    gy = sobel[..., 1]
    magnitude = tf.sqrt(gx * gx + gy * gy)
    magnitude = tf.squeeze(magnitude, axis=-1)
    return tf.cast(magnitude > 0.0, tf.float32)


ce_loss_fn = tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True)
bce_edge = tf.keras.losses.BinaryCrossentropy(from_logits=True)


#calcula la pérdida combinada de segmentación
def seg_loss(y_true, y_pred):
    y_true_ce = tf.cast(tf.squeeze(y_true, axis=-1), tf.int32)
    ce = ce_loss_fn(y_true_ce, y_pred)
    dice_loss = 1.0 - dice_coef(
        y_true,
        y_pred,
        from_logits=BGAUNET_FROM_LOGITS,
        pos_class=BGAUNET_POSITIVE_CLASS,
    )
    total = ce + dice_loss
    total = tf.where(
        tf.math.is_finite(total),
        total,
        tf.constant(1e3, dtype=tf.float32),
    )
    return tf.cast(total, tf.float32)


#calcula la pérdida asociada a los bordes
def edge_loss(y_true, y_pred_edge):
    edge_true = compute_edge_map(y_true)
    loss = bce_edge(edge_true, y_pred_edge)
    loss = tf.where(
        tf.math.is_finite(loss),
        loss,
        tf.constant(1e3, dtype=tf.float32),
    )
    return tf.cast(loss, tf.float32)


#arquitectura SwinTransformer dual

#define la rama convolucional que procesa la máscara
class MaskBranchCNN(nn.Module):
    def __init__(self, out_dim=256):
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

    def forward(self, x):
        x = self.features(x)
        return self.proj(x)


#define el clasificador de dos ramas para imagen y máscara
class DualBranchClassifier(nn.Module):
    def __init__(
        self,
        model_name,
        image_size,
        num_classes=2,
        mask_dim=256,
        fusion_dim=512,
    ):
        super().__init__()

        self.image_backbone = timm.create_model(
            model_name,
            pretrained=False,
            num_classes=0,
            global_pool="avg",
        )

        with torch.no_grad():
            dummy = torch.zeros(1, 3, image_size, image_size)
            image_feature_dimension = self.image_backbone(dummy).shape[1]

        self.mask_backbone = MaskBranchCNN(out_dim=mask_dim)

        self.classifier = nn.Sequential(
            nn.Linear(image_feature_dimension + mask_dim, fusion_dim),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(fusion_dim, 128),
            nn.ReLU(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(128, num_classes),
        )

    def forward(self, image, mask):
        image_features = self.image_backbone(image)
        mask_features = self.mask_backbone(mask)
        fused_features = torch.cat([image_features, mask_features], dim=1)
        return self.classifier(fused_features)


#funciones generales

#valida las rutas y parámetros principales del sistema
def validate_configuration():
    required_paths = {
        "Modelo YOLO11": YOLO_MODEL_PATH,
        "Modelo BGAU-Net": BGAUNET_MODEL_PATH,
        "Modelo Swin Transformer": SWIN_MODEL_PATH,
        "Dataset de entrada": INPUT_DATASET_DIR,
    }

    missing = []

    for name, path in required_paths.items():
        if not path.exists():
            missing.append(f"{name}: {path}")

    if missing:
        message = "\n".join(missing)
        raise FileNotFoundError(
            "No se encontraron los siguientes archivos o carpetas:\n" + message
        )

    if not 0.0 <= YOLO_CONFIDENCE_THRESHOLD <= 1.0:
        raise ValueError("YOLO_CONFIDENCE_THRESHOLD debe estar entre 0 y 1.")

    if not 0.0 <= YOLO_IOU_THRESHOLD <= 1.0:
        raise ValueError("YOLO_IOU_THRESHOLD debe estar entre 0 y 1.")

    input_resolved = INPUT_DATASET_DIR.resolve()
    output_resolved = OUTPUT_DATASET_DIR.resolve()

    if input_resolved == output_resolved:
        raise ValueError("La carpeta de salida no puede ser igual a la carpeta de entrada.")

    try:
        output_resolved.relative_to(input_resolved)
        raise ValueError(
            "La carpeta de salida no puede estar dentro de la carpeta de entrada."
        )
    except ValueError as error:
        if str(error).startswith("La carpeta de salida"):
            raise


#crea y prepara las carpetas de salida
def prepare_output_directories():
    if OUTPUT_DATASET_DIR.exists() and CLEAR_OUTPUT_DIRECTORY:
        shutil.rmtree(OUTPUT_DATASET_DIR)

    directories = [
        OUTPUT_IMAGES_DIR,
        OUTPUT_XML_DIR,
        OUTPUT_MGAC_MASKS_DIR,
        OUTPUT_BGAUNET_MASKS_DIR,
        OUTPUT_REPORTS_DIR,
    ]

    if SAVE_DEBUG_IMAGES:
        directories.append(OUTPUT_DEBUG_DIR)

    if SAVE_MASK_OVERLAYS:
        directories.append(OUTPUT_OVERLAYS_DIR)

    if SAVE_IMAGES_WITHOUT_DETECTIONS:
        directories.append(OUTPUT_NO_DETECTIONS_DIR)

    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)


#busca las imágenes admitidas dentro del dataset
def find_images(root_directory):
    return sorted(
        path
        for path in root_directory.rglob("*")
        if path.is_file() and path.suffix.lower() in VALID_IMAGE_EXTENSIONS
    )


#limpia el texto para utilizarlo como nombre de archivo
def sanitize_text(text):
    clean_characters = []

    for character in str(text):
        if character.isalnum() or character in "-_":
            clean_characters.append(character)
        else:
            clean_characters.append("_")

    result = "".join(clean_characters).strip("_")
    return result if result else "image"


#genera identificadores únicos para cada imagen
def create_source_identifiers(image_paths, dataset_root):
    stem_counts = Counter(path.stem.lower() for path in image_paths)
    identifiers = {}
    used_identifiers = set()

    for image_path in image_paths:
        if stem_counts[image_path.stem.lower()] == 1:
            candidate = sanitize_text(image_path.stem)
        else:
            relative_parent = image_path.parent.relative_to(dataset_root)
            parent_text = sanitize_text("_".join(relative_parent.parts))
            candidate = sanitize_text(f"{parent_text}_{image_path.stem}")

        unique_candidate = candidate
        counter = 2

        while unique_candidate.lower() in used_identifiers:
            unique_candidate = f"{candidate}_{counter}"
            counter += 1

        used_identifiers.add(unique_candidate.lower())
        identifiers[image_path] = unique_candidate

    return identifiers


#limita la bounding box a las dimensiones de la imagen
def clip_bbox(xmin, ymin, xmax, ymax, width, height):
    xmin = max(0, min(int(round(xmin)), width - 1))
    ymin = max(0, min(int(round(ymin)), height - 1))
    xmax = max(1, min(int(round(xmax)), width))
    ymax = max(1, min(int(round(ymax)), height))
    return xmin, ymin, xmax, ymax


#calcula el área de la bounding box
def bbox_area(bbox):
    xmin, ymin, xmax, ymax = bbox
    return max(0, xmax - xmin) * max(0, ymax - ymin)


#guarda una imagen en formato jpg
def save_image_as_jpg(image_bgr, output_path):
    success = cv2.imwrite(
        str(output_path),
        image_bgr,
        [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY],
    )

    if not success:
        raise IOError(f"No se pudo guardar la imagen: {output_path}")


#guarda una máscara binaria en formato png
def save_mask_png(mask_u8, output_path):
    success = cv2.imwrite(str(output_path), mask_u8)

    if not success:
        raise IOError(f"No se pudo guardar la máscara: {output_path}")


#guarda los resultados en un archivo csv
def save_csv(path, rows, fieldnames):
    with open(path, "w", newline="", encoding="utf-8-sig") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


#cargar modelos

#selecciona automáticamente el dispositivo para yolo
def resolve_yolo_device():
    if YOLO_DEVICE != "auto":
        return YOLO_DEVICE

    return 0 if torch.cuda.is_available() else "cpu"


#carga el modelo yolo entrenado
def load_yolo_model():
    print("\nCargando YOLO11...")
    model = YOLO(str(YOLO_MODEL_PATH))
    print(f"YOLO11 cargado: {YOLO_MODEL_PATH}")
    return model


#carga el modelo bgaunet y realiza una inferencia de prueba
def load_bgaunet_model():
    print("\nCargando BGAU-Net...")

    custom_objects = {"seg_loss": seg_loss, "edge_loss": edge_loss, "dice_coef": dice_coef,}

    model = tf.keras.models.load_model(BGAUNET_MODEL_PATH, custom_objects=custom_objects, compile=False,)

    dummy = tf.zeros([1, BGAUNET_TARGET_SIZE[0], BGAUNET_TARGET_SIZE[1], 4], dtype=tf.float32,)
    
    _ = model(dummy, training=False)

    print(f"BGAU-Net cargada: {BGAUNET_MODEL_PATH}")
    print(f"Salidas BGAU-Net: {model.output_names}")
    return model


#elimina prefijos del diccionario de pesos cuando es necesario
def remove_state_dict_prefix(state_dict, prefix):
    if all(key.startswith(prefix) for key in state_dict.keys()):
        return {key[len(prefix):]: value for key, value in state_dict.items()}
    return state_dict


#carga el modelo swin transformer de dos ramas
def load_swin_model():
    print("\nCargando SwinTransformer dual")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    checkpoint = torch.load(SWIN_MODEL_PATH, map_location=device)

    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        state_dict = checkpoint["model_state_dict"]
        model_name = checkpoint.get("model_name", DEFAULT_SWIN_MODEL_NAME)
        image_size = int(checkpoint.get("image_size", DEFAULT_SWIN_IMAGE_SIZE))
        mask_dim = int(checkpoint.get("mask_dim", 256))
        fusion_dim = int(checkpoint.get("fusion_dim", 512))
    else:
        state_dict = checkpoint
        model_name = DEFAULT_SWIN_MODEL_NAME
        image_size = DEFAULT_SWIN_IMAGE_SIZE
        mask_dim = 256
        fusion_dim = 512

    state_dict = remove_state_dict_prefix(state_dict, "module.")
    state_dict = remove_state_dict_prefix(state_dict, "_orig_mod.")

    model = DualBranchClassifier(model_name=model_name, image_size=image_size, num_classes=2, mask_dim=mask_dim, fusion_dim=fusion_dim,)

    model.load_state_dict(state_dict, strict=True)
    model = model.to(device)
    model.eval()

    print(f"Swin Transformer cargado: {SWIN_MODEL_PATH}")
    print(f"Arquitectura: {model_name}")
    print(f"Tamaño de entrada: {image_size} x {image_size}")
    print(f"Dispositivo PyTorch: {device}")

    return model, device, model_name, image_size


#Yolo y XML

#extrae y filtra las detecciones obtenidas por yolo
def extract_yolo_detections(result, image_width, image_height):
    detections = []

    if result.boxes is None or len(result.boxes) == 0:
        return detections

    boxes_xyxy = result.boxes.xyxy.detach().cpu().numpy()
    confidences = result.boxes.conf.detach().cpu().numpy()

    if result.boxes.cls is not None:
        class_ids = result.boxes.cls.detach().cpu().numpy().astype(int)
    else:
        class_ids = np.zeros(len(boxes_xyxy), dtype=int)

    for box, confidence, class_id in zip(boxes_xyxy, confidences, class_ids):
        xmin, ymin, xmax, ymax = clip_bbox(box[0], box[1], box[2], box[3], image_width, image_height,)

        box_width = xmax - xmin
        box_height = ymax - ymin

        if box_width < MIN_BOX_WIDTH or box_height < MIN_BOX_HEIGHT:
            continue

        detections.append({"xmin": xmin, "ymin": ymin, "xmax": xmax, "ymax": ymax, "confidence": float(confidence), "class_id": int(class_id), "area": bbox_area((xmin, ymin, xmax, ymax)), "is_fallback": False,})

    detections = sorted(detections, key=lambda item: item["confidence"], reverse=True,)

    if MAX_DETECTIONS_PER_IMAGE is not None and MAX_DETECTIONS_PER_IMAGE > 0:
        detections = detections[:MAX_DETECTIONS_PER_IMAGE]

    detections = sorted(detections, key=lambda item: (item["xmin"], item["ymin"], -item["confidence"]),)

    return detections


#aplica formato legible al contenido xml
def prettify_xml(element):
    rough_xml = ET.tostring(element, encoding="utf-8")
    reparsed = minidom.parseString(rough_xml)
    return reparsed.toprettyxml(indent="  ", encoding=None)


#crea la estructura xml en formato pascal voc
def create_pascal_voc_xml(output_filename, width, height, depth, bbox, confidence, source_image, is_fallback,):
    xmin, ymin, xmax, ymax = bbox

    annotation = ET.Element("annotation")

    folder = ET.SubElement(annotation, "folder")
    folder.text = OUTPUT_IMAGES_DIR.name

    filename = ET.SubElement(annotation, "filename")
    filename.text = output_filename

    source = ET.SubElement(annotation, "source")

    database = ET.SubElement(source, "database")
    database.text = "OPTIMUS-THY"

    original = ET.SubElement(source, "original_image")
    original.text = str(source_image)

    detector = ET.SubElement(source, "detector")
    detector.text = "YOLO11m"

    detection_confidence = ET.SubElement(source, "confidence")
    detection_confidence.text = f"{confidence:.8f}"

    fallback = ET.SubElement(source, "fallback_full_image")
    fallback.text = "1" if is_fallback else "0"

    size = ET.SubElement(annotation, "size")

    width_node = ET.SubElement(size, "width")
    width_node.text = str(width)

    height_node = ET.SubElement(size, "height")
    height_node.text = str(height)

    depth_node = ET.SubElement(size, "depth")
    depth_node.text = str(depth)

    segmented = ET.SubElement(annotation, "segmented")
    segmented.text = "1"

    obj = ET.SubElement(annotation, "object")

    name = ET.SubElement(obj, "name")
    name.text = XML_OBJECT_NAME

    pose = ET.SubElement(obj, "pose")
    pose.text = "Unspecified"

    truncated = ET.SubElement(obj, "truncated")
    truncated.text = "0"

    difficult = ET.SubElement(obj, "difficult")
    difficult.text = "0"

    bndbox = ET.SubElement(obj, "bndbox")

    xmin_node = ET.SubElement(bndbox, "xmin")
    xmin_node.text = str(xmin)

    ymin_node = ET.SubElement(bndbox, "ymin")
    ymin_node.text = str(ymin)

    xmax_node = ET.SubElement(bndbox, "xmax")
    xmax_node.text = str(xmax)

    ymax_node = ET.SubElement(bndbox, "ymax")
    ymax_node.text = str(ymax)

    return annotation


#guarda la bounding box y sus datos en un archivo xml
def save_xml(output_xml_path, output_filename, image_shape, bbox, confidence, source_image, is_fallback,):
    image_height, image_width = image_shape[:2]
    image_depth = image_shape[2] if len(image_shape) == 3 else 1

    annotation = create_pascal_voc_xml(
        output_filename=output_filename,
        width=image_width,
        height=image_height,
        depth=image_depth,
        bbox=bbox,
        confidence=confidence,
        source_image=source_image,
        is_fallback=is_fallback,
    )

    with open(output_xml_path, "w", encoding="utf-8") as xml_file:
        xml_file.write(prettify_xml(annotation))


#lee las bounding boxes almacenadas en el xml
def parse_xml_boxes(xml_path):
    tree = ET.parse(xml_path)
    root = tree.getroot()

    boxes = []

    for obj in root.findall(".//object"):
        label = obj.findtext("name", default="").strip()
        bndbox = obj.find("bndbox")

        if bndbox is None:
            continue

        xmin = int(float(bndbox.findtext("xmin", default="0")))
        ymin = int(float(bndbox.findtext("ymin", default="0")))
        xmax = int(float(bndbox.findtext("xmax", default="0")))
        ymax = int(float(bndbox.findtext("ymax", default="0")))

        if xmax > xmin and ymax > ymin:
            boxes.append((xmin, ymin, xmax, ymax, label))

    if not boxes:
        raise ValueError(f"No se encontraron bounding boxes válidas en: {xml_path}")

    return boxes


#dibuja las detecciones y sus confianzas sobre la imagen
def draw_detections(image_bgr, detections):
    visualization = image_bgr.copy()

    for index, detection in enumerate(detections, start=1):
        xmin = detection["xmin"]
        ymin = detection["ymin"]
        xmax = detection["xmax"]
        ymax = detection["ymax"]
        confidence = detection["confidence"]
        is_fallback = detection["is_fallback"]

        if is_fallback:
            label = "Sin deteccion: imagen completa"
        else:
            label = f"Nodulo {index}: {confidence:.3f}"

        cv2.rectangle(visualization, (xmin, ymin), (xmax, ymax), (0, 255, 0),2,)

        text_y = max(22, ymin - 8)

        cv2.putText(visualization, label, (xmin, text_y), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 0), 2, cv2.LINE_AA,)

    return visualization


#MGAC

#genera la pseudomáscara mediante mgac dentro de la bounding box
def generate_mgac_mask(image_bgr, bbox):
    image_gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    image_height, image_width = image_gray.shape

    xmin, ymin, xmax, ymax = clip_bbox(
        bbox[0],
        bbox[1],
        bbox[2],
        bbox[3],
        image_width,
        image_height,
    )

    roi = image_gray[ymin:ymax, xmin:xmax]

    if roi.size == 0:
        raise ValueError(f"La ROI de MGAC está vacía para la bbox: {bbox}")

    roi_float = img_as_float(roi)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    roi_u8 = np.clip(roi_float * 255.0, 0, 255).astype(np.uint8)
    roi_equalized = clahe.apply(roi_u8)

    roi_median = cv2.medianBlur(roi_equalized, 5)
    roi_blurred = cv2.GaussianBlur(roi_median, (0, 0), 1.2)

    gradient_x = cv2.Sobel(roi_blurred, cv2.CV_32F, 1, 0, ksize=3)
    gradient_y = cv2.Sobel(roi_blurred, cv2.CV_32F, 0, 1, ksize=3)
    gradient = cv2.magnitude(gradient_x, gradient_y)
    gradient = gradient / (gradient.max() + 1e-6)

    inverse_gaussian_gradient = 1.0 / (1.0 + 12.0 * gradient)

    roi_height, roi_width = roi.shape
    initial_level_set = np.zeros((roi_height, roi_width), dtype=np.uint8)

    center_x = roi_width // 2
    center_y = roi_height // 2

    axis_x = max(1, int(0.32 * roi_width * MGAC_MARGIN))
    axis_y = max(1, int(0.32 * roi_height * MGAC_MARGIN))

    max_axis_x = max(1, roi_width // 2 - 1)
    max_axis_y = max(1, roi_height // 2 - 1)

    axis_x = min(axis_x, max_axis_x)
    axis_y = min(axis_y, max_axis_y)

    cv2.ellipse(initial_level_set, (center_x, center_y), (axis_x, axis_y), 0, 0, 360, 1, -1,)

    mgac = morphological_geodesic_active_contour(inverse_gaussian_gradient, num_iter=MGAC_NUM_ITER, init_level_set=initial_level_set, smoothing=MGAC_SMOOTHING, balloon=MGAC_BALLOON,)

    mgac = mgac > 0

    if MGAC_CLOSING_RADIUS > 0:
        mgac = closing(mgac, disk(MGAC_CLOSING_RADIUS))

    full_mask = np.zeros((image_height, image_width), dtype=np.uint8)
    full_mask[ymin:ymax, xmin:xmax] = mgac.astype(np.uint8) * 255

    return full_mask


#BGAU-Net

#crea un mapa binario a partir de la bounding box
def build_bbox_mask(height, width, bbox):
    mask = np.zeros((height, width), dtype=np.uint8)
    xmin, ymin, xmax, ymax = clip_bbox(bbox[0], bbox[1], bbox[2], bbox[3], width, height)
    mask[ymin:ymax, xmin:xmax] = 255
    return mask


#selecciona la salida principal de segmentación de bgaunet
def select_main_segmentation_output(outputs):
    if isinstance(outputs, dict):
        preferred_names = ["seg_main", "main", "segmentation", "output_1",]

        for preferred_name in preferred_names:
            if preferred_name in outputs:
                return outputs[preferred_name]

        return next(iter(outputs.values()))

    if isinstance(outputs, (list, tuple)):
        if len(outputs) == 0:
            raise ValueError("La BGAU-Net no devolvió ninguna salida.")
        return outputs[0]

    return outputs


#conserva únicamente el componente conectado de mayor tamaño
def keep_largest_connected_component(mask_u8):
    binary = (mask_u8 > 0).astype(np.uint8)
    number_of_labels, labels, stats, _ = cv2.connectedComponentsWithStats(binary, connectivity=8,)

    if number_of_labels <= 1:
        return mask_u8

    component_areas = stats[1:, cv2.CC_STAT_AREA]
    largest_label = 1 + int(np.argmax(component_areas))
    return (labels == largest_label).astype(np.uint8) * 255


#aplica el postprocesamiento a la máscara generada por bgaunet
def postprocess_bgaunet_mask(mask_u8, bbox):
    processed = (mask_u8 > 127).astype(np.uint8) * 255

    if BGAUNET_CLOSING_KERNEL and BGAUNET_CLOSING_KERNEL > 1:
        kernel_size = int(BGAUNET_CLOSING_KERNEL)

        if kernel_size % 2 == 0:
            kernel_size += 1

        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size, kernel_size),)
        processed = cv2.morphologyEx(processed, cv2.MORPH_CLOSE, kernel)

    if KEEP_LARGEST_MASK_COMPONENT:
        processed = keep_largest_connected_component(processed)

    if CLIP_BGAUNET_MASK_TO_BBOX:
        bbox_mask = build_bbox_mask(processed.shape[0], processed.shape[1], bbox)
        processed = cv2.bitwise_and(processed, bbox_mask)

    return processed


#genera la máscara final mediante bgaunet
def predict_bgaunet_mask(model, image_bgr, bbox, mgac_mask):
    original_height, original_width = image_bgr.shape[:2]

    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    image_resized = cv2.resize(image_rgb, (BGAUNET_TARGET_SIZE[1], BGAUNET_TARGET_SIZE[0]), interpolation=cv2.INTER_LINEAR,)
    image_input = image_resized.astype(np.float32) / 255.0

    bbox_mask_original = build_bbox_mask(original_height, original_width, bbox)
    bbox_mask_resized = cv2.resize(bbox_mask_original, (BGAUNET_TARGET_SIZE[1], BGAUNET_TARGET_SIZE[0]), interpolation=cv2.INTER_NEAREST,)
    bbox_input = (bbox_mask_resized > 127).astype(np.float32)[..., np.newaxis]

    network_input = np.concatenate([image_input, bbox_input], axis=-1)
    network_input = tf.convert_to_tensor(network_input[np.newaxis, ...], dtype=tf.float32,)

    outputs = model(network_input, training=False)
    segmentation_output = select_main_segmentation_output(outputs)
    segmentation_output = tf.convert_to_tensor(segmentation_output)

    if segmentation_output.shape.rank != 4:
        raise ValueError(
            "La salida principal de BGAU-Net debe tener cuatro dimensiones "
            f"[batch, alto, ancho, clases]. Forma obtenida: {segmentation_output.shape}")

    number_of_channels = segmentation_output.shape[-1]

    if number_of_channels == 1:
        if BGAUNET_FROM_LOGITS:
            positive_probability = tf.math.sigmoid(segmentation_output[0, ..., 0])
        else:
            positive_probability = segmentation_output[0, ..., 0]

        predicted_small = tf.cast(positive_probability >= BGAUNET_THRESHOLD, tf.uint8,).numpy()
    else:
        if BGAUNET_FROM_LOGITS:
            probabilities = tf.nn.softmax(segmentation_output, axis=-1)
        else:
            probabilities = segmentation_output

        predicted_class = tf.argmax(probabilities[0], axis=-1)
        predicted_small = tf.cast(tf.equal(predicted_class, BGAUNET_POSITIVE_CLASS), tf.uint8,).numpy()

    predicted_small = predicted_small.astype(np.uint8) * 255

    predicted_original = cv2.resize(predicted_small, (original_width, original_height), interpolation=cv2.INTER_NEAREST,)

    predicted_original = postprocess_bgaunet_mask(predicted_original, bbox)

    positive_pixels = int(np.count_nonzero(predicted_original))

    if positive_pixels < MIN_BGAUNET_MASK_PIXELS and USE_MGAC_IF_BGAUNET_EMPTY:
        return mgac_mask.copy(), "mgac_fallback", positive_pixels

    return predicted_original, "bgaunet", positive_pixels


#clasificación SwinTransformer


#expande la bounding box utilizando un margen proporcional
def expand_box(xmin, ymin, xmax, ymax, image_width, image_height, margin):
    box_width = xmax - xmin
    box_height = ymax - ymin

    delta_x = int(round(box_width * margin))
    delta_y = int(round(box_height * margin))

    xmin = max(0, xmin - delta_x)
    ymin = max(0, ymin - delta_y)
    xmax = min(image_width, xmax + delta_x)
    ymax = min(image_height, ymax + delta_y)

    return xmin, ymin, xmax, ymax


#recorta la imagen y la máscara según la bounding box del xml
def crop_roi_from_xml(image_pil, mask_pil, xml_path, margin):
    boxes = parse_xml_boxes(xml_path)

    xmin = min(box[0] for box in boxes)
    ymin = min(box[1] for box in boxes)
    xmax = max(box[2] for box in boxes)
    ymax = max(box[3] for box in boxes)

    image_width, image_height = image_pil.size

    xmin, ymin, xmax, ymax = expand_box(xmin, ymin, xmax, ymax, image_width, image_height, margin,)

    if xmax <= xmin or ymax <= ymin:
        raise ValueError(f"La ROI final es inválida: {(xmin, ymin, xmax, ymax)}")

    image_roi = image_pil.crop((xmin, ymin, xmax, ymax))
    mask_roi = mask_pil.crop((xmin, ymin, xmax, ymax))

    return image_roi, mask_roi, (xmin, ymin, xmax, ymax)


#prepara la imagen y la máscara para el swin transformer
def prepare_swin_inputs(image_roi, mask_roi, image_size, device):
    image_transform = transforms.Compose([transforms.Resize((image_size, image_size)), transforms.ToTensor(), transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225],),])

    mask_transform = transforms.Compose([transforms.Resize((image_size, image_size), interpolation=transforms.InterpolationMode.NEAREST,),transforms.ToTensor(),])

    image_tensor = image_transform(image_roi).unsqueeze(0).to(device)
    mask_tensor = mask_transform(mask_roi).unsqueeze(0).to(device)
    mask_tensor = (mask_tensor > 0.5).float()

    return image_tensor, mask_tensor


#realiza la clasificación final del nódulo tiroideo
def predict_swin_class(model, device, image_size, image_bgr, final_mask, xml_path,):
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    image_pil = Image.fromarray(image_rgb).convert("RGB")
    mask_pil = Image.fromarray(final_mask).convert("L")

    image_roi, mask_roi, final_box = crop_roi_from_xml(image_pil=image_pil, mask_pil=mask_pil, xml_path=xml_path, margin=SWIN_ROI_MARGIN,)

    image_tensor, mask_tensor = prepare_swin_inputs(image_roi=image_roi, mask_roi=mask_roi, image_size=image_size, device=device,)

    with torch.inference_mode():
        logits = model(image_tensor, mask_tensor)
        probabilities = torch.softmax(logits, dim=1)
        predicted_label = int(torch.argmax(probabilities, dim=1).item())
        probability_benign = float(probabilities[0, BENIGN_CLASS_INDEX].item())
        probability_malignant = float(probabilities[0, MALIGNANT_CLASS_INDEX].item())

    predicted_class = "Benigno" if predicted_label == BENIGN_CLASS_INDEX else "Maligno"

    return {"predicted_label": predicted_label, "predicted_class": predicted_class, "probability_benign": probability_benign, "probability_malignant": probability_malignant, "final_roi_box": final_box,
        "image_roi": image_roi, "mask_roi": mask_roi,}


#visualización

#crea una visualización con máscara, bounding box y predicción
def create_mask_overlay(image_bgr, mask_u8, bbox, prediction_text):
    overlay = image_bgr.copy()
    mask_boolean = mask_u8 > 0

    red_layer = np.zeros_like(overlay)
    red_layer[:, :, 2] = 255

    overlay[mask_boolean] = cv2.addWeighted(overlay[mask_boolean], 0.60, red_layer[mask_boolean], 0.40, 0,)

    xmin, ymin, xmax, ymax = bbox
    cv2.rectangle(overlay, (xmin, ymin), (xmax, ymax), (0, 255, 0), 2)

    cv2.putText(overlay, prediction_text, (xmin, max(24, ymin - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 255), 2, cv2.LINE_AA,)

    return overlay


#procesamiento completo


#ejecuta el flujo completo sobre todas las imágenes del dataset
def process_dataset(yolo_model, bgaunet_model, swin_bundle):
    swin_model, swin_device, swin_model_name, swin_image_size = swin_bundle

    image_paths = find_images(INPUT_DATASET_DIR)

    if not image_paths:
        raise RuntimeError(f"No se encontraron imágenes en: {INPUT_DATASET_DIR}")

    source_identifiers = create_source_identifiers(image_paths, INPUT_DATASET_DIR)
    yolo_device = resolve_yolo_device()

    results_rows = []
    error_rows = []
    no_detection_rows = []

    counters = {"original_images": len(image_paths), "images_with_yolo_detection": 0, "images_without_yolo_detection": 0, "processed_nodules": 0, "benign_predictions": 0, "malignant_predictions": 0, "bgaunet_masks": 0, "mgac_fallback_masks": 0, "errors": 0,}

    print("\n" + "=" * 88)
    print("INFERENCIA AUTOMÁTICA DE NÓDULOS TIROIDEOS")
    print("YOLO11 -> XML -> MGAC -> BGAU-NET -> SWIN TRANSFORMER")
    print("=" * 88)
    print(f"Dataset de entrada : {INPUT_DATASET_DIR}")
    print(f"Dataset de salida  : {OUTPUT_DATASET_DIR}")
    print(f"Imágenes encontradas: {len(image_paths)}")
    print(f"Dispositivo YOLO   : {yolo_device}")
    print(f"GPU TensorFlow     : {len(TF_GPUS) > 0}")
    print(f"GPU PyTorch        : {torch.cuda.is_available()}")

    for image_path in tqdm(image_paths, desc="Procesando imágenes", unit="img"):
        source_id = source_identifiers[image_path]
        relative_source_path = image_path.relative_to(INPUT_DATASET_DIR)

        try:
            image_bgr = cv2.imread(str(image_path), cv2.IMREAD_COLOR)

            if image_bgr is None:
                raise ValueError("OpenCV no pudo leer la imagen.")

            image_height, image_width = image_bgr.shape[:2]

            yolo_results = yolo_model.predict(source=str(image_path), imgsz=YOLO_IMAGE_SIZE, conf=YOLO_CONFIDENCE_THRESHOLD, iou=YOLO_IOU_THRESHOLD, device=yolo_device, verbose=False, save=False,)

            if len(yolo_results) == 0:
                detections = []
            else:
                detections = extract_yolo_detections(yolo_results[0], image_width, image_height,)

            yolo_detected = len(detections) > 0

            if yolo_detected:
                counters["images_with_yolo_detection"] += 1
            else:
                counters["images_without_yolo_detection"] += 1

                no_detection_rows.append(
                    {"source_image": image_path.name, "source_relative_path": str(relative_source_path), "reason": "no_yolo_detection",
                        "detail": (f"No hubo detecciones con confianza >= " f"{YOLO_CONFIDENCE_THRESHOLD}."),})

                if SAVE_IMAGES_WITHOUT_DETECTIONS:
                    destination = OUTPUT_NO_DETECTIONS_DIR / image_path.name
                    if destination.exists():
                        destination = OUTPUT_NO_DETECTIONS_DIR / (f"{source_id}{image_path.suffix.lower()}")
                    shutil.copy2(image_path, destination)

                if not USE_FULL_IMAGE_IF_NO_DETECTION:
                    continue

                detections = [{"xmin": 0, "ymin": 0, "xmax": image_width, "ymax": image_height, "confidence": 0.0, "class_id": -1, "area": image_width * image_height, "is_fallback": True,}]

            if SAVE_DEBUG_IMAGES:
                debug_image = draw_detections(image_bgr, detections)
                debug_path = OUTPUT_DEBUG_DIR / f"{source_id}_detections.jpg"
                save_image_as_jpg(debug_image, debug_path)

            number_of_cases = len(detections)

            for nodule_index, detection in enumerate(detections, start=1):
                if number_of_cases == 1:
                    case_id = source_id
                else:
                    case_id = f"{source_id}_{nodule_index}"

                output_image_name = f"{case_id}{OUTPUT_IMAGE_EXTENSION}"
                output_xml_name = f"{case_id}.xml"
                output_mask_name = f"{case_id}.png"

                output_image_path = OUTPUT_IMAGES_DIR / output_image_name
                output_xml_path = OUTPUT_XML_DIR / output_xml_name
                output_mgac_mask_path = OUTPUT_MGAC_MASKS_DIR / output_mask_name
                output_bgaunet_mask_path = OUTPUT_BGAUNET_MASKS_DIR / output_mask_name

                bbox = (detection["xmin"], detection["ymin"], detection["xmax"], detection["ymax"],)

                try:
                    save_image_as_jpg(image_bgr, output_image_path)

                    save_xml(output_xml_path=output_xml_path, output_filename=output_image_name, image_shape=image_bgr.shape, bbox=bbox, confidence=detection["confidence"], source_image=relative_source_path,is_fallback=detection["is_fallback"],)

                    mgac_mask = generate_mgac_mask(image_bgr, bbox)
                    save_mask_png(mgac_mask, output_mgac_mask_path)

                    final_mask, mask_source, raw_bgaunet_pixels = predict_bgaunet_mask(model=bgaunet_model, image_bgr=image_bgr, bbox=bbox, mgac_mask=mgac_mask,)
                    save_mask_png(final_mask, output_bgaunet_mask_path)

                    if mask_source == "bgaunet":
                        counters["bgaunet_masks"] += 1
                    else:
                        counters["mgac_fallback_masks"] += 1

                    classification = predict_swin_class(model=swin_model, device=swin_device, image_size=swin_image_size, image_bgr=image_bgr, final_mask=final_mask, xml_path=output_xml_path,)

                    predicted_class = classification["predicted_class"]

                    if predicted_class == "Benigno":
                        counters["benign_predictions"] += 1
                    else:
                        counters["malignant_predictions"] += 1

                    if SAVE_MASK_OVERLAYS:
                        prediction_text = (
                            f"{predicted_class} | "
                            f"B: {classification['probability_benign']:.3f} | "
                            f"M: {classification['probability_malignant']:.3f}"
                        )
                        overlay = create_mask_overlay(image_bgr, final_mask, bbox, prediction_text,)
                        overlay_path = OUTPUT_OVERLAYS_DIR / f"{case_id}_overlay.jpg"
                        save_image_as_jpg(overlay, overlay_path)
                    else:
                        overlay_path = Path("")

                    final_roi_box = classification["final_roi_box"]

                    results_rows.append(
                        {
                            "case_id": case_id,
                            "source_image": image_path.name,
                            "source_relative_path": str(relative_source_path),
                            "nodule_index": nodule_index,
                            "nodules_in_source": number_of_cases,
                            "yolo_detected": int(not detection["is_fallback"]),
                            "full_image_fallback": int(detection["is_fallback"]),
                            "yolo_confidence": detection["confidence"],
                            "yolo_class_id": detection["class_id"],
                            "xmin": bbox[0],
                            "ymin": bbox[1],
                            "xmax": bbox[2],
                            "ymax": bbox[3],
                            "bbox_width": bbox[2] - bbox[0],
                            "bbox_height": bbox[3] - bbox[1],
                            "bbox_area": detection["area"],
                            "mask_source": mask_source,
                            "raw_bgaunet_positive_pixels": raw_bgaunet_pixels,
                            "final_mask_positive_pixels": int(np.count_nonzero(final_mask)),
                            "predicted_label": classification["predicted_label"],
                            "predicted_class": predicted_class,
                            "probability_benign": classification["probability_benign"],
                            "probability_malignant": classification["probability_malignant"],
                            "roi_xmin": final_roi_box[0],
                            "roi_ymin": final_roi_box[1],
                            "roi_xmax": final_roi_box[2],
                            "roi_ymax": final_roi_box[3],
                            "swin_model_name": swin_model_name,
                            "swin_image_size": swin_image_size,
                            "output_image": str(output_image_path),
                            "output_xml": str(output_xml_path),
                            "output_mgac_mask": str(output_mgac_mask_path),
                            "output_final_mask": str(output_bgaunet_mask_path),
                            "output_overlay": str(overlay_path) if SAVE_MASK_OVERLAYS else "",})

                    counters["processed_nodules"] += 1

                    print("\n" + "-" * 88)
                    print(f"IMAGEN               : {relative_source_path}")
                    print(f"CASO                 : {case_id}")
                    print(f"NÓDULO               : {nodule_index}/{number_of_cases}")
                    print(f"DETECCIÓN YOLO       : {'Sí' if not detection['is_fallback'] else 'No'}")
                    print(f"CONFIANZA YOLO       : {detection['confidence']:.6f}")
                    print(f"BOUNDING BOX         : {bbox}")
                    print(f"MÁSCARA FINAL        : {mask_source}")
                    print(f"PREDICCIÓN           : {predicted_class}")
                    print(f"PROBABILIDAD BENIGNO : " f"{classification['probability_benign']:.6%}")
                    print(f"PROBABILIDAD MALIGNO : " f"{classification['probability_malignant']:.6%}")
                    print("-" * 88)

                except Exception as nodule_error:
                    counters["errors"] += 1

                    error_rows.append({"source_image": image_path.name, "source_relative_path": str(relative_source_path), "case_id": case_id, "stage": "nodule_pipeline", "error_type": type(nodule_error).__name__,
                            "error_message": str(nodule_error), "traceback": traceback.format_exc(),})

                    print(f"\n[ERROR] Falló el caso {case_id}: " f"{type(nodule_error).__name__}: {nodule_error}")

        except Exception as image_error:
            counters["errors"] += 1

            error_rows.append({"source_image": image_path.name, "source_relative_path": str(relative_source_path), "case_id": source_id, "stage": "image_pipeline", "error_type": type(image_error).__name__, 
                               "error_message": str(image_error), "traceback": traceback.format_exc(),})

            print(f"\n[ERROR] Falló la imagen {relative_source_path}: " f"{type(image_error).__name__}: {image_error}")

    result_fieldnames = [
        "case_id",
        "source_image",
        "source_relative_path",
        "nodule_index",
        "nodules_in_source",
        "yolo_detected",
        "full_image_fallback",
        "yolo_confidence",
        "yolo_class_id",
        "xmin",
        "ymin",
        "xmax",
        "ymax",
        "bbox_width",
        "bbox_height",
        "bbox_area",
        "mask_source",
        "raw_bgaunet_positive_pixels",
        "final_mask_positive_pixels",
        "predicted_label",
        "predicted_class",
        "probability_benign",
        "probability_malignant",
        "roi_xmin",
        "roi_ymin",
        "roi_xmax",
        "roi_ymax",
        "swin_model_name",
        "swin_image_size",
        "output_image",
        "output_xml",
        "output_mgac_mask",
        "output_final_mask",
        "output_overlay",
    ]

    error_fieldnames = ["source_image", "source_relative_path", "case_id", "stage", "error_type", "error_message", "traceback",]

    no_detection_fieldnames = ["source_image", "source_relative_path", "reason", "detail",]

    save_csv(RESULTS_CSV_PATH, results_rows, result_fieldnames)
    save_csv(ERRORS_CSV_PATH, error_rows, error_fieldnames)
    save_csv(NO_DETECTIONS_CSV_PATH, no_detection_rows, no_detection_fieldnames,)

    return counters, results_rows


#programa principal


#muestra el resumen final y verifica los archivos generados
def print_final_summary(counters, results_rows):
    generated_images = list(OUTPUT_IMAGES_DIR.glob(f"*{OUTPUT_IMAGE_EXTENSION}"))
    generated_xmls = list(OUTPUT_XML_DIR.glob("*.xml"))
    generated_mgac_masks = list(OUTPUT_MGAC_MASKS_DIR.glob("*.png"))
    generated_final_masks = list(OUTPUT_BGAUNET_MASKS_DIR.glob("*.png"))

    image_ids = {path.stem for path in generated_images}
    xml_ids = {path.stem for path in generated_xmls}
    mgac_ids = {path.stem for path in generated_mgac_masks}
    final_mask_ids = {path.stem for path in generated_final_masks}

    incomplete_cases = sorted((image_ids | xml_ids | mgac_ids | final_mask_ids) - (image_ids & xml_ids & mgac_ids & final_mask_ids))

    print("\n" + "=" * 88)
    print("PROCESO FINALIZADO")
    print("=" * 88)
    print(f"Imágenes originales                  : {counters['original_images']}")
    print(f"Imágenes con detección YOLO          : " f"{counters['images_with_yolo_detection']}")
    print(f"Imágenes sin detección YOLO          : " f"{counters['images_without_yolo_detection']}")
    print(f"Nódulos/casos procesados             : {counters['processed_nodules']}")
    print(f"Predicciones benignas                : {counters['benign_predictions']}")
    print(f"Predicciones malignas                : {counters['malignant_predictions']}")
    print(f"Máscaras generadas por BGAU-Net      : {counters['bgaunet_masks']}")
    print(f"Máscaras sustituidas por MGAC        : " f"{counters['mgac_fallback_masks']}")
    print(f"Errores                              : {counters['errors']}")
    print(f"Imágenes de salida                   : {len(generated_images)}")
    print(f"XML generados                        : {len(generated_xmls)}")
    print(f"Máscaras MGAC generadas              : {len(generated_mgac_masks)}")
    print(f"Máscaras finales generadas           : {len(generated_final_masks)}")
    print(f"Casos incompletos                    : {len(incomplete_cases)}")

    if results_rows:
        mean_benign_probability = np.mean([row["probability_benign"] for row in results_rows])
        mean_malignant_probability = np.mean([row["probability_malignant"] for row in results_rows])

        print(f"Probabilidad benigna promedio         : " f"{mean_benign_probability:.6%}")
        print(f"Probabilidad maligna promedio         : " f"{mean_malignant_probability:.6%}")

    print("\nDataset generado en:")
    print(OUTPUT_DATASET_DIR)
    print("\nResultados CSV:")
    print(RESULTS_CSV_PATH)
    print("\nErrores CSV:")
    print(ERRORS_CSV_PATH)
    print("\nReporte de imágenes sin detección:")
    print(NO_DETECTIONS_CSV_PATH)

    if incomplete_cases:
        print("\nCasos incompletos:")
        for case_id in incomplete_cases:
            print(f"  - {case_id}")

#ejecuta la configuración, carga de modelos e inferencia completa
def main():
    validate_configuration()
    prepare_output_directories()

    print("=" * 88)
    print("CONFIGURACIÓN DEL SISTEMA")
    print("=" * 88)
    print(f"Python               : {sys.version.split()[0]}")
    print(f"PyTorch              : {torch.__version__}")
    print(f"TensorFlow           : {tf.__version__}")
    print(f"CUDA PyTorch         : {torch.cuda.is_available()}")

    if torch.cuda.is_available():
        print(f"GPU PyTorch          : {torch.cuda.get_device_name(0)}")

    yolo_model = load_yolo_model()
    bgaunet_model = load_bgaunet_model()
    swin_bundle = load_swin_model()

    counters, results_rows = process_dataset(yolo_model=yolo_model, bgaunet_model=bgaunet_model, swin_bundle=swin_bundle,)

    print_final_summary(counters, results_rows)

if __name__ == "__main__":
    main()