import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { PageLayout } from "@/components/layout/page-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";
import {
  formatDateFr,
  formatDateTimeFr,
  formatRelativeDateFr,
} from "@/lib/utils/date";
import { isOverdue, isUpcomingIn7Days } from "@/lib/utils/dates";
import {
  ENTRY_POINT_STATUS_LABELS,
  APPLICATION_STATUS_LABELS,
  INTERVIEW_TYPE_LABELS,
} from "@/lib/utils/enums";
import type { EntryPointStatus, ApplicationStatus } from "@prisma/client";
import { ChevronRight } from "lucide-react";
import { ActionCompleteButton } from "@/components/action-complete-button";

/**
 * KPI & Section logic (documented for clarity):
 *
 * - totalApplicationsSent: applications with status NOT IN (PREPARATION, REJECTED, OFFER, WITHDRAWN)
 *   → "Envoyées" = candidatures effectivement envoyées ou en cours de process
 *
 * - highInterestNotAdvanced: personalInterest >= 7 AND status = FIND_ENTRY_POINT
 *   → Entreprises prioritaires où on n'a pas encore trouvé de point d'entrée
 */

const SENT_APPLICATION_STATUSES: ApplicationStatus[] = [
  "SENT",
  "WAITING",
  "RESPONSE_RECEIVED",
  "HR_INTERVIEW",
  "TECHNICAL_INTERVIEW",
  "CASE_STUDY",
  "FINAL",
];

const HIGH_INTEREST_THRESHOLD = 7;

