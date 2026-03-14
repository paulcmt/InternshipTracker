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
- **Migrations** : une seule migration baseline `20260314100000_baseline` dans `prisma/migrations/`. Les changements de schéma futurs ajoutent de nouvelles migrations au-dessus de cette base.
- **Base locale** : `prisma/dev.db` (SQLite, fichier ignoré par Git)

### Commandes principales

| Commande | Description |
|----------|-------------|
| `npm run db:generate` | Régénère le client Prisma après modification du schema |
| `npm run db:backup` | Sauvegarde la base SQLite dans `prisma/backups/` (avec timestamp) |
| `npm run db:restore:latest` | Restaure la base depuis la sauvegarde la plus récente |
| `npm run db:migrate:backup` | Applique les migrations sur une copie de backup (base principale non modifiée) |
| `npm run db:migrate` | Applique les migrations (ou en crée une nouvelle si le schema a changé) |
| `npm run db:migrate:safe` | **Backup puis** migration — à utiliser si vous avez des données à préserver |
| `npm run db:seed` | Ensemence la base avec des données de démonstration |
| `npm run db:seed:safe` | **Backup puis** seed — le seed écrase les données existantes |
| `npm run db:reset` | Supprime la base, réapplique les migrations, réexécute le seed |
| `npm run db:reset:safe` | **Backup puis** reset — pour repartir proprement sans perdre les données |

### Sauvegarde avant opérations destructives

Avant tout reset, seed ou migration risquée, créez une sauvegarde :

```bash
npm run db:backup
```

Les sauvegardes sont stockées dans `prisma/backups/` avec un nom du type `dev-2025-03-12T14-30-00.db`.

**Restaurer la sauvegarde la plus récente :**

```bash
npm run db:restore:latest
```

Le script sauvegarde automatiquement la base actuelle avant d’écraser, puis restaure le fichier le plus récent dans `prisma/backups/`.

**Restaurer une sauvegarde précise (manuel) :**

```bash
cp prisma/backups/dev-2025-03-12T14-30-00.db prisma/dev.db
rm -f prisma/dev.db-journal
```

**Appliquer les migrations sur une copie de sauvegarde (sans toucher à la base principale) :**

Pour vérifier que les migrations s’appliquent correctement sur un backup, ou pour obtenir une copie à jour à partir d’un ancien backup :

```bash
npm run db:migrate:backup
```

- Utilise par défaut le **dernier** fichier `.db` dans `prisma/backups/` (le plus récent en date).
- Copie ce backup vers `prisma/backups/migrate-target.db`, puis exécute `prisma migrate deploy` en pointant uniquement vers ce fichier (via `DATABASE_URL`).
- La base principale (`prisma/dev.db`) n’est **jamais** modifiée.

Pour cibler un backup précis :

```bash
npx tsx scripts/migrate-backup-db.ts prisma/backups/dev-2025-03-12T14-30-00.db
```

Le résultat migré se trouve dans `prisma/backups/migrate-target.db` (écrasé à chaque run).

Vérification rapide : après `db:migrate:backup`, ouvrir `prisma/backups/migrate-target.db` avec un outil SQLite ou lancer l’app avec `DATABASE_URL="file:./prisma/backups/migrate-target.db" npm run dev` pour contrôler schéma et données.

**Quand utiliser les commandes « safe » :**
- `db:migrate:safe` — avant une migration si vous avez des données manuelles importantes
- `db:seed:safe` — le seed écrase tout ; utilisez `db:seed:safe` si vous voulez garder une copie
- `db:reset:safe` — avant un reset complet

### Migrations

- **Une seule migration baseline** : `prisma/migrations/20260314100000_baseline/` contient le schéma complet. Une nouvelle base (ou un clone) applique uniquement cette migration.

```bash
# Appliquer les migrations (nouvelle install ou base vide)
npm run db:migrate
# ou en déploiement : npx prisma migrate deploy

# Après modification du schema : créer une nouvelle migration (s’ajoute après la baseline)
npx prisma migrate dev --name description_du_changement
```

La base actuelle `prisma/dev.db` reste inchangée ; les prochaines migrations s’appliquent par-dessus la baseline.

### Reset local (DB vide + reseed)

```bash
npm run db:reset
```

Équivalent à : `prisma migrate reset --force` puis `prisma db seed`. Utile pour repartir sur une base propre avec les données de démo.

### Seed

Le seed crée des entreprises (Mistral, Datadog, DeepMind, OpenAI, G42, Hugging Face) avec actions, candidatures et entretiens de démonstration.

```bash
# Lancer le seed seul (après reset ou base vide)
npm run db:seed
```

### Réinitialiser une base (sans toucher aux fichiers de migration)

Pour repartir d’une base vide avec le schéma actuel (baseline + éventuelles migrations) :

```bash
npm run db:reset
```

Cela exécute `prisma migrate reset`, réapplique toutes les migrations (baseline puis les suivantes) et lance le seed. **Ne modifie pas** le contenu du dossier `prisma/migrations/`.

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

- **Company** : nom, statut, intérêt personnel (1–10), etc.
- **EntryPoint** : lié à Company (Cascade), type (JOB_POSTING, RECRUITER, …), statut, prochaine action
- **Application** : liée à Company (Cascade) et optionnellement EntryPoint (SetNull)
- **Interview** : lié à Company et Application (Cascade)

### Revalidation

Les actions serveur (create/update/delete) appellent `revalidatePath` sur les routes concernées pour éviter les pages obsolètes après mutations.
