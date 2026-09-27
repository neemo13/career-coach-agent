"""
WHAT  - extracts plain text from an uploaded PDF resume.
WHY   - kept separate from app/api/resumes.py so the extraction logic can be
        tested/reused on its own, and so the route handler only deals with
        HTTP concerns (per the "keep business logic separate from routes" rule).
HOW   - app/api/resumes.py calls extract_text_from_pdf() with raw file bytes.
"""

from io import BytesIO

from pypdf import PdfReader
from pypdf.errors import PdfReadError

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


class ResumeExtractionError(Exception):
    """Raised for any resume that can't be turned into usable text."""


def extract_text_from_pdf(file_bytes: bytes) -> str:
    if len(file_bytes) == 0:
        raise ResumeExtractionError("The uploaded file is empty.")

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise ResumeExtractionError("File is too large. Maximum size is 5 MB.")

    try:
        reader = PdfReader(BytesIO(file_bytes))
    except PdfReadError:
        raise ResumeExtractionError(
            "This doesn't look like a valid PDF. Please upload a text-based PDF resume."
        )

    if reader.is_encrypted:
        raise ResumeExtractionError(
            "This PDF is password-protected. Please upload an unprotected file."
        )

    pages_text = []
    for page in reader.pages:
        pages_text.append(page.extract_text() or "")

    text = "\n".join(pages_text).strip()

    if not text:
        # Most common cause: a scanned/image-only resume with no text layer.
        # OCR is out of scope for V1 - see README known limitations.
        raise ResumeExtractionError(
            "No readable text found in this PDF. If it's a scanned image, "
            "please upload a text-based PDF instead."
        )

    return text