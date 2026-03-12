import { PageHeader } from "@/components/layout/page-header";
import { PageLayout } from "@/components/layout/page-layout";
import { ApplicationForm } from "@/components/forms/application-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";
import { ENTRY_POINT_TYPE_LABELS } from "@/lib/utils/enums";
import type { EntryPointType } from "@prisma/client";

export default async function NewApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>;
}) {
  const params = await searchParams;
  const preselectedCompanyId = params.companyId ?? undefined;

  const [companies, entryPoints] = await Promise.all([
    prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.entryPoint.findMany({
      select: {
        id: true,
        companyId: true,
        type: true,
        personName: true,
        company: { select: { name: true } },
      },
    }),
  ]);

  const entryPointOptions = entryPoints.map((ep) => ({
    id: ep.id,
    companyId: ep.companyId,
    label: `${ep.company.name} — ${ep.personName ?? ENTRY_POINT_TYPE_LABELS[ep.type as EntryPointType]}`,
  }));

  const redirectTo = preselectedCompanyId
    ? `/companies/${preselectedCompanyId}`
    : undefined;

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <PageHeader
          title="Nouvelle candidature"
          description={
            preselectedCompanyId
              ? "Ajouter une candidature pour cette entreprise"
              : "Enregistrer une nouvelle candidature"
          }
        />
        <Card>
          <CardHeader />
          <CardContent>
            <ApplicationForm
              companies={companies}
              entryPoints={entryPointOptions}
              preselectedCompanyId={preselectedCompanyId}
              redirectTo={redirectTo}
            />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
