"""
Minimal OpenAI-compatible Whisper server for Recipe Extractor.

POST /v1/audio/transcriptions
  - file: audio file (mp3, wav, m4a, …)
  - model: ignored (uses WHISPER_MODEL_SIZE env)
  - language: optional ISO code (e.g. en)

Run: uvicorn server:app --host 127.0.0.1 --port 8000
"""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import JSONResponse
from faster_whisper import WhisperModel

MODEL_SIZE = os.getenv('WHISPER_MODEL_SIZE', 'small')
DEVICE = os.getenv('WHISPER_DEVICE', 'cpu')
COMPUTE_TYPE = os.getenv('WHISPER_COMPUTE_TYPE', 'int8')

print(f'[whisper-server] Loading model={MODEL_SIZE} device={DEVICE} compute={COMPUTE_TYPE}…')
_model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
print('[whisper-server] Model ready.')

app = FastAPI(title='Local Whisper API', version='1.0.0')


@app.get('/health')
def health() -> dict[str, str]:
    return {'status': 'ok', 'model': MODEL_SIZE}


@app.post('/v1/audio/transcriptions')
async def transcribe(
    file: UploadFile = File(...),
    model: str = Form('whisper-1'),
    language: str | None = Form(None),
) -> JSONResponse:
    suffix = Path(file.filename or 'audio.mp3').suffix or '.mp3'
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        lang = language.split('-')[0] if language else None
        segments, _info = _model.transcribe(tmp_path, language=lang, vad_filter=True)
        text = ' '.join(segment.text.strip() for segment in segments if segment.text.strip())
        return JSONResponse({'text': text})
    finally:
        Path(tmp_path).unlink(missing_ok=True)


if __name__ == '__main__':
    import uvicorn

    port = int(os.getenv('PORT', '8000'))
    uvicorn.run('server:app', host='127.0.0.1', port=port, reload=False)
