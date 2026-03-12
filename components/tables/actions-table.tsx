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
import { ListTodo, Pencil, Trash2 } from "lucide-react";
import { ActionCompleteButton } from "@/components/action-complete-button";
import {
  ACTION_STATUS_LABELS,
  ACTION_PRIORITY_LABELS,
} from "@/lib/utils/enums";
import { formatDateFr } from "@/lib/utils/date";
import { isActionOverdue, isActionDueToday } from "@/lib/utils/actions";
import { deleteAction } from "@/app/actions/actions";
import { useState } from "react";
import type { ActionStatus, ActionPriority } from "@prisma/client";

type ActionWithRelations = {
  id: string;
  title: string;
  description: string | null;
  status: ActionStatus;
  priority: ActionPriority;
  dueDate: Date | null;
  completedAt: Date | null;
  companyId: string | null;
  entryPointId: string | null;
  applicationId: string | null;
  interviewId: string | null;
  company?: { id: string; name: string } | null;
  entryPoint?: { id: string; company?: { name: string } } | null;
  application?: { id: string; roleTitle: string; company?: { name: string } } | null;
  interview?: { id: string; interviewType: string; company?: { name: string } } | null;
};

interface ActionsTableProps {
  actions: ActionWithRelations[];
  sort: string;
  order: "asc" | "desc";
  basePath: string;
}

export function ActionsTable({
  actions,
  sort,
  order,
  basePath,
}: ActionsTableProps) {
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
      await deleteAction(deleteId);
      setDeleteId(null);
    } catch (e) {
      if (
        e &&
        typeof e === "object" &&
        "digest" in e &&
        typeof (e as { digest?: string }).digest === "string" &&
        (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
      ) {
        setDeleteId(null);
        throw e;
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const getLinkedLabel = (action: ActionWithRelations) => {
    if (action.company) return action.company.name;
    if (action.application)
      return `${action.application.company?.name ?? "—"} — ${action.application.roleTitle}`;
    if (action.entryPoint)
      return action.entryPoint.company?.name ?? "Point d'entrée";
    if (action.interview)
      return `${action.interview.company?.name ?? "—"} — ${action.interview.interviewType}`;
    return null;
  };

  if (actions.length === 0) {
    return (
      <EmptyState
        icon={<ListTodo className="size-6" />}
        title="Aucune action"
        description="Aucune action ne correspond à vos filtres. Créez une nouvelle action ou modifiez les critères."
      />
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Titre</TableHead>
              <SortableTableHead
                columnKey="status"
                label="Statut"
                currentSort={sort}
                currentOrder={order}
                onSort={handleSort}
              />
              <SortableTableHead
                columnKey="priority"
                label="Priorité"
                currentSort={sort}
                currentOrder={order}
                onSort={handleSort}
              />
              <SortableTableHead
                columnKey="dueDate"
                label="Échéance"
                currentSort={sort}
                currentOrder={order}
                onSort={handleSort}
              />
              <TableHead>Lié à</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actions.map((action) => {
              const overdue = isActionOverdue(action);
              const dueToday = isActionDueToday(action);
              return (
                <TableRow
                  key={action.id}
                  className={`cursor-pointer ${overdue ? "bg-destructive/5" : ""} ${action.status === "DONE" ? "opacity-75" : ""}`}
                  onClick={() => router.push(`/actions/${action.id}/edit`)}
                >
                  <TableCell
                    className="w-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ActionCompleteButton
                      actionId={action.id}
                      disabled={action.status === "DONE" || action.status === "CANCELED"}
                      variant="compact"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/actions/${action.id}/edit`}
                      className="hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {action.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={ACTION_STATUS_LABELS[action.status]}
                      variant={
                        action.status === "DONE"
                          ? "secondary"
                          : action.status === "IN_PROGRESS"
                            ? "default"
                            : action.status === "CANCELED"
                              ? "outline"
                              : "outline"
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={ACTION_PRIORITY_LABELS[action.priority]}
                      variant={
                        action.priority === "HIGH"
                          ? "destructive"
                          : action.priority === "MEDIUM"
                            ? "default"
                            : "secondary"
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {action.dueDate ? (
                      <span
                        className={
                          overdue
                            ? "font-medium text-destructive"
                            : dueToday
                              ? "font-medium text-amber-600 dark:text-amber-500"
                              : ""
                        }
                      >
                        {formatDateFr(action.dueDate)}
                        {overdue && " (en retard)"}
                        {dueToday && !overdue && " (aujourd'hui)"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getLinkedLabel(action) ?? "—"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        asChild
                      >
                        <Link href={`/actions/${action.id}/edit`}>
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
                          setDeleteId(action.id);
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
        title="Supprimer l'action"
        description="Cette action est irréversible."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="destructive"
        onConfirm={handleDelete}
        confirmDisabled={isDeleting}
      />
    </>
  );
}
