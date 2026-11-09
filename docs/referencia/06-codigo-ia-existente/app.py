#librerías necesarias

import importlib.util
import io
import shutil
import tempfile
import zipfile
from datetime import datetime
from pathlib import Path
import cv2
import numpy as np
import pandas as pd
import streamlit as st
from PIL import Image
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


#configuración

BASE_CODE_PATH = Path(__file__).resolve().parent / "base.py"

LOGO_ESPOCH = Path(r"C:\Users\HP\IDI-086_inference_complete\extras\espoch.png")
LOGO_SOLCA = Path(r"C:\Users\HP\IDI-086_inference_complete\extras\solca.png")

PAGE_TITLE = "OPTIMUS-THY"
PROJECT_TITLE = "Sistema computacional inteligente para análisis, detección y seguimiento de cáncer de tiroides con visualización interactiva e inmersiva"

st.set_page_config(page_title=PAGE_TITLE, page_icon="🩺", layout="wide",)


#carga el código original como un módulo sin ejecutar su función main
def load_base_module():
    specification = importlib.util.spec_from_file_location("base", BASE_CODE_PATH,)

    if specification is None or specification.loader is None:
        raise ImportError(f"No se pudo cargar el archivo base: {BASE_CODE_PATH}")

    module = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(module)

    return module

base = load_base_module()

#prepara las carpetas temporales utilizadas por streamlit
def configure_streamlit_directories():
    if "optimus_thy_workspace" not in st.session_state:
        st.session_state.optimus_thy_workspace = tempfile.mkdtemp(prefix="optimus_thy_streamlit_")

    workspace = Path(st.session_state.optimus_thy_workspace)
    input_directory = workspace / "data"
    output_directory = workspace / "results_prediction"

    base.INPUT_DATASET_DIR = input_directory
    base.OUTPUT_DATASET_DIR = output_directory

    base.OUTPUT_IMAGES_DIR = output_directory / "images"
    base.OUTPUT_XML_DIR = output_directory / "xml"
    base.OUTPUT_MGAC_MASKS_DIR = output_directory / "masks_mgac"
    base.OUTPUT_BGAUNET_MASKS_DIR = output_directory / "masks_bgaunet"
    base.OUTPUT_DEBUG_DIR = output_directory / "debug_yolo"
    base.OUTPUT_OVERLAYS_DIR = output_directory / "overlays"
    base.OUTPUT_NO_DETECTIONS_DIR = output_directory / "no_detections"
    base.OUTPUT_REPORTS_DIR = output_directory / "reports"

    base.RESULTS_CSV_PATH = base.OUTPUT_REPORTS_DIR / "resultados_prediccion.csv"
    base.ERRORS_CSV_PATH = base.OUTPUT_REPORTS_DIR / "errores.csv"
    base.NO_DETECTIONS_CSV_PATH = base.OUTPUT_REPORTS_DIR / "no_detections.csv"

    return workspace, input_directory, output_directory


#carga los modelos una sola vez durante la ejecución de la aplicación
@st.cache_resource(show_spinner=False)
def load_models():
    yolo_model = base.load_yolo_model()
    bgaunet_model = base.load_bgaunet_model()
    swin_bundle = base.load_swin_model()

    return yolo_model, bgaunet_model, swin_bundle


#convierte una imagen bgr a rgb
def convert_bgr_to_rgb(image_bgr):
    return cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB,)


#convierte una imagen bgr a pil
def convert_bgr_to_pil(image_bgr):
    image_rgb = convert_bgr_to_rgb(image_bgr)
    return Image.fromarray(image_rgb).convert("RGB")


#convierte una máscara a pil
def convert_mask_to_pil(mask):
    mask = np.asarray(mask)

    if mask.ndim == 3 and mask.shape[-1] == 1:
        mask = mask[:, :, 0]

    if mask.ndim > 2:
        mask = np.squeeze(mask)

    if mask.ndim != 2:
        raise ValueError(f"La máscara debe tener dos dimensiones. Forma obtenida: {mask.shape}")

    if mask.dtype != np.uint8:
        if mask.size > 0 and np.max(mask) <= 1:
            mask = mask * 255

        mask = np.clip(mask, 0, 255,).astype(np.uint8)

    return Image.fromarray(mask).convert("L")

