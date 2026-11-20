
from __future__ import annotations

import argparse
import json
import logging
import os
from pathlib import Path

from backend.app.config import BACKEND_ROOT, PROJECT_ROOT

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("agriwise.training")
WEIGHTS = BACKEND_ROOT / "models" / "weights" / "mobilenet_v2_no_top.h5"
OUTPUT = BACKEND_ROOT / "models" / "artifacts"
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def _has_images(folder: Path) -> bool:
    return any(path.suffix.lower() in IMAGE_SUFFIXES for path in folder.rglob("*"))


def _class_dirs(folder: Path) -> list[Path]:
    return [entry for entry in folder.iterdir() if entry.is_dir() and _has_images(entry)]


def _class_root(root: Path, task: str) -> Path | None:
    """Find a flat class-folder dataset, including archive/PlantVillage/color."""
    task_root = root / task
    if task_root.is_dir() and len(_class_dirs(task_root)) >= 2:
        return task_root
    if len(_class_dirs(root)) >= 2:
        return root

    color_roots = [path for path in root.rglob("color") if path.is_dir() and _has_images(path)]
    candidates = color_roots
    if not candidates:
        candidates = []
        for child in root.rglob("*"):
            if not child.is_dir():
                continue
            if len(_class_dirs(child)) >= 2:
                candidates.append(child)
    if not candidates:
        return None

    def score(path: Path) -> tuple[int, int, int]:
        class_dirs = _class_dirs(path)
        image_count = sum(
            sum(1 for file in entry.rglob("*") if file.is_file() and file.suffix.lower() in IMAGE_SUFFIXES)
            for entry in class_dirs
        )
        has_plantvillage_labels = int(any("___" in entry.name for entry in class_dirs))
        return has_plantvillage_labels, len(class_dirs), image_count

    return max(candidates, key=score)


def _generators(task: str, root: Path, batch_size: int, tf, ImageDataGenerator):
    task_root = root / task
    train_dir = task_root / "train"
    validation_dir = task_root / "validation"
    if train_dir.is_dir() and validation_dir.is_dir():
        augmentation = ImageDataGenerator(
            preprocessing_function=tf.keras.applications.mobilenet_v2.preprocess_input,
            rotation_range=20,
            width_shift_range=0.1,
            height_shift_range=0.1,
            zoom_range=0.15,
            horizontal_flip=True,
            fill_mode="nearest",
        )
        plain = ImageDataGenerator(preprocessing_function=tf.keras.applications.mobilenet_v2.preprocess_input)
        training = augmentation.flow_from_directory(
            train_dir, target_size=(224, 224), batch_size=batch_size,
            class_mode="categorical", shuffle=True, seed=42,
        )
        validation = plain.flow_from_directory(
            validation_dir, target_size=(224, 224), batch_size=batch_size,
            class_mode="categorical", shuffle=False,
            classes=list(training.class_indices.keys()),
        )
        layout = "pre_split_train_validation"
    else:
        class_root = _class_root(root, task)
        if class_root is None:
            raise SystemExit(
                f"Missing {task} data. Expected {root / task / 'train'} and "
                f"{root / task / 'validation'}, or flat class folders such as PlantVillage/color/<class>."
            )
        class_dirs = _class_dirs(class_root)
        if len(class_dirs) < 2:
            raise SystemExit(f"{task} data at {class_root} needs at least two image-containing class folders.")
        logger.warning(
            "No train/validation split found; using a deterministic stratified 80/20 directory split from %s",
            class_root,
        )
        augmentation = ImageDataGenerator(
            preprocessing_function=tf.keras.applications.mobilenet_v2.preprocess_input,
            rotation_range=20,
            width_shift_range=0.1,
            height_shift_range=0.1,
            zoom_range=0.15,
            horizontal_flip=True,
            fill_mode="nearest",
            validation_split=0.2,
        )
        plain = ImageDataGenerator(
            preprocessing_function=tf.keras.applications.mobilenet_v2.preprocess_input,
            validation_split=0.2,
        )
        training = augmentation.flow_from_directory(
            class_root, target_size=(224, 224), batch_size=batch_size,
            class_mode="categorical", subset="training", shuffle=True, seed=42,
        )
        validation = plain.flow_from_directory(
            class_root, target_size=(224, 224), batch_size=batch_size,
            class_mode="categorical", subset="validation", shuffle=False, seed=42,
            classes=list(training.class_indices.keys()),
        )
        layout = "flat_class_folders_stratified_80_20_seed_42"

    if training.num_classes < 2:
        raise SystemExit(f"{task} training data needs at least two class folders.")
    train_counts = [int((training.classes == index).sum()) for index in range(training.num_classes)]
    validation_counts = [int((validation.classes == index).sum()) for index in range(training.num_classes)]
    labels = [name for name, _ in sorted(training.class_indices.items(), key=lambda item: item[1])]
    missing = [labels[index] for index, count in enumerate(validation_counts) if count == 0]
    if missing:
        raise SystemExit(f"Validation split has no samples for class(es): {', '.join(missing)}")
    totals = [train_counts[index] + validation_counts[index] for index in range(len(labels))]
    sparse = [f"{labels[index]}={count}" for index, count in enumerate(totals) if count < 20]
    if sparse:
        logger.warning("Very few images in class(es) (%s); validation metrics are not reliable.", ", ".join(sparse))
    if task == "disease" and not any("healthy" in label.lower() for label in labels):
        logger.warning("This disease dataset has no healthy class; the model cannot learn healthy-leaf predictions.")
    return training, validation, labels, layout, train_counts, validation_counts


