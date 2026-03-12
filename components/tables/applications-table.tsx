"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableTableHead } from "@/components/sortable-table-head";
import { useFilterParams } from "@/hooks/use-filter-params";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FileText, Pencil, Trash2 } from "lucide-react";
import {
  APPLICATION_STATUS_LABELS,
  ROLE_FAMILY_LABELS,
  ENTRY_POINT_TYPE_LABELS,
} from "@/lib/utils/enums";
import { formatDateFr } from "@/lib/utils/date";
import { isOverdue, isUpcomingIn7Days } from "@/lib/utils/dates";
import { deleteApplication } from "@/app/applications/actions";
import { useState } from "react";
import type {
  ApplicationStatus,
  RoleFamily,
  EntryPointType,
} from "@prisma/client";

type ApplicationWithRelations = {
  id: string;
  roleTitle: string;
  roleFamily: RoleFamily;
  status: ApplicationStatus;
  appliedAt: Date | null;
  nextAction: string | null;
  nextActionDate: Date | null;
  company: { id: string; name: string };
  entryPoint: {
    id: string;
    type: EntryPointType;
    personName: string | null;
  } | null;
};

interface ApplicationsTableProps {
  applications: ApplicationWithRelations[];
  sort: string;
  order: "asc" | "desc";
  basePath: string;
}

function getStatusVariant(
  status: ApplicationStatus
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "REJECTED" || status === "WITHDRAWN") return "secondary";
  if (status === "OFFER") return "default";
  if (status === "PREPARATION" || status === "WAITING") return "outline";
  return "default";
}

export function ApplicationsTable({
  applications,
  sort,
  order,
  basePath,
}: ApplicationsTableProps) {
  const router = useRouter();
  const { setParams } = useFilterParams(basePath);

  const handleSort = (columnKey: string) => {
    const newOrder =
      sort === columnKey && order === "asc" ? "desc" : "asc";
    setParams({ sort: columnKey, order: newOrder });
  };
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteApplication(deleteId);
      setDeleteId(null);
    } catch (e) {
      if (e && typeof e === "object" && "digest" in e && typeof (e as { digest?: string }).digest === "string" && (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")) {
        setDeleteId(null);
        throw e;
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (applications.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="size-6" />}
        title="Aucune candidature"
        description="Aucune candidature ne correspond à vos filtres. Modifiez les critères ou créez une nouvelle candidature."
      />
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entreprise</TableHead>
              <TableHead>Poste</TableHead>
              <TableHead>Famille</TableHead>
              <SortableTableHead
                columnKey="status"
                label="Statut"
                currentSort={sort}
                currentOrder={order}
                onSort={handleSort}
              />
              <TableHead>Point d&apos;entrée</TableHead>
              <TableHead>Prochaine action</TableHead>
              <SortableTableHead
                columnKey="nextActionDate"
                label="Date"
                currentSort={sort}
                currentOrder={order}
                onSort={handleSort}
              />
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => {
              const overdue = isOverdue(app.nextActionDate);
              const imminent = isUpcomingIn7Days(app.nextActionDate);
              return (
                <TableRow
                  key={app.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/companies/${app.company.id}`)}
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/companies/${app.company.id}`}
                      className="hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {app.company.name}
                    </Link>
                  </TableCell>
                  <TableCell>{app.roleTitle}</TableCell>
                  <TableCell>{ROLE_FAMILY_LABELS[app.roleFamily]}</TableCell>
                  <TableCell>
                    <StatusBadge
                      label={APPLICATION_STATUS_LABELS[app.status]}
                      variant={getStatusVariant(app.status)}
                    />
                  </TableCell>
                  <TableCell>
                    {app.entryPoint ? (
                      <span className="text-sm">
                        {ENTRY_POINT_TYPE_LABELS[app.entryPoint.type]}
                        {app.entryPoint.personName &&
                          ` — ${app.entryPoint.personName}`}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{app.nextAction ?? "—"}</TableCell>
                  <TableCell>
                    {app.nextActionDate ? (
                      <span
                        className={
                          overdue
                            ? "font-medium text-destructive"
                            : imminent
                              ? "font-medium text-amber-600 dark:text-amber-500"
                              : ""
                        }
                      >
                        {formatDateFr(app.nextActionDate)}
                        {overdue && " (en retard)"}
                        {imminent && !overdue && " (proche)"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        asChild
                      >
                        <Link href={`/applications/${app.id}/edit`}>
                          <Pencil className="size-4" />
                          <span className="sr-only">Modifier</span>
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteId(app.id);
                        }}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Supprimer</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Supprimer la candidature"
        description="Cette action est irréversible. Les entretiens liés seront également supprimés."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="destructive"
        onConfirm={handleDelete}
        confirmDisabled={isDeleting}
      />
    </>
  );
}