#lee una imagen mediante opencv
def read_image(image_path):
    image = cv2.imread(str(image_path), cv2.IMREAD_COLOR,)

    if image is None:
        raise ValueError(f"No se pudo leer la imagen: {image_path}")

    return image


#crea una imagen con la bounding box de un único nódulo
def create_case_bbox_image(image_bgr, row):
    detection = {"xmin": int(row["xmin"]), "ymin": int(row["ymin"]), "xmax": int(row["xmax"]), "ymax": int(row["ymax"]), "confidence": float(row["yolo_confidence"]),
        "is_fallback": bool(row["full_image_fallback"]),}

    return base.draw_detections(image_bgr, [detection],)


#obtiene la región de interés de la imagen y de la máscara
def create_roi_images(image_bgr, final_mask, row):
    xmin = int(row["roi_xmin"])
    ymin = int(row["roi_ymin"])
    xmax = int(row["roi_xmax"])
    ymax = int(row["roi_ymax"])

    image_rgb = convert_bgr_to_rgb(image_bgr)

    image_roi = image_rgb[ymin:ymax, xmin:xmax,]

    mask_roi = final_mask[ymin:ymax, xmin:xmax,]

    return image_roi, mask_roi


#prepara un caso para mostrarlo en la interfaz
def load_case_data(row):
    image_path = Path(row["output_image"])
    xml_path = Path(row["output_xml"])
    mgac_path = Path(row["output_mgac_mask"])
    final_mask_path = Path(row["output_final_mask"])

    image_bgr = read_image(image_path)
    mgac_mask = cv2.imread(str(mgac_path), cv2.IMREAD_GRAYSCALE,)
    final_mask = cv2.imread(str(final_mask_path), cv2.IMREAD_GRAYSCALE,)

    if mgac_mask is None:
        raise ValueError(f"No se pudo leer la máscara MGAC: {mgac_path}")

    if final_mask is None:
        raise ValueError(f"No se pudo leer la máscara final: {final_mask_path}")

    overlay_path = Path(row["output_overlay"])

    if row["output_overlay"] and overlay_path.exists():
        overlay = read_image(overlay_path)
    else:
        prediction_text = (f"{row['predicted_class']} | "
            f"B: {float(row['probability_benign']):.3f} | "
            f"M: {float(row['probability_malignant']):.3f}")

        bbox = (int(row["xmin"]), int(row["ymin"]), int(row["xmax"]), int(row["ymax"]),)

        overlay = base.create_mask_overlay(image_bgr, final_mask, bbox, prediction_text,)

    bbox_image = create_case_bbox_image(image_bgr, row,)

    image_roi, mask_roi = create_roi_images(image_bgr, final_mask, row,)

    return {"image_bgr": image_bgr, "xml_path": xml_path, "mgac_mask": mgac_mask, "final_mask": final_mask, "overlay": overlay, "bbox_image": bbox_image, "image_roi": image_roi,
        "mask_roi": mask_roi,}


#convierte una imagen pil para utilizarla en el pdf
def pil_to_reader(image_pil):
    image_buffer = io.BytesIO()
    image_pil.save(image_buffer, format="PNG",)
    image_buffer.seek(0)

    return ImageReader(image_buffer)


#dibuja una imagen conservando su relación de aspecto
def draw_pil_image(pdf_canvas, image_pil, x, y, width, height):
    image_width, image_height = image_pil.size

    scale = min(width / image_width, height / image_height,)

    draw_width = image_width * scale
    draw_height = image_height * scale

    draw_x = x + (width - draw_width) / 2
    draw_y = y + (height - draw_height) / 2

    pdf_canvas.drawImage(pil_to_reader(image_pil), draw_x, draw_y, width=draw_width, height=draw_height, preserveAspectRatio=True, mask="auto",)


