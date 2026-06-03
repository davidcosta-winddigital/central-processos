#!/bin/sh
# Coletor de métricas (execução ÚNICA) — Central de Processos · FreeBSD / TrueNAS CORE
# Coleta UMA vez e envia para 1 ou mais destinos (local e/ou produção). Rode via cron a cada 1 min.
# ===================== DESTINOS (edite aqui) =====================
# Preencha os ambientes desejados. Deixe o TOKEN vazio para ignorar um destino.
# Cada ambiente tem o SEU token (bancos separados).
API_URL_1="http://SEU_HOST:8000/api"
TOKEN_1="COLE_TOKEN_LOCAL"

API_URL_2="https://processos.winddigital.com.br/api"
TOKEN_2=""        # cole o token gerado no dashboard de PRODUÇÃO

SAMPLE="2"
# ================================================================

# 1. NOME e IP (dinâmicos)
NOME=$(hostname 2>/dev/null)
INTERFACE=$(route -n get default 2>/dev/null | awk '/interface:/{print $2}')
if [ -n "$INTERFACE" ]; then
    HOST=$(ifconfig "$INTERFACE" inet 2>/dev/null | awk '/inet /{print $2}')
else
    HOST=$(ifconfig 2>/dev/null | awk '/inet /{if($2!="127.0.0.1"){print $2; exit}}')
fi
HOST=$(echo "$HOST" | cut -d'/' -f1)
NOME=$(printf '%s' "$NOME" | tr -d '"\\')
HOST=$(printf '%s' "$HOST" | tr -d '"\\')

# 2. DISCO (maior pool em /mnt/<nome>; -kP evita quebra com nome longo)
DISK_PATH=$(df -kP 2>/dev/null | awk 'NR>1 && $6 ~ /^\/mnt\/[^\/]+$/ {print $2, $6}' | sort -rn | head -n1 | awk '{print $2}')
[ -z "$DISK_PATH" ] && DISK_PATH="/"

# 3. FUNÇÕES
cpu_idle_total() { set -- $(sysctl -n kern.cp_time); echo "$5 $(( $1 + $2 + $3 + $4 + $5 ))"; }
net_bytes()      { netstat -ibnW 2>/dev/null | awk '$1!="lo0" && $0 ~ /<Link#/ {rx+=$8; tx+=$11} END{print rx+0, tx+0}'; }

# Memória (desconta o ARC do ZFS, que é cache reclaimável)
pagesize=$(sysctl -n hw.pagesize)
total_pages=$(sysctl -n vm.stats.vm.v_page_count)
free_pages=$(sysctl -n vm.stats.vm.v_free_count)
inact_pages=$(sysctl -n vm.stats.vm.v_inactive_count)
cache_pages=$(sysctl -n vm.stats.vm.v_cache_count 2>/dev/null || echo 0)
arc_bytes=$(sysctl -n kstat.zfs.misc.arcstats.size 2>/dev/null || echo 0)
mem_total=$(( total_pages * pagesize / 1024 / 1024 ))
mem_avail=$(( (free_pages + inact_pages + cache_pages) * pagesize / 1024 / 1024 + arc_bytes / 1024 / 1024 ))
mem_used=$(( mem_total - mem_avail ))
[ "$mem_used" -lt 0 ] && mem_used=0

