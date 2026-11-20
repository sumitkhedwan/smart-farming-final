from __future__ import annotations

import json
import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import Any

from PIL import Image, ImageStat

from ..config import BACKEND_ROOT

LOGGER = logging.getLogger(__name__)
ARTIFACTS = Path(os.getenv("MODEL_ARTIFACT_DIR", BACKEND_ROOT / "models" / "artifacts")).resolve()
TASK_CONFIG = {
    "disease": (ARTIFACTS / "disease_demo.json", ARTIFACTS / "disease_model.weights.h5"),
    "soil": (ARTIFACTS / "soil_demo.json", ARTIFACTS / "soil_model.weights.h5"),
}


def _features(image: Image.Image) -> list[float]:
    thumb = image.convert("RGB").resize((48, 48))
    stats = ImageStat.Stat(thumb)
    means = [v / 255.0 for v in stats.mean]
    spreads = [v / 255.0 for v in stats.stddev]
    get_flattened_data = getattr(thumb, "get_flattened_data", None)
    pixels = get_flattened_data() if callable(get_flattened_data) else tuple(thumb.getdata())
    total = max(1, len(pixels))
    green = sum(1 for r, g, b in pixels if g > r * 1.12 and g > b * 1.05 and g > 48) / total
    brown = sum(1 for r, g, b in pixels if r > g * 1.16 and r > b * 1.16 and r > 45) / total
    bright = sum(1 for r, g, b in pixels if (r + g + b) / 3 > 190) / total
    return means + spreads + [green, brown, bright]


def _distance(a: list[float], b: list[float]) -> float:
    return sum((x - y) ** 2 for x, y in zip(a, b)) ** 0.5


@lru_cache(maxsize=2)
def _demo_artifact(task: str) -> dict[str, Any]:
    path, _ = TASK_CONFIG[task]
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        LOGGER.warning("Demo artifact unavailable for %s; using embedded fallback: %s", task, exc)
        labels = ["healthy", "unknown"] if task == "disease" else ["loamy", "sandy", "clay", "unknown"]
        return {"task": task, "demo_mode": True, "labels": labels, "centroids": {}}


def _real_model(task: str) -> tuple[Any, list[str], bool] | None:
    metadata_path = ARTIFACTS / f"{task}_model.json"
    weights_path = TASK_CONFIG[task][1]
    keras_path = ARTIFACTS / f"{task}_model.keras"
    if (not weights_path.exists() and not keras_path.exists()) or not metadata_path.exists():
        return None
    try:
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        if keras_path.exists():
            from tensorflow.keras.models import load_model

            model = load_model(keras_path, compile=False)
        else:
            from tensorflow.keras import Model, layers
            from tensorflow.keras.applications import MobileNetV2

            base = MobileNetV2(include_top=False, weights=None, input_shape=(224, 224, 3), name=f"{task}_mobilenet_v2")
            inputs = layers.Input(shape=(224, 224, 3))
            x = base(inputs, training=False)
            x = layers.GlobalAveragePooling2D(name=f"{task}_global_average_pool")(x)
            x = layers.Dropout(0.25, name=f"{task}_dropout")(x)
            outputs = layers.Dense(len(metadata["labels"]), activation="softmax", name=f"{task}_classifier")(x)
            model = Model(inputs, outputs)
            model.load_weights(weights_path)
        return model, metadata["labels"], bool(metadata.get("demo_mode", False))
    except Exception as exc:  # pragma: no cover - requires optional TensorFlow and user-trained artifacts
        LOGGER.exception("Could not load trained %s model: %s", task, exc)
        return None


def _predict_real(task: str, image: Image.Image) -> dict[str, Any] | None:
    # The cache stores loaded Keras objects by task so repeated API calls do not reload weights.
    model_and_labels = _cached_real_model(task)
    if model_and_labels is None:
        return None
    model, labels, demo_mode = model_and_labels
    import numpy as np  # optional TensorFlow dependency

    batch = np.asarray(image.resize((224, 224)), dtype="float32")
    batch = (batch / 127.5 - 1.0)[None, ...]
    scores = model.predict(batch, verbose=0)[0]
    index = int(scores.argmax())
    confidence = float(scores[index])
    if demo_mode:
        confidence = min(confidence, 0.43)
    return {"label": labels[index], "confidence": confidence, "demo_mode": demo_mode, "architecture": "MobileNetV2"}


@lru_cache(maxsize=2)
def _cached_real_model(task: str) -> tuple[Any, list[str], bool] | None:
    return _real_model(task)


def predict(task: str, image: Image.Image) -> dict[str, Any]:
    if task not in TASK_CONFIG:
        raise ValueError(f"Unsupported model task: {task}")
    try:
        real = _predict_real(task, image)
    except Exception as exc:  # pragma: no cover - defensive fallback if an optional runtime is broken
        LOGGER.exception("Real %s inference failed: %s", task, exc)
        real = None
    if real:
        return real

    artifact = _demo_artifact(task)
    labels = artifact.get("labels", [])
    centroids = artifact.get("centroids", {})
    feature_vector = _features(image)
    candidates = [
        (label, _distance(feature_vector, centroids[label]))
        for label in labels
        if label in centroids and label != "unknown"
    ]
    if not candidates:
        fallback = "unknown" if task == "disease" else "loamy"
        return {"label": fallback, "confidence": 0.2, "demo_mode": True}

    candidates.sort(key=lambda item: item[1])
    nearest_label, nearest_distance = candidates[0]
    # This is a transparent synthetic prototype score, not a calibrated probability.
    confidence = max(0.12, min(0.43, 0.43 * (1.0 - min(nearest_distance, 1.0))))
    uniformity = sum(ImageStat.Stat(image.resize((24, 24))).stddev) / (3 * 255)
    if task == "disease" and uniformity < 0.025:
        nearest_label = "unknown"
        confidence = 0.16
    return {"label": nearest_label, "confidence": confidence, "demo_mode": True}


def inference_status() -> dict[str, bool]:
    """Report whether each task can load a real trained model in this process."""
    return {task: model is None or model[2] for task in TASK_CONFIG for model in [_cached_real_model(task)]}