#dibuja el encabezado institucional del pdf
def draw_pdf_header(pdf_canvas, page_width, page_height):
    header_height = 70

    pdf_canvas.setStrokeColor(colors.black)
    pdf_canvas.line(30, page_height - header_height, page_width - 30, page_height - header_height,)

    if LOGO_ESPOCH.exists():
        try:
            pdf_canvas.drawImage(str(LOGO_ESPOCH), 30, page_height - 65, width=50, height=50, preserveAspectRatio=True, mask="auto",)
        except Exception:
            pass

    if LOGO_SOLCA.exists():
        try:
            pdf_canvas.drawImage(str(LOGO_SOLCA), page_width - 80, page_height - 65, width=50, height=50, preserveAspectRatio=True, mask="auto",)
        except Exception:
            pass

    pdf_canvas.setFont("Helvetica-Bold", 16,)
    pdf_canvas.drawCentredString(page_width / 2, page_height - 25, "OPTIMUS-THY",)

    pdf_canvas.setFont("Helvetica-Bold", 10,)
    pdf_canvas.drawCentredString(page_width / 2, page_height - 42, "Sistema computacional inteligente para análisis, detección y seguimiento",)
    pdf_canvas.drawCentredString(page_width / 2, page_height - 56, "de cáncer de tiroides con visualización interactiva e inmersiva",)


#crea el reporte pdf con una página por nódulo
def create_pdf_report(results_dataframe, analysis_date):
    buffer = io.BytesIO()
    pdf_canvas = canvas.Canvas(buffer, pagesize=A4,)

    page_width, page_height = A4

    for _, row in results_dataframe.iterrows():
        case_data = load_case_data(row)

        draw_pdf_header(pdf_canvas, page_width, page_height,)

        pdf_canvas.setFont("Helvetica-Bold", 12,)
        pdf_canvas.drawString(40, page_height - 90, "Reporte de clasificación de nódulo tiroideo",)

        pdf_canvas.setFont("Helvetica", 9,)
        pdf_canvas.drawString(40, page_height - 108, f"Fecha de análisis: {analysis_date}",)
        pdf_canvas.drawString(40, page_height - 123, f"Imagen: {row['source_image']}",)
        pdf_canvas.drawString(40, page_height - 138, f"Nódulo: {int(row['nodule_index'])}/{int(row['nodules_in_source'])}",)

        pdf_canvas.setFont("Helvetica-Bold", 11,)
        pdf_canvas.drawString(40, page_height - 158, f"Predicción final: {row['predicted_class']}",)

        pdf_canvas.setFont("Helvetica", 9,)
        pdf_canvas.drawString(40, page_height - 173, f"Probabilidad benigno: {float(row['probability_benign']):.4%}",)
        pdf_canvas.drawString(40, page_height - 188, f"Probabilidad maligno: {float(row['probability_malignant']):.4%}",)
        pdf_canvas.drawString(300, page_height - 173, f"Bounding box: ({int(row['xmin'])}, {int(row['ymin'])}, {int(row['xmax'])}, {int(row['ymax'])})",)
        pdf_canvas.drawString(300, page_height - 188, f"Máscara final: {row['mask_source']}",)

        image_width = 160
        image_height = 115

        first_row_y = page_height - 335
        second_row_y = page_height - 485

        images = [("Imagen original", convert_bgr_to_pil( case_data["image_bgr"]), 35, first_row_y,),
            ("Bounding box", convert_bgr_to_pil(case_data["bbox_image"]), 218, first_row_y,),
            ("Pseudomáscara MGAC", convert_mask_to_pil(case_data["mgac_mask"]).convert("RGB"), 401, first_row_y,),
            ("Máscara BGAU-Net", convert_mask_to_pil(case_data["final_mask"]).convert("RGB"), 35, second_row_y,),
            ("ROI ecográfica", Image.fromarray(case_data["image_roi"]).convert("RGB"), 218, second_row_y,),
            ("Máscara ROI", convert_mask_to_pil(case_data["mask_roi"]).convert("RGB"), 401, second_row_y,),]

        for title, image, x, y in images:
            pdf_canvas.setFont("Helvetica-Bold", 8,)
            pdf_canvas.drawCentredString(x + image_width / 2, y + image_height + 8, title,)

            draw_pil_image(pdf_canvas, image, x, y, image_width, image_height,)

        overlay_y = page_height - 680

        pdf_canvas.setFont("Helvetica-Bold", 8,)
        pdf_canvas.drawCentredString(page_width / 2, overlay_y + 145, "Resultado final",)

        draw_pil_image(pdf_canvas, convert_bgr_to_pil(case_data["overlay"]), 145, overlay_y, 300, 135,)

        pdf_canvas.setFont("Helvetica", 8,)
        pdf_canvas.drawString(40, 45, f"Modelo: {row['swin_model_name']}",)
        pdf_canvas.drawString(40, 32, f"Tamaño de entrada: {int(row['swin_image_size'])} x {int(row['swin_image_size'])}",)

        pdf_canvas.showPage()

    pdf_canvas.save()
    buffer.seek(0)

    return buffer.getvalue()


