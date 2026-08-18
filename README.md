*This project has been created as part of the 42 curriculum by ynzue-es, engiusep, nyousfi.*

# Kop

> Betting without the stake. You predict, you win Kops, you dominate your friends.

**Kop** is a web platform for football predictions **with no real money involved**. Users bet **Kops** (a virtual, worthless, non-convertible currency) on real matches, compete in private leagues and climb the leaderboards. The point is not money, it is bragging rights.

Odds are not bought from a provider: they are computed by our own engine from the recent form of both teams, and they move live with the score.

> Architecture, data model, endpoints, odds engine and security are documented in **[TECHNICAL.md](TECHNICAL.md)**.

---

## Features

Everything listed here is implemented and demonstrable.

| Area | What it does |
|---|---|
| **Authentication** | Email/password or Google OAuth 2.0, then a mandatory second step: 6-digit code emailed via Brevo, valid 5 min. JWT in httpOnly cookies, silent refresh through a Next.js server route. |
| **Profile & settings** | Avatar upload (5 MB max, validated both sides), username, bio, public-profile toggle, reduced-motion preference. |
| **Matches** | Celery scraping of foot-live: live matches every 30 s, upcoming daily, plus history and full match sheets (line-ups, events, referee, venue, half-time score). |
| **Odds engine** | Odds derived from each team's last 10 finished matches, home advantage, 7 % margin, probability floor. Re-derived live from goal difference and minute played. |
| **Betting** | Floating bet slip, simple and combo bets, stake presets, potential-gain preview, atomic debit under row lock. |
| **Settlement** | Automatic inside the 30-second live loop: selections resolve, then bets, then winners are credited, always at the odds snapshotted when the bet was placed. |
| **Community** | Confidence gauge per match (share of users on each outcome) and "Kop trends" over a window that widens while volume is low. |
| **Leaderboards** | Filterable by period (week / month / season / all time) and scope (world / friends), computed by SQL aggregation over settled bets. |
| **Private leagues** | Create, rename, delete, invite friends, accept/decline, kick, leave, internal leaderboard and dedicated chat room. |
| **Friends** | Search, requests, activity feed, and online status derived from `last_seen` (5-minute window) so a crashed tab never leaves anyone stuck "online". |
| **Chat & notifications** | Private conversations and league rooms over WebSockets with persisted history, real-time notification push, bell, mark one/all as read. |
| **Gamification** | Daily and season challenges with claimable rewards, badges, 500-Kop daily bonus, daily wheel of fortune (−1 000 to +2 000, 10 000 jackpot at 1 %). |
| **Admin panel** | Global stats, user search, edition of profile / role / balance / bets and account deletion. Hierarchy enforced server-side: an admin cannot touch an owner, only an owner edits roles. |
| **Design system** | 21 reusable components, design tokens in `globals.css`, custom icon set, mobile-first responsive layout. |

---

## Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16 (App Router, SSR + server routes as a cookie proxy), React 19, TypeScript strict, Tailwind CSS 4, Framer Motion, Axios |
| **Backend** | Django 5.2 + DRF, Django Channels + Redis (WebSockets), Daphne, Celery + Beat, simplejwt / dj-rest-auth / allauth |
| **Data** | PostgreSQL 16 for the wallet's real transactions (`transaction.atomic()` + `select_for_update()`); Redis 7 for the Celery broker and the Channels layer |
| **Infra** | Docker Compose (dev/prod split), Caddy with automatic TLS |

Two choices worth stating up front: **Next.js** because auth relies on httpOnly cookies that client-side JS cannot read, so the exchange with Django happens in server routes; **Channels** rather than a separate WebSocket service, so one middleware validates the same JWT cookie as the REST API instead of duplicating authentication.

---

## Getting started

**Prerequisites**: Docker 24+ and Compose v2. Nothing else: Python, Node and PostgreSQL run in containers. No sports API key is needed. A Google OAuth client and a Brevo API key are required for the full login flow.

```bash
git clone git@github.com:Nass26dev/ft_transcendence.git
cd ft_transcendence
cp .env.example .env      # then fill it in (see the comments in .env.example)
docker compose up --build
```

