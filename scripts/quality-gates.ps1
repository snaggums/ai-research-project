$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BackendDirectory = Join-Path $ProjectRoot "backend"
$FrontendDirectory = Join-Path $ProjectRoot "frontend"
$PythonExecutable = Join-Path $BackendDirectory ".venv\Scripts\python.exe"
$ApiTestComposeFile = Join-Path $ProjectRoot "docker-compose.test.yml"

function Assert-CommandSucceeded {
    param([string]$Step)

    if ($LASTEXITCODE -ne 0) {
        throw "$Step failed with exit code $LASTEXITCODE."
    }
}

if (-not (Test-Path -LiteralPath $PythonExecutable)) {
    throw "Backend virtual environment not found at $PythonExecutable. Create it and install requirements-dev.txt first."
}

Write-Host "[1/7] Starting the isolated API integration-test database..."
& docker compose -f $ApiTestComposeFile up -d --wait postgres-test
Assert-CommandSucceeded "Starting the API integration-test database"

try {
    Write-Host "[2/7] Running backend integration tests with coverage..."
    Push-Location $BackendDirectory
    try {
        & $PythonExecutable -m pytest --cov=app --cov-report=term-missing --cov-fail-under=50
        Assert-CommandSucceeded "Backend tests"
    }
    finally {
        Pop-Location
    }
}
finally {
    Write-Host "Stopping the isolated API integration-test database..."
    & docker compose -f $ApiTestComposeFile down
    Assert-CommandSucceeded "Stopping the API integration-test database"
}

Push-Location $FrontendDirectory
try {
    Write-Host "[3/7] Running frontend lint checks..."
    & npm run lint
    Assert-CommandSucceeded "Frontend lint"

    Write-Host "[4/7] Building the frontend..."
    & npm run build
    Assert-CommandSucceeded "Frontend build"

    Write-Host "[5/7] Building Storybook..."
    & npm run build-storybook
    Assert-CommandSucceeded "Storybook build"

    Write-Host "[6/7] Running component tests with coverage floors..."
    & npm run test:coverage
    Assert-CommandSucceeded "Frontend component tests"

    Write-Host "[7/7] Running the Playwright golden path..."
    & npm run test:e2e
    Assert-CommandSucceeded "Playwright end-to-end test"
}
finally {
    Pop-Location
}

Write-Host "All quality gates passed."
