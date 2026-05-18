# Kop — Technical Specification

Document interne. Architecture, schéma DB, endpoints, répartition équipe.

---

## 1. Stack

| Couche | Techno | Version | Justification |
|---|---|---|---|
| Frontend | Next.js | 16 (App Router, RSC) | Framework requis ft_t, SSR/CSR mix, écosystème mature |
| UI | Tailwind + Radix primitives | 4.x | Design system custom rapide, accessibilité |
| Backend | Django + DRF | 5.x | Framework requis, ORM solide, écosystème auth |
| Realtime | Django Channels + Redis | 4.x | WS natif Django, scale horizontal possible |
| DB | PostgreSQL | 16 | Transactions ACID critiques pour le wallet |
| Cache / queue / pub-sub | Redis | 7 | Sessions WS, ZSET classements, broker Celery |
| Worker | Celery + Celery Beat | 5.x | Settle async, fetch API sport périodique, refill hebdo |
| Reverse proxy | nginx | stable | TLS, rate limiting L7, static |
| Conteneurisation | Docker Compose | v2 | Single command requis ft_t |
| API sportive | API-Football ou TheSportsDB | — | Free tier suffisant en dev, cache Redis 1h |

### Pourquoi PostgreSQL plutôt que SQLite

Wallet + paris = transactions concurrentes massives à kickoff. `SELECT FOR UPDATE`, isolation serializable, et performance sous charge sont non négociables. SQLite ne tient pas.

### Pourquoi Channels et pas Socket.io séparé

Auth unifiée avec Django (JWT validé côté consumer), pas de service séparé à maintenir, Redis déjà présent comme backend.

---

## 2. Architecture

```
                    ┌────────────────────┐
                    │   nginx (TLS)      │
                    │   rate limit L7    │
                    └────────┬───────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         ┌────▼────┐    ┌────▼─────┐   ┌───▼────┐
         │ Next.js │    │ Django   │   │Channels│
         │  (SSR)  │    │  (DRF)   │   │  (WS)  │
         └────┬────┘    └────┬─────┘   └───┬────┘
              │              │             │
              └──────────────┼─────────────┘
                             │
                  ┌──────────┼──────────┐
                  │          │          │
             ┌────▼───┐ ┌────▼───┐ ┌────▼────┐
             │Postgres│ │ Redis  │ │ Celery  │
             │        │ │        │ │ Workers │
             └────────┘ └────────┘ └────┬────┘
                                        │
                                  ┌─────▼──────┐
                                  │ API-Sport  │
                                  └────────────┘
```

### Flux critiques

**Place bet** : Next → Django REST → DB transaction (lock wallet, débit, create Bet) → publish Redis pubsub → Channels broadcast aux abonnés (jauge confiance se met à jour).

**Settle** : Celery Beat scrute matchs `live → finished` toutes les 60s → fetch API sport → pour chaque pari concerné : transaction (crédit wallet si gain, mark settled) → publish notif via Channels → user voit le résultat live.

**Live odds** : Celery Beat fetch odds toutes les 30s sur matchs live → diff avec Redis → si changement, broadcast WS aux clients sur la room du match.

---

## 3. Schéma DB

### Tables principales

