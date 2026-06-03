# Coletor de métricas (execução ÚNICA) — Central de Processos · Windows
# Feito para rodar pelo Agendador de Tarefas a cada 1 minuto. Coleta uma vez, envia e sai.
# Uso:
#   .\agente-windows.ps1 -ApiUrl "http://HOST:8000/api" -Token "seu-token" -DiskPath "C:"
param(
  [string]$ApiUrl   = $env:API_URL,
  [string]$Token    = $env:TOKEN,
  [string]$DiskPath = $(if ($env:DISK_PATH) { $env:DISK_PATH } else { 'C:' })
)
if (-not $ApiUrl -or -not $Token) { Write-Error "Informe -ApiUrl e -Token."; exit 1 }

try {
  $cpu = [math]::Round((Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average, 1)
  $os  = Get-CimInstance Win32_OperatingSystem
  $memTotal = [math]::Round($os.TotalVisibleMemorySize / 1024)
  $memUsed  = [math]::Round(($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) / 1024)
  $disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='$DiskPath'"
  $diskTotal = [math]::Round($disk.Size / 1GB)
  $diskUsed  = [math]::Round(($disk.Size - $disk.FreeSpace) / 1GB)
  $uptime = [int]((Get-Date) - $os.LastBootUpTime).TotalSeconds

  $rx = 0; $tx = 0
  try {
    $rx = [math]::Round(((Get-Counter '\Network Interface(*)\Bytes Received/sec' -ErrorAction Stop).CounterSamples | Measure-Object CookedValue -Sum).Sum * 8 / 1MB, 1)
    $tx = [math]::Round(((Get-Counter '\Network Interface(*)\Bytes Sent/sec').CounterSamples | Measure-Object CookedValue -Sum).Sum * 8 / 1MB, 1)
  } catch {}

  $top = Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 5 | ForEach-Object {
    [pscustomobject]@{ nome = $_.ProcessName; cpu = 0; memoria = [math]::Round($_.WorkingSet64 / 1MB, 1) }
  }

  # nome e IP do próprio servidor (dinâmicos)
  $nome = $env:COMPUTERNAME
  $hostIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1 -ExpandProperty IPAddress)

  $body = @{
    nome = $nome; host = $hostIp
    cpu = $cpu; mem_total_mb = $memTotal; mem_used_mb = $memUsed
    disk_total_gb = $diskTotal; disk_used_gb = $diskUsed
    net_rx_mbps = $rx; net_tx_mbps = $tx; uptime_s = $uptime
    load = @([math]::Round($cpu / 100, 2)); top = $top
  } | ConvertTo-Json -Depth 4

  Invoke-RestMethod -Uri "$ApiUrl/infra/ingest" -Method Post `
    -Headers @{ 'X-Server-Token' = $Token } -ContentType 'application/json' -Body $body | Out-Null
} catch {
  Write-Warning "Falha ao enviar: $_"
}
