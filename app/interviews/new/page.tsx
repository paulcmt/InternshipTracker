import { PageHeader } from "@/components/layout/page-header";
import { PageLayout } from "@/components/layout/page-layout";
import { InterviewForm } from "@/components/forms/interview-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";

export default async function NewInterviewPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>;
}) {
  const params = await searchParams;
  const preselectedCompanyId = params.companyId ?? undefined;

  const [companies, applications] = await Promise.all([
    prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.application.findMany({
      select: {
        id: true,
        companyId: true,
        roleTitle: true,
        company: { select: { name: true } },
      },
    }),
  ]);

  const applicationOptions = applications.map((a) => ({
    id: a.id,
    companyId: a.companyId,
    label: `${a.company.name} — ${a.roleTitle}`,
  }));

  const redirectTo = preselectedCompanyId
    ? `/companies/${preselectedCompanyId}`
    : undefined;

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <PageHeader
          title="Nouvel entretien"
          description={
            preselectedCompanyId
              ? "Planifier un entretien pour cette entreprise"
              : "Planifier un nouvel entretien"
          }
        />
        <Card>
          <CardHeader />
          <CardContent>
            <InterviewForm
              companies={companies}
              applications={applicationOptions}
              preselectedCompanyId={preselectedCompanyId}
              redirectTo={redirectTo}
            />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
