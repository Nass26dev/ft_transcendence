# Kop — Documentation technique

Document interne : architecture réelle, schéma, endpoints, algorithmes.
Le [README](README.md) est la porte d'entrée du projet ; ce document décrit **ce qui tourne**.

> Toute affirmation ci-dessous a été vérifiée contre le code. Quand quelque chose
> n'est pas implémenté, c'est écrit noir sur blanc plutôt que passé sous silence.

---

## Sommaire

1. [Stack](#1-stack)
2. [Architecture](#2-architecture)
3. [Découpage en apps](#3-découpage-en-apps)
4. [Schéma de données](#4-schéma-de-données)
5. [Endpoints REST](#5-endpoints-rest)
6. [WebSockets](#6-websockets)
7. [Authentification](#7-authentification)
8. [Moteur de cotes](#8-moteur-de-cotes)
9. [Règlement des paris](#9-règlement-des-paris)
10. [Scraping](#10-scraping)
11. [Classements et tendances](#11-classements-et-tendances)
12. [Sécurité — état réel](#12-sécurité--état-réel)
13. [Conventions](#13-conventions)

---

## 1. Stack

| Couche | Techno | Version | Rôle |
|---|---|---|---|
| Frontend | Next.js (App Router) | 16.1 | SSR, routing, routes serveur servant de proxy vers l'API |
| UI | Tailwind CSS | 4 | Styles, tokens dans `globals.css` |
| Animations | Framer Motion | 12 | Transitions, respect de « animations réduites » |
| HTTP client | Axios | 1.x | Intercepteur de refresh de token |
| Backend | Django + DRF | 5.2 | ORM, migrations, API REST, admin |
| Temps réel | Django Channels + channels-redis | 4.x | WebSockets dans le même process Django |
| Serveur ASGI | Daphne | 4.x | Sert HTTP **et** WebSocket |
| Tâches | Celery + Celery Beat | 5.6 | Scraping, cotes, règlement |
| Base | PostgreSQL | 16 | Transactions sur le solde |
| Broker / channel layer | Redis | 7 | Broker Celery, couche Channels |
| Reverse proxy | Caddy | 2 | Terminaison TLS. Dev : certificat local auto-genere (CA interne), `https://localhost:8443`. Prod : Let's Encrypt automatique |

### Pourquoi PostgreSQL et pas SQLite

Le solde est modifié en concurrence : placer un pari débite, le règlement crédite, le bonus et la roue s'ajoutent. Ces opérations tournent dans `transaction.atomic()` avec `select_for_update()`. SQLite sérialise toutes les écritures au niveau du fichier, ce qui ne tient pas dès que plusieurs utilisateurs parient au même coup d'envoi.

### Pourquoi Channels et pas un service WebSocket séparé

Le socket doit savoir **qui** est connecté. `CookieJWTAuthMiddleware` relit le cookie JWT déjà utilisé par l'API REST et injecte l'utilisateur Django dans le scope du consumer. Un service Node séparé aurait imposé de dupliquer l'authentification et de synchroniser deux modèles utilisateur.

---

## 2. Architecture

```
                          Navigateur
                              │
                    ┌─────────▼──────────┐
                    │       Caddy         │   TLS dans les deux cas
                    │  dev  : CA interne  │   :8443
                    │  prod : Let's Encr. │   :443
                    └─────┬────────┬─────┘
                          │        │
              /  /_next   │        │  /api  /ws  /admin  /static  /media
                    ┌─────▼────┐  ┌▼──────────────────────────┐
                    │ Next.js  │  │        Daphne (ASGI)      │
                    │  :3000   │─▶│  Django HTTP + Channels   │
                    │          │  │          :8000            │
                    └──────────┘  └────┬─────────────────┬────┘
                   routes serveur      │                 │
                   (proxy cookies)     │                 │
                                  ┌────▼─────┐     ┌─────▼─────┐
                                  │PostgreSQL│     │   Redis   │
                                  └────▲─────┘     └─────▲─────┘
                                       │                 │
                                  ┌────┴─────────────────┴────┐
                                  │  Celery worker + beat     │
                                  └────────────┬──────────────┘
                                               │ scraping HTTP
                                        ┌──────▼──────┐
                                        │  foot-live  │
                                        └─────────────┘
```

**En développement**, Caddy tourne aussi (service `caddy_dev` de l'override) avec un certificat local genere par sa CA interne (`tls internal`, cf. `caddy/Caddyfile.dev`). Le navigateur n'a qu'une entrée : `https://localhost:8443`. Les ports 3000 et 8000 ne sont pas publiés sur l'hôte, donc aucun accès en clair n'est possible.

Les ports 8443 et 8080 remplacent 443 et 80 parce que Docker en mode rootless, fréquent sur les postes 42, ne peut pas se lier aux ports privilégiés.

**Un seul process backend** sert le HTTP et les WebSockets — il n'y a pas de service Channels distinct, contrairement à ce que suggérait l'ancienne version de ce document.

### Flux critiques

**Placer un pari** — le front POST `/api/bets/` → transaction : verrou sur l'utilisateur, vérification du solde, débit, création du `Bet` et de ses `BetSelection` avec **snapshot des cotes**.

**Régler un pari** — `scrape_live` (toutes les 30 s) détecte les matchs passés `finished`, règle les jambes, résout les tickets, crédite les gagnants et pousse une notification WebSocket.

**Cotes live** — le même cycle de 30 s recalcule les cotes des matchs du jour à partir de la forme des équipes puis du score en cours.

---

## 3. Découpage en apps

```
api/
├── core/            settings, urls, asgi, configuration Celery
├── users/           User custom, auth 2 étapes, solde, bonus, roue, admin
├── sports/          Sport/Competition/Team/Match/Odds, scraping, cotes, règlement
├── betting/         Bet/BetSelection, tendances, classements
├── league/          League, LeagueInvitation
├── friends/         Friendship, feed
├── chat/            Message (ligue), Conversation/DirectMessage + consumers
├── challenges/      Challenge, Badge, ChallengeClaim, UserBadge
└── notifications/   Notification + consumer
```

Le domaine sportif (`sports/`) isole sa logique dans `services/` : `odds.py`, `settle.py`, `details.py`, et le scraper dans `scraper/footlive.py`.

---

## 4. Schéma de données

Voir la [section Database Schema du README](README.md#database-schema) pour le diagramme et le tableau des champs.

### Contraintes et décisions notables

- `User.wallet` : `DecimalField(max_digits=14, decimal_places=2)`, défaut **100.00**, borné à `MAX_WALLET = 1 000 000 000` et jamais négatif.
- `User.status` : `owner` / `admin` / `user`. Il n'y a **pas** de rôle `moderator` ni `guest`.
- `Odds` : unique par `(match, market, selection)`. Un seul marché existe aujourd'hui, `1N2`.
- `BetSelection.odd_value` : **copie** de la cote au moment du pari. Les cotes bougent toutes les 30 s ; sans ce snapshot, on réglerait à une valeur que l'utilisateur n'a jamais acceptée.
- `Match.external_id` unique et `footlive_id` : réconciliation entre deux passages du scraper.
- `ChallengeClaim.period` : date ISO pour un défi quotidien, littéral `"season"` sinon. C'est ce champ qui empêche de réclamer deux fois le même jour.
- `Team` : contrainte d'unicité `(competition, name)` ajoutée en migration `0005` après une vague de doublons.

---

## 5. Endpoints REST

Pas de préfixe de version. Authentification par **cookie JWT httpOnly**, pas d'en-tête `Authorization` côté navigateur.

### Authentification

| Méthode | Chemin | Description |
|---|---|---|
| POST | `/api/auth/registration/` | Inscription (dj-rest-auth) |
| POST | `/api/auth/login/` | Étape 1 : email + mot de passe → envoie le code |
| POST | `/api/auth/login/verify/` | Étape 2 : code à 6 chiffres → pose les cookies |
| POST | `/api/auth/logout/` | Déconnexion |
| POST | `/api/auth/token/refresh/` | Rafraîchit l'access token |
| POST | `/api/auth/social/google/` | Connexion Google |

### Profil et économie

| Méthode | Chemin | Description |
|---|---|---|
| GET / PATCH | `/api/profile/` | Profil ; PATCH accepte l'avatar en multipart ou les champs texte en JSON |
| POST | `/api/daily-bonus/` | Réclame le bonus quotidien (500 Kops, 1×/jour) |
| GET | `/api/wheel/` | Cases de la roue + disponibilité du jour |
| POST | `/api/wheel/spin/` | Tourne la roue (1×/jour) |
| POST | `/api/onboarding/complete/` | Marque l'onboarding terminé |

### Sport et paris

| Méthode | Chemin | Description |
|---|---|---|
| GET | `/api/matches/` | Liste des matchs |
| GET | `/api/matches/upcoming/` | À venir (J+7) |
| GET | `/api/matches/live/` | En direct |
| GET | `/api/matches/<id>/` | Fiche détaillée (compos, événements, arbitre) |
| GET | `/api/matches/<id>/odds/` | Cotes du match |
| GET/POST | `/api/bets/` | Mes paris / placer un pari |
| GET | `/api/betting/trending/` | Tendances Kop |
| GET | `/api/leaderboard/` | `?period=week\|month\|season\|all&scope=world\|friends` |

### Social

| Méthode | Chemin | Description |
|---|---|---|
| GET | `/api/friends/` | Mes amis |
| GET | `/api/friends/search/` | Recherche d'utilisateurs |
| GET | `/api/friends/feed/` | Activité des amis |
| POST | `/api/friends/request/` | Envoyer une demande |
| POST | `/api/friends/request/<id>/accept/` | Accepter |
| POST | `/api/league/create/` | Créer une ligue |
| GET | `/api/league/list/` · `/api/league/all-league/` | Mes ligues / toutes |
| GET | `/api/league/<id>/` · `/members/` · `/leaderboard/` | Détail, membres, classement |
| PATCH · DELETE | `/api/league/<id>/` | Renommer / supprimer une ligue (créateur uniquement) |
| POST | `/api/league/<id>/leave/` · `/kick/<user_id>/` | Quitter, exclure |
| POST | `/api/league/invite/` · `/invitations/<id>/accept\|decline/` | Invitations |
| GET | `/api/chat/conversations/` · `/conversations/<id>/messages/` | Messagerie privée |
| GET | `/api/chat/leagues/<id>/messages/` | Historique d'une ligue |
| GET | `/api/notifications/` · POST `/read-all/` · `/<id>/read/` | Notifications |

### Défis et administration

| Méthode | Chemin | Description |
|---|---|---|
| GET | `/api/challenges/` | Défis du jour et de saison + progression |
| POST | `/api/challenges/<code>/claim/` | Réclamer une récompense |
| GET | `/api/badges/` | Badges débloqués |
| GET | `/api/admin/stats/` | Statistiques globales |
| GET | `/api/admin/users/` · `/users/<pk>/` | Recherche, fiche utilisateur |
| PATCH | `/api/admin/users/<pk>/` | Éditer pseudo, email, bio, rôle |
| DELETE | `/api/admin/users/<pk>/` | Supprimer un compte (garde-fous de hiérarchie) |
| PATCH | `/api/admin/users/<pk>/wallet/` | Éditer un solde |
| DELETE | `/api/admin/users/<pk>/friends/<friend_pk>/` | Retirer une amitié |

---

## 6. WebSockets

Trois consumers, montés dans `core/asgi.py` derrière `CookieJWTAuthMiddleware`.

| Route | Consumer | Usage |
|---|---|---|
| `ws/chat/<league_id>/` | `ChatConsumer` | Salon d'une ligue |
| `ws/dm/<conversation_id>/` | `DMConsumer` | Conversation privée |
| `ws/notifications/` | `NotificationConsumer` | Notifications de l'utilisateur |

Pas de multiplexage ni de système d'abonnement : **une connexion par salon**, l'URL porte la cible. Plus simple à raisonner, et suffisant à cette échelle.

L'authentification se fait par **cookie**, pas par `?token=` en query string — un token dans l'URL fuiterait dans les logs d'accès.

---

## 7. Authentification

### Inscription

`POST /api/auth/registration/` via dj-rest-auth, avec `users.serializers.RegisterSerializer`. Le solde initial vient du **seul défaut du modèle** : `wallet` n'est volontairement pas un champ du serializer, sinon le client choisirait son propre solde de départ.

### Connexion en deux étapes

1. `POST /api/auth/login/` — `authenticate(email, password)`. Si valide, un code à 6 chiffres est tiré avec `secrets.choice`, stocké dans le cache Django sous `otp_<user_id>` avec un TTL de 300 s, puis envoyé par Brevo.
2. `POST /api/auth/login/verify/` — code comparé, puis génération du couple de tokens et pose des cookies.

Le second facteur est **obligatoire à chaque connexion**, pas optionnel.

#### Où vit le code, et ce que ça implique

Aucun `CACHES` n'est configuré : le cache est donc le `LocMemCache` par défaut
de Django, **propre au process**. C'est cohérent avec le déploiement actuel —
`daphne -b 0.0.0.0 -p 8000` est mono-process, donc le code posé à l'étape 1 est
toujours relu par le même process à l'étape 2.

Deux conséquences assumées :

- un redémarrage du conteneur entre les deux étapes invalide les codes en vol
  (l'utilisateur redemande un code, TTL de 5 min) ;
- passer Daphne en multi-process **casserait la 2FA** (code posé par un worker,
  relu par un autre). Le jour où ça arrive, la bascule tient en un bloc
  `CACHES` pointant sur le Redis déjà présent — aucun code applicatif à
  toucher, les appels `cache.set/get/delete` sont identiques.

C'est aussi la raison pour laquelle les tests E2E ne peuvent pas relire le code
depuis un `manage.py shell` : ce process a son propre cache, vide (cf. § Tests E2E).

### Tokens

| Réglage | Valeur |
|---|---|
| `ACCESS_TOKEN_LIFETIME` | 5 minutes |
| `REFRESH_TOKEN_LIFETIME` | 7 jours |
| Cookies | `access_token`, `refresh_token`, `httponly=True`, `SameSite=Lax` |
| `Secure` | `not DEBUG` — donc actif en prod seulement |

Le front ne lit jamais ces cookies : `frontend/app/api/refresh-token/route.ts` fait le relais côté serveur Next.

---

## 8. Moteur de cotes

`api/sports/services/odds.py`. Aucun fournisseur externe : les cotes sont **calculées**.

### Paramètres

```python
FORM_WINDOW = 10            # derniers matchs analysés par équipe
HOME_ADVANTAGE = 0.15       # bonus de force à domicile
MARGIN = 0.07               # overround bookmaker (~7 %)
MIN_PROB = 0.05             # plancher par issue
LIVE_GOAL_SENSITIVITY = 0.55
LIVE_DRAW_BOOST = 0.25
```

### Étapes

1. **Force d'équipe** — moyenne de points par match (3 / 1 / 0) sur les `FORM_WINDOW` derniers matchs terminés *avant* la date du match considéré. Une équipe inconnue vaut 1.0, force neutre.
2. **Probabilités 1N2** — la force domicile reçoit `HOME_ADVANTAGE`, puis répartition proportionnelle. La probabilité de nul part de 0.30 et diminue à mesure que l'écart de force grandit, avec un plancher à 0.18. Plancher `MIN_PROB` sur chaque issue, puis renormalisation.
3. **Ajustement live** — pour un match en cours :
   - un facteur temps passe de 0.4 en début de match à 1.0 à la 90ᵉ : un but à la 5ᵉ pèse moins qu'un but à la 85ᵉ ;
   - à égalité, le nul est progressivement renforcé (`LIVE_DRAW_BOOST × avancement`) ;
   - sinon, l'équipe qui mène absorbe une fraction `1 − exp(−0.55 × |écart| × temps)` des probabilités du nul et de l'adversaire.
4. **Conversion en cotes** — `cote = 1 / (proba × (1 + MARGIN))`.

Recalculé pour tous les matchs du jour à chaque cycle de 30 s.

---

## 9. Règlement des paris

`api/sports/services/settle.py`, déclenché depuis `scrape_live`.

`settle_match` tourne sous `@transaction.atomic` et verrouille les jambes concernées avec `select_for_update()` — deux tâches Celery en parallèle ne peuvent pas régler deux fois le même pari.

Résolution d'un ticket :

| Situation des jambes | Résultat |
|---|---|
| Au moins une perdante | Ticket **perdu** (la mise était déjà retenue) |
| Toutes décidées, au moins une gagnante | Ticket **gagné** : mise × produit des cotes gagnantes, les jambes annulées comptant pour 1 |
| Toutes annulées | **Remboursement** de la mise |
| Une jambe encore en attente | Ticket **inchangé** |

Le crédit passe par `Least(F("wallet") + gain, MAX_WALLET)` : le plafond est appliqué en base, sans lire-modifier-écrire côté Python. Une notification part ensuite vers le WebSocket de l'utilisateur.

---

## 10. Scraping

`api/sports/scraper/footlive.py` et `services/details.py`.

| Tâche | Déclenchement | Périmètre |
|---|---|---|
| `sports.scrape_live` | toutes les **30 s** (Beat) | Matchs du jour, recalcul des cotes, **règlement**, enrichissement des fiches |
| `sports.scrape_upcoming` | **minuit** (Beat) | J+7 |
| `sports.scrape_history` | manuelle / premier démarrage | J-180 à J-1 |
| `sports.scrape_details` | appelée par `scrape_live` | Compos, arbitre, stade, événements |
| `sports.settle_bets` | manuelle | Règlement seul, utile en débogage |

`scrape_live` fait donc cinq choses par cycle : scraper, calculer les cotes, régler, enrichir, et renvoyer un rapport. Concentration assumée pour garantir l'ordre des opérations, mais c'est le point à découper en premier si le cycle devient trop long.

Au premier démarrage, `seed_if_empty` enchaîne `scrape_history` puis `scrape_upcoming` — la seconde attend la fin de la première, sinon les cotes seraient calculées sans historique de forme.

---

## 11. Classements et tendances

**Calculés en SQL**, par agrégation Django sur les paris réglés — il n'y a pas de ZSET Redis, contrairement à ce que prévoyait la spec initiale. Un index et une agrégation suffisent à cette volumétrie, et cela évite d'avoir à reconstruire un état Redis après un incident.

- **Périodes** : `week`, `month`, `season`, `all`
- **Portées** : `world`, `friends` (jointure sur les `Friendship` acceptées)

**Tendances Kop** (`TrendingBetsView`) : paris les plus pris sur une fenêtre glissante qui s'élargit — 1 h, puis 24 h, puis tout l'historique — tant que `TRENDING_TARGET = 3` paris distincts ne sont pas atteints. Objectif : ne jamais afficher une liste vide quand le volume est faible.

### Statut en ligne

La présence est **déduite**, pas stockée. `User.last_seen` est horodaté à chaque
requête authentifiée (dans `CookieJWTAuthentication.authenticate`) et à chaque
ouverture de WebSocket (dans le middleware Channels) ; `User.is_online` renvoie
vrai si cette date a moins de `ONLINE_WINDOW` (5 min).

Deux raisons de ne pas maintenir un booléen `is_online` en base :

- **aucun événement ne signale la fermeture d'un onglet.** Un crash, une perte
  de réseau ou un `kill -9` laisseraient l'utilisateur bloqué « en ligne »
  indéfiniment ;
- **rien à réparer au redémarrage.** Un booléen persisté devrait être remis à
  zéro pour tout le monde au démarrage du serveur.

L'écriture est throttlée à une par minute (`LAST_SEEN_REFRESH`) et passe par
`queryset.update()` : sans cela, chaque requête authentifiée déclencherait un
UPDATE pour une information dont la précision utile est la minute.

---

## 12. Sécurité — état réel

### En place

- **Mots de passe** : hachage Django par défaut (PBKDF2-SHA256), salé
- **JWT en cookies httpOnly** : inaccessibles au JavaScript, `SameSite=Lax`, `Secure` en production
- **Second facteur obligatoire** à chaque connexion, code à usage unique expirant en 5 minutes
- **CORS** : liste blanche stricte définie dans `settings.py` selon `DEBUG`
- **CSRF** : origines de confiance limitées aux domaines kop.life en production
- **Transactions sur le solde** : `transaction.atomic()` + `select_for_update()`, plafond et plancher appliqués en base
- **Snapshot des cotes** à la prise du pari : impossible de rejouer un pari à une cote plus favorable
- **Upload d'avatar** : type MIME vérifié côté serveur, 5 Mo maximum
- **Solde non modifiable par le client** à l'inscription
- **Authentification WebSocket** par cookie, connexion refusée sans utilisateur valide
- **TLS partout** : Let's Encrypt en production, certificat auto-signé en développement, aucun port applicatif exposé en clair

### Absent

À connaître avant la soutenance, ces points étaient annoncés dans l'ancienne spec :

- Pas d'**Argon2** (le hasher Django par défaut reste correct, mais ce n'est pas ce qui était écrit)
- Pas de **rate limiting** — ni au niveau du reverse proxy, ni via django-ratelimit. L'étape 1 du login est donc brute-forçable.
- Pas d'**audit log**
- Pas de **CSP** ni d'en-têtes de sécurité durcis
- Pas de **PKCE** explicite sur l'OAuth (délégué à allauth)
- Pas de validation de schéma côté front (pas de zod) : la validation repose sur les serializers DRF

---

## 13. Conventions

- **Python** : docstrings sur les modules métier, commentaires en français expliquant le *pourquoi*
- **TypeScript** : mode strict, exports nommés sauf pour les pages Next, types partagés dans `utils/types.ts`
- **Commits** : conventional commits (`feat:`, `fix:`, `responsive:`), messages en français
- **Branche** : `main` unique
- **Textes d'interface** : tutoiement, registre familier assumé, terminologie unifiée (« pari » pour l'objet métier, « ticket » réservé au panier)

### Outils de vérification

```bash
docker compose exec backend python3 -m pytest          # 260 tests, tous verts
docker compose exec frontend npx tsc --noEmit          # typage strict
docker compose exec frontend npm run lint
./e2e/run.sh                                           # 28 tests E2E Selenium
```

Il n'y a **pas de CI** : ces commandes sont à lancer à la main avant de pousser.

### Tests E2E

`e2e/` pilote un vrai Chrome contre la stack dev en cours d'exécution : neuf
fichiers qui rejouent **un seul parcours continu** (inscription → connexion →
paris → ligue → roue → chat → réglages → déconnexion) dans une même session de
navigateur, avec une capture d'écran à chaque étape dans `e2e/screenshots/`.

- `e2e/helpers.py` : URL de la stack, attentes et interactions (le bruit Selenium) ;
- `e2e/conftest.py` : fixtures — navigateur (conteneur `selenium` ou Chrome local), compte jetable, session (`logged_in`, qui rend chaque fichier rejouable seul), capture automatique en cas d'échec ;
- `./e2e/run.sh --headed --demo` : fenêtre visible + curseur animé, pour montrer le parcours.

Deux points méritent d'être connus :

- **La 2FA n'est couverte que jusqu'à l'écran de saisie du code.** Le code part
  par email et vit dans le cache Django, qui est un `LocMemCache` propre au
  process : un `manage.py shell` lancé à côté n'y a pas accès. Les tests
  ouvrent donc la session en posant directement les cookies JWT
  (`sign_in`), comme le ferait la vérification du code.
- **Attendre `readyState === "complete"` ne suffit pas** : à ce moment le SPA
  n'affiche encore que des squelettes. `visit()` attend en plus la disparition
  des `.animate-pulse`, sans quoi on testerait des pages vides.
