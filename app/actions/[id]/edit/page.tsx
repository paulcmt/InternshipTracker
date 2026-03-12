import { PageHeader } from "@/components/layout/page-header";
import { PageLayout } from "@/components/layout/page-layout";
import { ActionForm } from "@/components/forms/action-form";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";

export default async function EditActionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const action = await prisma.action.findUnique({
    where: { id },
    include: {
      company: { select: { id: true, name: true } },
      entryPoint: { select: { id: true, companyId: true } },
      application: { select: { id: true, companyId: true } },
      interview: { select: { id: true, companyId: true } },
    },
  });

  if (!action) notFound();

  const companies = await prisma.company.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-6 p-6 max-w-2xl">
        <PageHeader
          title="Modifier l'action"
          description={action.title}
        />
        <ActionForm action={action} companies={companies} />
      </div>
    </PageLayout>
  );
}
