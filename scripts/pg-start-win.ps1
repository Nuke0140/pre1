# pg-start-win.ps1 — Start embedded PostgreSQL for Windows
$ErrorActionPreference = "Stop"
$rootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$pgData = Join-Path $rootDir "db\pgdata_win"
$pgBin = Join-Path $rootDir "node_modules\@embedded-postgres\windows-x64\native\bin\postgres.exe"
$pidFile = Join-Path $pgData "postmaster.pid"

if (Test-Path $pidFile) {
    $existingPid = (Get-Content $pidFile)[0]
    $running = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
    if ($running) {
        Write-Host "PostgreSQL is already running (PID: $existingPid) on port 5432."
        exit 0
    } else {
        Write-Host "Removing stale postmaster.pid (PID was $existingPid)..."
        Remove-Item $pidFile -Force
    }
}

Write-Host "Starting PostgreSQL from $pgData..."
Start-Process -FilePath $pgBin -ArgumentList "-D", "`"$pgData`"" -WindowStyle Hidden
Start-Sleep -Seconds 2
Write-Host "PostgreSQL started successfully on port 5432."