```
users
  id, email (unique), password_hash, username (unique)
  avatar_config (JSONB), wallet_balance (int), created_at
  is_active, is_staff, role (enum: admin/moderator/user/guest)
  totp_secret (nullable), totp_enabled (bool)
  oauth_provider (nullable), oauth_id (nullable)

friendships
  id, from_user_fk, to_user_fk, status (pending/accepted/blocked)
  created_at, accepted_at
  unique(from_user, to_user)

leagues
  id, name, code (unique 8 chars), owner_fk
  description, created_at, max_members, is_public
  
league_memberships
  id, league_fk, user_fk, role (owner/member/moderator)
  joined_at
  unique(league, user)

sports
  id, name, slug

competitions
  id, sport_fk, name, slug, season, country, logo_url

teams
  id, competition_fk, name, short_name, logo_url, external_id

matches
  id, competition_fk, home_team_fk, away_team_fk
  kickoff_at, status (scheduled/live/finished/cancelled)
  home_score, away_score, current_minute
  external_id (unique), updated_at

odds
  id, match_fk, market (1N2/over_under/btts), 
  selection (home/draw/away/over/under/yes/no)
  value (decimal), updated_at
  unique(match, market, selection)

bets
  id, user_fk, total_stake (int), potential_gain (int)
  status (pending/won/lost/void), placed_at, settled_at
  is_combined (bool)

bet_selections
  id, bet_fk, match_fk, market, selection
  odds_snapshot (decimal at placement)
  result (nullable: won/lost/void)

notifications
  id, user_fk, type (bet_settled/league_invite/friend_request/...)
  payload (JSONB), read_at (nullable), created_at

chat_messages
  id, room_type (league/dm), room_id (league_id or pair hash)
  sender_fk, content (text), created_at, edited_at
  
daily_challenges
  id, user_fk, challenge_type, progress, target
  completed_at (nullable), reward_kops, date

audit_log
  id, user_fk, action, entity_type, entity_id
  metadata (JSONB), ip, created_at
```

### Decoupage apps Django

apps/
├── users/          → users, friendships
├── leagues/        → leagues, league_memberships
├── sports/         → sports, competitions, teams, matches, odds
├── betting/        → bets, bet_selections
├── social/         → notifications, chat_messages
├── gamification/   → daily_challenges
└── core/           → audit_log

### Index critiques

- `bets (user_fk, status)` — historique paris user
- `bets (status, placed_at)` — settle batch
- `bet_selections (match_fk, result)` — settle par match
- `matches (status, kickoff_at)` — lobby
- `chat_messages (room_type, room_id, created_at DESC)` — historique chat
- `notifications (user_fk, read_at, created_at DESC)` — feed notifs

### Classements (Redis, pas DB)

- `ZSET leaderboard:global` → score = wallet_balance
- `ZSET leaderboard:weekly:YYYY-WW` → reset Celery beat lundi 00:00
- `ZSET leaderboard:league:{id}` → membres de la ligue
- `ZSET leaderboard:friends:{user_id}` → user + amis

Mise à jour : à chaque settle, `ZADD` sur les ZSET pertinents en pipeline.

---

## 4. API REST

Préfixe : `/api/v1/`. Auth : JWT Bearer dans header `Authorization`. WS : query param `?token=`.

### Auth (`/auth`)

| Method | Path | Description |
|---|---|---|
| POST | `/auth/signup` | Inscription email/password |
| POST | `/auth/login` | Login email/password, retourne JWT |
| POST | `/auth/logout` | Invalide refresh token |
| POST | `/auth/refresh` | Refresh JWT |
| GET | `/auth/oauth/google` | Redirect OAuth Google |
| GET | `/auth/oauth/google/callback` | Callback Google |
| GET | `/auth/oauth/42` | Redirect OAuth 42 |
| GET | `/auth/oauth/42/callback` | Callback 42 |
| POST | `/auth/2fa/enable` | Active 2FA, retourne QR code |
| POST | `/auth/2fa/verify` | Vérifie code TOTP |
| POST | `/auth/2fa/disable` | Désactive 2FA |
| POST | `/auth/password/reset` | Demande reset par email |

### Users (`/users`)

| Method | Path | Description |
|---|---|---|
| GET | `/users/me` | Mon profil complet |
| PATCH | `/users/me` | Update profil (avatar, username) |
| GET | `/users/me/wallet` | Balance + historique transactions |
| GET | `/users/me/stats` | Stats personnelles (ROI, win rate, séries) |
| GET | `/users/me/bets` | Historique paris paginé |
| GET | `/users/{id}` | Profil public d'un user |
| GET | `/users/search?q=` | Recherche par username |
| DELETE | `/users/me` | Suppression compte (RGPD) |
| GET | `/users/me/export` | Export données (RGPD) |

### Friends (`/friends`)

