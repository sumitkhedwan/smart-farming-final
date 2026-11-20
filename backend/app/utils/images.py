from __future__ import annotations

import io

from fastapi import HTTPException, UploadFile
from PIL import Image, ImageFile, UnidentifiedImageError

from ..config import settings

ImageFile.LOAD_TRUNCATED_IMAGES = False
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}


async def read_valid_image(upload: UploadFile) -> tuple[Image.Image, bytes]:
    declared_type = (upload.content_type or "").lower()
    if declared_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Upload a JPEG, PNG, or WebP image.")

    content = await upload.read(settings.max_upload_bytes + 1)
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="Image exceeds the 10 MB upload limit.")

    try:
        with Image.open(io.BytesIO(content)) as probe:
            if probe.format not in ALLOWED_FORMATS:
                raise HTTPException(status_code=415, detail="The file content is not a supported image format.")
            width, height = probe.size
            if width < settings.min_image_side or height < settings.min_image_side:
                raise HTTPException(status_code=422, detail="Use an image at least 64 × 64 pixels.")
            if width * height > settings.max_image_pixels:
                raise HTTPException(status_code=413, detail="Image dimensions are too large to process safely.")
            probe.verify()
        with Image.open(io.BytesIO(content)) as source:
            image = source.convert("RGB")
            image.load()
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise HTTPException(status_code=422, detail="The image is unreadable or damaged. Choose a clear photo.") from exc
    return image, content
