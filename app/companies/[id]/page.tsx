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
      entryPoints: true,
      applications: {
        include: { interviews: true, entryPoint: true },
      },
      interviews: { include: { application: true } },
      actions: true,
    },
  });

  if (!company) notFound();

  const deadlineOverdue = isOverdue(company.deadline);
  const deadlineImminent = isUpcomingIn7Days(company.deadline);

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

        <div className="grid gap-6">
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
                  <span className="text-sm text-muted-foreground">Type</span>
                  <p className="font-medium">{company.companyType}</p>
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
                <div>
                  <span className="text-sm text-muted-foreground">
                    Date limite
                  </span>
                  <p
                    className={
                      deadlineOverdue
                        ? "font-medium text-destructive"
                        : deadlineImminent
                          ? "font-medium text-amber-600 dark:text-amber-500"
                          : ""
                    }
                  >
                    {company.deadline
                      ? `${formatDateFr(company.deadline)}${deadlineOverdue ? " (en retard)" : deadlineImminent ? " (proche)" : ""}`
                      : "—"}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-sm text-muted-foreground">
                    Rôles cibles
                  </span>
                  <p className="font-medium">{company.targetRoles}</p>
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
            </CardContent>
          </Card>

          {/* Actions liées */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Actions liées</CardTitle>
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
                    .filter((a) => a.status !== "CANCELED")
                    .sort((a, b) => {
                      const aDate = a.dueDate?.getTime() ?? Infinity;
                      const bDate = b.dueDate?.getTime() ?? Infinity;
                      return aDate - bDate;
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
                          <div className="flex-1">
                            <p className="font-medium">{a.title}</p>
                            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              <span>
                                {ACTION_STATUS_LABELS[a.status]} •{" "}
                                {ACTION_PRIORITY_LABELS[a.priority]}
                              </span>
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

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {company.notes ? (
                <p className="whitespace-pre-wrap text-sm">{company.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucune note pour le moment.
                </p>
              )}
            </CardContent>
          </Card>

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
                    const epOverdue = isOverdue(ep.nextActionDate);
                    const epImminent = isUpcomingIn7Days(ep.nextActionDate);
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
                            {ep.nextAction &&
                              ` • ${ep.nextAction}`}
                            {ep.nextActionDate && (
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
                                • {formatDateFr(ep.nextActionDate)}
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
                    const appOverdue = isOverdue(app.nextActionDate);
                    const appImminent = isUpcomingIn7Days(app.nextActionDate);
                    return (
                      <li
                        key={app.id}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{app.roleTitle}</p>
                          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <StatusBadge
                              label={APPLICATION_STATUS_LABELS[app.status]}
                              variant="outline"
                            />
                            {app.entryPoint &&
                              `${ENTRY_POINT_TYPE_LABELS[app.entryPoint.type]}`}
                            {app.appliedAt &&
                              `Envoyée le ${formatDateFr(app.appliedAt)}`}
                            {app.nextAction && app.nextAction}
                            {app.nextActionDate && (
                              <span
                                className={
                                  appOverdue
                                    ? "font-medium text-destructive"
                                    : appImminent
                                      ? "font-medium text-amber-600 dark:text-amber-500"
                                      : ""
                                }
                              >
                                {formatDateFr(app.nextActionDate)}
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
                                href={`/applications/${int.application.id}/edit`}
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
