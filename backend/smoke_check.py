"""Start a local Uvicorn process and exercise all public image routes."""

from __future__ import annotations

import http.client
import io
import argparse
import json
import os
import socket
import subprocess
import sys
import time
from pathlib import Path

from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def _free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def _png(color: tuple[int, int, int]) -> bytes:
    image = Image.new("RGB", (160, 160), color)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def _post_image(port: int, route: str, filename: str, image: bytes) -> dict:
    boundary = "----AgriWiseSmokeBoundary"
    body = (
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"image\"; filename=\"{filename}\"\r\n"
        "Content-Type: image/png\r\n\r\n"
    ).encode() + image + f"\r\n--{boundary}--\r\n".encode()
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=10)
    connection.request("POST", route, body=body, headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    response = connection.getresponse()
    raw = response.read()
    connection.close()
    result = json.loads(raw.decode("utf-8"))
    if response.status != 200:
        raise RuntimeError(f"{route} returned {response.status}: {result}")
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model-artifact-dir", help="Optional trained model folder to load for this check")
    args = parser.parse_args()
    port = _free_port()
    child_env = os.environ.copy()
    if args.model_artifact_dir:
        child_env["MODEL_ARTIFACT_DIR"] = str((PROJECT_ROOT / args.model_artifact_dir).resolve())
    process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", str(port)],
        cwd=PROJECT_ROOT,
        env=child_env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        deadline = time.monotonic() + 120
        while time.monotonic() < deadline:
            try:
                connection = http.client.HTTPConnection("127.0.0.1", port, timeout=1)
                connection.request("GET", "/health")
                response = connection.getresponse()
                health = json.loads(response.read().decode("utf-8"))
                connection.close()
                if response.status == 200:
                    break
            except OSError:
                time.sleep(0.2)
        else:
            raise RuntimeError("Uvicorn did not start within 120 seconds.")

        print("GET /health", json.dumps(health, ensure_ascii=False))
        print("POST /api/disease/predict", json.dumps(_post_image(port, "/api/disease/predict", "leaf.png", _png((50, 125, 55))), ensure_ascii=False))
        print("POST /api/soil/predict", json.dumps(_post_image(port, "/api/soil/predict", "soil.png", _png((151, 93, 69))), ensure_ascii=False))
        print("POST /api/diagnose", json.dumps(_post_image(port, "/api/diagnose", "leaf.png", _png((50, 125, 55))), ensure_ascii=False))
        print("POST /api/soil-diagnose", json.dumps(_post_image(port, "/api/soil-diagnose", "soil.png", _png((151, 93, 69))), ensure_ascii=False))
    finally:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=5)


if __name__ == "__main__":
    main()
