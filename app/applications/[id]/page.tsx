import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import {
  APPLICATION_TYPE_LABELS,
  APPLICATION_STATUS_LABELS,
  ENTRY_POINT_TYPE_LABELS,
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_STATUS_LABELS,
  ACTION_STATUS_LABELS,
  ACTION_PRIORITY_LABELS,
} from "@/lib/utils/enums";
import { formatDateFr, formatDateTimeFr } from "@/lib/utils/date";
import { isOverdue, isUpcomingIn7Days } from "@/lib/utils/dates";
import { ExternalLink, Pencil, Building2, Plus, Users } from "lucide-react";
import { ApplicationDeleteButton } from "@/components/application-delete-button";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      company: true,
      entryPoint: true,
      interviews: true,
      actions: {
        orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!application) notFound();

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <PageHeader
          title={application.roleTitle}
          description={application.company.name}
        >
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/applications/${application.id}/edit`}>
                <Pencil className="size-4" />
                Modifier
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/companies/${application.companyId}`}>
                <Building2 className="size-4" />
                Voir l&apos;entreprise
              </Link>
            </Button>
            <ApplicationDeleteButton applicationId={application.id} />
          </div>
        </PageHeader>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    Entreprise liée
                  </span>
                  <p className="font-medium">
                    <Link
                      href={`/companies/${application.company.id}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      {application.company.name}
                      <ExternalLink className="size-3" />
                    </Link>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Intitulé du poste
                  </span>
                  <p className="font-medium">{application.roleTitle}</p>
                </div>
                {application.location && (
                  <div>
                    <span className="text-muted-foreground">
                      Localisation
                    </span>
                    <p className="font-medium">{application.location}</p>
                  </div>
                )}
                {application.offerUrl && (
                  <div>
                    <span className="text-muted-foreground">
                      URL de l&apos;offre
                    </span>
                    <p>
                      <a
                        href={application.offerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        Lien <ExternalLink className="size-3" />
                      </a>
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">
                    Type de candidature
                  </span>
                  <p className="font-medium">
                    {APPLICATION_TYPE_LABELS[application.applicationType]}
                  </p>
                </div>
                {application.appliedAt && (
                  <div>
                    <span className="text-muted-foreground">
                      Date de candidature
                    </span>
                    <p className="font-medium">
                      {formatDateFr(application.appliedAt)}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Statut</span>
                  <p>
                    <StatusBadge
                      label={
                        APPLICATION_STATUS_LABELS[application.status]
                      }
                      variant={
                        application.status === "REJECTED" ||
                        application.status === "WITHDRAWN"
                          ? "secondary"
                          : application.status === "OFFER"
                            ? "default"
                            : "outline"
                      }
                    />
                  </p>
                </div>
                {application.entryPoint && (
                  <div>
                    <span className="text-muted-foreground">
                      Point d&apos;entrée
                    </span>
                    <p className="font-medium">
                      <Link
                        href={`/entry-points/${application.entryPoint.id}`}
                        className="text-primary hover:underline"
                      >
                        {ENTRY_POINT_TYPE_LABELS[application.entryPoint.type]}
                        {application.entryPoint.personName &&
                          ` — ${application.entryPoint.personName}`}
                      </Link>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1 text-sm">
                <span className="text-muted-foreground">Notes</span>
                <p className="whitespace-pre-wrap">
                  {application.notes || "Aucune note pour le moment."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Historique des actions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Historique des actions</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/actions/new?companyId=${application.companyId}&applicationId=${application.id}&redirectTo=/applications/${application.id}`}
                >
                  <Plus className="size-4" />
                  Créer une action
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {application.actions.length > 0 ? (
                <ul className="space-y-3">
                  {application.actions
                    .slice()
                    .sort(
                      (a, b) =>
                        b.createdAt.getTime() - a.createdAt.getTime()
                    )
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
                <p className="text-sm text-muted-foreground">
                  Aucune action liée à cette candidature pour l&apos;instant.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Entretiens liés */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Entretiens liés</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/interviews/new?companyId=${application.companyId}&applicationId=${application.id}`}
              >
                <Plus className="size-4" />
                Ajouter
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {application.interviews.length > 0 ? (
              <ul className="space-y-3">
                {application.interviews.map((int) => {
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
                          {int.interviewerName &&
                            ` — ${int.interviewerName}`}
                        </p>
                        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <StatusBadge
                            label={
                              INTERVIEW_STATUS_LABELS[int.status]
                            }
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
                description="Les entretiens planifiés pour cette candidature apparaîtront ici."
              >
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`/interviews/new?companyId=${application.companyId}&applicationId=${application.id}`}
                  >
                    <Plus className="size-4" />
                    Ajouter un entretien
                  </Link>
                </Button>
              </EmptyState>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
