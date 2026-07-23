$ErrorActionPreference = "Stop"

$RootDirectory = Split-Path -Parent $PSScriptRoot
$BackendDirectory = Join-Path $RootDirectory "backend"
$FrontendDirectory = Join-Path $RootDirectory "frontend"

$PythonExecutable = "python"

$WindowsVenvPython = Join-Path `
    $BackendDirectory `
    ".venv\Scripts\python.exe"

$UnixVenvPython = Join-Path `
    $BackendDirectory `
    ".venv\bin\python"

if (Test-Path $WindowsVenvPython) {
    $PythonExecutable = $WindowsVenvPython
}
elseif (Test-Path $UnixVenvPython) {
    $PythonExecutable = $UnixVenvPython
}

Write-Host "========================================"
Write-Host "FINAL VERIFICATION — CHATBOT AKADEMIK"
Write-Host "========================================"
Write-Host "Python: $PythonExecutable"

Push-Location $BackendDirectory

try {
    & $PythonExecutable `
        -m compileall `
        -q `
        app.py `
        config.py `
        src `
        scripts `
        tests

    & $PythonExecutable `
        -m pytest

    & $PythonExecutable `
        scripts/verify_project.py
}
finally {
    Pop-Location
}

Push-Location $FrontendDirectory

try {
    npm ci
    npm run build
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "Semua pemeriksaan backend dan frontend berhasil."
Write-Host "Laporan: backend/reports/final_verification.md"