def train_task(task: str, root: Path, epochs: int, fine_tune_epochs: int, batch_size: int, output_dir: Path, demo_mode: bool) -> None:
    try:
        import numpy as np
        import tensorflow as tf
        from tensorflow.keras import Model, layers
        from tensorflow.keras.applications import MobileNetV2
        from tensorflow.keras.preprocessing.image import ImageDataGenerator
    except ImportError as exc:
        raise SystemExit("TensorFlow is optional. Install it with: python -m pip install -r requirements-ml.txt") from exc

    training, validation, labels, layout, train_counts, validation_counts = _generators(
        task, root, batch_size, tf, ImageDataGenerator,
    )
    tf.random.set_seed(42)
    np.random.seed(42)
    initial_weights: str | None = str(WEIGHTS) if WEIGHTS.is_file() else "imagenet"
    transfer_learning = False
    try:
        base = MobileNetV2(include_top=False, weights=initial_weights, input_shape=(224, 224, 3), name=f"{task}_mobilenet_v2")
        transfer_learning = True
    except Exception as exc:
        logger.warning("Pretrained weights unavailable (%s); falling back to random initialization for this run.", exc)
        base = MobileNetV2(include_top=False, weights=None, input_shape=(224, 224, 3), name=f"{task}_mobilenet_v2")
        transfer_learning = False

    base.trainable = False
    inputs = layers.Input(shape=(224, 224, 3))
    x = base(inputs, training=False)
    x = layers.GlobalAveragePooling2D(name=f"{task}_global_average_pool")(x)
    x = layers.Dropout(0.25, name=f"{task}_dropout")(x)
    outputs = layers.Dense(training.num_classes, activation="softmax", name=f"{task}_classifier")(x)
    model = Model(inputs, outputs)
    model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3), loss="categorical_crossentropy", metrics=["accuracy"])
    model.fit(training, validation_data=validation, epochs=epochs, verbose=1)

    if fine_tune_epochs > 0:
        base.trainable = True
        for layer in base.layers[:-30]:
            layer.trainable = False
        for layer in base.layers:
            if isinstance(layer, tf.keras.layers.BatchNormalization):
                layer.trainable = False
        model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5), loss="categorical_crossentropy", metrics=["accuracy"])
        model.fit(training, validation_data=validation, epochs=fine_tune_epochs, verbose=1)

    validation.reset()
    loss, accuracy = model.evaluate(validation, verbose=0)
    probabilities = model.predict(validation, verbose=0)
    predicted = probabilities.argmax(axis=1)
    truth = validation.classes
    confusion = np.zeros((training.num_classes, training.num_classes), dtype=int)
    for actual, guess in zip(truth, predicted):
        confusion[int(actual), int(guess)] += 1

    output_dir.mkdir(parents=True, exist_ok=True)
    weights_path = output_dir / f"{task}_model.weights.h5"
    model.save_weights(weights_path)
    metadata = {
        "task": task,
        "demo_mode": demo_mode,
        "architecture": "MobileNetV2",
        "classifier_head": "global_average_pooling_2d_dropout_0.25_dense_softmax",
        "weights_file": weights_path.name,
        "transfer_learning": transfer_learning,
        "labels": labels,
        "validation_loss": float(loss),
        "validation_accuracy": float(accuracy),
        "validation_confusion_matrix": confusion.tolist(),
        "validation_samples": len(truth),
        "dataset_root": str(root),
        "dataset_layout": layout,
        "train_samples_per_class": dict(zip(labels, train_counts)),
        "validation_samples_per_class": dict(zip(labels, validation_counts)),
        "input_size": [224, 224],
        "preprocessing": "tf.keras.applications.mobilenet_v2.preprocess_input",
    }
    (output_dir / f"{task}_model.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    logger.info("%s model saved; validation accuracy=%.4f over %s validation images", task, accuracy, len(truth))


def main() -> None:
    parser = argparse.ArgumentParser(description="Train disease and soil MobileNetV2 transfer-learning classifiers.")
    parser.add_argument("--dataset-root", type=Path, default=PROJECT_ROOT / "datasets", help="Root containing task/train and task/validation, flat class folders, or a PlantVillage archive")
    parser.add_argument("--tasks", nargs="+", choices=("disease", "soil"), default=("disease", "soil"), help="Tasks to train; use --tasks disease for PlantVillage")
    parser.add_argument("--epochs", type=int, default=8)
    parser.add_argument("--fine-tune-epochs", type=int, default=2)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--output-dir", type=Path, default=OUTPUT, help="Directory for saved models and metadata")
    parser.add_argument("--demo-mode", action="store_true", help="Keep models trained on synthetic/sample data explicitly marked as demos")
    args = parser.parse_args()
    if args.epochs < 1 or args.fine_tune_epochs < 0 or args.batch_size < 1:
        parser.error("epochs and batch-size must be positive; fine-tune-epochs cannot be negative")
    for task in args.tasks:
        train_task(task, args.dataset_root.resolve(), args.epochs, args.fine_tune_epochs, args.batch_size, args.output_dir.resolve(), args.demo_mode)


if __name__ == "__main__":
    main()