| Method | Path | Description |
|---|---|---|
| GET | `/friends` | Liste de mes amis + online status |
| POST | `/friends/requests` | Envoyer demande |
| GET | `/friends/requests` | Demandes reçues |
| POST | `/friends/requests/{id}/accept` | Accepter |
| POST | `/friends/requests/{id}/reject` | Refuser |
| DELETE | `/friends/{user_id}` | Supprimer ami |
| POST | `/friends/{user_id}/block` | Bloquer |

### Leagues (`/leagues`)

| Method | Path | Description |
|---|---|---|
| GET | `/leagues` | Mes ligues |
| POST | `/leagues` | Créer une ligue |
| GET | `/leagues/{id}` | Détail ligue |
| PATCH | `/leagues/{id}` | Update (owner only) |
| DELETE | `/leagues/{id}` | Supprimer (owner only) |
| POST | `/leagues/join` | Rejoindre par code |
| POST | `/leagues/{id}/leave` | Quitter |
| GET | `/leagues/{id}/members` | Liste membres |
| DELETE | `/leagues/{id}/members/{user_id}` | Kick (owner) |
| GET | `/leagues/{id}/leaderboard` | Classement de la ligue |

### Matches (`/matches`)

| Method | Path | Description |
|---|---|---|
| GET | `/matches?status=&competition=&date=` | Liste filtrable |
| GET | `/matches/upcoming` | Matchs à venir (J+7) |
| GET | `/matches/live` | Matchs en cours |
| GET | `/matches/{id}` | Détail + odds + jauge confiance |
| GET | `/matches/{id}/odds` | Toutes les odds actuelles |
| GET | `/matches/{id}/community` | Jauge confiance (% par issue) |

### Bets (`/bets`)

| Method | Path | Description |
|---|---|---|
| POST | `/bets` | Placer un pari (simple ou combiné) |
| GET | `/bets` | Mes paris (filtres status) |
| GET | `/bets/{id}` | Détail pari |
| DELETE | `/bets/{id}` | Annuler (si match pas commencé) |

**Body POST `/bets`** :
```json
{
  "stake": 100,
  "selections": [
    { "match_id": 42, "market": "1N2", "selection": "home" },
    { "match_id": 51, "market": "btts", "selection": "yes" }
  ]
}
```

### Leaderboards (`/leaderboards`)

| Method | Path | Description |
|---|---|---|
| GET | `/leaderboards/global?limit=100&offset=0` | Top global |
| GET | `/leaderboards/weekly` | Classement semaine en cours |
| GET | `/leaderboards/friends` | Entre amis |
| GET | `/leaderboards/me` | Ma position dans chaque classement |

### Notifications (`/notifications`)

| Method | Path | Description |
|---|---|---|
| GET | `/notifications` | Mes notifs paginées |
| POST | `/notifications/{id}/read` | Marquer lue |
| POST | `/notifications/read-all` | Tout marquer lu |

### Challenges (`/challenges`)

| Method | Path | Description |
|---|---|---|
| GET | `/challenges/today` | Défis du jour + progression |
| POST | `/challenges/{id}/claim` | Réclamer la récompense |

### Public API (`/public`) — module Major

API publique avec API key dans header `X-API-Key`, rate limit 100 req/h par key, doc OpenAPI à `/public/docs`.

| Method | Path | Description |
|---|---|---|
| GET | `/public/matches` | Liste matchs publics |
| GET | `/public/leaderboards/global` | Top public |
| POST | `/public/predictions` | Soumettre une prédiction (pour bots tiers) |
| PUT | `/public/predictions/{id}` | Update prédiction |
| DELETE | `/public/predictions/{id}` | Supprimer |

### Admin (`/admin/*`) — permissions Major

CRUD users, modération chat, suspension, recalcul classements. Accès `role=admin` ou `moderator` selon endpoint.

---

## 5. WebSockets

Endpoint : `wss://kop.local/ws/?token=<jwt>`. Multiplexing par "rooms".

### Subscriptions

