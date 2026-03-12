import { PageHeader } from "@/components/layout/page-header";
import { PageLayout } from "@/components/layout/page-layout";
import { CompanyForm } from "@/components/forms/company-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id } });

  if (!company) notFound();

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <PageHeader
          title={`Modifier ${company.name}`}
          description="Modifier les informations de l'entreprise"
        />
        <Card>
          <CardHeader />
          <CardContent>
            <CompanyForm company={company} />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
