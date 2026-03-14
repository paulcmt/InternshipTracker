#!/usr/bin/env npx tsx
/**
 * Applies current Prisma migrations to a copy of a backup DB, without touching
 * the main database (prisma/dev.db). Use this to verify migrations on backup
 * data or to produce an up-to-date copy from an old backup.
 *
 * Workflow:
 * 1. Copy backup DB to a working path (prisma/backups/migrate-target.db).
 * 2. Set DATABASE_URL to that path for the duration of the command.
 * 3. Run `prisma migrate deploy` against that copy only.
 *
 * The main DB is never read or written; Prisma is pointed at the copy via env.
 */

import "dotenv/config";
import { execSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { resolve } from "node:path";

const backupsDir = resolve(process.cwd(), "prisma", "backups");
const targetFileName = "migrate-target.db";
const targetPath = resolve(backupsDir, targetFileName);
const targetJournalPath = targetPath.replace(/\.db$/, ".db-journal");

const mainDbUrl = process.env["DATABASE_URL"] ?? "file:./prisma/dev.db";
const mainDbPath = (() => {
  const m = mainDbUrl.match(/^file:(.+)$/);
  if (!m) return null;
  return resolve(process.cwd(), m[1].trim().replace(/^\.\//, ""));
})();

function getBackupToUse(): string {
  const arg = process.argv[2];
  if (arg) {
    const candidate = resolve(process.cwd(), arg);
    if (!existsSync(candidate)) {
      console.error("migrate-backup-db: File not found:", candidate);
      process.exit(1);
    }
    return candidate;
  }
  if (!existsSync(backupsDir)) {
    console.error("migrate-backup-db: No backup folder at", backupsDir);
    process.exit(1);
  }
  const dbFiles = readdirSync(backupsDir)
    .filter((f) => f.endsWith(".db") && f !== targetFileName)
    .map((f) => resolve(backupsDir, f))
    .filter((f) => statSync(f).isFile());
  if (dbFiles.length === 0) {
    console.error("migrate-backup-db: No backup .db files in", backupsDir);
    process.exit(1);
  }
  dbFiles.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return dbFiles[0];
}

function main() {
  const sourceBackup = getBackupToUse();
  console.log("migrate-backup-db: Source backup:", sourceBackup);
  console.log("migrate-backup-db: Target (migrated copy):", targetPath);

  mkdirSync(backupsDir, { recursive: true });
  copyFileSync(sourceBackup, targetPath);
  if (existsSync(targetJournalPath)) {
    unlinkSync(targetJournalPath);
  }

  const databaseUrl = `file:${targetPath}`;
  const env = { ...process.env, DATABASE_URL: databaseUrl };

  try {
    execSync("npx prisma migrate deploy", {
      env,
      stdio: "inherit",
      cwd: process.cwd(),
    });
  } catch {
    process.exit(1);
  }

  console.log("migrate-backup-db: Done. Migrated copy at:", targetPath);
  if (mainDbPath) {
    console.log("migrate-backup-db: Main DB was not modified:", mainDbPath);
  }
}

main();
