"""Start the API and Vite dev server, then verify UI delivery and API proxying."""

from __future__ import annotations

import http.client
import json
import shutil
import socket
import subprocess
import sys
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))
from backend.smoke_check import _png, _post_image


def _assert_free(port: int) -> None:
    with socket.socket() as sock:
        if sock.connect_ex(("127.0.0.1", port)) == 0:
            raise RuntimeError(f"Port {port} is already in use; stop the service and retry.")


def _get(port: int, path: str) -> tuple[int, bytes]:
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=3)
    connection.request("GET", path)
    response = connection.getresponse()
    result = response.status, response.read()
    connection.close()
    return result


def _wait_for(port: int, path: str, timeout: int = 45) -> bytes:
    deadline = time.monotonic() + timeout
    last_error: Exception | None = None
    while time.monotonic() < deadline:
        try:
            status, body = _get(port, path)
            if status == 200:
                return body
            last_error = RuntimeError(f"GET {path} returned HTTP {status}")
        except OSError as exc:
            last_error = exc
        time.sleep(0.25)
    raise RuntimeError(f"Service on port {port} did not become ready: {last_error}")


def main() -> None:
    node = shutil.which("node")
    if not node or not (PROJECT_ROOT / "node_modules" / "vite" / "bin" / "vite.js").is_file():
        raise SystemExit("Install frontend packages with npm ci before running this smoke check.")
    for port in (5000, 8080):
        _assert_free(port)

    api = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", "5000"],
        cwd=PROJECT_ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    vite = subprocess.Popen(
        [node, str(PROJECT_ROOT / "node_modules" / "vite" / "bin" / "vite.js"), "--host", "127.0.0.1", "--port", "8080", "--strictPort"],
        cwd=PROJECT_ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        _wait_for(5000, "/health")
        page = _wait_for(8080, "/")
        if b"<div id=\"root\">" not in page and b"<div id=\"root\"" not in page:
            raise RuntimeError("Vite returned a page without the React root element.")
        print("GET / via Vite: HTTP 200, React document served")
        disease = _post_image(8080, "/api/diagnose", "leaf.png", _png((50, 125, 55)))
        soil = _post_image(8080, "/api/soil-diagnose", "soil.png", _png((151, 93, 69)))
        print("POST /api/diagnose via Vite:", json.dumps({key: disease[key] for key in ("diseaseName", "confidence", "demo_mode", "needs_clearer_photo")}, ensure_ascii=False))
        print("POST /api/soil-diagnose via Vite:", json.dumps({key: soil[key] for key in ("soil_type", "confidence", "demo_mode", "needs_clearer_photo")}, ensure_ascii=False))
    finally:
        for process in (vite, api):
            process.terminate()
        for process in (vite, api):
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)


if __name__ == "__main__":
    main()
