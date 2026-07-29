#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_ROOT="${BASALTEMPERATUR_DEPLOY_ROOT:-/opt/apps/basaltemperatur/repo}"
SHARED_ROOT="${BASALTEMPERATUR_SHARED_ROOT:-$(dirname "$DEPLOY_ROOT")/shared}"
ENV_FILE="$SHARED_ROOT/.env.hostinger"
STATE_FILE="$SHARED_ROOT/.deployed-commit"
PREVIOUS_STATE_FILE="$SHARED_ROOT/.previous-deployed-commit"
TARGET_REF="${1:-origin/main}"
HEALTH_ATTEMPTS="${BASALTEMPERATUR_HEALTH_ATTEMPTS:-30}"
HEALTH_DELAY_SECONDS="${BASALTEMPERATUR_HEALTH_DELAY_SECONDS:-2}"
SWITCHED=0
PREVIOUS_RUNNING=0
PREVIOUS_COMMIT=''

if [[ $# -gt 1 ]]; then
  printf '%s\n' 'Usage: deploy-hostinger.sh [origin/main|40-character-commit-sha]' >&2
  exit 64
fi

if [[ "$TARGET_REF" != 'origin/main' ]] \
  && [[ ! "$TARGET_REF" =~ ^[0-9a-f]{40}$ ]]; then
  printf 'Invalid deployment target: %s\n' "$TARGET_REF" >&2
  exit 64
fi

if [[ "$DEPLOY_ROOT" != /* || "$DEPLOY_ROOT" == '/' ]]; then
  printf '%s\n' 'BASALTEMPERATUR_DEPLOY_ROOT must be a specific absolute path.' >&2
  exit 64
fi

if [[ ! -e "$DEPLOY_ROOT/.git" ]]; then
  printf 'Deployment checkout is missing: %s\n' "$DEPLOY_ROOT" >&2
  exit 66
fi

if [[ ! -f "$ENV_FILE" ]]; then
  printf 'Deployment environment is missing: %s\n' "$ENV_FILE" >&2
  exit 66
fi

if [[ ! "$HEALTH_ATTEMPTS" =~ ^[1-9][0-9]*$ ]] \
  || [[ ! "$HEALTH_DELAY_SECONDS" =~ ^[0-9]+$ ]]; then
  printf '%s\n' 'Health attempt and delay settings must be non-negative integers.' >&2
  exit 64
fi

export BASALTEMPERATUR_ENV_FILE="$ENV_FILE"
cd "$DEPLOY_ROOT"

if [[ -n "$(git status --porcelain --untracked-files=normal)" ]]; then
  printf '%s\n' 'Refusing to deploy from a dirty checkout.' >&2
  exit 65
fi

ORIGIN_URL="$(git remote get-url origin)"
case "$ORIGIN_URL" in
  *'/kristianhoffmann/basaltemperatur.git'|*':kristianhoffmann/basaltemperatur.git') ;;
  *)
    printf 'Unexpected origin repository: %s\n' "$ORIGIN_URL" >&2
    exit 65
    ;;
esac

git fetch --prune origin main

if [[ "$TARGET_REF" == 'origin/main' ]]; then
  TARGET_COMMIT="$(git rev-parse origin/main)"
else
  TARGET_COMMIT="$TARGET_REF"
fi

git cat-file -e "${TARGET_COMMIT}^{commit}"
git merge-base --is-ancestor "$TARGET_COMMIT" origin/main

PREVIOUS_COMMIT="$(git rev-parse HEAD)"
if [[ -f "$STATE_FILE" ]]; then
  RECORDED_COMMIT="$(tr -d '[:space:]' < "$STATE_FILE")"
  if [[ "$RECORDED_COMMIT" =~ ^[0-9a-f]{40}$ ]] \
    && git cat-file -e "${RECORDED_COMMIT}^{commit}" 2>/dev/null; then
    PREVIOUS_COMMIT="$RECORDED_COMMIT"
  fi
fi

COMPOSE=(
  docker compose
  --project-name basaltemperatur-web
  --env-file "$ENV_FILE"
  -f compose.hostinger.yaml
)

if [[ -n "$("${COMPOSE[@]}" ps -q app)" ]]; then
  PREVIOUS_RUNNING=1
fi

printf '%s\n' "$PREVIOUS_COMMIT" > "$PREVIOUS_STATE_FILE"

deploy_rollback() {
  local exit_code=$?
  trap - ERR
  set +e

  if [[ "$SWITCHED" -eq 1 ]]; then
    printf 'Deployment failed; restoring commit %s\n' "$PREVIOUS_COMMIT" >&2
    if [[ "$PREVIOUS_RUNNING" -eq 1 ]]; then
      git checkout --detach "$PREVIOUS_COMMIT"
      "${COMPOSE[@]}" build --pull app
      "${COMPOSE[@]}" up -d --no-deps app
    else
      "${COMPOSE[@]}" stop app
      git checkout --detach "$PREVIOUS_COMMIT"
    fi
  fi

  exit "$exit_code"
}

trap deploy_rollback ERR

git checkout --detach "$TARGET_COMMIT"
SWITCHED=1

"${COMPOSE[@]}" build --pull app
"${COMPOSE[@]}" up -d --no-deps app

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
if [[ ! "$APP_PORT" =~ ^[0-9]+$ ]] \
  || (( APP_PORT < 1 || APP_PORT > 65535 )); then
  printf 'Invalid APP_PORT: %s\n' "$APP_PORT" >&2
  false
fi

HEALTH_URL="http://127.0.0.1:${APP_PORT}/api/health"
HEALTHY=0
for ((attempt = 1; attempt <= HEALTH_ATTEMPTS; attempt += 1)); do
  if curl --fail --silent --show-error --max-time 5 \
    --output /dev/null "$HEALTH_URL"; then
    HEALTHY=1
    break
  fi
  if (( attempt < HEALTH_ATTEMPTS )); then
    sleep "$HEALTH_DELAY_SECONDS"
  fi
done

if [[ "$HEALTHY" -ne 1 ]]; then
  printf 'Health check failed after %s attempts: %s\n' \
    "$HEALTH_ATTEMPTS" "$HEALTH_URL" >&2
  false
fi

printf '%s\n' "$TARGET_COMMIT" > "$STATE_FILE"
trap - ERR
printf 'Deployed commit %s with a healthy app container.\n' "$TARGET_COMMIT"
