import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import {
  Pencil,
  DoorOpen,
  FileText,
  Users,
  ExternalLink,
  Plus,
  ListTodo,
} from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import {
  COMPANY_STATUS_LABELS,
  ENTRY_POINT_TYPE_LABELS,
  ENTRY_POINT_STATUS_LABELS,
  APPLICATION_STATUS_LABELS,
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_STATUS_LABELS,
  ACTION_STATUS_LABELS,
  ACTION_PRIORITY_LABELS,
} from "@/lib/utils/enums";
import { formatDateFr, formatDateTimeFr } from "@/lib/utils/date";
import { isOverdue, isUpcomingIn7Days } from "@/lib/utils/dates";
import type { CompanyStatus } from "@prisma/client";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      entryPoints: {
        include: {
          actions: {
            where: { status: { in: ["TODO", "IN_PROGRESS"] } },
            orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
          },
        },
      },
      applications: {
        include: {
          interviews: true,
          entryPoint: true,
          actions: {
            where: { status: { in: ["TODO", "IN_PROGRESS"] } },
            orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
          },
        },
      },
      interviews: { include: { application: true } },
      actions: true,
    },
  });

  if (!company) notFound();

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <PageHeader
          title={company.name}
          description={
            [company.city, company.country].filter(Boolean).join(", ") || "—"
          }
        >
          <Button asChild variant="outline" size="sm">
            <Link href={`/companies/${company.id}/edit`}>
              <Pencil className="size-4" />
              Modifier
            </Link>
          </Button>
        </PageHeader>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-sm text-muted-foreground">Statut</span>
                  <p>
                    <StatusBadge
                      label={COMPANY_STATUS_LABELS[company.status as CompanyStatus]}
                      variant={
                        company.status === "CLOSED"
                          ? "secondary"
                          : company.status === "PROCESS_IN_PROGRESS"
                            ? "default"
                            : "outline"
                      }
                    />
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Taille</span>
                  <p className="font-medium">{company.sizeEstimate ?? "—"}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Intérêt personnel
                  </span>
                  <p className="font-medium">{company.personalInterest}/10</p>
                </div>
                {company.careersUrl && (
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Site carrières
                    </span>
                    <p>
                      <a
                        href={company.careersUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        Lien <ExternalLink className="size-3" />
                      </a>
                    </p>
                  </div>
                )}
                {company.linkedinUrl && (
                  <div>
                    <span className="text-sm text-muted-foreground">
                      LinkedIn
                    </span>
                    <p>
                      <a
                        href={company.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        Lien <ExternalLink className="size-3" />
                      </a>
                    </p>
                  </div>
                )}
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Note</span>
                <p className="mt-1 text-sm">
                  {company.notes ? (
                    <span className="whitespace-pre-wrap">{company.notes}</span>
                  ) : (
                    <span className="text-muted-foreground">
                      Aucune note pour le moment
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Historique des actions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Historique des actions</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href={`/actions/new?companyId=${company.id}`}>
                  <Plus className="size-4" />
                  Créer une action
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {company.actions.length > 0 ? (
                <ul className="space-y-3">
                  {company.actions
                    .sort((a, b) => {
                      return (
                        b.createdAt.getTime() - a.createdAt.getTime()
                      );
                    })
                    .map((a) => {
                      const overdue =
                        a.dueDate &&
                        a.status !== "DONE" &&
                        a.status !== "CANCELED" &&
                        isOverdue(a.dueDate);
                      const imminent =
                        a.dueDate &&
                        a.status !== "DONE" &&
                        !overdue &&
                        isUpcomingIn7Days(a.dueDate);
                      return (
                        <li
                          key={a.id}
                          className="flex items-center justify-between rounded-md border p-3"
                        >
                          <div className="flex-1 space-y-1">
                            <p className="font-medium">{a.title}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                              <StatusBadge
                                label={ACTION_STATUS_LABELS[a.status]}
                                variant={
                                  a.status === "DONE"
                                    ? "secondary"
                                    : a.status === "IN_PROGRESS"
                                      ? "default"
                                      : a.status === "CANCELED"
                                        ? "outline"
                                        : "outline"
                                }
                              />
                              <StatusBadge
                                label={ACTION_PRIORITY_LABELS[a.priority]}
                                variant={
                                  a.priority === "HIGH"
                                    ? "destructive"
                                    : a.priority === "MEDIUM"
                                      ? "default"
                                      : "secondary"
                                }
                              />
                              {a.dueDate && (
                                <span
                                  className={
                                    overdue
                                      ? "font-medium text-destructive"
                                      : imminent
                                        ? "font-medium text-amber-600 dark:text-amber-500"
                                        : ""
                                  }
                                >
                                  {formatDateFr(a.dueDate)}
                                  {overdue && " (en retard)"}
                                  {imminent && !overdue && " (proche)"}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Créée le {formatDateTimeFr(a.createdAt)}
                              {a.completedAt && (
                                <>
                                  {" "}
                                  • Terminée le{" "}
                                  {formatDateTimeFr(a.completedAt)}
                                </>
                              )}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/actions/${a.id}/edit`}>
                              <Pencil className="size-4" />
                            </Link>
                          </Button>
                        </li>
                      );
                    })}
                </ul>
              ) : (
                <EmptyState
                  icon={<ListTodo className="size-6" />}
                  title="Aucune action"
                  description="Créez une action pour suivre les prochaines étapes avec cette entreprise."
                >
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/actions/new?companyId=${company.id}`}>
                      <Plus className="size-4" />
                      Créer une action
                    </Link>
                  </Button>
                </EmptyState>
              )}
            </CardContent>
          </Card>

        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Points d'entrée liés */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Points d&apos;entrée liés</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/entry-points/new?companyId=${company.id}`}
                >
                  <Plus className="size-4" />
                  Ajouter
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {company.entryPoints.length > 0 ? (
                <ul className="space-y-3">
                  {company.entryPoints.map((ep) => {
                    const nextAction = ep.actions[0];
                    const epOverdue = nextAction?.dueDate && isOverdue(nextAction.dueDate);
                    const epImminent =
                      nextAction?.dueDate &&
                      !epOverdue &&
                      isUpcomingIn7Days(nextAction.dueDate);
                    return (
                      <li
                        key={ep.id}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {ENTRY_POINT_TYPE_LABELS[ep.type]}
                            {ep.personName && ` — ${ep.personName}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {ENTRY_POINT_STATUS_LABELS[ep.status]}
                            {nextAction?.title && ` • ${nextAction.title}`}
                            {nextAction?.dueDate && (
                              <span
                                className={
                                  epOverdue
                                    ? " font-medium text-destructive"
                                    : epImminent
                                      ? " font-medium text-amber-600 dark:text-amber-500"
                                      : ""
                                }
                              >
                                {" "}
                                • {formatDateFr(nextAction.dueDate)}
                                {epOverdue && " (en retard)"}
                                {epImminent && !epOverdue && " (proche)"}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link href={`/entry-points/${ep.id}/edit`}>
                              <Pencil className="size-4" />
                            </Link>
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  icon={<DoorOpen className="size-6" />}
                  title="Aucun point d'entrée"
                  description="Ajoutez des recruteurs, alumni ou offres pour cette entreprise."
                >
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/entry-points/new?companyId=${company.id}`}>
                      <Plus className="size-4" />
                      Ajouter un point d'entrée
                    </Link>
                  </Button>
                </EmptyState>
              )}
            </CardContent>
          </Card>

          {/* Candidatures liées */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Candidatures liées</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href={`/applications/new?companyId=${company.id}`}>
                  <Plus className="size-4" />
                  Ajouter
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {company.applications.length > 0 ? (
                <ul className="space-y-3">
                  {company.applications.map((app) => {
                    const nextAction = app.actions[0];
                    const appOverdue =
                      nextAction?.dueDate && isOverdue(nextAction.dueDate);
                    const appImminent =
                      nextAction?.dueDate &&
                      !appOverdue &&
                      isUpcomingIn7Days(nextAction.dueDate);
                    return (
                      <li
                        key={app.id}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            <Link
                              href={`/applications/${app.id}`}
                              className="hover:underline"
                            >
                              {app.roleTitle}
                            </Link>
                          </p>
                          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <StatusBadge
                              label={APPLICATION_STATUS_LABELS[app.status]}
                              variant="outline"
                            />
                            {app.entryPoint &&
                              `${ENTRY_POINT_TYPE_LABELS[app.entryPoint.type]}`}
                            {app.appliedAt &&
                              `Envoyée le ${formatDateFr(app.appliedAt)}`}
                            {nextAction?.title && nextAction.title}
                            {nextAction?.dueDate && (
                              <span
                                className={
                                  appOverdue
                                    ? "font-medium text-destructive"
                                    : appImminent
                                      ? "font-medium text-amber-600 dark:text-amber-500"
                                      : ""
                                }
                              >
                                {formatDateFr(nextAction.dueDate)}
                                {appOverdue && " (en retard)"}
                                {appImminent && !appOverdue && " (proche)"}
                              </span>
                            )}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/applications/${app.id}/edit`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  icon={<FileText className="size-6" />}
                  title="Aucune candidature"
                  description="Les candidatures pour cette entreprise apparaîtront ici."
                >
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/applications/new?companyId=${company.id}`}>
                      <Plus className="size-4" />
                      Ajouter une candidature
                    </Link>
                  </Button>
                </EmptyState>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          {/* Entretiens liés */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Entretiens liés</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href={`/interviews/new?companyId=${company.id}`}>
                  <Plus className="size-4" />
                  Ajouter
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {company.interviews.length > 0 ? (
                <ul className="space-y-3">
                  {company.interviews.map((int) => {
                    const intUpcoming =
                      int.scheduledAt &&
                      isUpcomingIn7Days(int.scheduledAt);
                    return (
                      <li
                        key={int.id}
                        className={`flex items-center justify-between rounded-md border p-3 ${intUpcoming ? "border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20" : ""}`}
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {INTERVIEW_TYPE_LABELS[int.interviewType]}
                            {int.interviewerName && ` — ${int.interviewerName}`}
                          </p>
                          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <StatusBadge
                              label={INTERVIEW_STATUS_LABELS[int.status]}
                              variant="outline"
                            />
                            {int.scheduledAt && (
                              <span
                                className={
                                  intUpcoming
                                    ? "font-semibold text-amber-700 dark:text-amber-400"
                                    : ""
                                }
                              >
                                {formatDateTimeFr(int.scheduledAt)}
                                {intUpcoming && " (à venir)"}
                              </span>
                            )}
                            {int.application && (
                              <Link
                                href={`/applications/${int.application.id}`}
                                className="hover:underline"
                              >
                                {int.application.roleTitle}
                              </Link>
                            )}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/interviews/${int.id}/edit`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  icon={<Users className="size-6" />}
                  title="Aucun entretien"
                  description="Les entretiens planifiés apparaîtront ici."
                >
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/interviews/new?companyId=${company.id}`}>
                      <Plus className="size-4" />
                      Ajouter un entretien
                    </Link>
                  </Button>
                </EmptyState>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
