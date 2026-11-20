from __future__ import annotations

import argparse
import json
import random
from pathlib import Path

from PIL import Image, ImageDraw

from backend.app.config import BACKEND_ROOT
from backend.app.models.inference import _features

ROOT = BACKEND_ROOT / "data" / "demo_dataset"
ARTIFACTS = BACKEND_ROOT / "models" / "artifacts"
SOIL_COLORS = {
    "sandy": (192, 161, 108), "clay": (151, 93, 69), "loamy": (117, 82, 57),
    "silty": (165, 143, 119), "black": (48, 40, 32), "red": (153, 61, 42), "alluvial": (134, 116, 85),
}
DISEASE_COLORS = {
    "healthy": (54, 132, 55), "Apple___Apple_scab": (86, 111, 48),
    "Apple___Cedar_apple_rust": (141, 94, 39), "Apple___Black_rot": (64, 63, 49), "unknown": (130, 130, 130),
}


def make_image(label: str, base: tuple[int, int, int], seed: int, task: str) -> Image.Image:
    rng = random.Random(seed)
    image = Image.new("RGB", (96, 96), base)
    pixels = image.load()
    for y in range(96):
        for x in range(96):
            noise = rng.randint(-17, 17)
            pixels[x, y] = tuple(max(0, min(255, value + noise)) for value in base)
    if task == "disease" and label != "healthy":
        draw = ImageDraw.Draw(image)
        for _ in range(12):
            x, y = rng.randrange(8, 88), rng.randrange(8, 88)
            radius = rng.randrange(2, 7)
            spot = (205, 142, 50) if "rust" in label.lower() else (92, 55, 39)
            draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=spot)
    return image


def train(samples_per_class: int = 8) -> None:
    if samples_per_class < 2:
        raise ValueError("Use at least two synthetic samples per class.")
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    random.seed(2026)
    tasks = {"soil": SOIL_COLORS, "disease": DISEASE_COLORS}
    for task, prototypes in tasks.items():
        centroids: dict[str, list[float]] = {}
        for label, base in prototypes.items():
            vectors = []
            for index in range(samples_per_class):
                image = make_image(label, base, seed=1000 + index * 97 + len(label), task=task)
                split = "validation" if index % 4 == 0 else "train"
                folder = ROOT / task / split / label
                folder.mkdir(parents=True, exist_ok=True)
                image.save(folder / f"synthetic_{index + 1:02d}.jpg", quality=90)
                vectors.append(_features(image))
            centroids[label] = [sum(row[i] for row in vectors) / len(vectors) for i in range(len(vectors[0]))]
        artifact = {
            "task": task,
            "demo_mode": True,
            "method": "synthetic_color_prototype_v1",
            "labels": list(prototypes),
            "centroids": centroids,
            "samples_per_class": samples_per_class,
            "warning": "Synthetic training images only. Not accurate for agricultural diagnosis or soil identification.",
        }
        (ARTIFACTS / f"{task}_demo.json").write_text(json.dumps(artifact, indent=2), encoding="utf-8")
        print(f"Wrote {task} DEMO model: {len(prototypes)} classes × {samples_per_class} synthetic images")
    print(f"Synthetic images: {ROOT}")
    print(f"Model artifacts: {ARTIFACTS}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Train explicit non-accurate demo prototypes from synthetic images.")
    parser.add_argument("--samples-per-class", type=int, default=8)
    args = parser.parse_args()
    train(args.samples_per_class)


if __name__ == "__main__":
    main()
