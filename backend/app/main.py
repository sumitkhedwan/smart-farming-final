from __future__ import annotations

import logging
import os
import time
from collections import defaultdict, deque

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field
from starlette.datastructures import Headers
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import settings
from .models.inference import inference_status, predict
from .services.chat import answer_farming_question
from .services.knowledge import disease_remedy, soil_guidance
from .utils.images import read_valid_image

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("agriwise.api")
is_production = settings.app_env.lower() == "production"
app = FastAPI(
    title="AgriWise Smart Farming API",
    version="1.0.0",
    description="Plant disease and soil photo screening API",
    docs_url=None if is_production else "/docs",
    redoc_url=None if is_production else "/redoc",
    openapi_url=None if is_production else "/openapi.json",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

_rate_buckets: dict[str, deque[float]] = defaultdict(deque)


class SPAStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as exc:
            accepts_html = "text/html" in Headers(scope=scope).get("accept", "")
            has_file_extension = bool(os.path.splitext(os.path.basename(path))[1])
            if exc.status_code != 404 or not accepts_html or has_file_extension:
                raise
            return await super().get_response("index.html", scope)


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    message: str = Field(min_length=1, max_length=500)


class ChatResponse(BaseModel):
    response: str


@app.middleware("http")
async def rate_limit_and_log(request: Request, call_next):
    started = time.monotonic()
    client = request.client.host if request.client else "unknown"
    is_api_request = request.url.path.startswith("/api/")
    if request.url.path in {"/api/diagnose", "/api/disease/predict", "/api/soil-diagnose", "/api/soil/predict"}:
        try:
            declared_length = int(request.headers.get("content-length", "0"))
        except ValueError:
            declared_length = 0
        if declared_length > settings.max_upload_bytes + 256 * 1024:
            return JSONResponse({"error": "Request exceeds the image upload limit."}, status_code=413)
    now = time.monotonic()
    bucket = _rate_buckets[client] if is_api_request else None
    if bucket is not None:
        while bucket and bucket[0] <= now - settings.rate_limit_window_seconds:
            bucket.popleft()
        if len(bucket) >= settings.rate_limit_requests:
            return JSONResponse({"error": "Rate limit exceeded. Please retry shortly."}, status_code=429)
        bucket.append(now)
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("Unhandled API exception on %s", request.url.path)
        return JSONResponse({"error": "Internal server error."}, status_code=500)
    if bucket is not None:
        response.headers["X-RateLimit-Limit"] = str(settings.rate_limit_requests)
        response.headers["X-RateLimit-Remaining"] = str(max(0, settings.rate_limit_requests - len(bucket)))
    logger.info("%s %s %s %.1fms", request.method, request.url.path, response.status_code, (time.monotonic() - started) * 1000)
    return response


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"error": "Invalid request.", "details": exc.errors()})


