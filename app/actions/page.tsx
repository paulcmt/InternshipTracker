import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { LoadingTable } from "@/components/loading-table";
import { Plus } from "lucide-react";
import { ActionsTable } from "@/components/tables/actions-table";
import { ActionsFilters } from "@/components/tables/actions-filters";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

type SearchParams = Promise<{
  search?: string;
  status?: string;
  priority?: string;
  linkedType?: string;
  dueDateState?: string;
  sort?: string;
  order?: string;
}>;

async function ActionsContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const status = params.status as "TODO" | "IN_PROGRESS" | "DONE" | "CANCELED" | undefined;
  const priority = params.priority as "LOW" | "MEDIUM" | "HIGH" | undefined;
  const linkedType = params.linkedType;
  const dueDateState = params.dueDateState;
  const sort = params.sort ?? "dueDate";
  const order = (params.order === "desc" ? "desc" : "asc") as "asc" | "desc";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);

  const where: Prisma.ActionWhereInput = {};

  if (search) {
    where.title = { contains: search };
  }
  if (status) {
    where.status = status;
  }
  if (priority) {
    where.priority = priority;
  }
  if (linkedType === "company") {
    where.companyId = { not: null };
  } else if (linkedType === "entryPoint") {
    where.entryPointId = { not: null };
  } else if (linkedType === "application") {
    where.applicationId = { not: null };
  } else if (linkedType === "interview") {
    where.interviewId = { not: null };
  }
  if (dueDateState === "overdue") {
    where.dueDate = { lt: today };
    where.status = { in: ["TODO", "IN_PROGRESS"] };
  } else if (dueDateState === "today") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    where.dueDate = { gte: today, lt: tomorrow };
  } else if (dueDateState === "upcoming") {
    where.dueDate = { gt: today, lte: in7Days };
    where.status = { in: ["TODO", "IN_PROGRESS"] };
  } else if (dueDateState === "none") {
    where.dueDate = null;
  }

  const actions = await prisma.action.findMany({
    where,
    include: {
      company: { select: { id: true, name: true } },
      entryPoint: { select: { id: true, company: { select: { name: true } } } },
      application: {
        select: {
          id: true,
          roleTitle: true,
          company: { select: { name: true } },
        },
      },
      interview: {
        select: {
          id: true,
          interviewType: true,
          company: { select: { name: true } },
        },
      },
    },
  });

  const sortedActions = [...actions].sort((a, b) => {
    if (sort === "dueDate") {
      const aDate = a.dueDate?.getTime() ?? Infinity;
      const bDate = b.dueDate?.getTime() ?? Infinity;
      return order === "asc" ? aDate - bDate : bDate - aDate;
    }
    if (sort === "priority") {
      const orderMap = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      const diff = orderMap[a.priority] - orderMap[b.priority];
      return order === "asc" ? diff : -diff;
    }
    if (sort === "status") {
      const cmp = a.status.localeCompare(b.status);
      return order === "asc" ? cmp : -cmp;
    }
    if (sort === "createdAt") {
      return order === "asc"
        ? a.createdAt.getTime() - b.createdAt.getTime()
        : b.createdAt.getTime() - a.createdAt.getTime();
    }
    return 0;
  });

  return (
    <>
      <ActionsFilters
        search={search}
        status={status}
        priority={priority}
        linkedType={linkedType}
        dueDateState={dueDateState}
      />
      <ActionsTable
        actions={sortedActions}
        sort={sort}
        order={order}
        basePath="/actions"
      />
    </>
  );
}

export default async function ActionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <PageHeader
          title="Actions"
          description="Prochaines étapes et tâches"
        >
          <Button asChild>
            <Link href="/actions/new">
              <Plus className="size-4" />
              Nouvelle action
            </Link>
          </Button>
        </PageHeader>
        <Suspense fallback={<LoadingTable />}>
          <ActionsContent searchParams={searchParams} />
        </Suspense>
      </div>
    </PageLayout>
  );
}