export default async function DashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalCompanies,
    totalApplicationsSent,
    totalInterviews,
    upcomingActions,
    highInterestNotAdvanced,
    entryPointActionsFollowUp,
    applicationActionsFollowUp,
    upcomingInterviews,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.application.count({
      where: { status: { in: SENT_APPLICATION_STATUSES } },
    }),
    prisma.interview.count(),
    // Upcoming actions: open only (exclude DONE, CANCELED), due today or in the future, by dueDate asc
    prisma.action.findMany({
      where: {
        status: { in: ["TODO", "IN_PROGRESS"] },
        dueDate: { gte: today },
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: 10,
      include: {
        company: { select: { id: true, name: true } },
      },
    }),
    prisma.company.findMany({
      where: {
        status: "FIND_ENTRY_POINT",
        personalInterest: { gte: HIGH_INTEREST_THRESHOLD },
      },
      orderBy: { personalInterest: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        personalInterest: true,
        _count: { select: { entryPoints: true } },
      },
    }),
    prisma.action.findMany({
      where: {
        status: { in: ["TODO", "IN_PROGRESS"] },
        dueDate: { not: null },
        entryPointId: { not: null },
      },
      orderBy: { dueDate: "asc" },
      take: 8,
      include: {
        entryPoint: {
          include: {
            company: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.action.findMany({
      where: {
        status: { in: ["TODO", "IN_PROGRESS"] },
        dueDate: { not: null },
        application: {
          status: {
            notIn: ["REJECTED", "OFFER", "WITHDRAWN"],
          },
        },
      },
      orderBy: { dueDate: "asc" },
      take: 8,
      include: {
        application: {
          include: {
            company: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.interview.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { gte: today },
      },
      orderBy: { scheduledAt: "asc" },
      take: 8,
      include: {
        company: { select: { id: true, name: true } },
        application: { select: { id: true, roleTitle: true } },
      },
    }),
  ]);

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <PageHeader
          title="Tableau de bord"
          description="Centre de contrôle opérationnel"
        />

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Entreprises" value={totalCompanies} />
          <StatCard
            title="Candidatures envoyées"
            value={totalApplicationsSent}
          />
          <StatCard title="Entretiens" value={totalInterviews} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 1. Upcoming actions: open only, due today or later, sorted by dueDate asc */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Actions à venir
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Prochaines échéances (à faire ou en cours, date aujourd&apos;hui ou ultérieure)
              </p>
            </CardHeader>
            <CardContent>
              {upcomingActions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune action à venir.
                </p>
              ) : (
                <ul className="space-y-2">
                  {upcomingActions.map((a) => {
                    const imminent = a.dueDate && isUpcomingIn7Days(a.dueDate);
                    return (
                      <li
                        key={a.id}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                      >
                        <ActionCompleteButton actionId={a.id} />
                        <Link
                          href={`/actions/${a.id}/edit`}
                          className="flex flex-1 items-center justify-between"
                        >
                          <span>
                            {a.title}
                            {a.company && (
                              <span className="ml-2 text-muted-foreground">
                                — {a.company.name}
                              </span>
                            )}
                            {a.dueDate && (
                              <span
                                className={
                                  imminent
                                    ? "ml-2 font-medium text-amber-600 dark:text-amber-500"
                                    : "ml-2 text-muted-foreground"
                                }
                              >
                                {formatDateFr(a.dueDate)}
                              </span>
                            )}
                          </span>
                          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Link
                href="/actions"
                className="mt-3 flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                Voir toutes les actions <ChevronRight className="size-4" />
              </Link>
            </CardContent>
          </Card>

          {/* High-interest companies not sufficiently advanced */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Priorité : recherche point d&apos;entrée
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Intérêt ≥{HIGH_INTEREST_THRESHOLD}/10, statut « Recherche point d&apos;entrée »
              </p>
            </CardHeader>
            <CardContent>
              {highInterestNotAdvanced.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune entreprise prioritaire en attente.
                </p>
              ) : (
                <ul className="space-y-2">
                  {highInterestNotAdvanced.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/companies/${c.id}`}
                        className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                      >
                        <span>
                          {c.name}
                          <span className="ml-2 text-muted-foreground">
                            {c.personalInterest}/10 • {c._count.entryPoints} point
                            {c._count.entryPoints > 1 ? "s" : ""} d&apos;entrée
                          </span>
                        </span>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/entry-points/new"
                className="mt-3 flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                Nouveau point d&apos;entrée <ChevronRight className="size-4" />
              </Link>
            </CardContent>
          </Card>

          {/* 3. Entry points needing follow-up (via linked actions) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Points d&apos;entrée à relancer
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Prochaine action planifiée
              </p>
            </CardHeader>
            <CardContent>
              {entryPointActionsFollowUp.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun suivi planifié.
                </p>
              ) : (
                <ul className="space-y-2">
                  {entryPointActionsFollowUp.map((a) => {
                    const ep = a.entryPoint;
                    if (!ep) return null;
                    const overdue = a.dueDate && isOverdue(a.dueDate);
                    const imminent =
                      a.dueDate && !overdue && isUpcomingIn7Days(a.dueDate);
                    return (
                      <li key={ep.id}>
                        <Link
                          href={`/entry-points/${ep.id}/edit`}
                          className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                        >
                          <span>
                            {ep.company.name}
                            <span className="ml-2 text-muted-foreground">
                              — {ENTRY_POINT_STATUS_LABELS[ep.status as EntryPointStatus]}
                            </span>
                            {a.dueDate && (
                              <span
                                className={
                                  overdue
                                    ? " ml-2 font-medium text-destructive"
                                    : imminent
                                      ? " ml-2 font-medium text-amber-600"
                                      : " ml-2 text-muted-foreground"
                                }
                              >
                                {formatRelativeDateFr(a.dueDate)}
                              </span>
                            )}
                            {a.title && (
                              <span className="ml-2 text-muted-foreground">
                                — {a.title}
                              </span>
                            )}
                          </span>
                          <ChevronRight className="size-4 text-muted-foreground" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Link
                href="/entry-points"
                className="mt-3 flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                Voir tous les points d&apos;entrée <ChevronRight className="size-4" />
              </Link>
            </CardContent>
          </Card>

          {/* Applications with upcoming or overdue next actions (via linked actions) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Candidatures — prochaines actions
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Actions planifiées (hors refusées/offres)
              </p>
            </CardHeader>
            <CardContent>
              {applicationActionsFollowUp.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune action planifiée.
                </p>
              ) : (
                <ul className="space-y-2">
                  {applicationActionsFollowUp.map((a) => {
                    const app = a.application;
                    if (!app) return null;
                    const overdue = a.dueDate && isOverdue(a.dueDate);
                    const imminent =
                      a.dueDate && !overdue && isUpcomingIn7Days(a.dueDate);
                    return (
                      <li key={app.id}>
                        <Link
                          href={`/applications/${app.id}`}
                          className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                        >
                          <span>
                            {app.company.name}
                            <span className="ml-2 text-muted-foreground">
                              — {app.roleTitle} •{" "}
                              {APPLICATION_STATUS_LABELS[app.status as ApplicationStatus]}
                            </span>
                            {a.dueDate && (
                              <span
                                className={
                                  overdue
                                    ? " ml-2 font-medium text-destructive"
                                    : imminent
                                      ? " ml-2 font-medium text-amber-600"
                                      : " ml-2 text-muted-foreground"
                                }
                              >
                                {formatRelativeDateFr(a.dueDate)}
                              </span>
                            )}
                            {a.title && (
                              <span className="ml-2 text-muted-foreground">
                                — {a.title}
                              </span>
                            )}
                          </span>
                          <ChevronRight className="size-4 text-muted-foreground" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Link
                href="/applications"
                className="mt-3 flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                Voir toutes les candidatures <ChevronRight className="size-4" />
              </Link>
            </CardContent>
          </Card>

          {/* Upcoming interviews */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Prochains entretiens
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingInterviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun entretien planifié.
                </p>
              ) : (
                <ul className="space-y-2">
                  {upcomingInterviews.map((int) => (
                    <li key={int.id}>
                      <Link
                        href={`/interviews/${int.id}/edit`}
                        className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                      >
                        <span>
                          {int.company.name}
                          <span className="ml-2 text-muted-foreground">
                            — {INTERVIEW_TYPE_LABELS[int.interviewType]}
                            {int.application &&
                              ` (${int.application.roleTitle})`}
                          </span>
                          {int.scheduledAt && (
                            <span className="ml-2 font-medium text-amber-600 dark:text-amber-500">
                              {formatDateTimeFr(int.scheduledAt)}
                            </span>
                          )}
                        </span>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/interviews"
                className="mt-3 flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                Voir tous les entretiens <ChevronRight className="size-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
