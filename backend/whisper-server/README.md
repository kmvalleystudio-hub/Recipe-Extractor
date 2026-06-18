# Local Whisper server — run in a separate terminal from the Recipe Extractor backend
#
# First time (creates venv + installs faster-whisper, ~500MB model download on first transcribe):
#   powershell -ExecutionPolicy Bypass -File backend/scripts/start-whisper.ps1
#
# Later runs:
#   powershell -ExecutionPolicy Bypass -File backend/scripts/start-whisper.ps1
#
# Health check: http://localhost:8000/health
#
# backend/.env should include:
#   TRANSCRIPTION_PROVIDER=whisper-api
#   WHISPER_API_URL=http://localhost:8000/v1
#   WHISPER_MODEL=whisper-1
