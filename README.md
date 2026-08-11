*This project has been created as part of the 42 curriculum by ynzue-es, engiusep, nyousfi, acancel.*

# Kop

> Betting without the stake. You predict, you win Kops, you dominate your friends.

## Description

**Kop** is a web platform for football predictions **with no real money involved**. Users bet **Kops** — a virtual, worthless, non-convertible currency — on real football matches, compete in private leagues, and climb the leaderboards.

The point is not money. It is bragging rights.

Traditional sports-betting apps monetise addiction. Kop keeps the mechanics that make betting fun — reading the odds, the tension of a live match, the thrill of an accumulator — and removes the financial risk entirely. No real money ever enters or leaves the platform.

### Key features

- **Simple and combo bets** on real matches, with odds computed by our own engine from recent team form
- **Live odds** that shift with the score while a match is being played
- **Automatic settlement** of bets as soon as a match finishes
- **Community confidence gauge**: the share of users backing each outcome, per match
- **Private leagues** with invitations, internal leaderboards and a dedicated chat room
- **Real-time chat and notifications** over WebSockets
- **Daily bonus, wheel of fortune, challenges and badges**
- **Two-step authentication**: password, then a 6-digit code sent by email

---

## Table of contents

- [Technical Stack](#technical-stack)
- [Instructions](#instructions)
- [Database Schema](#database-schema)
- [Features List](#features-list)
- [Modules](#modules)
- [Team Information](#team-information)
- [Project Management](#project-management)
- [Individual Contributions](#individual-contributions)
- [Known limitations](#known-limitations)
- [Resources](#resources)

---

## Technical Stack

### Frontend

| Technology | Version | Why |
|---|---|---|
| **Next.js** (App Router) | 16 | Server-side rendering for first paint and SEO, file-based routing, server routes used as a proxy so JWT cookies never transit through client-side JavaScript |
| **React** | 19 | Component model, required by Next.js |
| **TypeScript** | 5 (strict) | Types shared across the whole data layer, catches API contract drift at build time |
| **Tailwind CSS** | 4 | Utility-first styling, no CSS file to maintain in parallel, design tokens centralised in `globals.css` |
| **Framer Motion** | 12 | Page and component transitions, with a "reduced motion" preference honoured app-wide |
| **Axios** | 1.x | HTTP client with interceptors for automatic token refresh |

### Backend

| Technology | Version | Why |
|---|---|---|
| **Django** | 5.2 | Batteries included: ORM, migrations, admin, mature auth ecosystem |
| **Django REST Framework** | 3.x | Serialisers, viewsets, permission classes |
| **Django Channels** + channels-redis | 4.x | WebSockets natively inside Django: one auth system, one deployment, no separate service |
| **Daphne** | 4.x | ASGI server handling HTTP and WebSocket traffic in the same process |
| **Celery** + Celery Beat | 5.x | Scheduled scraping, odds recomputation and bet settlement outside the request cycle |
| **simplejwt** / dj-rest-auth / allauth | — | JWT in httpOnly cookies, Google OAuth 2.0 |

### Data

| Technology | Version | Why |
|---|---|---|
| **PostgreSQL** | 16 | The wallet requires real transactions. Bet placement and settlement run inside `transaction.atomic()` with `select_for_update()` row locks, so two concurrent bets cannot both spend the same balance. SQLite's single-writer model does not hold under the concurrent load expected at kick-off. |
| **Redis** | 7 | Celery broker, Channels layer for WebSocket fan-out, and cache backend storing login codes with a 5-minute TTL |

### Infrastructure

**Docker Compose** for the whole stack (single-command startup), **nginx** with Let's Encrypt for TLS termination in production.

### Justification of the main technical choices

**Why Next.js rather than plain React** — authentication relies on httpOnly cookies, which client-side JavaScript cannot read by design. Next.js server routes (`app/api/*`) let the server exchange those cookies with Django, so no token ever reaches the browser's JavaScript context.

**Why Channels rather than a separate WebSocket service** — a socket must know *who* is connected. With Channels, a middleware validates the same JWT cookie used by the REST API and injects the Django user into the consumer scope. A separate Node service would have meant duplicating authentication and keeping two user models in sync.

**Why scraping rather than a sports API** — free tiers of sports APIs cap requests per day, which is incompatible with a 30-second refresh loop on live matches. Scraping foot-live gives unlimited refresh, full match sheets (line-ups, events, referee, venue) and no API key to distribute across four developers.

**Why computing our own odds** — no free provider exposes odds, and the app must work at any time regardless of a third party's uptime. The engine derives odds from the recent form of both teams, adds a home advantage, applies a bookmaker margin, and adjusts live according to the score and the minute played.

---

## Instructions

### Prerequisites

- **Docker 24+** and **Docker Compose v2**
- Nothing else: Python, Node and PostgreSQL all run inside containers
- **No sports API key needed** — match data comes from scraping, odds are computed locally
- A **Google OAuth client** (Google Cloud Console) and a **Brevo API key** (transactional emails for login codes) are required for the full authentication flow

### Environment setup

Credentials live in a single `.env` file at the root, ignored by Git. [.env.example](.env.example) is the commented reference.

```bash
cp .env.example .env
```

Then fill it in. Variable names must match **exactly** what the code reads — a misnamed variable is silently ignored, or stops the backend from starting.

| Variable | Purpose |
|---|---|
| `DJANGO_SECRET_KEY` | Django secret. **Wrap it in single quotes**: if it contains a `$`, Docker Compose would interpolate it. |
| `DJANGO_DEBUG` | The only dev/prod switch. `True` locally. Absent means `False`, and only the kop.life domains are then accepted. |
| `POSTGRES_DB` / `_USER` / `_PASSWORD` / `_HOST` / `_PORT` | Database, read both by the postgres image and by Django |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Same value as `GOOGLE_CLIENT_ID`, needed in the browser |
| `BREVO_API_KEY` | Sending login codes by email |
| `NEXT_PUBLIC_API_URL` | API URL called from the browser |
| `API_URL` | API URL called from Next.js server routes, container to container |
| `NEXT_PUBLIC_API_URL_PROD` / `CERTBOT_EMAIL` | Production only |

`DJANGO_DEBUG` alone drives `DEBUG`, `ALLOWED_HOSTS` and the CORS/CSRF origins. Those lists are written in [api/core/settings.py](api/core/settings.py) and never injected from the environment.

### Running the project

```bash
git clone git@github.com:Nass26dev/ft_transcendence.git
cd ft_transcendence
cp .env.example .env      # then fill it in
docker compose up --build
```

| Entry point | URL |
|---|---|
| Application | **https://localhost:8443** |
| API | https://localhost:8443/api/ |
| Django admin | https://localhost:8443/admin/ |

Everything goes through **HTTPS**, including in development: an nginx reverse proxy terminates TLS with a self-signed certificate generated when its image is built. Your browser will warn about an unrecognised certificate on first visit — accept it once. Ports 3000 and 8000 are deliberately **not** published on the host, so there is no plaintext way into the application.

Ports 8443 and 8080 are used instead of 443 and 80 because rootless Docker, common on 42 workstations, cannot bind privileged ports.

On first launch the database is empty: the `seed_if_empty` command automatically triggers a scrape of the last 180 days, then of the next 7 days. Allow a few minutes before matches and odds appear — the Celery worker logs its progress.

`docker compose up` automatically layers **docker-compose.override.yml** on top, switching the project to development mode: code mounted as volumes, hot reload, `runserver` and `next dev`, exposed ports. `docker-compose.yml` alone describes production.

### Useful commands

There is no Makefile; everything goes through Docker Compose.

```bash
docker compose up --build           # start the stack (dev)
docker compose down                 # stop
docker compose down -v              # stop and drop the database
docker compose logs -f backend      # follow one service's logs

docker compose exec backend python3 manage.py migrate
docker compose exec backend python3 manage.py createsuperuser
docker compose exec backend python3 -m pytest              # backend tests
docker compose exec frontend npx tsc --noEmit              # type checking
docker compose exec frontend npm run lint
```

### Production

```bash
docker compose -f docker-compose.yml --profile prod up -d --build
```

The `-f docker-compose.yml` flag is required, otherwise the development layer is applied. The `prod` profile starts nginx, which obtains and renews the Let's Encrypt certificate on its own for the domains listed in [nginx/nginx.prod.conf](nginx/nginx.prod.conf). Check beforehand that `DJANGO_DEBUG` is removed or `False`, that `CERTBOT_EMAIL` is set, and that DNS points to the machine.

---

## Database Schema

PostgreSQL, managed through the Django ORM. Ten application modules, each owning its tables.

```
                    ┌──────────────────┐
                    │      User        │
                    │ email (unique)   │
                    │ username, bio    │
                    │ wallet DECIMAL   │
                    │ status enum      │
                    │ avatar, is_public│
                    └────────┬─────────┘
                             │
   ┌──────────┬──────────────┼──────────────┬─────────────┐
   │          │              │              │             │
┌──▼───────┐ ┌▼───────────┐ ┌▼──────────┐ ┌─▼──────────┐ ┌▼────────────┐
│Friendship│ │   League   │ │    Bet    │ │Notification│ │ChallengeClaim│
│sender    │ │ creator    │ │ stake     │ │ recipient  │ │ user         │
│receiver  │ │ members M2M│ │ odd_value │ │ actor      │ │ challenge    │
│status    │ │ name, desc │ │ status    │ │ type, data │ │ period       │
└──────────┘ └─────┬──────┘ └─────┬─────┘ └────────────┘ └──────────────┘
                   │              │
          ┌────────▼───────┐ ┌────▼──────────┐
          │LeagueInvitation│ │ BetSelection  │
          │sender/receiver │ │ bet FK        │
          │status          │ │ match FK      │
          └────────────────┘ │ odd FK        │
                             │ odd_value     │
                             │ status        │
                             └────┬──────────┘
                                  │
  ┌──────────┐   ┌─────────────┐  │  ┌──────────────┐
  │  Sport   │──▶│ Competition │──┼─▶│    Match     │
  │ name     │   │ name, season│  │  │ home/away FK │
  │ slug     │   │ country     │  └─▶│ kickoff_at   │
  └──────────┘   └──────┬──────┘     │ status       │
                        │            │ scores       │
                   ┌────▼────┐       │ current_min  │
                   │  Team   │──────▶│ referee,venue│
                   │ name    │       └───┬──────┬───┘
                   │ logo_url│           │      │
                   └─────────┘     ┌─────▼──┐ ┌─▼──────────┐
                                   │  Odds  │ │ MatchEvent │
                                   │ market │ │ MatchLineup│
                                   │ value  │ └────────────┘
                                   └────────┘
```

### Main tables

| Table | Key fields | Relations |
|---|---|---|
| `users_user` | `email` unique, `username`, `wallet` DECIMAL(14,2) default 100, `status` enum (`owner`/`admin`/`user`), `avatar` image, `bio`, `is_public` bool, `last_daily_bonus` date, `last_wheel_spin` date, `onboarding_completed` bool | Referenced by nearly every other table |
| `friends_friendship` | `status` (`pending`/`accepted`), `created_at` | `sender` → User, `receiver` → User |
| `league_league` | `name`, `description`, `created_at` | `creator` → User, `members` M2M User |
| `league_leagueinvitation` | `status`, `created_at` | `league`, `sender`, `receiver` |
| `sports_sport` / `sports_competition` / `sports_team` | `name`, `slug`, `season`, `country`, `logo_url`, `external_id` | Sport ← Competition ← Team |
| `sports_match` | `kickoff_at`, `status` (`scheduled`/`live`/`finished`), `home_score`, `away_score`, `current_minute`, `external_id` unique, `footlive_id`, `referee`, `venue`, `ht_*_score` | `competition`, `home_team`, `away_team` |
| `sports_matchevent` / `sports_matchlineup` | `minute`, `type`, `team_side`, `player`, `role`, `number` | → Match |
| `sports_odds` | `market` (1N2), `selection` (`home`/`draw`/`away`), `value` DECIMAL, `updated_at` | → Match, unique per (match, market, selection) |
| `betting_bet` | `stake` DECIMAL, `odd_value` (combined odds), `status` (`pending`/`won`/`lost`), `created_at`, `settled_at` | `user` → User |
| `betting_betselection` | `odd_value` snapshot at placement, `status`, `settled_at` | `bet`, `match`, `odd` |
| `chat_message` | `content`, `created_at` | `league`, `sender` |
| `chat_conversation` / `chat_directmessage` | `content`, `created_at` | `user_a`/`user_b`, then `conversation`, `sender` |
| `notifications_notification` | `type`, `message`, `url`, `data` JSONB, `is_read`, `created_at` | `recipient`, `actor` |
| `challenges_challenge` / `_badge` | `code` slug, `kind` (`daily`/`season`), `metric`, `target`, `reward`, `threshold` | Catalogue tables |
| `challenges_challengeclaim` / `_userbadge` | `period` (ISO date or `season`), `claimed_at`, `unlocked_at` | `user`, `challenge`/`badge` |

**Key design decision** — `BetSelection.odd_value` stores a *snapshot* of the odds at the moment the bet is placed. Odds move every 30 seconds; without this copy, settling a bet would use a different value from the one the user accepted.

---

## Features List

| Feature | Description | Main contributors |
|---|---|---|
| **Authentication** | Sign-up by email/password or Google OAuth 2.0. Two-step login: password, then a 6-digit code emailed via Brevo, valid 5 minutes. JWT stored in httpOnly cookies, access 5 min / refresh 7 days, silent refresh through a Next.js server route. | engiusep, nyousfi, acancel |
| **Profile & settings** | Avatar upload (any image, 5 MB max, validated client and server side), first/last name, username, bio, public-profile toggle, reduced-motion preference. | nyousfi, ynzue-es |
| **Match scraping** | Celery pipeline against foot-live: live matches every 30 s, upcoming matches daily at midnight, plus history and detailed sheets (line-ups, events, referee, venue, half-time score). | ynzue-es, engiusep |
| **Odds engine** | Odds computed from each team's last 10 finished matches, home advantage, a 7 % bookmaker margin and a probability floor. Live adjustment based on goal difference and minute played. | ynzue-es |
| **Betting** | Floating bet slip, simple and combo bets, quick stake presets, potential-gain preview, atomic balance debit under row lock. | ynzue-es, nyousfi |
| **Settlement** | Runs inside the 30-second live loop: finished matches resolve each selection, then each bet, then credit the winners. | ynzue-es |
| **Confidence gauge & trends** | Per match, the share of users backing each outcome. "Kop trends" lists the most-backed bets over a window that widens (1 h → 24 h → all time) while volume is low. | ynzue-es |
| **Leaderboards** | Filterable by period (week, month, season, all time) and scope (world, friends), computed by SQL aggregation over settled bets. | ynzue-es, nyousfi |
| **Private leagues** | Creation, invitation of friends, accept/decline, internal leaderboard, leave, kick by the creator. | engiusep, ynzue-es |
| **Friends** | User search, requests sent and received, acceptance, friends' activity feed. | engiusep, nyousfi |
| **Chat** | Private conversations and one room per league, over WebSockets with persisted history. | engiusep, ynzue-es |
| **Notifications** | Real-time push over WebSocket, notification bell, mark one or all as read. | ynzue-es |
| **Gamification** | Daily and season challenges with claimable rewards, badges unlocked by thresholds, 500-Kop daily bonus, daily wheel of fortune (−1 000 to +2 000, jackpot 10 000 at 1 %). | ynzue-es |
| **Admin panel** | Reserved for `admin` and `owner`: global statistics, user search, inspection and editing of balance, friends and bets. | ynzue-es, nyousfi |
| **Design system** | 21 reusable components: Avatar, Icon, Kops, Modal, OddPill, ProgressBar, Skeleton, StatCard, Tag, Toast, MatchCard, LiveTile, CompactRow, OddsRow, TeamBadge, MatchSkeleton, MatchSearchBar, LeagueFilterBar, BetSlip, TicketCard, Onboarding — plus mobile-first responsive layout. | ynzue-es, nyousfi |
| **Infrastructure** | Docker Compose dev/prod split, multi-stage Dockerfiles, nginx and TLS, Celery worker and beat. | engiusep, nyousfi |

---

## Modules

Target: **14 points**. The table below reflects what is **actually working today**, not what was planned.

### Claimed — implemented

| Category | Module | Type | Pts | How it was implemented | Who |
|---|---|---|---|---|---|
| Web | Framework front + back | Major | 2 | Next.js 16 App Router (SSR + server routes) and Django 5 + DRF | all |
| Web | Real-time via WebSockets | Major | 2 | Django Channels, Redis layer, 3 consumers (league chat, DM, notifications), JWT-cookie middleware, graceful disconnect handling | ynzue-es, engiusep |
| Web | User interaction | Major | 2 | Chat (DM + league), profile pages, full friends system | engiusep, ynzue-es |
| Web | ORM | Minor | 1 | Django ORM across all 10 apps, migrations versioned | all |
| Web | Complete notification system | Minor | 1 | `Notification` model covering creation/update/deletion events, WebSocket push, read tracking | ynzue-es |
| Web | Custom design system | Minor | 1 | 21 reusable components (well above the 10 required), colour palette and typography tokens in `globals.css`, custom icon set | ynzue-es, nyousfi |
| User Mgmt | Standard user management | Major | 2 | Profile editing, avatar upload with default fallback, friends system, public profile page | nyousfi, engiusep |
| User Mgmt | Organization system | Major | 2 | Private leagues: create, read, update membership, invite, kick, leave, internal leaderboard | engiusep, ynzue-es |
| User Mgmt | OAuth 2.0 | Minor | 1 | Google via allauth + dj-rest-auth, tokens landing in httpOnly cookies | engiusep, nyousfi |
| User Mgmt | 2FA | Minor | 1 | Mandatory second step at every login: 6-digit code generated with `secrets`, stored in Redis with 5-minute TTL, emailed through Brevo | engiusep, acancel |
| Gaming/UX | Gamification system | Minor | 1 | Four of the six listed mechanics: badges, leaderboards, daily challenges, rewards. All persisted in PostgreSQL, with progress bars and claim feedback. | ynzue-es |

**Subtotal: 16 points**

### Candidates to reach the target more safely

| Module | Type | Pts | Current state |
|---|---|---|---|
| **Modules of choice — odds engine** | Major | 2 | Working. Would need a written justification: no free provider exposes odds, so probabilities are derived from team form, converted with a bookmaker margin, and re-derived live from the score. |
| Web — SSR | Minor | 1 | Next.js App Router already server-renders every page; needs to be demonstrated as an explicit choice. |
| Web — Advanced search | Minor | 1 | Match search and competition filters exist; sorting and pagination would need to be completed. |
| Web — File upload | Minor | 1 | Avatar upload exists with dual validation; the module also asks for multiple file types, preview, deletion and a progress indicator. |
| User Mgmt — Advanced permissions | Major | 2 | Three roles (`owner`/`admin`/`user`) and a working admin panel; the module also expects a `moderator` role and full user CRUD. |

### Not started

Public API with API key and rate limiting · Accessibility WCAG 2.1 AA · i18n · RTL · AI modules · Cybersecurity (WAF/Vault) · Games · DevOps (ELK, Prometheus, microservices) · Analytics dashboard · GDPR · Blockchain

> The final point total must be arbitrated by the team before the defence. Only fully functional modules count — a partial module scores zero.

---

## Team Information

| Member | Role(s) | Responsibilities |
|---|---|---|
| **ynzue-es** | Tech Lead / Developer | Technical architecture, technology choices, review of critical changes. Owner of the sports domain (scraping, odds engine, settlement) and of most of the frontend. |
| **engiusep** | Project Manager / Developer | Team coordination, planning, blocker tracking. Backend: authentication, friends, chat, leagues. Docker and nginx infrastructure. |
| **nyousfi** | Product Owner / Developer | Product vision, feature prioritisation, validation of delivered work. Frontend, settings and admin panel, Docker and deployment. |
| **acancel** | Developer | Backend contributions on the users app, test setup (pytest) and dependency management. |

> Roles listed above are the ones each member ended up holding. The team started as four and finished as three: scope was redistributed along the way, so several people worked well outside their initial role — in particular, frontend-oriented members took on backend work. See [Project Management](#project-management).

---

## Project Management

**Tools** — **GitHub** for the repository, history and task tracking; **Discord** for day-to-day communication.

**Meetings** — no fixed weekly ritual. The team worked **together, in the same room, around each major push of the project**: every significant milestone (authentication, betting engine, leagues, real-time features) was built during shared working sessions rather than split up asynchronously. Decisions were therefore taken live, and code review happened by talking over the change as it was written.

**Work distribution** — the split follows domain ownership: one person owns a vertical slice (model, endpoints, UI) rather than a horizontal layer. This limits merge conflicts and avoids one member being blocked waiting for another's layer.

**Mid-project reorganisation** — the team started as four and **finished as three**. Roles and scope were redistributed among the remaining members, which is the main reason the commit counts below are uneven and why several people ended up working outside their initial role (frontend developers taking on backend work, and vice versa).

**Version control** — a single `main` branch, conventional commit messages (`feat:`, `fix:`, `responsive:`).

---

## Individual Contributions

Figures below come from `git log` over 132 commits.

### ynzue-es — 52 commits

Frontend `app/` and `components/` (the bulk of the interface), `api/sports`, `api/users`, `api/betting`, `api/notifications`, `api/challenges`.

Sole author of the two most technical files in the project: [odds.py](api/sports/services/odds.py), which derives odds from team form and adjusts them live, and [settle.py](api/sports/services/settle.py), which settles bets under transaction. Also the wheel of fortune, match sheets (line-ups, timeline), match search and the gamification system.

### engiusep — 26 commits

`api/users`, `api/friends`, `api/chat`, `api/league`, `api/core`, plus `docker-compose.yml`, `nginx/` and `requirements.txt`.

Two-step authentication with Brevo, friends system, chat and leagues on the backend side. Infrastructure work: container definitions, reverse proxy, TLS.

### nyousfi — 31 commits

`api/users`, `api/betting`, `api/friends`, `api/core`, frontend `app/`, `Dockerfile`, `nginx/`.

Settings page, admin panel, mobile responsive work, deployment. Also the front-end text consistency pass and the environment configuration (`.env.example`, variable naming).

### acancel — 8 commits

`api/users`, `pytest.ini`, `requirements.txt`, contributions to `api/users/tests.py`.

### Challenges faced

**Learning an unfamiliar stack.** Nobody on the team had shipped a Django or Next.js application before. The Common Core is C and C++; here everything was new at once — an ORM, migrations, an async server, React's rendering model, a type system on the frontend. The early weeks went as much into reading documentation as into writing code, and several first drafts were rewritten once the team actually understood the tools. Working in the same room helped: a blocker on one screen was usually something someone else had already hit.

**Finishing at three instead of four.** Partway through, the team lost a member and had to absorb their scope. Roles were redistributed: people who had positioned themselves on the frontend picked up backend work, and the initial split stopped matching who actually did what. The uneven commit counts above (52 / 31 / 26 / 8) are a direct consequence — the distribution among the three remaining members is balanced, and the team is prepared to explain the reorganisation during the defence.

---

## Known limitations

Stated openly, because they are visible during evaluation:

- **Online status** is not implemented, although the "Standard user management" module lists it among its requirements.
- No CI pipeline, no rate limiting, no audit log.
- The development TLS certificate is self-signed, so browsers show a warning on first visit.
- Frontend test coverage is nonexistent; backend coverage is minimal (12 tests).
- The starting balance (100 Kops) is low relative to the daily bonus (500) and to the wheel's swings (up to ±10 000).

---

## Resources

### Documentation used

- [Django 5](https://docs.djangoproject.com/) and [Django REST Framework](https://www.django-rest-framework.org/)
- [Django Channels](https://channels.readthedocs.io/) — WebSocket consumers and middleware
- [Celery](https://docs.celeryq.dev/) — periodic tasks and beat scheduling
- [Next.js 16 App Router](https://nextjs.org/docs) — server components, server routes
- [Tailwind CSS 4](https://tailwindcss.com/docs)
- [dj-rest-auth](https://dj-rest-auth.readthedocs.io/) and [django-allauth](https://docs.allauth.org/) — JWT cookies and Google OAuth
- [Brevo API](https://developers.brevo.com/) — transactional email

### Data sources

- **foot-live** — matches, scores, line-ups, events (scraped)
- **Brevo** — delivery of login codes

### Product inspiration

- [Omada](https://www.omadagame.com/) — virtual betting concept
- Winamax — art direction

### Visual identity

Dark only. Deep black background, Kop red `#D90000` as the accent, electric green `#A3FF12` for odds and winnings. Inter Tight (UI), Space Grotesk (headings), JetBrains Mono (figures).

### Use of AI

The team used Claude (Anthropic) for:

- **Design** — generation of the initial interactive HTML prototype used as a visual reference
- **Brainstorming** — identifying which ft_transcendence modules fitted the product idea
- **Debugging** — occasional help on Django Channels bugs and WebSocket authentication
- **Documentation and copy** — docstrings, comments, consistency pass over the interface texts, and this README
- **Configuration** — diagnosing environment-variable mismatches between `.env` and the code

AI did not write critical business logic. Bet settlement, wallet transactions, the odds engine, authentication and security were written and are understood by team members. Every member can explain the parts they delivered.

---

## Privacy

Kop simulates sports betting **with virtual currency only**. No real money is ever staked, exchanged or paid out. Kops hold no monetary value and cannot be converted.

Collected data is limited to email address, username, optional profile picture and in-app activity. **Dedicated Privacy Policy and Terms of Service pages still have to be written** (see [Known limitations](#known-limitations)).

## License

To be defined by the team.