| Channel | Trigger | Payload |
|---|---|---|
| `user:{id}:notifications` | À la connexion | `{type, payload}` à chaque notif |
| `user:{id}:wallet` | À la connexion | `{balance, delta}` à chaque change |
| `match:{id}:odds` | Sur abonnement | Odds mises à jour |
| `match:{id}:score` | Sur abonnement | Score live |
| `match:{id}:community` | Sur abonnement | % jauge confiance |
| `league:{id}:chat` | Sur abonnement | Messages chat ligue |
| `league:{id}:leaderboard` | Sur abonnement | Classement live |
| `dm:{user1}:{user2}` | Sur abonnement | Messages DM |

### Messages client → serveur

```json
{ "action": "subscribe", "channel": "match:42:odds" }
{ "action": "unsubscribe", "channel": "match:42:odds" }
{ "action": "send_message", "channel": "league:7:chat", "content": "tg" }
{ "action": "typing", "channel": "league:7:chat" }
```

---

## 6. Sécurité

- **Passwords** : Argon2id (django default Argon2PasswordHasher)
- **JWT** : access 15min, refresh 7j httpOnly secure SameSite=Lax
- **CSRF** : token sur tous les endpoints state-changing côté API session, désactivé sur API JWT pure
- **CORS** : whitelist stricte (front domain only)
- **Rate limiting** : nginx L7 (global) + django-ratelimit (par endpoint sensible)
- **2FA** : TOTP RFC 6238, 30s window, 1 step tolerance
- **OAuth** : state param, PKCE pour Google
- **Wallet** : transactions DB serializable, `SELECT FOR UPDATE`, jamais de calcul côté client
- **WS auth** : JWT en query param vérifié dans `connect()`, kick si invalide
- **HTTPS** : obligatoire, HSTS, certs Let's Encrypt en prod
- **Headers** : CSP strict, X-Frame-Options DENY, X-Content-Type-Options nosniff
- **Audit log** : toutes les actions sensibles (login, bet, transfer, admin) loguées
- **Validation** : front (zod) + back (DRF serializers + Django validators)

---

## 7. Settle engine (le morceau délicat)

Tâche Celery Beat toutes les 60s :

```python
@shared_task
def settle_finished_matches():
    matches = Match.objects.filter(
        status='live'
    ).filter(...)  # détection finished via API
    
    for match in matches:
        with transaction.atomic():
            match.status = 'finished'
            match.save()
            
            selections = BetSelection.objects.filter(
                match=match, result__isnull=True
            ).select_related('bet').select_for_update()
            
            for sel in selections:
                sel.result = compute_result(match, sel)
                sel.save()
            
            # check si tous les paris liés peuvent être settled
            bet_ids = {s.bet_id for s in selections}
            for bet_id in bet_ids:
                settle_bet_if_complete(bet_id)
```

`settle_bet_if_complete` :
- si une sélection `lost` → bet `lost`, pas de crédit
- si toutes `won` → bet `won`, crédit `total_stake * combined_odds`
- crédit wallet via `User.objects.select_for_update()` puis `update`
- publish notif WS user
- update Redis ZSET classements

Tests unitaires obligatoires : combinés mixtes, void (match annulé), reconciliation.

---

## 8. Répartition équipe

### Profils

- **B1 — Tech Lead / Backend** : archi, auth, perms, API publique
- **B2 — Backend / DevOps** : Docker, CI, Celery, intégration sport, settle engine
- **F1 — Frontend / PO** : design system, pages produit, ticket pari
- **F2 — Frontend / PM** : WebSockets client, chat, notifs, i18n, planning

### Ownership détaillé

#### B1 (Tech Lead)
- Modèle User custom + migrations
- Auth : email/password, JWT, refresh, OAuth Google + 42, 2FA TOTP
- Permissions Django (admin/moderator/user/guest) — module Major
- Endpoints `/auth/*`, `/users/*`, `/admin/*`
- API publique versionnée `/public/*` + OpenAPI + rate limit + API keys
- Code review backend (gardien archi)
- Tests auth et perms

