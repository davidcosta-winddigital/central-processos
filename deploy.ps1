# ============================================================
# deploy.ps1 - Build + push da imagem unica do central-processos.
#
# Uso:
#   .\deploy.ps1                # tag latest
#   .\deploy.ps1 -Tag v1.0.0    # tag versao + atualiza :latest
# ============================================================
param([string]$Tag = "latest")

$ErrorActionPreference = "Stop"
$ORG    = "winddigital"
$IMAGE  = "$ORG/central-processos"

Set-Location -Path $PSScriptRoot

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  Deploy Docker Hub"                     -ForegroundColor Yellow
Write-Host "  Imagem:  ${IMAGE}:${Tag}"              -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

try {
    docker version --format '{{.Server.Version}}' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "docker nao respondeu" }
} catch {
    Write-Host "ERRO: Docker nao esta rodando ou nao esta no PATH." -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Build: ${IMAGE}:${Tag} ===" -ForegroundColor Cyan
docker build -t "${IMAGE}:${Tag}" -f "Dockerfile" "."
if ($LASTEXITCODE -ne 0) { Write-Host "ERRO no build" -ForegroundColor Red; exit 1 }

if ($Tag -ne "latest") {
    docker tag "${IMAGE}:${Tag}" "${IMAGE}:latest"
}

Write-Host "`n=== Push: ${IMAGE}:${Tag} ===" -ForegroundColor Cyan
docker push "${IMAGE}:${Tag}"
if ($LASTEXITCODE -ne 0) { Write-Host "ERRO no push" -ForegroundColor Red; exit 1 }

if ($Tag -ne "latest") {
    docker push "${IMAGE}:latest"
    if ($LASTEXITCODE -ne 0) { Write-Host "ERRO no push de :latest" -ForegroundColor Red; exit 1 }
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Deploy concluido!" -ForegroundColor Green
Write-Host "    - ${IMAGE}:${Tag}" -ForegroundColor White
if ($Tag -ne "latest") { Write-Host "    - ${IMAGE}:latest" -ForegroundColor White }
Write-Host "`n  No Portainer:" -ForegroundColor Gray
Write-Host "    Stacks > central-processos > Update the stack > Re-pull image" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Green
