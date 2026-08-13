#!/usr/bin/env bash
# Lance la suite E2E Selenium contre la stack dev (`docker compose up` doit
# déjà tourner : backend/frontend/caddy_dev). Selon le mode choisi, démarre le
# conteneur selenium (profil "e2e") ou utilise le Chrome de la machine, puis
# installe les deps Python dans un venv local et exécute pytest.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# `docker compose` doit tourner depuis la racine du projet, mais on garde le
# dossier d'appel sous la main : c'est par rapport à LUI que les chemins passés
# à pytest doivent être résolus (`./run.sh test_03_home.py` depuis e2e/).
INVOCATION_DIR="$PWD"
cd "$ROOT_DIR"

usage() {
  cat <<'EOF'
Usage : ./e2e/run.sh [options] [-- options pytest]

Modes :
  (aucun)      Chrome dans le conteneur selenium, en tâche de fond.
  --watch      Idem, et ouvre noVNC (http://localhost:7900, mdp : secret)
               pour regarder le navigateur du conteneur en direct.
  --headed     Chrome installé sur la machine : une vraie fenêtre s'ouvre
               sur le bureau. Aucun conteneur selenium nécessaire.

Options :
  --demo       Curseur rouge visible qui se déplace vers chaque élément,
               frappe au clavier lettre par lettre, pauses entre actions.
  --slowmo N   Pause en secondes entre deux actions (défaut : 0.35 en démo).
  -h, --help   Cette aide.

Tout le reste est passé tel quel à pytest (mettre `--` devant en cas de
conflit de nom d'option). Les chemins de tests peuvent être relatifs au
dossier depuis lequel vous lancez le script, et chaque fichier est jouable
seul : la session est ouverte automatiquement si besoin.

Exemples :
  ./e2e/run.sh                              # suite complète, rapide
  ./e2e/run.sh --headed --demo              # démo commentée sur le bureau
  ./e2e/run.sh --watch --demo               # démo regardée via noVNC
  cd e2e && ./run.sh --headed --demo test_03_home.py     # un seul fichier
  ./e2e/run.sh -k wheel                     # un seul test
EOF
}

USE_LOCAL_CHROME=0
OPEN_VNC=0
PYTEST_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --headed)  USE_LOCAL_CHROME=1; shift ;;
    --watch)   OPEN_VNC=1; shift ;;
    --demo)    export E2E_DEMO=1; shift ;;
    --slowmo)  export E2E_DEMO=1 E2E_SLOWMO="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    --)        shift; PYTEST_ARGS+=("$@"); break ;;
    *)         PYTEST_ARGS+=("$1"); shift ;;
  esac
done

# Un chemin de test peut être donné relativement au dossier d'appel
# (`./run.sh test_03_home.py` depuis e2e/) ou à la racine
# (`./e2e/run.sh e2e/test_03_home.py`) : on le rend absolu dans les deux cas,
# sinon pytest ne le trouve plus après le `cd` — et perd au passage
# e2e/pytest.ini, qui fixe sa rootdir.
resolve_target() {
  local arg="$1" path rest="" candidate
  path="${arg%%::*}"                       # découpe les node ids fichier::test
  [[ "$arg" == *::* ]] && rest="::${arg#*::}"
  for candidate in "$path" "$INVOCATION_DIR/$path" "$ROOT_DIR/e2e/$path"; do
    if [ -n "$path" ] && [ -e "$candidate" ]; then
      printf '%s%s' "$(cd "$(dirname "$candidate")" && pwd)/$(basename "$candidate")" "$rest"
      return
    fi
  done
  printf '%s' "$arg"                       # options pytest (-k, -x…) : inchangées
}

for i in "${!PYTEST_ARGS[@]}"; do
  [[ "${PYTEST_ARGS[$i]}" == -* ]] || PYTEST_ARGS[$i]="$(resolve_target "${PYTEST_ARGS[$i]}")"
done

if [ "$USE_LOCAL_CHROME" -eq 1 ]; then
  export E2E_BROWSER=local
  echo "→ Mode fenêtre locale : Chrome va s'ouvrir sur le bureau."
  echo "  (ne touchez ni la fenêtre ni le clavier pendant le test)"
else
  export E2E_BROWSER=remote
  echo "→ Démarrage du conteneur selenium (profil e2e)…"
  docker compose --profile e2e up -d selenium
  cleanup() {
    echo "→ Arrêt du conteneur selenium…"
    docker compose --profile e2e stop selenium >/dev/null 2>&1 || true
  }
  trap cleanup EXIT

  if [ "$OPEN_VNC" -eq 1 ]; then
    VNC_URL="http://localhost:7900/?autoconnect=1&resize=scale&password=secret"
    echo "→ Écran du navigateur : $VNC_URL"
    (xdg-open "$VNC_URL" >/dev/null 2>&1 || true) &
    sleep 3  # laisser le temps d'afficher noVNC avant le premier test
  fi
fi

VENV_DIR="$ROOT_DIR/e2e/.venv"
if [ ! -d "$VENV_DIR" ]; then
  echo "→ Création du venv e2e…"
  python3 -m venv "$VENV_DIR"
fi

"$VENV_DIR/bin/pip" install --quiet --upgrade pip
"$VENV_DIR/bin/pip" install --quiet -r "$ROOT_DIR/e2e/requirements.txt"

echo "→ Lancement des tests E2E…"
"$VENV_DIR/bin/pytest" "${PYTEST_ARGS[@]:-$ROOT_DIR/e2e}"

echo "→ Screenshots : $ROOT_DIR/e2e/screenshots/"
