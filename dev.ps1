# Starts the backend and the frontend in two new PowerShell windows.
# Usage: .\dev.ps1
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$root\backend'; .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8000"
)

Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$root\frontend'; npm run dev"
)

Write-Host "Backend:  http://127.0.0.1:8000/docs"
Write-Host "Frontend: http://localhost:3000"
