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
  companyType?: string;
  personalInterest?: string;
  deadlineProximity?: string;
  sort?: string;
  order?: string;
}>;

async function CompaniesContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const status = params.status;
  const companyType = params.companyType;
  const personalInterest = params.personalInterest
    ? Number(params.personalInterest)
    : undefined;
  const deadlineProximity = params.deadlineProximity;
  const sort = params.sort ?? "name";
  const order = (params.order === "desc" ? "desc" : "asc") as "asc" | "desc";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);

  const where: Prisma.CompanyWhereInput = {};

  if (search) {
    where.name = { contains: search };
  }
  if (status) {
    where.status = status as "FIND_ENTRY_POINT" | "PROCESS_IN_PROGRESS" | "CLOSED";
  }
  if (companyType) {
    where.companyType = companyType;
  }
  if (personalInterest != null && !isNaN(personalInterest)) {
    where.personalInterest = personalInterest;
  }
  if (deadlineProximity === "overdue") {
    where.deadline = { lt: today };
  } else if (deadlineProximity === "imminent") {
    where.deadline = { gte: today, lte: in7Days };
  } else if (deadlineProximity === "none") {
    where.deadline = null;
  }

  const orderBy: Record<string, "asc" | "desc"> = {};
  if (sort === "name") orderBy.name = order;
  else if (sort === "deadline") orderBy.deadline = order;
  else if (sort === "personalInterest") orderBy.personalInterest = order;
  else if (sort === "status") orderBy.status = order;
  else if (sort === "createdAt") orderBy.createdAt = order;
  else orderBy.name = "asc";

  const companies = await prisma.company.findMany({
    where,
    orderBy: Object.keys(orderBy).length ? orderBy : { name: "asc" },
    include: {
      _count: { select: { entryPoints: true, applications: true } },
    },
  });

  return (
    <>
      <CompaniesFilters
        search={search}
        status={status}
        companyType={companyType}
        personalInterest={personalInterest}
        deadlineProximity={deadlineProximity}
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
