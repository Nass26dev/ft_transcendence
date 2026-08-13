#!/usr/bin/env bash
# Lance la suite E2E Selenium contre la stack dev (docker compose up doit
# déjà tourner : backend/frontend/caddy_dev). Démarre juste le conteneur
# selenium (profil "e2e", pas lancé par un `docker compose up` normal),
# installe les deps Python dans un venv local puis exécute pytest.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "→ Démarrage du conteneur selenium (profil e2e)…"
docker compose --profile e2e up -d selenium

cleanup() {
  echo "→ Arrêt du conteneur selenium…"
  docker compose --profile e2e stop selenium >/dev/null 2>&1 || true
}
trap cleanup EXIT

VENV_DIR="$ROOT_DIR/e2e/.venv"
if [ ! -d "$VENV_DIR" ]; then
  echo "→ Création du venv e2e…"
  python3 -m venv "$VENV_DIR"
fi

"$VENV_DIR/bin/pip" install --quiet --upgrade pip
"$VENV_DIR/bin/pip" install --quiet -r "$ROOT_DIR/e2e/requirements.txt"

echo "→ Lancement des tests E2E…"
"$VENV_DIR/bin/pytest" "$ROOT_DIR/e2e" -v --tb=short "$@"

echo "→ Screenshots : $ROOT_DIR/e2e/screenshots/"