#### B2 (Backend / DevOps)
- `docker-compose.yml`, Dockerfiles multi-stage, Makefile
- nginx config + TLS (certbot ou cert dev)
- CI GitHub Actions (lint + tests + build par PR)
- Intégration API sportive : fetcher Celery + cache Redis + mode mock
- Modèles Sport/Competition/Matches/Team/Odds + sync
- **Settle engine** (cœur technique) + tests intensifs
- Wallet transactions atomiques
- Endpoints `/matches/*`, `/bets/*`, `/leaderboards/*`
- Redis ZSET classements (mise à jour, reset hebdo via Beat)
- Backups DB, monitoring basique
- Load test (k6 ou locust) en fin de projet

#### F1 (Frontend / PO)
- Design system custom (10+ composants : Button, Input, Card, Modal, Avatar, Toast, OddsPill, MatchCard, LeagueCard, etc.) — module Minor
- Pages : Lobby, Détail match, Live, Profil
- Composant **Ticket de pari** (state global Zustand, persistance localStorage)
- **Jauge de confiance** (la feature signature)
- Avatar Omaji (SVG layered customisable)
- Animations gain/perte
- Responsive (mobile-first malgré la cible desktop)
- Tests Playwright des flows produit

#### F2 (Frontend / PM)
- Pages : Onboarding, Ligues, Classement global, Settings
- Client WebSocket (hook `useChannel`, gestion reconnexion, multiplex)
- Chat ligue + DM (UI + WS)
- Centre de notifications + toasts temps réel
- i18n FR/EN avec next-intl (backup module si besoin)
- Privacy Policy + Terms (rédigés sérieusement, pas placeholder)
- Suivi planning, jalons, tickets Linear/GitHub Issues
- README final (toutes les sections requises ft_t)

### Points de croisement front/back

Frontière contractualisée par **OpenAPI schema généré par drf-spectacular**, consommé en TypeScript via `openapi-typescript` côté Next. Toute modif API → schéma régénéré → types TS à jour, build front cassé si breaking change. Pas de drift.

Pour les WS : doc dans `/docs/websockets.md`, format des messages versionné.

### Ce qu'on fait à plusieurs (pair-prog ou review obligatoire)

- Settle engine (B1 + B2)
- Auth flow OAuth (B1 + F2 pour le redirect handling)
- Place bet (B2 backend + F1 frontend ticket)
- WS auth (B1 + F2)

---

## 9. CI / quality gates

- **Backend** : `ruff check`, `ruff format --check`, `mypy`, `pytest --cov` (>70% sur logique critique)
- **Frontend** : `eslint`, `tsc --noEmit`, `prettier --check`, `playwright test`
- **Build Docker** sur chaque PR
- **Pas de merge** sur `main` si CI rouge
- **Conventional commits** (feat:, fix:, chore:, etc.) — facilite le changelog

## 10. Environnements

| Env | Domaine | DB | Données |
|---|---|---|---|
| dev local | `localhost` | postgres docker | seed démo |
| staging | `staging.kop.xxx` | postgres dédié | seed + données réelles partielles |
| prod (démo soutenance) | `kop.xxx` | postgres dédié + backups | seed démo curated |

---

## 11. Risques techniques identifiés

| Risque | Mitigation |
|---|---|
| API sport : quotas free tier explosent | Cache Redis 1h agressif + mode mock dès le début (B2) |
| Settle race conditions sur paris combinés | Tests unitaires intensifs, isolation serializable, lock explicite |
| WS qui scale mal en local | Channels + Redis backend OK pour 100 users concurrents en démo, suffisant |
| Auth OAuth42 callback en dev | Domaine de dev whitelisté tôt, ngrok en backup |
| Cohérence types front/back | OpenAPI auto-généré + types TS auto-générés |
| Désync horloge serveur / API sport | Toujours utiliser timestamps API, jamais `datetime.now()` pour le settle |

---

## 12. Conventions code

- **Python** : ruff config standard, type hints obligatoires sur fonctions publiques, docstrings sur les modules métier
- **TypeScript** : strict mode, pas de `any` sauf justifié en commentaire, exports nommés (pas default sauf pages Next)
- **Branches** : `main` (protégée), `dev` (intégration), `feat/...`, `fix/...`
- **PR** : 1 reviewer min, template avec checklist (tests, doc, screenshots si UI)
- **Tests** : nommage `test_<unit>__<scenario>__<expected>`
