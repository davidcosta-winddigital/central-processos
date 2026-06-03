#!/bin/sh
# Coletor de métricas (execução ÚNICA) — Central de Processos · Linux
# Feito para rodar via cron a cada 1 minuto. Coleta uma vez, envia por HTTP e sai.
# Uso (cron):
#   * * * * * env API_URL="http://HOST:8000/api" TOKEN="seu-token" DISK_PATH="/" /bin/sh /caminho/agente-linux.sh >/dev/null 2>&1
[ -z "${API_URL:-}" ] && { echo "defina API_URL"; exit 1; }
[ -z "${TOKEN:-}" ]   && { echo "defina TOKEN"; exit 1; }
DISK_PATH="${DISK_PATH:-/}"
SAMPLE="${SAMPLE:-2}"

# nome e IP do próprio servidor (dinâmicos)
NOME="${NOME:-$(hostname 2>/dev/null)}"
HOST="${HOST:-$(ip -4 route get 1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src"){print $(i+1); exit}}')}"
[ -z "$HOST" ] && HOST=$(hostname -I 2>/dev/null | awk '{print $1}')
NOME=$(printf '%s' "$NOME" | tr -d '"\\')
HOST=$(printf '%s' "$HOST" | tr -d '"\\')

cpu_idle_total() { awk '/^cpu /{idle=$5; tot=0; for(i=2;i<=NF;i++) tot+=$i; print idle, tot}' /proc/stat; }
net_bytes()      { awk 'NR>2{rx+=$2; tx+=$10} END{print rx" "tx}' /proc/net/dev; }

set -- $(cpu_idle_total); i1=$1; t1=$2
set -- $(net_bytes);      r1=$1; x1=$2
sleep "$SAMPLE"
set -- $(cpu_idle_total); i2=$1; t2=$2
set -- $(net_bytes);      r2=$1; x2=$2

idle_d=$(( i2 - i1 )); total_d=$(( t2 - t1 ))
cpu=0
[ "$total_d" -gt 0 ] && cpu=$(awk "BEGIN{printf \"%.1f\",(1-$idle_d/$total_d)*100}")
rx=$(awk "BEGIN{d=$r2-$r1; if(d<0)d=0; printf \"%.1f\", d*8/1000000/$SAMPLE}")
tx=$(awk "BEGIN{d=$x2-$x1; if(d<0)d=0; printf \"%.1f\", d*8/1000000/$SAMPLE}")

mem_total=$(awk '/MemTotal/{print int($2/1024)}' /proc/meminfo)
mem_avail=$(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo)
mem_used=$(( mem_total - mem_avail ))
set -- $(df -k "$DISK_PATH" | tail -1 | awk '{print $2, $3}')
disk_total=$(( ${1:-0} / 1024 / 1024 ))
disk_used=$(( ${2:-0} / 1024 / 1024 ))
uptime_s=$(awk '{print int($1)}' /proc/uptime)
load=$(awk '{print $1", "$2", "$3}' /proc/loadavg)

top=$(ps -eo comm,%cpu,%mem --sort=-%cpu 2>/dev/null | tail -n +2 | head -5 \
      | awk '{n=$1; gsub(/["\\]/,"",n); printf "%s{\"nome\":\"%s\",\"cpu\":%s,\"memoria\":%s}",(NR>1?",":""),n,$2+0,$3+0}')

payload="{\"nome\":\"$NOME\",\"host\":\"$HOST\",\"cpu\":$cpu,\"mem_total_mb\":$mem_total,\"mem_used_mb\":$mem_used,\"disk_total_gb\":$disk_total,\"disk_used_gb\":$disk_used,\"net_rx_mbps\":$rx,\"net_tx_mbps\":$tx,\"uptime_s\":$uptime_s,\"load\":[$load],\"top\":[$top]}"

curl -s -m 15 -X POST "$API_URL/infra/ingest" \
  -H "X-Server-Token: $TOKEN" -H "Content-Type: application/json" \
  -d "$payload" >/dev/null 2>&1
