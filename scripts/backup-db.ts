#!/usr/bin/env npx tsx
/**
 * Backs up the SQLite database before destructive operations.
 * Creates prisma/backups/ with timestamped copy of dev.db (and -journal if present).
 * Exits gracefully if no DB exists.
 */

import "dotenv/config";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const url = process.env["DATABASE_URL"] ?? "file:./prisma/dev.db";
const match = url.match(/^file:(.+)$/);
if (!match) {
  console.error("backup-db: DATABASE_URL must be a file: URL");
  process.exit(1);
}

const dbFile = resolve(process.cwd(), match[1].trim().replace(/^\.\//, ""));
const journalFile = dbFile.replace(/\.db$/, ".db-journal");

if (!existsSync(dbFile)) {
  console.log("backup-db: No database found, skipping backup.");
  process.exit(0);
}

const backupsDir = resolve(process.cwd(), "prisma", "backups");
const timestamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .slice(0, 19);
const backupBase = "dev";
const backupFile = resolve(backupsDir, `${backupBase}-${timestamp}.db`);

try {
  mkdirSync(backupsDir, { recursive: true });
  copyFileSync(dbFile, backupFile);
  if (existsSync(journalFile)) {
    copyFileSync(
      journalFile,
      resolve(backupsDir, `${backupBase}-${timestamp}.db-journal`)
    );
  }
  console.log(`backup-db: Saved to ${backupFile}`);
} catch (err) {
  console.error("backup-db:", err);
  process.exit(1);
}