| Entry point | URL |
|---|---|
| Application | **https://localhost:8443** |
| API | https://localhost:8443/api/ |
| Django admin | https://localhost:8443/admin/ |

Everything goes through HTTPS, including in development: Caddy terminates TLS with its internal CA, so the browser warns once about the certificate; accept it. Ports 3000 and 8000 are deliberately not published. 8443/8080 are used instead of 443/80 because rootless Docker cannot bind privileged ports.

On first launch the database is empty: `seed_if_empty` scrapes the last 180 days then the next 7. Allow a few minutes before matches and odds appear.

`docker compose up` layers `docker-compose.override.yml` on top (volumes, hot reload, exposed ports). `docker-compose.yml` alone describes production:

```bash
docker compose -f docker-compose.yml --profile prod up -d --build
```

### Commands

```bash
docker compose down -v                                     # stop and drop the database
docker compose logs -f backend                             # follow one service
docker compose exec backend python3 manage.py migrate
docker compose exec backend python3 manage.py createsuperuser
docker compose exec backend python3 -m pytest              # 260 backend tests
docker compose exec frontend npx tsc --noEmit
docker compose exec frontend npm run lint
./e2e/run.sh                                               # end-to-end (Selenium)
```

### End-to-end tests

[e2e/](e2e/) drives a real Chrome against the running dev stack, with no mocks. Eleven files replay one continuous journey (sign-up → login → betting → league → wheel → chat → settings → logout) in a single session, screenshotting each step into `e2e/screenshots/`. Each file can also run alone thanks to the `logged_in` fixture.

```bash
./e2e/run.sh --watch            # + noVNC to watch it live
./e2e/run.sh --headed --demo    # real window, visible cursor, slowed down
./e2e/run.sh --help
```

2FA is covered up to the code entry screen only: the code is emailed and kept in Django's per-process cache, so the tests open the session by setting the same JWT cookies the verification would set.

---

## Modules

Target **14 points**, **21 claimed**. The table reflects what works today; each module can be demonstrated live.

| Category | Module | Type | Pts | Implementation |
|---|---|---|---|---|
| Web | Framework front + back | Major | 2 | Next.js 16 App Router and Django 5 + DRF |
| Web | Real-time WebSockets | Major | 2 | Channels + Redis, 3 consumers (league chat, DM, notifications), JWT-cookie middleware |
| Web | User interaction | Major | 2 | Chat DM + league, profile pages, full friends system |
| Web | ORM | Minor | 1 | Django ORM across the 10 apps, migrations versioned |
| Web | Notification system | Minor | 1 | `Notification` model, WebSocket push, read tracking |
| Web | Custom design system | Minor | 1 | 21 components (10 required), tokens and custom icon set |
| Web | Server-Side Rendering | Minor | 1 | Every route rendered server-side: `curl -k https://localhost:8443/login` returns real markup |
| User Mgmt | Standard user management | Major | 2 | Profile editing, avatar, friends with online status, public profile |
| User Mgmt | Organization system | Major | 2 | Private leagues: create, edit, delete, invite, kick, leave, leaderboard |
| User Mgmt | Advanced permissions | Major | 2 | Roles `owner`/`admin`/`user`, full user CRUD from the panel with guarded deletion |
| User Mgmt | OAuth 2.0 | Minor | 1 | Google via allauth + dj-rest-auth, tokens into httpOnly cookies |
| User Mgmt | 2FA | Minor | 1 | 6-digit code (`secrets`), cached 5 min, emailed through Brevo |
| Gaming/UX | Gamification | Minor | 1 | Badges, leaderboards, daily challenges, rewards |
| Choice | **Odds engine** | Major | 2 | See below |

### Custom module: the odds engine

The subject requires a written justification for a module of choice.

**Why.** Odds are the core mechanic of a betting platform, and no free provider exposes football odds: the free tiers that exist cap requests per day, which is incompatible with a 30-second live refresh. Buying data was not an option and faking it would have emptied the product of meaning.