#crea un archivo zip con todos los resultados
def create_zip_report(output_directory, pdf_bytes):
    buffer = io.BytesIO()

    with zipfile.ZipFile(buffer, mode="w", compression=zipfile.ZIP_DEFLATED,) as zip_file:
        for file_path in output_directory.rglob("*"):
            if file_path.is_file():
                relative_path = file_path.relative_to(output_directory)
                zip_file.write(file_path, arcname=str(relative_path),)

        zip_file.writestr("reports/reporte_prediccion.pdf", pdf_bytes,)

    buffer.seek(0)

    return buffer.getvalue()


#muestra el encabezado institucional de la aplicación
def show_app_header():
    logo_left, title_column, logo_right = st.columns([1, 6, 1])

    with logo_left:
        if LOGO_ESPOCH.exists():
            st.image(str(LOGO_ESPOCH), width = 110,)

    with title_column:
        st.markdown("<h1 style='text-align:center;'>OPTIMUS-THY</h1>", unsafe_allow_html=True,)
        st.markdown(f"<p style='text-align:center;'>{PROJECT_TITLE}</p>",unsafe_allow_html=True,)

    with logo_right:
        if LOGO_SOLCA.exists():
            st.image(str(LOGO_SOLCA), use_container_width=True,)

    st.markdown("---")


