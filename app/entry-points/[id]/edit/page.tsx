import { PageHeader } from "@/components/layout/page-header";
import { PageLayout } from "@/components/layout/page-layout";
import { EntryPointForm } from "@/components/forms/entry-point-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import {
  ACTION_PRIORITY_LABELS,
  ACTION_STATUS_LABELS,
  ENTRY_POINT_TYPE_LABELS,
} from "@/lib/utils/enums";
import { formatDateFr, formatDateTimeFr } from "@/lib/utils/date";
import { isOverdue, isUpcomingIn7Days } from "@/lib/utils/dates";
import { Plus } from "lucide-react";

export default async function EditEntryPointPage({
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

  const companies = await prisma.company.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <PageHeader
          title={`Modifier — ${entryPoint.company.name}`}
          description={`${entryPoint.personName ?? ENTRY_POINT_TYPE_LABELS[entryPoint.type]}`}
        />
        <Card>
          <CardHeader />
          <CardContent>
            <EntryPointForm
              entryPoint={entryPoint}
              companies={companies}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Historique des actions</CardTitle>
            <Button
              asChild
              variant="outline"
              size="sm"
            >
              <a
                href={`/actions/new?companyId=${entryPoint.companyId}&entryPointId=${entryPoint.id}&redirectTo=/entry-points/${entryPoint.id}/edit`}
              >
                <Plus className="size-4" />
                Créer une action
              </a>
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
    </PageLayout>
  );
}
