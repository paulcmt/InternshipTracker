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
import { DoorOpen, Pencil, Trash2 } from "lucide-react";
import {
  ENTRY_POINT_TYPE_LABELS,
  ENTRY_POINT_STATUS_LABELS,
} from "@/lib/utils/enums";
import { deleteEntryPoint } from "@/app/entry-points/actions";
import { useState } from "react";
import type { EntryPointStatus, EntryPointType } from "@prisma/client";

type EntryPointWithCompany = {
  id: string;
  type: EntryPointType;
  personName: string | null;
  personRole: string | null;
  status: EntryPointStatus;
  company: { id: string; name: string };
};

interface EntryPointsTableProps {
  entryPoints: EntryPointWithCompany[];
  sort: string;
  order: "asc" | "desc";
  basePath: string;
}

export function EntryPointsTable({
  entryPoints,
  sort,
  order,
  basePath,
}: EntryPointsTableProps) {
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
      await deleteEntryPoint(deleteId);
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

  if (entryPoints.length === 0) {
    return (
      <EmptyState
        icon={<DoorOpen className="size-6" />}
        title="Aucun point d'entrée"
        description="Aucun point d'entrée ne correspond à vos filtres. Modifiez les critères ou créez un nouveau point d'entrée."
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
              <TableHead>Type</TableHead>
              <TableHead>Personne</TableHead>
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
            {entryPoints.map((ep) => {
              return (
                <TableRow
                  key={ep.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/entry-points/${ep.id}`)}
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/companies/${ep.company.id}`}
                      className="hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ep.company.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {ENTRY_POINT_TYPE_LABELS[ep.type]}
                  </TableCell>
                  <TableCell>
                    {ep.personName ?? "—"}
                    {ep.personRole && (
                      <span className="text-muted-foreground">
                        {" "}
                        ({ep.personRole})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={ENTRY_POINT_STATUS_LABELS[ep.status]}
                      variant={
                        ep.status === "CLOSED"
                          ? "secondary"
                          : ep.status === "TO_CONTACT"
                            ? "destructive"
                            : "outline"
                      }
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
                        <Link href={`/entry-points/${ep.id}/edit`}>
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
                          setDeleteId(ep.id);
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
        title="Supprimer le point d'entrée"
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
