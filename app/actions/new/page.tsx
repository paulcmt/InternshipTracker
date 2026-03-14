import { PageHeader } from "@/components/layout/page-header";
import { PageLayout } from "@/components/layout/page-layout";
import { ActionForm } from "@/components/forms/action-form";
import { prisma } from "@/lib/db/prisma";

export default async function NewActionPage({
  searchParams,
}: {
  searchParams: Promise<{
    companyId?: string;
    entryPointId?: string;
    applicationId?: string;
    interviewId?: string;
    redirectTo?: string;
  }>;
}) {
  const params = await searchParams;
  const preselectedCompanyId = params.companyId?.trim() || undefined;
  const preselectedEntryPointId = params.entryPointId?.trim() || undefined;
  const preselectedApplicationId = params.applicationId?.trim() || undefined;
  const preselectedInterviewId = params.interviewId?.trim() || undefined;

  const explicitRedirect = params.redirectTo?.trim() || undefined;

  const companies = await prisma.company.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const redirectTo =
    explicitRedirect ??
    (preselectedEntryPointId
      ? `/entry-points/${preselectedEntryPointId}/edit`
      : preselectedCompanyId
        ? `/companies/${preselectedCompanyId}`
        : undefined);

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-6 p-6 max-w-2xl">
        <PageHeader
          title="Nouvelle action"
          description="Créez une tâche à effectuer"
        />
        <ActionForm
          companies={companies}
          preselectedCompanyId={preselectedCompanyId}
          preselectedEntryPointId={preselectedEntryPointId}
          preselectedApplicationId={preselectedApplicationId}
          preselectedInterviewId={preselectedInterviewId}
          redirectTo={redirectTo}
        />
      </div>
    </PageLayout>
  );
}
