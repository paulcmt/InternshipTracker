import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { LoadingTable } from "@/components/loading-table";
import { Plus } from "lucide-react";
import { CompaniesTable } from "@/components/tables/companies-table";
import { CompaniesFilters } from "@/components/tables/companies-filters";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

type SearchParams = Promise<{
  search?: string;
  status?: string;
  personalInterest?: string;
  sort?: string;
  order?: string;
}>;

async function CompaniesContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const status = params.status;
  const personalInterest = params.personalInterest
    ? Number(params.personalInterest)
    : undefined;
  const sort = params.sort ?? "name";
  const order = (params.order === "desc" ? "desc" : "asc") as "asc" | "desc";

  const where: Prisma.CompanyWhereInput = {};

  if (search) {
    where.name = { contains: search };
  }
  if (status) {
    where.status = status as "FIND_ENTRY_POINT" | "PROCESS_IN_PROGRESS" | "CLOSED";
  }
  if (personalInterest != null && !isNaN(personalInterest)) {
    where.personalInterest = personalInterest;
  }

  const orderBy: Prisma.CompanyOrderByWithRelationInput =
    sort === "name"
      ? { name: order }
      : sort === "personalInterest"
        ? { personalInterest: order }
        : sort === "status"
          ? { status: order }
          : sort === "createdAt"
            ? { createdAt: order }
            : sort === "entryPoints"
              ? { entryPoints: { _count: order } }
              : sort === "applications"
                ? { applications: { _count: order } }
                : { name: "asc" };

  const companies = await prisma.company.findMany({
    where,
    orderBy,
    include: {
      _count: { select: { entryPoints: true, applications: true } },
    },
  });

  return (
    <>
      <CompaniesFilters
        search={search}
        status={status}
        personalInterest={personalInterest}
      />
      <CompaniesTable
        companies={companies}
        sort={sort}
        order={order}
        basePath="/companies"
      />
    </>
  );
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <PageHeader
          title="Entreprises"
          description="Liste des entreprises ciblées"
        >
          <Button asChild>
            <Link href="/companies/new">
              <Plus className="size-4" />
              Nouvelle entreprise
            </Link>
          </Button>
        </PageHeader>
        <Suspense fallback={<LoadingTable />}>
          <CompaniesContent searchParams={searchParams} />
        </Suspense>
      </div>
    </PageLayout>
  );
}
