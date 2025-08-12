# WhatWeWatch

Application mobile React Native pour découvrir, organiser et partager son univers culturel (films, séries, musique, livres) via des listes personnalisées, un suivi intelligent, des fonctionnalités sociales, ludiques et (Temps 4) une dimension lieux / événements (expositions, festivals, cinémas, salles, villes) pour enrichir la découverte IRL.

Roadmap vision (phases macro):
Temps 1 (Core): Agrégation multi‑médias (v1: SEULEMENT films via TMDB pour accélérer le MVP; extension séries, musique, livres progressivement), recherche unifiée, listes personnalisées, suivi (à voir / en cours / terminé / favori), recommandations basées sur goûts + nouveautés simples.
Temps 2 (Social): Amis, listes partagées / collaboratives, suggestions entre contacts, fil d’activité léger.
Temps 3 (Jeu / Discovery): Mécanique type swipe (Tinder-like) sur contenus culturels pour affiner le profil de préférences + mode découverte gamifié.
Temps 4 (Lieux & Événements): Ajout d’un axe spatial et événementiel: lieux culturels (cinémas, salles de concert, musées, librairies), expositions / festivals / avant‑premières, villes favorites, mapping des contenus à des expériences physiques (ex: projection en salle, concert à venir, expo liée à un livre). Filtre géographique, wishlist d’événements, check‑ins.

## Badges

(À ajouter) CI | Coverage | Version | Licence  
Ex: ![CI](...) ![Coverage](...) ![Version](...) ![License](...)

## Sommaire

