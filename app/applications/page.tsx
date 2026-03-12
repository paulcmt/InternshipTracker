import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { LoadingTable } from "@/components/loading-table";
import { Plus } from "lucide-react";
import { ApplicationsTable } from "@/components/tables/applications-table";
import { ApplicationsFilters } from "@/components/tables/applications-filters";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

type SearchParams = Promise<{
  search?: string;
  status?: string;
  roleFamily?: string;
  applicationType?: string;
  companyId?: string;
  sort?: string;
  order?: string;
}>;

async function ApplicationsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const status = params.status;
  const roleFamily = params.roleFamily;
  const applicationType = params.applicationType;
  const companyId = params.companyId;
  const sort = params.sort ?? "nextActionDate";
  const order = (params.order === "desc" ? "desc" : "asc") as "asc" | "desc";

  const where: Prisma.ApplicationWhereInput = {};

  if (search) {
    where.OR = [
      { roleTitle: { contains: search } },
      { company: { name: { contains: search } } },
    ];
  }
  if (status) {
    where.status = status as Prisma.EnumApplicationStatusFilter;
  }
  if (roleFamily) {
    where.roleFamily = roleFamily as Prisma.EnumRoleFamilyFilter;
  }
  if (applicationType) {
    where.applicationType =
      applicationType as Prisma.EnumApplicationTypeFilter;
  }
  if (companyId) {
    where.companyId = companyId;
  }

  const orderBy: Prisma.ApplicationOrderByWithRelationInput = {};
  if (sort === "nextActionDate") {
    orderBy.nextActionDate = order;
  } else if (sort === "appliedAt") {
    orderBy.appliedAt = order;
  } else if (sort === "status") {
    orderBy.status = order;
  } else if (sort === "createdAt") {
    orderBy.createdAt = order;
  } else {
    orderBy.nextActionDate = "asc";
  }

  const [applications, companies] = await Promise.all([
    prisma.application.findMany({
      where,
      orderBy,
      include: {
        company: { select: { id: true, name: true } },
        entryPoint: {
          select: { id: true, type: true, personName: true },
        },
      },
    }),
    prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <ApplicationsFilters
        search={search}
        status={status}
        roleFamily={roleFamily}
        applicationType={applicationType}
        companyId={companyId}
        companies={companies}
      />
      <ApplicationsTable
        applications={applications}
        sort={sort}
        order={order}
        basePath="/applications"
      />
    </>
  );
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <PageHeader
          title="Candidatures"
          description="Suivi de vos candidatures"
        >
          <Button asChild>
            <Link href="/applications/new">
              <Plus className="size-4" />
              Nouvelle candidature
            </Link>
          </Button>
        </PageHeader>
        <Suspense fallback={<LoadingTable />}>
          <ApplicationsContent searchParams={searchParams} />
        </Suspense>
      </div>
    </PageLayout>
  );
}
