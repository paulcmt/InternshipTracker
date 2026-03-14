import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import {
  ACTION_PRIORITY_LABELS,
  ACTION_STATUS_LABELS,
  ENTRY_POINT_STATUS_LABELS,
  ENTRY_POINT_TYPE_LABELS,
} from "@/lib/utils/enums";
import { formatDateFr, formatDateTimeFr } from "@/lib/utils/date";
import { isOverdue, isUpcomingIn7Days } from "@/lib/utils/dates";
import { ExternalLink, Pencil, Building2, Plus } from "lucide-react";

export default async function EntryPointDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entryPoint = await prisma.entryPoint.findUnique({
    where: { id },
    include: {
      company: true,
      actions: true,
    },
  });

  if (!entryPoint) notFound();

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <PageHeader
          title={entryPoint.personName ?? ENTRY_POINT_TYPE_LABELS[entryPoint.type]}
          description={entryPoint.company.name}
        >
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/entry-points/${entryPoint.id}/edit`}>
                <Pencil className="size-4" />
                Modifier
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/companies/${entryPoint.companyId}`}>
                <Building2 className="size-4" />
                Voir l&apos;entreprise
              </Link>
            </Button>
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
                  <span className="text-muted-foreground">Entreprise</span>
                  <p className="font-medium">
                    <Link
                      href={`/companies/${entryPoint.company.id}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      {entryPoint.company.name}
                      <ExternalLink className="size-3" />
                    </Link>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type</span>
                  <p className="font-medium">
                    {ENTRY_POINT_TYPE_LABELS[entryPoint.type]}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Personne</span>
                  <p className="font-medium">
                    {entryPoint.personName ?? "—"}
                    {entryPoint.personRole && (
                      <span className="text-muted-foreground">
                        {" "}
                        ({entryPoint.personRole})
                      </span>
                    )}
                  </p>
                </div>
                {entryPoint.linkedinUrl && (
                  <div>
                    <span className="text-muted-foreground">LinkedIn</span>
                    <p>
                      <a
                        href={entryPoint.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        Profil <ExternalLink className="size-3" />
                      </a>
                    </p>
                  </div>
                )}
                {entryPoint.channel && (
                  <div>
                    <span className="text-muted-foreground">Canal</span>
                    <p className="font-medium">{entryPoint.channel}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Statut</span>
                  <p>
                    <StatusBadge
                      label={ENTRY_POINT_STATUS_LABELS[entryPoint.status]}
                      variant={
                        entryPoint.status === "CLOSED"
                          ? "secondary"
                          : entryPoint.status === "TO_CONTACT"
                            ? "destructive"
                            : "outline"
                      }
                    />
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Créé le</span>
                  <p className="font-medium">
                    {formatDateTimeFr(entryPoint.createdAt)}
                  </p>
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <span className="text-muted-foreground">Notes</span>
                <p className="whitespace-pre-wrap">
                  {entryPoint.notes || "Aucune note pour le moment."}
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
                  href={`/actions/new?companyId=${entryPoint.companyId}&entryPointId=${entryPoint.id}&redirectTo=/entry-points/${entryPoint.id}`}
                >
                  <Plus className="size-4" />
                  Créer une action
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {entryPoint.actions.length > 0 ? (
                <ul className="space-y-3">
                  {entryPoint.actions
                    .slice()
                    .sort(
                      (a, b) =>
                        b.createdAt.getTime() - a.createdAt.getTime(),
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
                        </li>
                      );
                    })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucune action liée à ce point d&apos;entrée pour l&apos;instant.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}

