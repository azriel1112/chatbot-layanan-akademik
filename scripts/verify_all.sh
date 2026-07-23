#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

PYTHON_BIN="python"

if [[ -x "$BACKEND_DIR/.venv/Scripts/python.exe" ]]; then
  PYTHON_BIN="$BACKEND_DIR/.venv/Scripts/python.exe"
elif [[ -x "$BACKEND_DIR/.venv/bin/python" ]]; then
  PYTHON_BIN="$BACKEND_DIR/.venv/bin/python"
fi

echo "========================================"
echo "FINAL VERIFICATION — CHATBOT AKADEMIK"
echo "========================================"
echo "Python: $PYTHON_BIN"

cd "$BACKEND_DIR"

"$PYTHON_BIN" -m compileall -q app.py config.py src scripts tests
"$PYTHON_BIN" -m pytest
"$PYTHON_BIN" scripts/verify_project.py

cd "$FRONTEND_DIR"

npm ci
npm run build

echo ""
echo "Semua pemeriksaan backend dan frontend berhasil."
echo "Laporan: backend/reports/final_verification.md"