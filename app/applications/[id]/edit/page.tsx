import { PageHeader } from "@/components/layout/page-header";
import { PageLayout } from "@/components/layout/page-layout";
import { ApplicationForm } from "@/components/forms/application-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { ENTRY_POINT_TYPE_LABELS } from "@/lib/utils/enums";
import type { EntryPointType } from "@prisma/client";

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      company: true,
      entryPoint: true,
    },
  });

  if (!application) notFound();

  const [companies, entryPoints] = await Promise.all([
    prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.entryPoint.findMany({
      where: { companyId: application.companyId },
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

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <PageHeader
          title={`Modifier — ${application.company.name}`}
          description={application.roleTitle}
        />
        <Card>
          <CardHeader />
          <CardContent>
            <ApplicationForm
              application={application}
              companies={companies}
              entryPoints={entryPointOptions}
            />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
