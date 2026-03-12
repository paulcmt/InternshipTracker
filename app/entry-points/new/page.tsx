import { PageHeader } from "@/components/layout/page-header";
import { PageLayout } from "@/components/layout/page-layout";
import { EntryPointForm } from "@/components/forms/entry-point-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";

export default async function NewEntryPointPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>;
}) {
  const params = await searchParams;
  const preselectedCompanyId = params.companyId ?? undefined;

  const companies = await prisma.company.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const redirectTo =
    preselectedCompanyId
      ? `/companies/${preselectedCompanyId}`
      : undefined;

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <PageHeader
          title="Nouveau point d'entrée"
          description={
            preselectedCompanyId
              ? "Ajouter un point d'entrée pour cette entreprise"
              : "Ajouter un point d'entrée (recruteur, alumni, offre...)"
          }
        />
        <Card>
          <CardHeader />
          <CardContent>
            <EntryPointForm
              companies={companies}
              preselectedCompanyId={preselectedCompanyId}
              redirectTo={redirectTo}
            />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
