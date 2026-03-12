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
import { Building2, Pencil, Trash2 } from "lucide-react";
import { COMPANY_STATUS_LABELS } from "@/lib/utils/enums";
import { formatDateFr } from "@/lib/utils/date";
import { isOverdue, isUpcomingIn7Days } from "@/lib/utils/dates";
import { deleteCompany } from "@/app/companies/actions";
import { useState } from "react";
import type { CompanyStatus } from "@prisma/client";

type CompanyWithCount = {
  id: string;
  name: string;
  companyType: string;
  country: string;
  city: string | null;
  personalInterest: number;
  deadline: Date | null;
  status: CompanyStatus;
  _count: { entryPoints: number; applications: number };
};

interface CompaniesTableProps {
  companies: CompanyWithCount[];
  sort: string;
  order: "asc" | "desc";
  basePath: string;
}

export function CompaniesTable({
  companies,
  sort,
  order,
  basePath,
}: CompaniesTableProps) {
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
      await deleteCompany(deleteId);
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

  if (companies.length === 0) {
    return (
      <EmptyState
        icon={<Building2 className="size-6" />}
        title="Aucune entreprise"
        description="Aucune entreprise ne correspond à vos filtres. Modifiez les critères ou créez une nouvelle entreprise."
      />
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead
                columnKey="name"
                label="Nom"
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
              <SortableTableHead
                columnKey="personalInterest"
                label="Intérêt"
                currentSort={sort}
                currentOrder={order}
                onSort={handleSort}
              />
              <SortableTableHead
                columnKey="deadline"
                label="Date limite"
                currentSort={sort}
                currentOrder={order}
                onSort={handleSort}
              />
              <TableHead className="text-center">Points</TableHead>
              <TableHead className="text-center">Candidatures</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => {
              const overdue = isOverdue(company.deadline);
              const imminent = isUpcomingIn7Days(company.deadline);
              return (
                <TableRow
                  key={company.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/companies/${company.id}`)}
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/companies/${company.id}`}
                      className="hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {company.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={COMPANY_STATUS_LABELS[company.status]}
                      variant={
                        company.status === "CLOSED"
                          ? "secondary"
                          : company.status === "PROCESS_IN_PROGRESS"
                            ? "default"
                            : "outline"
                      }
                    />
                  </TableCell>
                  <TableCell>{company.personalInterest}/10</TableCell>
                  <TableCell>
                    {company.deadline ? (
                      <span
                        className={
                          overdue
                            ? "font-medium text-destructive"
                            : imminent
                              ? "font-medium text-amber-600 dark:text-amber-500"
                              : ""
                        }
                      >
                        {formatDateFr(company.deadline)}
                        {overdue && " (en retard)"}
                        {imminent && !overdue && " (proche)"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {company._count.entryPoints}
                  </TableCell>
                  <TableCell className="text-center">
                    {company._count.applications}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        asChild
                      >
                        <Link href={`/companies/${company.id}/edit`}>
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
                          setDeleteId(company.id);
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
        title="Supprimer l'entreprise"
        description="Cette action est irréversible. Les points d'entrée et candidatures liés seront également supprimés."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="destructive"
        onConfirm={handleDelete}
        confirmDisabled={isDeleting}
      />
    </>
  );
}