#muestra los resultados de un nódulo
def show_case_result(row):
    case_data = load_case_data(row)

    if row["predicted_class"] == "Benigno":
        st.success(f"Clasificación final: {row['predicted_class']}")
    else:
        st.error(f"Clasificación final: {row['predicted_class']}")

    metric_1, metric_2, metric_3 = st.columns(3)

    with metric_1:
        st.metric("Probabilidad benigno", f"{float(row['probability_benign']):.2%}",)

    with metric_2:
        st.metric("Probabilidad maligno", f"{float(row['probability_malignant']):.2%}",)

    with metric_3:
        st.metric("Confianza YOLO", f"{float(row['yolo_confidence']):.2%}",)

    st.progress(float(row["probability_benign"]), text=f"Benigno: {float(row['probability_benign']):.2%}",)
    st.progress(float(row["probability_malignant"]), text=f"Maligno: {float(row['probability_malignant']):.2%}",)

    st.subheader("Resultados intermedios")

    column_1, column_2, column_3, column_4 = st.columns(4)

    with column_1:
        st.image(convert_bgr_to_rgb(case_data["image_bgr"]), caption="Imagen ecográfica original", use_container_width=True,)

    with column_2:
        st.image(convert_bgr_to_rgb(case_data["bbox_image"]), caption="Bounding box generada por YOLO", use_container_width=True,)

    with column_3:
        st.image(case_data["mgac_mask"], caption="Pseudomáscara MGAC", clamp=True, use_container_width=True,)

    with column_4:
        st.image(case_data["final_mask"], caption=f"Máscara final ({row['mask_source']})", clamp=True, use_container_width=True,)

    st.subheader("Región de interés utilizada por el modelo")

    roi_column_1, roi_column_2, roi_column_3 = st.columns(3)

    with roi_column_1:
        st.image(case_data["image_roi"], caption="ROI ecográfica", use_container_width=True,)

    with roi_column_2:
        st.image(case_data["mask_roi"], caption="Máscara ROI", clamp=True, use_container_width=True,)

    with roi_column_3:
        st.image(convert_bgr_to_rgb(case_data["overlay"]), caption="Resultado final",use_container_width=True,)

    st.subheader("Información técnica")

    technical_data = {
        "nódulo": f"{int(row['nodule_index'])}/{int(row['nodules_in_source'])}",
        "bounding box": (int(row["xmin"]), int(row["ymin"]), int(row["xmax"]), int(row["ymax"]),),
        "bounding box con margen": (int(row["roi_xmin"]), int(row["roi_ymin"]), int(row["roi_xmax"]), int(row["roi_ymax"]),),
        "detección yolo": ("sí"
            if int(row["yolo_detected"]) == 1
            else "no, se utilizó la imagen completa"),
        "fuente de máscara": row["mask_source"],
        "píxeles positivos finales": int(
            row["final_mask_positive_pixels"]),
        "modelo swin transformer": row["swin_model_name"],
        "tamaño de entrada": (f"{int(row['swin_image_size'])} x " f"{int(row['swin_image_size'])}"),}

    st.json(technical_data)

    download_xml, download_mgac, download_mask = st.columns(3)

    with download_xml:
        st.download_button(label="Descargar XML", data=case_data["xml_path"].read_bytes(), file_name=case_data["xml_path"].name, mime="application/xml",
            key=f"xml_{row['case_id']}", use_container_width=True,)

    with download_mgac:
        st.download_button(label="Descargar máscara MGAC", data=Path(row["output_mgac_mask"]).read_bytes(), file_name=Path(row["output_mgac_mask"]).name,
            mime="image/png", key=f"mgac_{row['case_id']}", use_container_width=True,)

    with download_mask:
        st.download_button(label="Descargar máscara final", data=Path(row["output_final_mask"]).read_bytes(),
            file_name=Path(row["output_final_mask"]).name,
            mime="image/png", key=f"mask_{row['case_id']}", use_container_width=True,)


