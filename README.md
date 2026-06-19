*This project has been created as part of the 42 curriculum by ynzue-es, engiusep, nyousfi, acancel.*

# Kop

> Le pari sans la mise. Tu pronostiques, tu gagnes des Kops, tu domines tes potes.

## Description

**Kop** est une plateforme web de pronostics sportifs **sans argent réel**, inspirée du concept Omada. Les utilisateurs parient avec une monnaie virtuelle (les **Kops**) sur des matchs de football (Ligue 1, Ligue des Champions), s'affrontent dans des ligues privées entre amis, et grimpent dans les classements hebdomadaires.

L'objectif n'est pas l'argent : c'est la fierté, le bragging right, et la preuve qu'on connaît mieux le foot que ses potes.

### Pourquoi Kop ?

Les applis de paris sportifs traditionnelles exploitent leurs utilisateurs avec de l'argent réel. Kop reprend la mécanique addictive et fun du pari sportif — la tension d'un match, l'analyse des cotes, le frisson du combiné — sans aucun risque financier. Zéro euro engagé, 100% du fun.

### Identité visuelle

DA inspirée Winamax : punchy, propre, dark only.
- Fond noir profond, surfaces gris très foncé
- Rouge Kop (#D90000) en accent principal
- Vert électrique (#A3FF12) pour cotes et gains
- Typo Inter Tight (UI) + Space Grotesk (titres) + JetBrains Mono (cotes)

## Features principales

### 🎯 Pronostics

- **Paris simples** sur le résultat d'un match (1 / N / 2)
- **Paris combinés** : plusieurs sélections, cote multipliée, gain ou rien
- **Live betting** : pari sur matchs en cours, cotes qui évoluent en temps réel
- **Cotes virtuelles** calculées par le système, mises à jour en live
- **Ticket de pari** persistant, modifiable jusqu'à validation

### 💰 Économie virtuelle (Kops)

- 1000 Kops offerts à l'inscription
- Refill hebdomadaire automatique pour ceux qui ont tout perdu
- Bonus de connexion quotidien
- **Aucun achat avec de l'argent réel**, jamais

### 👥 Ligues privées

- Création de ligues par code d'invitation
- Classement intra-ligue mis à jour en temps réel
- Chat de ligue (taunts entre potes)
- Owner peut gérer les membres
- Une personne peut être dans plusieurs ligues

### 🏆 Classements

- **Général** : tous les Kopistes
- **Hebdomadaire** : reset chaque lundi, archivage de l'historique
- **Par ligue** : entre membres uniquement
- **Entre amis** : friends only

### 🎮 Innovation Kop : Jauge de confiance communautaire

Sur chaque match, affichage en temps réel du pourcentage de Kopistes ayant parié sur chaque issue. Permet de voir si on est avec le consensus ou à contre-courant.

### 🔥 Live mode

- Suivi temps réel des matchs en cours
- Cotes qui pulsent quand elles changent
- Notifications instantanées sur les paris
- Compteur de seconde de jeu

### 📈 Profil & Stats

- Avatar personnalisable (Omaji-like, SVG layered)
- Stats par compétition (taux de réussite, ROI virtuel, série en cours)
- Historique complet des paris
- Badges et progression
- Online status visible par les amis

### 💬 Social

- Système d'amis (ajout / suppression / online status)
- Feed des paris des amis (toggle on/off)
- Chat 1v1 entre amis
- Chat de ligue
- Notifications temps réel

### 📅 Défis quotidiens

- Missions journalières (parier sur 3 matchs, gagner un combiné, etc.)
- Bonus Kops à la complétion
- Streak journalier

### ⚙️ Compte

- Inscription email/password ou OAuth (Google, 42)
- 2FA TOTP optionnel
- Multi-device (sessions concurrentes)
- Export de données (RGPD)
- Privacy Policy et Terms of Service explicites

## Écrans

1. **Onboarding** — Inscription, choix avatar, tutoriel rapide
2. **Lobby / Accueil** — Matchs du jour, jauge de confiance, feed amis (optionnel)
3. **Détail match** — Cotes 1/N/2, stats, jauge de confiance, ajout au ticket
4. **Ticket de paris** — Sélections en cours, mise, cote totale, validation
5. **Live** — Matchs en cours, cotes pulsantes, paris live
6. **Ligues** — Liste, détail, classement, chat de ligue, invitations
7. **Profil** — Stats, historique, avatar, badges, settings
8. **Classement global** — Podium, top 100, recherche

## Public cible

Fans de football (et de sport en général à terme), 16-35 ans, qui veulent vivre le frisson du pari avec leurs potes sans risquer leur loyer. Particulièrement les utilisateurs déçus par les applis de paris payantes ou qui ont arrêté pour raisons financières.

## Pourquoi pas un jeu jouable ?

Le sujet ft_transcendence v21.1 autorise explicitement *"any other creative web application that meets the requirements"* et liste *"a social network with user interactions"* parmi les exemples valides. Kop est un produit web complet avec interactions multi-utilisateurs temps réel, ce qui satisfait l'esprit du sujet.

Conséquence : on n'utilise aucun module de la catégorie *Gaming and user experience* (qui requiert un jeu jouable). On compense largement dans les autres catégories.

## Équipe

| Membre | Rôle principal | Rôle technique |
|---|---|---|
| ynzue-es | **Tech Lead** | Backend / archi |
| engiusep | **Project Manager** | Backend / DevOps |
| nyousfi | **Product Owner** | Frontend |
| acancel | **Developer** | Frontend |

## Modules ft_transcendence (18 points, cible 14)

### Web (8 pts)
- **Major** Framework front + back (Next.js + Django) — 2 pts
- **Major** Real-time WebSockets (cotes live, chat, classements, notifs) — 2 pts
- **Major** User interaction (chat + profil + amis) — 2 pts
- **Major** Public API + 5 endpoints + rate limit + doc — 2 pts

### User Management (8 pts)
- **Major** Standard user management (avatar, profils, online status) — 2 pts
- **Major** Advanced permissions (admin/moderator/user/guest) — 2 pts
- **Major** Organization system = Ligues privées (CRUD, invitations, rôles) — 2 pts
- **Minor** OAuth 2.0 (Google + 42) — 1 pt
- **Minor** 2FA TOTP — 1 pt

### Web (1 pt)
- **Minor** ORM (Django ORM) — 1 pt
- **Minor** Notification system complet (creation/update/deletion) — 1 pt

**Total : 18 points**

### Modules backup si rejet
- i18n FR/EN/ES (1 min) — next-intl
- Custom design system 10+ composants (1 min) — déjà fait
- GDPR (1 min) — export/delete
- Analytics dashboard (2 maj) — stats avancées par compétition

## Instructions

### Prérequis

- Docker 24+ et Docker Compose v2
- Make
- Un domaine ou `localhost` (cert auto-signé en dev)
- Une clé API sportive (API-Football free tier ou TheSportsDB)

### Setup

```bash
git clone <repo>
cd kop
cp .env.example .env
# Édite .env : SECRET_KEY, OAUTH credentials, SPORT_API_KEY
make up
```

Le site est accessible sur `https://localhost` (cert auto-signé en dev).

### Commandes utiles

```bash
make up          # Lance tout le stack
make down        # Arrête tout
make logs        # Tail des logs
make seed        # Charge des données de démo
make test        # Lance les tests back + front
make migrate     # Migrations Django
```

### Variables d'environnement

Voir `.env.example` à la racine. Toutes les credentials (DB, Redis, OAuth, API sport, secrets Django, JWT) sont en variables d'environnement, jamais en dur.

## Resources

### Documentation utilisée
- Django 5 docs
- Next.js 16 App Router
- Django Channels (WebSockets)
- Celery + Redis
- API-Football / TheSportsDB
- next-intl

### Inspiration produit
- [Omada](https://www.omadagame.com/) — concept de paris virtuels
- Winamax — direction artistique punchy

### Utilisation de l'IA

L'équipe a utilisé Claude (Anthropic) pour :
- **Design DA** : génération du prototype HTML interactif initial servant de référence
- **Brainstorming** : identification des modules ft_transcendence pertinents
- **Aide debug** : résolution ponctuelle de bugs Django Channels et auth WS
- **Documentation** : amélioration des docstrings et commentaires

L'IA n'a pas écrit de code métier critique. Tout le code lié au settle des paris, aux transactions wallet, à l'auth et à la sécurité a été écrit et compris par les membres de l'équipe. Chaque membre est capable d'expliquer toutes les parties qu'il a livrées.

## Privacy & Terms

Kop simule des paris sportifs **uniquement avec une monnaie virtuelle**. Aucun argent réel n'est jamais engagé, échangé ou sortant. Les Kops n'ont aucune valeur monétaire et ne peuvent pas être convertis. La plateforme est ouverte à partir de 16 ans.

Voir `/privacy` et `/terms` dans l'application pour le détail.

## License

À définir par l'équipe.
