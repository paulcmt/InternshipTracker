import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { LoadingTable } from "@/components/loading-table";
import { Plus } from "lucide-react";
import { EntryPointsTable } from "@/components/tables/entry-points-table";
import { EntryPointsFilters } from "@/components/tables/entry-points-filters";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

type SearchParams = Promise<{
  search?: string;
  status?: string;
  type?: string;
  companyId?: string;
  sort?: string;
  order?: string;
}>;

async function EntryPointsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const status = params.status;
  const type = params.type;
  const companyId = params.companyId;
  const sort = params.sort ?? "createdAt";
  const order = (params.order === "desc" ? "desc" : "asc") as "asc" | "desc";

  const where: Prisma.EntryPointWhereInput = {};

  if (search) {
    where.OR = [
      { personName: { contains: search } },
      { company: { name: { contains: search } } },
    ];
  }
  if (status) {
    where.status = status as Prisma.EnumEntryPointStatusFilter;
  }
  if (type) {
    where.type = type as Prisma.EnumEntryPointTypeFilter;
  }
  if (companyId) {
    where.companyId = companyId;
  }

  const orderBy: Prisma.EntryPointOrderByWithRelationInput = {};
  if (sort === "status") {
    orderBy.status = order;
  } else if (sort === "createdAt") {
    orderBy.createdAt = order;
  } else {
    orderBy.createdAt = "asc";
  }

  const [entryPoints, companies] = await Promise.all([
    prisma.entryPoint.findMany({
      where,
      orderBy,
      include: {
        company: { select: { id: true, name: true } },
      },
    }),
    prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <EntryPointsFilters
        search={search}
        status={status}
        type={type}
        companyId={companyId}
        companies={companies}
      />
      <EntryPointsTable
        entryPoints={entryPoints}
        sort={sort}
        order={order}
        basePath="/entry-points"
      />
    </>
  );
}

export default async function EntryPointsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <PageHeader
          title="Points d'entrée"
          description="Contacts et canaux d'accès aux entreprises"
        >
          <Button asChild>
            <Link href="/entry-points/new">
              <Plus className="size-4" />
              Nouveau point d'entrée
            </Link>
          </Button>
        </PageHeader>
        <Suspense fallback={<LoadingTable />}>
          <EntryPointsContent searchParams={searchParams} />
        </Suspense>
      </div>
    </PageLayout>
  );
}