**What it solves.** A full pipeline, not a wrapper around an API call: form score over each team's last 10 finished matches, conversion into probabilities, home advantage, bookmaker margin and probability floor so no payout is absurd, live re-derivation from the score and the minute, and a **snapshot** of the odds inside `BetSelection` so settlement pays at the rate the user accepted rather than the current one.

**What it buys us.** Independence: no API key to distribute, no third-party quota, no outage. Every match in the database is bettable at any time. It spans `sports` and `betting`, runs partly in Celery, and feeds the wallet, which is money-like state protected by row locks.

### Not claimed

Deliberately left out, since the subject scores an incomplete module as zero:

- **Advanced search**: team/competition search and league filters exist, a user-facing sort control does not.
- **File upload**: avatar upload is validated and stored, but without multiple types, preview, progress or deletion.

Not started: public API, WCAG 2.1 AA, i18n, RTL, AI modules, cybersecurity (WAF/Vault), games, DevOps (ELK, Prometheus, microservices), analytics, GDPR, blockchain.

---

## Team

| Member | Role(s) | Scope | Commits |
|---|---|---|---|
| **ynzue-es** | Tech Lead / Developer | Architecture and technology choices. Sports domain: scraping, [odds engine](api/sports/services/odds.py), [settlement](api/sports/services/settle.py). Most of the frontend, plus gamification, match sheets and search. | 60 |
| **engiusep** | Project Manager / Developer | Coordination and planning. Backend auth (Brevo 2FA), friends, chat, leagues. Docker and Caddy infrastructure. | 42 |
| **nyousfi** | Product Owner / Developer | Product vision and prioritisation. Settings page, admin panel, responsive work, deployment, environment configuration. | 40 |

**Working method**: GitHub for repository and tracking, Discord day to day, a single `main` branch with conventional commits. No weekly ritual: the team worked in the same room around each major push (auth, betting, leagues, real-time), so decisions and reviews happened live. Work was split by vertical slice (model → endpoints → UI) rather than by layer, which kept merge conflicts down.

**What was hard**: nobody had shipped Django or Next.js before, so the early weeks went as much into documentation as into code, and several first drafts were rewritten. The team also **started as four and finished as three**: scope was redistributed, frontend-oriented members took on backend work, and the uneven commit counts above are a direct consequence.

---

## Known limitations

- No CI pipeline, no rate limiting, no audit log.
- Self-signed development certificate, so browsers warn on first visit.
- No frontend unit tests: 260 backend tests and 11 end-to-end journeys, nothing at component level.
- The starting balance (100 Kops) is low next to the daily bonus (500) and the wheel's swings.
- Privacy Policy and Terms of Service pages still have to be written.

---

## Resources

**Documentation**: [Django 5](https://docs.djangoproject.com/), [DRF](https://www.django-rest-framework.org/), [Channels](https://channels.readthedocs.io/), [Celery](https://docs.celeryq.dev/), [Next.js 16](https://nextjs.org/docs), [Tailwind 4](https://tailwindcss.com/docs), [dj-rest-auth](https://dj-rest-auth.readthedocs.io/), [allauth](https://docs.allauth.org/), [Brevo](https://developers.brevo.com/).

**Data**: foot-live (matches, scores, line-ups, events, scraped), Brevo (login codes).

**Inspiration**: [Omada](https://www.omadagame.com/) for the virtual-betting concept, Winamax for the art direction.

**Visual identity**: dark only. Deep black background, Kop red `#D90000`, electric green `#A3FF12` for odds and winnings. Inter Tight, Space Grotesk, JetBrains Mono.

**Use of AI**: Claude (Anthropic) was used for the initial HTML prototype, module brainstorming, occasional debugging on Channels and WebSocket auth, docstrings and documentation, and environment-variable diagnostics. Bet settlement, wallet transactions, the odds engine, authentication and security were written and are understood by team members; each one can explain what they delivered.

---

## Privacy & license

Kop simulates sports betting **with virtual currency only**. No real money is ever staked, exchanged or paid out, and Kops cannot be converted. Collected data is limited to email, username, an optional profile picture and in-app activity.

License to be defined by the team.
