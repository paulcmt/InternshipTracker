import { PageHeader } from "@/components/layout/page-header";
import { PageLayout } from "@/components/layout/page-layout";
import { InterviewForm } from "@/components/forms/interview-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { INTERVIEW_TYPE_LABELS } from "@/lib/utils/enums";

export default async function EditInterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const interview = await prisma.interview.findUnique({
    where: { id },
    include: {
      company: true,
      application: true,
    },
  });

  if (!interview) notFound();

  const [companies, applications] = await Promise.all([
    prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.application.findMany({
      where: { companyId: interview.companyId },
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

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <PageHeader
          title={`Modifier — ${interview.company.name}`}
          description={`${INTERVIEW_TYPE_LABELS[interview.interviewType]} — ${interview.application.roleTitle}`}
        />
        <Card>
          <CardHeader />
          <CardContent>
            <InterviewForm
              interview={interview}
              companies={companies}
              applications={applicationOptions}
            />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