# top: 2 iterações (a 2ª traz CPU e WCPU instantâneos), ordenado por CPU
TOPRAW=$(top -b -s 1 -d 2 -o cpu 2>/dev/null)
cpu_top=$(printf '%s\n' "$TOPRAW" | awk '/^CPU:/{l=$0} END{ if(l){ gsub(/%/,"",l); n=split(l,a," "); for(i=1;i<=n;i++) if(a[i]=="idle"){ v=100-a[i-1]; if(v<0)v=0; printf "%.1f", v } } }')
top=$(printf '%s\n' "$TOPRAW" | awk -v MT="$mem_total" '
  /PID +USERNAME/ { cap=1; n=0; out=""; next }
  cap && n<5 && $1 ~ /^[0-9]+$/ {
    cmd=$NF; gsub(/["\\]/,"",cmd);
    wc=$(NF-1); gsub(/%/,"",wc); wc=wc+0;
    res=$7; u=substr(res,length(res),1); v=res+0;
    if(u=="K") mb=v/1024; else if(u=="G") mb=v*1024; else if(u=="T") mb=v*1024*1024; else mb=v;
    pm=(MT>0)? mb/MT*100 : 0;
    out = out (n>0?",":"") sprintf("{\"nome\":\"%s\",\"cpu\":%.1f,\"memoria\":%.1f}", cmd, wc, pm);
    n++;
  }
  END { print out }
')

# CPU/rede via kern.cp_time (base confiável, intervalo exato = SAMPLE)
set -- $(cpu_idle_total); i1=$1; t1=$2
set -- $(net_bytes);      r1=$1; x1=$2
sleep "$SAMPLE"
set -- $(cpu_idle_total); i2=$1; t2=$2
set -- $(net_bytes);      r2=$1; x2=$2

idle_d=$(( i2 - i1 )); total_d=$(( t2 - t1 ))
cpu_cp="0.0"
[ "$total_d" -gt 0 ] && cpu_cp=$(awk "BEGIN{printf \"%.1f\",(1-$idle_d/$total_d)*100}")
cpu="${cpu_top:-$cpu_cp}"; [ -z "$cpu" ] && cpu="$cpu_cp"

rx_d=$(( r2 - r1 )); [ "$rx_d" -lt 0 ] && rx_d=0
tx_d=$(( x2 - x1 )); [ "$tx_d" -lt 0 ] && tx_d=0
rx=$(awk "BEGIN{printf \"%.1f\", $rx_d*8/1000000/$SAMPLE}")
tx=$(awk "BEGIN{printf \"%.1f\", $tx_d*8/1000000/$SAMPLE}")

# fallback de processos -> ps
if [ -z "$top" ]; then
  top=$(ps -axo comm,pcpu,pmem | tail -n +2 | sort -k2 -rn | head -5 \
        | awk '{n=$1; gsub(/["\\]/,"",n); printf "%s{\"nome\":\"%s\",\"cpu\":%s,\"memoria\":%s}",(NR>1?",":""),n,$2+0,$3+0}')
fi

# Disco
set -- $(df -kP "$DISK_PATH" | awk 'END{print $2, $3}')
disk_total=$(( ${1:-0} / 1024 / 1024 ))
disk_used=$(( ${2:-0} / 1024 / 1024 ))

# Uptime (parse robusto e validado)
boot=$(sysctl -n kern.boottime 2>/dev/null | tr -d ',' | awk '{print $4}')
case "$boot" in ''|*[!0-9]*) boot=0;; esac
now=$(date +%s)
if [ "$boot" -gt 1000000000 ] && [ "$boot" -le "$now" ]; then uptime_s=$(( now - boot )); else uptime_s=0; fi

load=$(sysctl -n vm.loadavg | tr -d '{}' | awk '{print $1", "$2", "$3}')

payload="{\"nome\":\"$NOME\",\"host\":\"$HOST\",\"cpu\":$cpu,\"mem_total_mb\":$mem_total,\"mem_used_mb\":$mem_used,\"disk_total_gb\":$disk_total,\"disk_used_gb\":$disk_used,\"net_rx_mbps\":$rx,\"net_tx_mbps\":$tx,\"uptime_s\":$uptime_s,\"load\":[$load],\"top\":[$top]}"

# Envia para cada destino configurado (em paralelo; ignora os sem token).
enviar() {
  [ -z "$1" ] && return 0
  [ -z "$2" ] && return 0
  case "$2" in COLE_*) return 0;; esac
  curl -s -m 10 -X POST "$1/infra/ingest" \
    -H "X-Server-Token: $2" -H "Content-Type: application/json" \
    -d "$payload" >/dev/null 2>&1 &
}
enviar "$API_URL_1" "$TOKEN_1"
enviar "$API_URL_2" "$TOKEN_2"
wait
