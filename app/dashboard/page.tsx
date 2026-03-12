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
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalCompanies,
    totalApplicationsSent,
    totalInterviews,
    actionsDueTodayOrOverdue,
    companiesNearestDeadlines,
    highInterestNotAdvanced,
    entryPointsFollowUp,
    applicationsWithActions,
    upcomingInterviews,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.application.count({
      where: { status: { in: SENT_APPLICATION_STATUSES } },
    }),
    prisma.interview.count(),
    prisma.action.findMany({
      where: {
        status: { in: ["TODO", "IN_PROGRESS"] },
        OR: [
          { dueDate: { lt: today } },
          { dueDate: { gte: today, lt: tomorrow } },
        ],
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: 10,
      include: {
        company: { select: { id: true, name: true } },
      },
    }),
    prisma.company.findMany({
      where: { status: { not: "CLOSED" } },
      orderBy: [{ deadline: "asc" }],
      take: 8,
      select: {
        id: true,
        name: true,
        deadline: true,
        personalInterest: true,
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
    prisma.entryPoint.findMany({
      where: {
        status: { not: "CLOSED" },
        nextActionDate: { not: null },
      },
      orderBy: { nextActionDate: "asc" },
      take: 8,
      include: {
        company: { select: { id: true, name: true } },
      },
    }),
    prisma.application.findMany({
      where: {
        status: {
          notIn: ["REJECTED", "OFFER", "WITHDRAWN"],
        },
        nextActionDate: { not: null },
      },
      orderBy: { nextActionDate: "asc" },
      take: 8,
      include: {
        company: { select: { id: true, name: true } },
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
          {/* 1. Actions due today or overdue — main execution block */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Actions dues aujourd&apos;hui ou en retard
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Priorité immédiate
              </p>
            </CardHeader>
            <CardContent>
              {actionsDueTodayOrOverdue.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune action urgente.
                </p>
              ) : (
                <ul className="space-y-2">
                  {actionsDueTodayOrOverdue.map((a) => {
                    const overdue = a.dueDate && a.dueDate < today;
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
                                  overdue
                                    ? "ml-2 font-medium text-destructive"
                                    : "ml-2 font-medium text-amber-600 dark:text-amber-500"
                                }
                              >
                                {formatDateFr(a.dueDate)}
                                {overdue && " (en retard)"}
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

          {/* Companies with nearest deadlines */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Échéances entreprises
              </CardTitle>
            </CardHeader>
            <CardContent>
              {companiesNearestDeadlines.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune échéance à afficher.
                </p>
              ) : (
                <ul className="space-y-2">
                  {companiesNearestDeadlines.map((c) => {
                    const overdue = isOverdue(c.deadline);
                    const imminent = isUpcomingIn7Days(c.deadline);
                    return (
                      <li key={c.id}>
                        <Link
                          href={`/companies/${c.id}`}
                          className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                        >
                          <span>
                            {c.name}
                            {c.deadline && (
                              <span
                                className={
                                  overdue
                                    ? " ml-2 font-medium text-destructive"
                                    : imminent
                                      ? " ml-2 font-medium text-amber-600 dark:text-amber-500"
                                      : " ml-2 text-muted-foreground"
                                }
                              >
                                — {formatDateFr(c.deadline)}
                                {overdue && " (en retard)"}
                                {imminent && !overdue && " (proche)"}
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
                href="/companies"
                className="mt-3 flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                Voir toutes les entreprises <ChevronRight className="size-4" />
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

          {/* 3. Entry points needing follow-up */}
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
              {entryPointsFollowUp.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun suivi planifié.
                </p>
              ) : (
                <ul className="space-y-2">
                  {entryPointsFollowUp.map((ep) => {
                    const overdue = isOverdue(ep.nextActionDate);
                    const imminent = isUpcomingIn7Days(ep.nextActionDate);
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
                            {ep.nextActionDate && (
                              <span
                                className={
                                  overdue
                                    ? " ml-2 font-medium text-destructive"
                                    : imminent
                                      ? " ml-2 font-medium text-amber-600"
                                      : " ml-2 text-muted-foreground"
                                }
                              >
                                {formatRelativeDateFr(ep.nextActionDate)}
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

          {/* Applications with upcoming or overdue next actions */}
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
              {applicationsWithActions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune action planifiée.
                </p>
              ) : (
                <ul className="space-y-2">
                  {applicationsWithActions.map((app) => {
                    const overdue = isOverdue(app.nextActionDate);
                    const imminent = isUpcomingIn7Days(app.nextActionDate);
                    return (
                      <li key={app.id}>
                        <Link
                          href={`/applications/${app.id}/edit`}
                          className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                        >
                          <span>
                            {app.company.name}
                            <span className="ml-2 text-muted-foreground">
                              — {app.roleTitle} •{" "}
                              {APPLICATION_STATUS_LABELS[app.status as ApplicationStatus]}
                            </span>
                            {app.nextActionDate && (
                              <span
                                className={
                                  overdue
                                    ? " ml-2 font-medium text-destructive"
                                    : imminent
                                      ? " ml-2 font-medium text-amber-600"
                                      : " ml-2 text-muted-foreground"
                                }
                              >
                                {formatRelativeDateFr(app.nextActionDate)}
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
