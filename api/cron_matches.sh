#!/bin/sh

sleep 15

while true
do
  echo "--- Début de la synchronisation des matchs ---"
  python3 manage.py fetch_matches
  echo "--- Fin. Prochaine mise à jour dans 1 heure ---"

  sleep 3600
done