- [Contexte](#contexte)
- [Fonctionnalités](#fonctionnalités)
- [Stack--architecture](#stack--architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Démarrage](#démarrage)
- [Scripts NPM](#scripts-npm)
- [Qualité--tests](#qualité--tests)
- [Structure du code](#structure-du-code)
- [API--data-model](#api--data-model)
- [Roadmap](#roadmap)
- [Contribuer](#contribuer)
- [Sécurité](#sécurité)
- [Déploiement](#déploiement)
- [Observabilité](#observabilité)
- [FAQ](#faq)
- [Licence](#licence)
- [Contact](#contact)
- [Crédits](#crédits)
- [Annexes](#annexes)

## Contexte

Multiplier les plateformes rend le suivi dispersé (streaming, musique, lecture, événements). Objectif: centraliser, éviter doublons, faciliter recommandations, découverte active et passage du numérique au physique (sorties, expos). Cible: ciné/sériephiles, mélomanes, lecteurs, explorateurs urbains.

## Fonctionnalités

Scope initial (MVP élargi multimédia):

- [ ] Authentification (email + OAuth optionnel)
- [ ] Profils utilisateurs (avatar, bio courte, stats: films / albums / livres)
- [ ] Recherche unifiée (films, séries, artistes/albums/titres, livres)
- [ ] Listes multiples (watchlist, playlist de lecture, “à lire”, personnalisées)
- [ ] Suivi statut (à voir / en cours / terminé / abandonné)
- [ ] Rating perso + note de confiance
- [ ] Marquage date de consommation
- [ ] Recommandations (goûts + trending + nouveautés)
- [ ] Mode hors ligne (cache)
- [ ] Synchronisation multi‑devices
      Phase sociale (Temps 2):
- [ ] Amis / follow
- [ ] Listes partagées / collaboratives
- [ ] Suggestions d’amis et de contenus
- [ ] Fil d’activité (ajouts, notes)
      Phase jeu (Temps 3):
- [ ] Swipe discovery multi‑médias
- [ ] Sessions calibrage préférences (cold start)
- [ ] Points / progression / badges
      Phase lieux & événements (Temps 4):
- [ ] Référentiel lieux culturels (cinéma, salle, musée, festival, librairie)
- [ ] Événements (exposition, projection, concert)
- [ ] Liaison media ↔ événement (ex: film en salle, artiste en concert)
- [ ] Recherche filtrée par ville / rayon
- [ ] Check‑in / marquer “vu sur place”
- [ ] Wishlist d’événements / rappels
- [ ] Partage d’événements entre amis
      (Ajuster selon périmètre MVP)

## Stack & Architecture

Principes: simplicité maximale sur le MVP, évolutivité incrémentale (ajouts par feature flags), logique métier isolée dans un noyau framework‑agnostic.

- Mobile: React Native (Expo) + TypeScript
- State management (CHOIX FIGÉ): Zustand (simplicité, zéro boilerplate, sélecteurs fins; migration possible vers Redux Toolkit si besoins middleware complexes sociaux apparaissent Phase 2)
- Navigation: React Navigation
- UI: Design System Atomic + (CHOIX FIGÉ): Styled Components (Tamagui possible plus tard si besoin multi‑plateforme web)
- Backend (CHOIX FIGÉ v1): Express modulaire + TypeScript + Zod (validation) — Migration progressive possible vers NestJS si la complexité modulaire / interceptors / DI avancée devient nécessaire (ADR documentée)
- Auth: JWT (Access + Refresh rotation) + (OAuth différé jusqu'à usage stable email/password)
- Bases: PostgreSQL (données internes), Redis (DEFERRED: n'est activé qu'au moment de besoin rate limiting / cache token; phase initiale sans Redis pour réduire friction)
- Intégrations externes (progression): - Phase 1: TMDB (films) - Phase 1.1: TMDB séries - Phase 1.2: Spotify (musique) - Phase 1.3: Open Library / Google Books (livres) - Phase 4: APIs événements / lieux (Ticketmaster / Google Places / OSM) selon licences
- ORM: Prisma
- Géodonnées (Phase 4): PostGIS (option) sinon fallback colonnes lat/lng + index btree / gist simple
- Message/Queues (DEFERRED jusqu'à besoin concret): BullMQ (jobs trending / recalcul reco) + cron
- Infra: Docker Compose (dev), déploiement cible Railway / Fly.io / AWS
- Monorepo: PNPM workspaces + Turborepo
- Observabilité (staged): Pino (v1) → + prom-client métriques (v1.1) → éventuel OpenTelemetry (v2) → Prometheus / Grafana
- Feature flags: table interne simple (v1.1) ; Unleash (éval. post Phase 2)

### Décisions techniques figées (ADR)

Les ADR (Architecture Decision Records) synthétisent les choix et leur contexte. Fichiers à créer (placeholders) :

1. ADR-0001 State Management Mobile: Zustand retenu (simplicité, granularité updates, faible friction onboarding)
2. ADR-0002 Backend Framework v1: Express + Zod (time-to-first-feature < complexité Nest)
3. ADR-0003 Stratégie Identité Média & Normalisation
4. ADR-0004 Recommandations v1 (heuristique popularité + co-occurrence minimale)

Section à enrichir dans /docs/adr (non committé encore).

### Chemin critique MVP (Time-to-Value)

1. Auth email/password (signup/login + refresh)
2. Recherche films (TMDB) unifiée -> affichage résultats normalisés
3. Ajout film à Watchlist (statut planned)
4. Marquer progression (in_progress / completed) + rating facultatif
5. Générer recommandations v1 (top popularité + éventuellement 1 suggestion co-occurrence) affichées dans l'onglet Reco
6. Offline cache basique des derniers résultats & watchlist (AsyncStorage)

Livrer ce flux avant d'étendre types de médias.

### Stratégie Identité Média

Objectifs: éviter doublons inter-sources, fournir clé stable interne, faciliter extension.

- Clé native unique par source: (provider, externalId)
- Table Media canonique: id (UUID) interne référencé partout
- Contrainte UNIQUE(provider, externalId)
- Index (type, year), (title_normalized)
- Champ fingerprint dérivé: lower(unaccent(title)) + '|' + year + '|' + type — utilisé pour tentative de fusion multi‑sources (ex: film TMDB + autre provider)
- Normalisation titre: trim, suppression ponctuation, accents, toLower
- Fusion future: mapping cross-provider (table MediaAlias(provider, externalId, mediaId)) si sources supplémentaires

### Listes & Statuts (Modèle Simplifié)

- ConsumptionEntry (UNIQUE userId, mediaId) porte status (planned|in_progress|completed|abandoned) + rating + consumedAt
- Watchlist = status=planned (pas une entité distincte)
- Listes personnalisées: entité List + ListItem (organisation libre, pas de sémantique de progression)
- Empêche duplication logique statut vs listes spécifiques

### Recommandations v1 (Heuristique)

1. Popularité: count(ConsumptionEntry where status IN (completed) OR rating NOT NULL) sur 30 derniers jours (fenêtre glissante) + fallback global
2. Filtrage: exclure médias déjà completed ou rating existant par l'utilisateur
3. Co-occurrence simple (phase 1.1): pour chaque média consommé par user, médias partagés par ≥ X autres utilisateurs (X=2) triés par fréquence partagée
4. Score = `0.6*popularite_norm + 0.4*cooccur_norm` (si cooccur absent => uniquement popularité)
5. Pas de ML / embeddings avant signal suffisant (Phase long terme)

### Politique de Validation & Schémas

- Zod pour DTO request/response backend
- Génération types client mobile via script (DEFERRED jusqu'à stabilisation endpoints de base)

### Cache & Offline

- Mobile: AsyncStorage (watchlist + derniers résultats search)
- Backend: (DEFERRED) Redis pour cache réponses TMDB (TTL 15 min) quand volume > seuil / latence problématique

### Sécurité (Architecture v1)

- Refresh token rotation (stock id de session + invalidation après utilisation)
- Rate limiting (DEFERRED première itération) endpoints /auth/login, /catalog/search
- Sanitisation & validation systématiques via Zod

### Décisions différées (Open)

- Passage event-driven (domain events) — réévaluer quand >2 réactions sur un même événement domaine
- Migration Express -> NestJS — si besoin DI avancée / interceptors lourds / modularisation extrême
- Télémetrie distribuée (OpenTelemetry) — seulement après >1 service / besoin latency tracing
- Adoption Tamagui — si cible web unifiée

### Indicateurs MVP

- D7 retention (% utilisateurs ayant ajouté ≥1 média ET complété ≥1)
- Avg médias ajoutés / utilisateur semaine 1
- Temps moyen première reco (signup -> recomms affichées)

### Spécification minimale /catalog/search (v1 films seulement)

GET /catalog/search?q=string&page?=number

Réponse:

```json
{
  "query": "string",
  "page": 1,
  "pageSize": 20,
  "results": [
    {
      "id": "uuid",
      "provider": "tmdb",
      "externalId": "123",
      "type": "movie",
      "title": "...",
      "year": 2024,
      "coverUrl": "...",
      "overview": "..."
    }
  ],
  "total": 1234,
  "hasMore": true
}
```

Erreurs:

- 400 si q manquant ou < 2 chars
- 502 si échec provider (message générique)

### Contraintes & Index Recommandés (DB)

- UNIQUE(provider, externalId) sur Media
- UNIQUE(userId, mediaId) sur ConsumptionEntry
- UNIQUE(listId, mediaId) sur ListItem
- Index consumption(userId, status)
- Index media(type, year)
- Index list(userId)

### Plan d'évolution Observabilité

1. v1: logs Pino + correlationId (middleware)
2. v1.1: prom-client (latence endpoints, total requêtes, erreurs, reco_generated)
3. v2: tracing partiel (provider calls) si besoin diagnostic perf

### Fallback / Gestion des erreurs Providers

- Retenter 1 fois (backoff court) si échec réseau TMDB
- Circuit breaker simple (compteur échecs glissants) DEFERRED

### Performance initiale

- Objectif P95 endpoint search < 600ms (latence TMDB incluse) sur réseau standard
- Mise en place instrumentation simple avant optimisation structurelle

## Installation

Prérequis:

- Node >= 20
- PNPM >= 8
- Git
- Docker (Postgres + Redis)
- Xcode / Android SDK
- Comptes API: TMDB, Spotify, Books, (Temps 4: provider lieux/événements)

Clone:
git clone https://github.com/ybdn/WhatWeWatch.git
cd WhatWeWatch

Installer dépendances:
pnpm install

Services (option):
docker compose up -d

## Configuration

Copier exemple:
cp .env.example .env

‘‘‘
Variables principales:
APP_ENV=development
API_BASE_URL=<http://localhost:3000>
DB_URL=postgresql://user:pass@localhost:5432/whatwewatch
REDIS_URL=redis://localhost:6379
TMDB_API_KEY=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
BOOKS_API_KEY=
PLACES_API_KEY= (Temps 4 éventuel)
EVENTS_API_KEY= (Temps 4 éventuel)
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
JWT_SECRET=
EXPO_PUBLIC_API_BASE_URL=<http://localhost:3000>

Ne pas committer les secrets.

## Démarrage

Backend:
pnpm --filter backend dev

Mobile (Expo):
pnpm --filter mobile start
i / a pour lancer simulateur

## Scripts NPM

pnpm dev
pnpm build
pnpm lint
pnpm format
pnpm test
pnpm test:watch
pnpm test:e2e
pnpm prisma:migrate
pnpm prisma:studio
pnpm clean

## Qualité & Tests

- ESLint + Prettier
- Commitlint + Husky + lint-staged
- Tests unitaires: Vitest / Jest
- Tests RN: Jest + React Native Testing Library
- E2E backend: Supertest
- E2E mobile (phase 2): Detox
- Couverture cible: 80%

## Structure du code

Arborescence (monorepo PNPM + Turborepo) — prévisionnelle (sera créée incrémentalement):

/
apps/
mobile/ # App React Native (Expo)
backend/ # API Node (NestJS ou Express modulaire)
packages/
core/ # Logique métier partagée (agrégation + normalisation médias, règles listes/statuts, reco basique; phases futures: social, swipe, lieux/événements)
ui/ # Design System / composants RN réutilisables
utils/ # Helpers transverses (dates, HTTP, cache keys)
config/ # Config centralisée (eslint, prettier, jest, tsup, env schemas)
tsconfig/ # Bases TS (tsconfig.base.json + variantes)
prisma/ # schema.prisma, migrations, seed
docs/ # ADR, diagrammes, specs API, roadmap détaillée
tools/ # Scripts (codegen API client, ingestion, jobs cron)
.github/ # Workflows CI, templates issues/PR
.env.example
turbo.json
pnpm-workspace.yaml

Séparation des responsabilités:

- apps/mobile: Couche présentation + orchestration UX. Consomme le domaine via API + (léger) code partagé core (types).  
   Structure indicative:  
   mobile/src/
  navigation/
  screens/ (search, mediaDetail, lists, profile, discovery, events (phase 4))
  features/ (search, lists, auth, recommendations, social (phase 2), swipe (phase 3))
  store/ (Zustand ou Redux slices)
  services/api/ (client généré + hooks)
  components/
  theme/
  hooks/
  utils/
  assets/
- apps/backend: Modules métiers isolés.  
   backend/src/
  modules/
  auth/
  users/
  media/ (adapters: tmdb, spotify, books)
  lists/
  consumption/
  recommendations/
  social/ (phase 2)
  discovery/ (swipe engine, phase 3)
  places/ (phase 4)
  events/ (phase 4)
  common/ (infra: db, cache, config, guards)
  jobs/ (cron trending, rafraîchissement métadonnées)
  interfaces/ (DTO, mappers)
  main.ts

packages/core (domaine pur):

- Entités / value objects: User, Media(movie|series|track|album|book), List, ListItem, ConsumptionEntry, RecommendationContext, SwipePreference, Place (phase 4), Event (phase 4)
- Services: MediaAggregator (fan‑in TMDB/Spotify/Books), MediaNormalizer, RecommendationService (popularité + similarité simple), ListService, StatusService
- Extensions futures: SocialGraphService (phase 2), SwipeScoring (phase 3), GeoMappingService (phase 4)
- Pas de dépendance framework; testable isolément.

Flux média (Temps 1):

Sources externes -> Adapters (backend) -> Normalisation (core) -> Persistence (Prisma) -> Exposition API / Recos -> Mobile (cache local + affichage).

Évolution par phases:

- Phase 2: Ajout modules social + extension core (graph).
- Phase 3: Feature discovery (swipe) dans core + module backend discovery.
- Phase 4: Ajout entités Place/Event + services géo (option PostGIS) + endpoints filtrés.

Observabilité / cross-cutting:

- Logging, metrics, tracing dans backend/common (middlewares + interceptors)
- Feature flags: table interne + guard côté backend; mobile lit flags /api/flags.
- Sécurité: Auth middleware (JWT), rate limiting Redis, validation schémas (zod / class-validator).

Tests:

- Unit: core (100% ciblé sur logique pure)
- Intégration backend: modules + DB (prisma test env)
- E2E API: Supertest / contract (OpenAPI snapshot)
- Mobile: component + feature tests (RTL), e2e Detox (phase 2+)

Règles contribution code:

- Nouveau domaine → d’abord dans core si logique pure
- Aucune logique métier durable dans components / controllers
- Adapters externes minces (mapping → core)

Cette structure facilite:

- Partage logique multi‑phases
- Scalabilité (ajout futures sources / lieux)
- Tests rapides (core sans runtime RN / Nest)
- Déploiement ciblé (apps découplées)

## API / Data Model

Endpoints (exemples – v1 effectifs puis phases):
POST /auth/signup
POST /auth/login
GET /users/me
GET /catalog/search?q=&types=movie,series,music,book
POST /lists
POST /lists/:id/items
PATCH /entries/:id (status, rating)
GET /recommendations
POST /friends/:id (phase 2)
POST /swipe (phase 3)
GET /places?city=&type=cinema,museum (phase 4)
GET /events?city=&mediaId= (phase 4)
POST /events/:id/checkin (phase 4)
POST /events/:id/wishlist (phase 4)

Schémas (draft):
User(id, email, username, avatarUrl, createdAt)
Media(id, externalId, source, type[movie|series|track|album|book], title, year, coverUrl, meta JSON)
List(id, userId, name, visibility, createdAt)
ListItem(id, listId, mediaId, addedAt, note)
ConsumptionEntry(id, userId, mediaId, status, rating, consumedAt, createdAt)
Friendship(id, userId, friendId, status)
SwipeEvent(id, userId, mediaId, direction, createdAt)
Place(id, externalId, name, type[cinema|venue|museum|bookstore|festival_site], city, lat, lng, meta JSON, createdAt) (phase 4)
Event(id, placeId, mediaId?, title, startsAt, endsAt?, city, source, meta JSON, createdAt) (phase 4)
EventAttendance(id, eventId, userId, status[wishlist|checked_in], createdAt) (phase 4)

Versionnage: /api/v1

## Roadmap

Temps 1 (Core):

- [ ] Auth email + JWT
- [ ] Recherche unifiée multi‑source
- [ ] Listes + statuts + notes
- [ ] Recos basiques (popularité + similarité simple)
- [ ] Cache offline basique

Temps 2 (Social):

- [ ] Amis / follow
- [ ] Listes collaboratives
- [ ] Suggestions amis / contenus
- [ ] Fil d’activité

Temps 3 (Jeu / Discovery):

- [ ] Swipe engine
- [ ] Algorithme affinage préférences
- [ ] Gamification (badges / progression)

Temps 4 (Lieux & Événements):

- [ ] Modèle lieux + ingestion APIs
- [ ] Recherche géolocalisée
- [ ] Événements liés aux médias
- [ ] Check‑ins + wishlist
- [ ] Partage événements entre amis

Long terme:

- [ ] Mode TV app
- [ ] Extension navigateur (ajout rapide)
- [ ] Recommandations avancées (embedding / ML léger)
- [ ] Notifications intelligentes événementielles (Temps 4+)
- [ ] Suggestions voyages culturels (agrégation multi‑villes)

## Contribuer

1. Fork + clone
2. Branche: feat/"description"
3. Commits: type(scope): sujet
4. Vérifier tests + lint
5. PR avec template

Types: feat, fix, chore, docs, refactor, test, perf, ci

Checklist PR:

- [ ] Description claire
- [ ] Tests ajoutés/MAJ
- [ ] Lint OK
- [ ] Docs à jour
- [ ] Pas de secret

## Sécurité

Signaler vulnérabilité: <security@exemple.com>  
Divulgation responsable. Dépendances scannées en CI.

## Déploiement

CI: GitHub Actions (lint, test, build)  
Docker multi-stage backend  
Migrations: pnpm prisma:migrate deploy  
SemVer + tags Git  
Envs: staging / production  
Mobile: EAS (build & submit)  
Feature flags (activation progressive nouvelles phases)

## Observabilité

Logs: Pino JSON  
Tracing: OpenTelemetry (opt)  
Metrics: Prometheus  
Crash reporting: Sentry (mobile + backend)  
Alerting: Grafana / Healthchecks

## FAQ

Q: Pourquoi multi‑médias puis lieux ?  
R: Relier goûts et expériences physiques.  
Q: Comptes API requis ?  
R: Oui (TMDB, Spotify, livres, puis événements/lieux).  
Q: Différence listes vs statut ?  
R: Statut = progression; listes = organisation libre.

## Licence

MIT choisie (simplicité adoption). Ajouter fichier LICENSE séparé avant publication.

## Contact

Mainteneur:

- Nom (GitHub: @ybdn) - email(incoming)
  Issues pour bogues / idées.

## Crédits

Données: TMDB, Spotify, Open Library / Google Books (+ fournisseurs lieux/événements phase 4)  
Librairies: React Native, React Navigation, Zustand/Redux, Prisma, NestJS/Express

## Annexes

- Diagrammes: /docs/diagrams
- ADR: /docs/adr
- Changelog: CHANGELOG.md
- Performance: caching multi‑source + normalisation interne
- Politique versions mobile: SemVer + OTA
- Privacy: à rédiger (stockage, géolocalisation consentie phase 4)

---

Remplacer placeholders restants avant publication.
