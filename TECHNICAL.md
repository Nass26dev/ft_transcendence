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
| Cache / broker / channel layer | Redis | 7 | Broker Celery, couche Channels, codes OTP (TTL 5 min) |
| Reverse proxy | nginx (image `jonasal/nginx-certbot`) | — | TLS Let's Encrypt, **profil `prod` uniquement** |

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
                    │  nginx  (prod)     │   TLS, Let's Encrypt
                    │  profil "prod"     │   absent en dev
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

**En développement**, nginx n'existe pas : le navigateur tape directement `localhost:3000` (front) et `localhost:8000` (API), en HTTP.

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

> `/api/register/` existe aussi (`users/urls.py`) mais **renvoie 500** : la vue générique appelle `serializer.save()` sans l'argument `request` qu'attend `RegisterSerializer.save()`. Route morte à supprimer ou à réparer ; c'est la cause de l'unique test backend en échec.

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

1. `POST /api/auth/login/` — `authenticate(email, password)`. Si valide, un code à 6 chiffres est tiré avec `secrets.choice`, stocké dans le cache Redis sous `otp_<user_id>` avec un TTL de 300 s, puis envoyé par Brevo.
2. `POST /api/auth/login/verify/` — code comparé, puis génération du couple de tokens et pose des cookies.

Le second facteur est **obligatoire à chaque connexion**, pas optionnel.

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
- **TLS** en production, certificats Let's Encrypt renouvelés automatiquement

### Absent

À connaître avant la soutenance, ces points étaient annoncés dans l'ancienne spec :

- Pas d'**Argon2** (le hasher Django par défaut reste correct, mais ce n'est pas ce qui était écrit)
- Pas de **rate limiting** — ni au niveau nginx, ni via django-ratelimit. L'étape 1 du login est donc brute-forçable.
- Pas d'**audit log**
- Pas de **CSP** ni d'en-têtes de sécurité durcis
- Pas de **PKCE** explicite sur l'OAuth (délégué à allauth)
- **HTTPS absent en développement**, alors que le sujet l'exige pour toute connexion navigateur → backend
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
docker compose exec backend python3 -m pytest          # 11 tests
docker compose exec frontend npx tsc --noEmit          # typage strict
docker compose exec frontend npm run lint
```

Il n'y a **pas de CI** : ces commandes sont à lancer à la main avant de pousser.
