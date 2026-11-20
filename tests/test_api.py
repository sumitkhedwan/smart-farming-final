from __future__ import annotations

import io
from dataclasses import replace

from fastapi import FastAPI
from fastapi.testclient import TestClient
from PIL import Image

from backend.app.main import app
from backend.app.main import SPAStaticFiles
from backend.app import main as api_module

client = TestClient(app)


def sample_png(color: tuple[int, int, int] = (50, 125, 55)) -> bytes:
    image = Image.new("RGB", (128, 128), color)
    output = io.BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()


def test_chat_uses_bundled_guidance_and_validates_message() -> None:
    response = client.post("/api/chat", json={"message": "How do I irrigate clay soil?"})
    assert response.status_code == 200
    assert "irrigate slowly" in response.json()["response"].lower()
    assert client.post("/api/chat", json={"message": " "}).status_code == 422
    assert client.post("/api/chat", json={"message": "x" * 501}).status_code == 422


def test_spa_static_fallback_only_serves_browser_routes(tmp_path) -> None:
    (tmp_path / "index.html").write_text("<!doctype html><title>AgriWise</title>", encoding="utf-8")
    spa_app = FastAPI()
    spa_app.mount("/", SPAStaticFiles(directory=str(tmp_path), html=True), name="frontend")
    spa_client = TestClient(spa_app)
    assert "AgriWise" in spa_client.get("/profile", headers={"Accept": "text/html"}).text
    assert spa_client.get("/assets/missing.js").status_code == 404


def test_production_homepage_serves_the_built_frontend() -> None:
    response = client.get("/", headers={"Accept": "text/html"})
    assert response.status_code == 200
    assert 'id="root"' in response.text
    assert "AgriWise" in response.text


def test_unknown_api_path_does_not_fall_through_to_the_spa() -> None:
    response = client.get("/api/missing", headers={"Accept": "text/html"})
    assert response.status_code == 404
    assert response.json()["error"] == "API endpoint not found."


def test_health_reports_demo_mode() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["demo_mode"] is True


def test_disease_prediction_returns_demo_label_and_remedy() -> None:
    response = client.post("/api/disease/predict", files={"image": ("leaf.png", sample_png(), "image/png")})
    assert response.status_code == 200
    data = response.json()
    assert data["demo_mode"] is True
    assert data["model_source"] == "synthetic_demo"
    assert data["diseaseName"] in {None, "Unknown", "Apple Scab", "Cedar Apple Rust", "Black Rot"}
    assert "chemical" in data["remedy"] and "dosage" in data["remedy"]
    assert "severity" in data and "needs_clearer_photo" in data


def test_legacy_disease_route_matches_current_frontend() -> None:
    response = client.post("/api/diagnose", files={"image": ("leaf.png", sample_png(), "image/png")})
    assert response.status_code == 200
    assert "recommendations" in response.json()


def test_soil_prediction_includes_type_and_care() -> None:
    response = client.post("/api/soil/predict", files={"image": ("soil.png", sample_png((151, 93, 69)), "image/png")})
    assert response.status_code == 200
    data = response.json()
    assert data["soil_type"] in {"sandy", "clay", "loamy", "silty", "black", "red", "alluvial"}
    assert 0 <= data["confidence"] <= 100
    assert data["demo_mode"] is True
    assert data["crops"] and data["irrigation"] and data["fertilizer"]
    assert data["disease_care_link"]["path"] == "/diagnosis"
    assert len(data["recommendations"]) == 3


def test_legacy_soil_route_matches_current_frontend() -> None:
    response = client.post("/api/soil-diagnose", files={"image": ("soil.png", sample_png(), "image/png")})
    assert response.status_code == 200
    assert "tests_to_confirm" in response.json()


def test_rejects_unsupported_content_type() -> None:
    response = client.post("/api/diagnose", files={"image": ("x.gif", b"GIF89a", "image/gif")})
    assert response.status_code == 415
    assert "error" in response.json()


def test_rejects_unreadable_image_bytes() -> None:
    response = client.post("/api/soil/predict", files={"image": ("x.png", b"not a png image", "image/png")})
    assert response.status_code == 422


def test_rejects_oversized_upload() -> None:
    content = b"x" * (10 * 1024 * 1024 + 1)
    response = client.post("/api/diagnose", files={"image": ("large.png", content, "image/png")})
    assert response.status_code == 413


def test_unknown_case_is_supported() -> None:
    response = client.post("/api/diagnose", files={"image": ("gray.png", sample_png((128, 128, 128)), "image/png")})
    assert response.status_code == 200
    data = response.json()
    assert data["diseaseName"] == "Unknown"
    assert data["diseaseRisk"] == "unknown"
    assert data["remedy"]["chemical"] == ["No chemical treatment is recommended for an unknown result."]


def test_rate_limit_returns_429(monkeypatch) -> None:
    api_module._rate_buckets.clear()
    monkeypatch.setattr(api_module, "settings", replace(api_module.settings, rate_limit_requests=2))
    assert client.get("/openapi.json").status_code == 200
    assert client.get("/openapi.json").status_code == 200
    assert client.get("/openapi.json").status_code == 200
    assert client.post("/api/chat", json={"message": "How do I water tomatoes?"}).status_code == 200
    assert client.post("/api/chat", json={"message": "How do I water tomatoes?"}).status_code == 200
    assert client.post("/api/chat", json={"message": "How do I water tomatoes?"}).status_code == 429
    api_module._rate_buckets.clear()


def test_cors_allows_the_local_frontend_origin() -> None:
    response = client.options(
        "/api/disease/predict",
        headers={"Origin": "http://localhost:8080", "Access-Control-Request-Method": "POST"},
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:8080"
