#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_ROOT="${BASALTEMPERATUR_DEPLOY_ROOT:-/opt/apps/basaltemperatur/repo}"
SHARED_ROOT="${BASALTEMPERATUR_SHARED_ROOT:-$(dirname "$DEPLOY_ROOT")/shared}"
ENV_FILE="$SHARED_ROOT/.env.hostinger"

if [[ ! -e "$DEPLOY_ROOT/.git" || ! -f "$ENV_FILE" ]]; then
  printf '%s\n' 'Basaltemperatur checkout or environment file is missing.' >&2
  exit 66
fi

export BASALTEMPERATUR_ENV_FILE="$ENV_FILE"
cd "$DEPLOY_ROOT"

COMPOSE=(
  docker compose
  --project-name basaltemperatur-web
  --env-file "$ENV_FILE"
  -f compose.hostinger.yaml
)

"${COMPOSE[@]}" config --quiet
container_id="$("${COMPOSE[@]}" ps -q app)"
if [[ -z "$container_id" ]]; then
  printf '%s\n' 'Basaltemperatur app container is missing.' >&2
  exit 1
fi

container_status="$(docker inspect --format '{{.State.Status}}' "$container_id")"
container_health="$(docker inspect --format '{{.State.Health.Status}}' "$container_id")"
container_user="$(docker inspect --format '{{.Config.User}}' "$container_id")"
if [[ "$container_status" != 'running' || "$container_health" != 'healthy' ]]; then
  printf 'Basaltemperatur app is not healthy: status=%s health=%s\n' \
    "$container_status" "$container_health" >&2
  exit 1
fi
if [[ "$container_user" != 'nextjs' && "$container_user" != '1001:1001' ]]; then
  printf 'Basaltemperatur app uses unexpected user: %s\n' "$container_user" >&2
  exit 1
fi

APP_PORT="$(
  awk -F= '
    $1 == "APP_PORT" {
      value = $2
      gsub(/^[[:space:]"]+|[[:space:]"]+$/, "", value)
      print value
    }
  ' "$ENV_FILE" | tail -n 1
)"
APP_PORT="${APP_PORT:-3040}"
published_port="$(docker port "$container_id" 3000/tcp)"
if [[ "$published_port" != "127.0.0.1:${APP_PORT}" ]]; then
  printf 'Unexpected published port: %s\n' "$published_port" >&2
  exit 1
fi

network_names="$(docker inspect \
  --format '{{range $name, $_ := .NetworkSettings.Networks}}{{$name}} {{end}}' \
  "$container_id")"
if [[ " $network_names " != *' basaltemperatur_edge '* ]]; then
  printf 'Basaltemperatur app is not attached to basaltemperatur_edge: %s\n' \
    "$network_names" >&2
  exit 1
fi

network_aliases="$(docker inspect \
  --format '{{json (index .NetworkSettings.Networks "basaltemperatur_edge").Aliases}}' \
  "$container_id")"
if [[ "$network_aliases" != *'"basaltemperatur-app"'* ]]; then
  printf 'Basaltemperatur app is missing its Caddy alias: %s\n' \
    "$network_aliases" >&2
  exit 1
fi

curl --fail --silent --show-error --max-time 5 \
  --output /dev/null "http://127.0.0.1:${APP_PORT}/api/health"

printf 'Basaltemperatur app verified: container=%s port=127.0.0.1:%s network=basaltemperatur_edge alias=basaltemperatur-app\n' \
  "${container_id:0:12}" "$APP_PORT"
