#!/bin/sh

sleep 15

while true
do
  echo "--- Début de la synchronisation des matchs ---"
  python3 manage.py fetch_matches
  echo "--- Fin. Prochaine mise à jour dans 1 minute ---"

  sleep 120
done