import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { LoadingTable } from "@/components/loading-table";
import { Plus } from "lucide-react";
import { InterviewsTable } from "@/components/tables/interviews-table";
import { InterviewsFilters } from "@/components/tables/interviews-filters";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

type SearchParams = Promise<{
  search?: string;
  status?: string;
  interviewType?: string;
  companyId?: string;
  sort?: string;
  order?: string;
}>;

async function InterviewsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const status = params.status;
  const interviewType = params.interviewType;
  const companyId = params.companyId;
  const sort = params.sort ?? "scheduledAt";
  const order = (params.order === "desc" ? "desc" : "asc") as "asc" | "desc";

  const where: Prisma.InterviewWhereInput = {};

  if (search) {
    where.OR = [
      { interviewerName: { contains: search } },
      { company: { name: { contains: search } } },
    ];
  }
  if (status) {
    where.status = status as Prisma.EnumInterviewStatusFilter;
  }
  if (interviewType) {
    where.interviewType =
      interviewType as Prisma.EnumInterviewTypeFilter;
  }
  if (companyId) {
    where.companyId = companyId;
  }

  const orderBy: Prisma.InterviewOrderByWithRelationInput = {};
  if (sort === "scheduledAt") {
    orderBy.scheduledAt = order;
  } else if (sort === "status") {
    orderBy.status = order;
  } else if (sort === "createdAt") {
    orderBy.createdAt = order;
  } else {
    orderBy.scheduledAt = "asc";
  }

  const [interviews, companies] = await Promise.all([
    prisma.interview.findMany({
      where,
      orderBy,
      include: {
        company: { select: { id: true, name: true } },
        application: { select: { id: true, roleTitle: true } },
      },
    }),
    prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <InterviewsFilters
        search={search}
        status={status}
        interviewType={interviewType}
        companyId={companyId}
        companies={companies}
      />
      <InterviewsTable
        interviews={interviews}
        sort={sort}
        order={order}
        basePath="/interviews"
      />
    </>
  );
}

export default async function InterviewsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <PageHeader
          title="Entretiens"
          description="Calendrier et suivi des entretiens"
        >
          <Button asChild>
            <Link href="/interviews/new">
              <Plus className="size-4" />
              Nouvel entretien
            </Link>
          </Button>
        </PageHeader>
        <Suspense fallback={<LoadingTable />}>
          <InterviewsContent searchParams={searchParams} />
        </Suspense>
      </div>
    </PageLayout>
  );
}
