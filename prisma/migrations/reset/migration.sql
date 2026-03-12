-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "companyType" TEXT NOT NULL,
    "sizeEstimate" TEXT,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "careersUrl" TEXT,
    "linkedinUrl" TEXT,
    "targetRoles" TEXT NOT NULL,
    "personalInterest" INTEGER NOT NULL,
    "deadline" DATETIME,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EntryPoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "personName" TEXT,
    "personRole" TEXT,
    "linkedinUrl" TEXT,
    "email" TEXT,
    "channel" TEXT,
    "status" TEXT NOT NULL,
    "nextAction" TEXT,
    "nextActionDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EntryPoint_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "entryPointId" TEXT,
    "roleTitle" TEXT NOT NULL,
    "roleFamily" TEXT NOT NULL,
    "location" TEXT,
    "offerUrl" TEXT,
    "applicationType" TEXT NOT NULL,
    "appliedAt" DATETIME,
    "status" TEXT NOT NULL,
    "nextAction" TEXT,
    "nextActionDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Application_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Application_entryPointId_fkey" FOREIGN KEY ("entryPointId") REFERENCES "EntryPoint" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "interviewType" TEXT NOT NULL,
    "interviewerName" TEXT,
    "scheduledAt" DATETIME,
    "status" TEXT NOT NULL,
    "feedback" TEXT,
    "strengths" TEXT,
    "improvements" TEXT,
    "nextStep" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Interview_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "companyId" TEXT,
    "entryPointId" TEXT,
    "applicationId" TEXT,
    "interviewId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Action_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Action_entryPointId_fkey" FOREIGN KEY ("entryPointId") REFERENCES "EntryPoint" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Action_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Action_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