@app.exception_handler(HTTPException)
async def http_error_handler(_: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": str(exc.detail), "detail": str(exc.detail)}, headers=exc.headers)


@app.get("/health")
async def health():
    model_modes = inference_status()
    return {"status": "ok", "service": "agriwise-api", "demo_mode": any(model_modes.values()), "models_in_demo_mode": model_modes}


def _disease_response(prediction: dict) -> dict:
    label = str(prediction["label"])
    lowered = label.lower().replace(" ", "_")
    if "healthy" in lowered:
        remedy_key = "healthy"
        disease_name = None
        healthy = True
    elif lowered in {"unknown", "unrecognized", "unknown_plant"}:
        remedy_key = "unknown"
        disease_name = "Unknown"
        healthy = False
    else:
        tail = lowered.split("___")[-1]
        disease_name = tail.replace("_", " ").title()
        remedy_key = tail
        healthy = False

    remedy = disease_remedy(remedy_key)
    confidence_percent = round(float(prediction["confidence"]) * 100, 1)
    demo = bool(prediction["demo_mode"])
    confidence_threshold = 55.0
    return {
        "healthy": healthy,
        "confidence": confidence_percent,
        "diseaseName": disease_name,
        "diseaseRisk": remedy.get("risk", "unknown"),
        "severity": "not_assessed" if not demo else "unknown_demo",
        "symptoms": remedy.get("symptoms", []),
        "recommendations": {
            "immediate": remedy.get("organic", []),
            "preventive": remedy.get("prevention", []),
        },
        "remedy": {
            "organic": remedy.get("organic", []),
            "chemical": remedy.get("chemical", []),
            "dosage": remedy.get("dosage", "Follow the locally registered product label for the named crop."),
            "prevention": remedy.get("prevention", []),
        },
        "similarCases": 0,
        "demo_mode": demo,
        "model_source": (
            "mobilenetv2_synthetic_demo" if demo and prediction.get("architecture")
            else "synthetic_demo" if demo
            else "mobilenetv2_transfer_learning"
        ),
        "needs_clearer_photo": confidence_percent < confidence_threshold,
        "message": (
            "DEMO MODE: this synthetic prototype is not accurate for diagnosis. Upload a clearer photo and confirm with a local agronomist."
            if demo and confidence_percent < confidence_threshold
            else "Model output is a screening aid; confirm disease and treatment with a local agronomist."
        ),
    }


@app.post("/api/diagnose")
@app.post("/api/disease/predict")
async def diagnose(image: UploadFile = File(...)):
    validated_image, _ = await read_valid_image(image)
    return _disease_response(predict("disease", validated_image))


@app.post("/api/soil-diagnose")
@app.post("/api/soil/predict")
async def soil_diagnose(image: UploadFile = File(...)):
    validated_image, _ = await read_valid_image(image)
    prediction = predict("soil", validated_image)
    soil_type = str(prediction["label"]).lower()
    if soil_type not in {"sandy", "clay", "loamy", "silty", "black", "red", "alluvial"}:
        soil_type = "loamy"
    advice = soil_guidance(soil_type)
    confidence_percent = round(float(prediction["confidence"]) * 100, 1)
    demo = bool(prediction["demo_mode"])
    needs_clearer = confidence_percent < 55.0
    return {
        "soil_type": soil_type,
        "confidence": confidence_percent,
        "status": "unclear" if needs_clearer else "looks_good",
        "summary": (
            f"DEMO MODE: the image prototype suggests {soil_type} soil, but the confidence is low. Treat this as an example only."
            if demo
            else f"The image model suggests {soil_type} soil. Confirm with a field inspection and soil test."
        ),
        "observations": ["Photo-based color and texture screening only; soil chemistry is not measured."],
        "recommendations": [
            {"title": "Suitable crops", "detail": ", ".join(advice["crops"]), "priority": "soon"},
            {"title": "Irrigation", "detail": advice["irrigation"], "priority": "now"},
            {"title": "Fertilizer and amendments", "detail": advice["fertilizer"], "priority": "testing"},
        ],
        "crops": advice["crops"],
        "irrigation": advice["irrigation"],
        "fertilizer": advice["fertilizer"],
        "tests_to_confirm": advice["tests_to_confirm"],
        "disease_care_link": {
            "title": "Connect soil and plant health",
            "detail": "Use irrigation and drainage guidance alongside a separate disease assessment. A soil photo cannot identify a plant pathogen.",
            "path": "/diagnosis",
        },
        "source": "mobilenetv2_demo" if demo and prediction.get("architecture") else "visual_demo" if demo else "mobilenetv2",
        "demo_mode": demo,
        "needs_clearer_photo": needs_clearer,
        "limitations": "A photograph cannot measure pH, nutrients, salinity, contamination, or soil structure at depth. Test soil before applying fertilizer or amendments.",
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    return {"response": answer_farming_question(request.message)}


@app.api_route(
    "/api/{unmatched_path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    include_in_schema=False,
)
async def api_not_found(unmatched_path: str):
    raise HTTPException(status_code=404, detail="API endpoint not found.")


if __name__ == "__main__":  # pragma: no cover - convenience entry point
    import uvicorn

    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=5000, reload=False)


frontend_dist = os.getenv("FRONTEND_DIST", "dist")
if frontend_dist and os.path.isdir(frontend_dist):
    app.mount("/", SPAStaticFiles(directory=frontend_dist, html=True), name="frontend")
