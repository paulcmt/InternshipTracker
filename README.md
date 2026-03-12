# InternshipTracker

Outil personnel de suivi de recherche de stage — CRM local-first pour candidatures et entretiens.

## Objectif

Gérer le flux complet de recherche de stage : entreprises ciblées, points d'entrée (recruteurs, alumni, offres), candidatures et entretiens. Interface en français, données stockées localement.

## Stack

- **Framework** : Next.js 16 (App Router)
- **Langage** : TypeScript
- **Base** : Prisma + SQLite (better-sqlite3)
- **UI** : React 19, Tailwind CSS 4, shadcn/ui, Lucide icons
- **Validation** : Zod

## Prérequis

- Node.js 20+
- npm

## Installation et démarrage

```bash
# 1. Installer les dépendances
npm install

# 2. Copier la configuration (optionnel, valeur par défaut)
# Le fichier .env contient : DATABASE_URL="file:./prisma/dev.db"

# 3. Générer le client Prisma
npm run db:generate

# 4. Appliquer les migrations et ensemencer
npm run db:migrate
npm run db:seed

# 5. Lancer l'application
npm run dev
```

L'application est accessible uniquement sur la machine locale :

- **Dev** : `npm run dev` → [http://localhost:3000](http://localhost:3000)
- **Prod** : `npm run build` puis `npm run start` → [http://localhost:3000](http://localhost:3000)

Le serveur écoute uniquement sur `127.0.0.1` (localhost). L'app n'est pas accessible depuis le réseau local (LAN).

## Flux Prisma

### Résumé

- **Schéma** : `prisma/schema.prisma`
- **Migration baseline** : une seule migration `init` représente le schéma actuel
- **Base locale** : `prisma/dev.db` (SQLite, fichier ignoré par Git)

### Commandes principales

| Commande | Description |
|----------|-------------|
| `npm run db:generate` | Régénère le client Prisma après modification du schema |
| `npm run db:migrate` | Applique les migrations (ou en crée une nouvelle si le schema a changé) |
| `npm run db:seed` | Ensemence la base avec des données de démonstration |
| `npm run db:reset` | Supprime la base, réapplique les migrations, réexécute le seed |

### Migrations

```bash
# Appliquer les migrations (nouvelle install ou après pull)
npm run db:migrate

# Créer une nouvelle migration après modification du schema
npx prisma migrate dev --name nom_de_la_migration

# Appliquer sans créer (prod)
npx prisma migrate deploy
```

### Reset local (DB vide + reseed)

```bash
npm run db:reset
```

Équivalent à : `prisma migrate reset --force` puis `prisma db seed`. Utile pour repartir sur une base propre avec les données de démo.

### Seed

Le seed crée des entreprises (Mistral, Datadog, DeepMind, OpenAI, G42, Hugging Face) avec deadlines variées, actions, candidatures et entretiens de démonstration.

```bash
# Lancer le seed seul (après reset ou base vide)
npm run db:seed
```

### Reset complet (DB + migrations, pour squasher)

Si vous devez recréer la migration baseline depuis le schema actuel :

```bash
rm -f prisma/dev.db prisma/dev.db-journal
rm -rf prisma/migrations/20*
npx prisma migrate dev --name init
npm run db:seed
```

## Architecture

```text
app/
  companies/       # CRUD entreprises (liste, détail, new, edit)
  entry-points/    # CRUD points d'entrée
  applications/   # CRUD candidatures
  interviews/      # CRUD entretiens
  dashboard/       # Vue synthèse (KPIs, échéances, actions)
  layout.tsx       # Layout global avec sidebar
components/
  layout/          # TopNavBar, PageLayout, PageHeader
  tables/          # Tableaux avec filtres (companies, entry-points, applications, interviews)
  forms/           # Formulaires réutilisables (company-form, etc.)
  ui/              # shadcn/ui
lib/
  db/              # Client Prisma
  validations/     # Schémas Zod ( company, entry-point, application, interview )
  utils/           # formatDateFr, enums → labels FR
prisma/
  schema.prisma    # Modèles Company, EntryPoint, Application, Interview
  seed.ts          # Données de démonstration
```

### Données

- **Company** : nom, statut, intérêt personnel (1–10), deadline, etc.
- **EntryPoint** : lié à Company (Cascade), type (JOB_POSTING, RECRUITER, …), statut, prochaine action
- **Application** : liée à Company (Cascade) et optionnellement EntryPoint (SetNull)
- **Interview** : lié à Company et Application (Cascade)

### Revalidation

Les actions serveur (create/update/delete) appellent `revalidatePath` sur les routes concernées pour éviter les pages obsolètes après mutations.
