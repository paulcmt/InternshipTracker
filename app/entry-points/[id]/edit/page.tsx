import { PageHeader } from "@/components/layout/page-header";
import { PageLayout } from "@/components/layout/page-layout";
import { EntryPointForm } from "@/components/forms/entry-point-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { ENTRY_POINT_TYPE_LABELS } from "@/lib/utils/enums";

export default async function EditEntryPointPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entryPoint = await prisma.entryPoint.findUnique({
    where: { id },
    include: { company: true },
  });

  if (!entryPoint) notFound();

  const companies = await prisma.company.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <PageHeader
          title={`Modifier — ${entryPoint.company.name}`}
          description={`${entryPoint.personName ?? ENTRY_POINT_TYPE_LABELS[entryPoint.type]}`}
        />
        <Card>
          <CardHeader />
          <CardContent>
            <EntryPointForm
              entryPoint={entryPoint}
              companies={companies}
            />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
