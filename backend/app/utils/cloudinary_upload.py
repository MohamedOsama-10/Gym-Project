# app/utils/cloudinary_upload.py
"""
Cloudinary file upload utility.
Credentials must be set via environment variables — never hardcoded.
"""

import cloudinary
import cloudinary.uploader
import os

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def _configure():
    cloudinary.config(
        cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME", ""),
        api_key=os.environ.get("CLOUDINARY_API_KEY", ""),
        api_secret=os.environ.get("CLOUDINARY_API_SECRET", ""),
        secure=True,
    )


def validate_image(data: bytes, content_type: str = "") -> None:
    """Raise ValueError if file is too large or wrong type."""
    if len(data) > MAX_FILE_SIZE_BYTES:
        raise ValueError(f"File too large. Maximum allowed size is 5 MB.")
    if content_type and content_type not in ALLOWED_MIME_TYPES:
        raise ValueError(f"File type '{content_type}' not allowed. Use JPEG, PNG, WebP or GIF.")


def upload_file(file, folder: str, public_id: str = None, content_type: str = "") -> str:
    """
    Upload a file to Cloudinary and return the secure URL.
    Validates file size and type before uploading.
    """
    _configure()

    if hasattr(file, "read"):
        data = file.read()
    else:
        data = file

    validate_image(data, content_type)

    upload_options = {
        "folder": f"gym_system/{folder}",
        "resource_type": "image",
        "overwrite": True,
    }
    if public_id:
        upload_options["public_id"] = os.path.splitext(public_id)[0]

    result = cloudinary.uploader.upload(data, **upload_options)
    return result["secure_url"]


def delete_file(url: str) -> bool:
    """Delete a file from Cloudinary by its URL."""
    _configure()
    try:
        parts = url.split("/upload/")
        if len(parts) < 2:
            return False
        path = parts[1]
        if path.startswith("v") and "/" in path:
            path = path.split("/", 1)[1]
        public_id = os.path.splitext(path)[0]
        cloudinary.uploader.destroy(public_id)
        return True
    except Exception:
        return False