#ejecuta la inferencia sobre la imagen cargada
def run_streamlit_inference(uploaded_image):
    workspace, input_directory, output_directory = (configure_streamlit_directories())

    if input_directory.exists():
        shutil.rmtree(input_directory)

    input_directory.mkdir(parents=True, exist_ok=True,)

    input_path = input_directory / uploaded_image.name

    with open(input_path, "wb") as image_file:
        image_file.write(uploaded_image.getbuffer())

    base.prepare_output_directories()

    yolo_model, bgaunet_model, swin_bundle = load_models()

    counters, results_rows = base.process_dataset(yolo_model=yolo_model, bgaunet_model=bgaunet_model, swin_bundle=swin_bundle,)

    if not results_rows:
        raise RuntimeError("El proceso terminó sin generar predicciones.")

    results_dataframe = pd.DataFrame(results_rows)

    return {"workspace": workspace, "input_directory": input_directory, "output_directory": output_directory, "counters": counters,
        "results_dataframe": results_dataframe, "analysis_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),}


#interfaz principal

show_app_header()

st.title("Sistema de clasificación de nódulos tiroideos")

st.write("Seleccione una imagen ecográfica. La aplicación ejecutará automáticamente YOLO11, generará el XML, obtendrá la pseudomáscara MGAC, producirá la máscara final con BGAU-Net y realizará la clasificación con Swin Transformer.")

with st.sidebar:
    st.header("Configuración")

    st.write("Umbral YOLO:", base.YOLO_CONFIDENCE_THRESHOLD,)
    st.write("Resolución YOLO:", base.YOLO_IMAGE_SIZE,)
    st.write("Máximo de nódulos:", base.MAX_DETECTIONS_PER_IMAGE,)
    st.write("Resolución BGAU-Net:", f"{base.BGAUNET_TARGET_SIZE[0]} x {base.BGAUNET_TARGET_SIZE[1]}",)
    st.write("GPU TensorFlow:", len(base.TF_GPUS) > 0,)
    st.write("GPU PyTorch:", base.torch.cuda.is_available(),)

uploaded_image = st.file_uploader("Seleccione la imagen ecográfica", type=[extension.replace(".", "") for extension in base.VALID_IMAGE_EXTENSIONS],)

preview_image = None

if uploaded_image is not None:
    image_bytes = np.frombuffer(uploaded_image.getvalue(), dtype=np.uint8,)

    preview_image = cv2.imdecode(image_bytes,cv2.IMREAD_COLOR,)

    if preview_image is None:
        st.error("No se pudo leer la imagen seleccionada.")
    else:
        st.image(convert_bgr_to_rgb(preview_image), caption=uploaded_image.name, width=600,)
        st.success("Imagen cargada correctamente.")
else:
    st.info("Cargue una imagen para comenzar.")

analyze_button = st.button("Analizar imagen ecográfica", type="primary", disabled=preview_image is None, use_container_width=True,)

if analyze_button:
    try:
        with st.status("Ejecutando el análisis completo", expanded=True,) as status:
            st.write("Preparando la imagen y las carpetas temporales.")
            st.write("Cargando los modelos de inteligencia artificial.")

            analysis_result = run_streamlit_inference(uploaded_image)

            st.write("Generando los resultados y reportes.")
            status.update(label="Análisis completado correctamente", state="complete", expanded=False,)

        st.session_state["optimus_thy_analysis"] = analysis_result

    except Exception as error:
        st.error("Ocurrió un error durante el análisis: " f"{type(error).__name__}: {error}")

if "optimus_thy_analysis" in st.session_state:
    analysis_result = st.session_state["optimus_thy_analysis"]

    results_dataframe = analysis_result["results_dataframe"]

    counters = analysis_result["counters"]

    st.markdown("---")
    st.header("Reporte de predicción")

    if counters["images_without_yolo_detection"] > 0:
        st.warning("YOLO no detectó ningún nódulo con el umbral configurado. Se utilizó toda la imagen como bounding box.")

    summary_1, summary_2, summary_3, summary_4 = st.columns(4)

    with summary_1:
        st.metric("Nódulos procesados", counters["processed_nodules"],)

    with summary_2:
        st.metric("Predicciones benignas", counters["benign_predictions"],)

    with summary_3:
        st.metric("Predicciones malignas", counters["malignant_predictions"],)

    with summary_4:
        st.metric("Errores", counters["errors"],)

    tabs = st.tabs([f"Nódulo {int(row['nodule_index'])}" for _, row in results_dataframe.iterrows()])

    for tab, (_, row) in zip(tabs, results_dataframe.iterrows(),):
        with tab:
            show_case_result(row)

    st.markdown("---")
    st.subheader("Tabla de resultados")

    st.dataframe(results_dataframe[["case_id", "predicted_class", "probability_benign", "probability_malignant", "yolo_confidence", "mask_source",]], use_container_width=True, hide_index=True,)

    csv_bytes = base.RESULTS_CSV_PATH.read_bytes()

    pdf_bytes = create_pdf_report(results_dataframe, analysis_result["analysis_date"],)

    zip_bytes = create_zip_report(analysis_result["output_directory"], pdf_bytes,)

    st.subheader("Descargar reporte completo")

    csv_column, pdf_column, zip_column = st.columns(3)

    source_name = str(results_dataframe.iloc[0]["source_image"])
    base_name = base.sanitize_text(Path(source_name).stem)

    with csv_column:
        st.download_button(label="Descargar CSV", data=csv_bytes, file_name=f"{base_name}_resultados.csv", mime="text/csv", use_container_width=True,)

    with pdf_column:
        st.download_button(label="Descargar PDF", data=pdf_bytes, file_name=f"{base_name}_reporte.pdf", mime="application/pdf", use_container_width=True,)

    with zip_column:
        st.download_button(label="Descargar todos los archivos", data=zip_bytes, file_name=f"{base_name}_resultados.zip", mime="application/zip", use_container_width=True,)

st.caption("Este sistema constituye una herramienta de apoyo a la investigación y no reemplaza la evaluación realizada por un profesional médico.")