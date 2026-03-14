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
import { Users, Pencil, Trash2 } from "lucide-react";
import {
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_STATUS_LABELS,
} from "@/lib/utils/enums";
import { formatDateFr, formatDateTimeFr } from "@/lib/utils/date";
import { isUpcomingIn7Days } from "@/lib/utils/dates";
import { deleteInterview } from "@/app/interviews/actions";
import { useState } from "react";
import type { InterviewStatus, InterviewType } from "@prisma/client";

type InterviewWithRelations = {
  id: string;
  interviewType: InterviewType;
  interviewerName: string | null;
  scheduledAt: Date | null;
  status: InterviewStatus;
  feedback: string | null;
  company: { id: string; name: string };
  application: { id: string; roleTitle: string };
};

interface InterviewsTableProps {
  interviews: InterviewWithRelations[];
  sort: string;
  order: "asc" | "desc";
  basePath: string;
}

function getStatusVariant(
  status: InterviewStatus
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "CANCELED") return "secondary";
  if (status === "SCHEDULED") return "default";
  if (status === "COMPLETED" || status === "FEEDBACK_RECEIVED")
    return "outline";
  return "default";
}

export function InterviewsTable({
  interviews,
  sort,
  order,
  basePath,
}: InterviewsTableProps) {
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
      await deleteInterview(deleteId);
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

  if (interviews.length === 0) {
    return (
      <EmptyState
        icon={<Users className="size-6" />}
        title="Aucun entretien"
        description="Aucun entretien ne correspond à vos filtres. Modifiez les critères ou créez un nouvel entretien."
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
              <TableHead>Candidature</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Intervieweur</TableHead>
              <SortableTableHead
                columnKey="scheduledAt"
                label="Date prévue"
                currentSort={sort}
                currentOrder={order}
                onSort={handleSort}
              />
              <SortableTableHead
                columnKey="status"
                label="Statut"
                currentSort={sort}
                currentOrder={order}
                onSort={handleSort}
              />
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {interviews.map((int) => {
              const upcoming = int.scheduledAt && isUpcomingIn7Days(int.scheduledAt);
              return (
                <TableRow
                  key={int.id}
                  className={`cursor-pointer ${upcoming ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}`}
                  onClick={() => router.push(`/companies/${int.company.id}`)}
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/companies/${int.company.id}`}
                      className="hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {int.company.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/applications/${int.application.id}`}
                      className="hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {int.application.roleTitle}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {INTERVIEW_TYPE_LABELS[int.interviewType]}
                  </TableCell>
                  <TableCell>{int.interviewerName ?? "—"}</TableCell>
                  <TableCell>
                    {int.scheduledAt ? (
                      <span
                        className={
                          upcoming
                            ? "font-semibold text-amber-700 dark:text-amber-400"
                            : ""
                        }
                      >
                        {formatDateTimeFr(int.scheduledAt)}
                        {upcoming && " (à venir)"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={INTERVIEW_STATUS_LABELS[int.status]}
                      variant={getStatusVariant(int.status)}
                    />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        asChild
                      >
                        <Link href={`/interviews/${int.id}/edit`}>
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
                          setDeleteId(int.id);
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
        title="Supprimer l'entretien"
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
