#!/usr/bin/env npx tsx
/**
 * Restores the SQLite database from the most recent backup in prisma/backups/.
 * Optionally backs up the current DB before overwriting.
 */

import "dotenv/config";
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

const url = process.env["DATABASE_URL"] ?? "file:./prisma/dev.db";
const match = url.match(/^file:(.+)$/);
if (!match) {
  console.error("restore-db: DATABASE_URL must be a file: URL");
  process.exit(1);
}

const dbFile = resolve(process.cwd(), match[1].trim().replace(/^\.\//, ""));
const journalFile = dbFile.replace(/\.db$/, ".db-journal");
const backupsDir = resolve(process.cwd(), "prisma", "backups");

if (!existsSync(backupsDir)) {
  console.error("restore-db: No backup folder found at", backupsDir);
  process.exit(1);
}

const dbFiles = readdirSync(backupsDir)
  .filter((f) => f.endsWith(".db"))
  .map((f) => resolve(backupsDir, f))
  .filter((f) => statSync(f).isFile());

if (dbFiles.length === 0) {
  console.error("restore-db: No backup files found in", backupsDir);
  process.exit(1);
}

// Sort by mtime, newest first
dbFiles.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
const latestBackup = dbFiles[0];

// Backup current DB before overwriting (if it exists)
if (existsSync(dbFile)) {
  console.warn(`restore-db: WARNING: About to overwrite ${dbFile} with latest backup.`);
  const preRestoreBackup = resolve(
    backupsDir,
    `pre-restore-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.db`
  );
  try {
    mkdirSync(backupsDir, { recursive: true });
    copyFileSync(dbFile, preRestoreBackup);
    console.log(`restore-db: Backed up current DB to ${preRestoreBackup}`);
  } catch (err) {
    console.error("restore-db: Failed to backup current DB:", err);
    process.exit(1);
  }
}

try {
  copyFileSync(latestBackup, dbFile);
  if (existsSync(journalFile)) {
    unlinkSync(journalFile);
  }
  console.log(`restore-db: Restored from ${latestBackup}`);
  console.log(`restore-db: Destination: ${dbFile}`);
  console.log("restore-db: Done.");
} catch (err) {
  console.error("restore-db:", err);
  process.exit(1);
}
