"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import {
  interviewCreateSchema,
  interviewUpdateSchema,
} from "@/lib/validations/interview";
import type { InterviewStatus, InterviewType } from "@prisma/client";

function formDataToInterview(data: FormData) {
  const scheduledAtVal = data.get("scheduledAt") as string;
  return {
    companyId: data.get("companyId") as string,
    applicationId: data.get("applicationId") as string,
    interviewType: data.get("interviewType") as InterviewType,
    interviewerName: (data.get("interviewerName") as string) || undefined,
    scheduledAt: scheduledAtVal || undefined,
    status: data.get("status") as InterviewStatus,
    feedback: (data.get("feedback") as string) || undefined,
    strengths: (data.get("strengths") as string) || undefined,
    improvements: (data.get("improvements") as string) || undefined,
    nextStep: (data.get("nextStep") as string) || undefined,
  };
}

export async function createInterview(_prev: unknown, formData: FormData) {
  const raw = formDataToInterview(formData);
  const data = {
    ...raw,
    scheduledAt: raw.scheduledAt || null,
  };
  const parsed = interviewCreateSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const app = await prisma.application.findUnique({
    where: { id: parsed.data.applicationId },
  });
  if (!app || app.companyId !== parsed.data.companyId) {
    return {
      error: {
        applicationId: ["La candidature doit appartenir à cette entreprise"],
      },
    };
  }
  const interview = await prisma.interview.create({
    data: {
      ...parsed.data,
      scheduledAt: parsed.data.scheduledAt ?? null,
    },
  });
  revalidatePath("/interviews");
  revalidatePath(`/companies/${interview.companyId}`);
  revalidatePath(`/applications/${interview.applicationId}`);
  revalidatePath("/dashboard");
  const redirectTo = formData.get("redirectTo") as string | null;
  if (redirectTo?.startsWith("/companies/")) {
    redirect(redirectTo);
  }
  redirect("/interviews");
}

export async function updateInterview(_prev: unknown, formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return { error: { id: ["ID manquant"] } };
  const raw = formDataToInterview(formData);
  const data = {
    ...raw,
    scheduledAt: raw.scheduledAt === "" ? null : raw.scheduledAt,
  };
  const parsed = interviewUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const existing = await prisma.interview.findUnique({ where: { id } });
  if (!existing) return { error: { id: ["Entretien introuvable"] } };
  if (parsed.data.applicationId) {
    const app = await prisma.application.findUnique({
      where: { id: parsed.data.applicationId },
    });
    const companyId = parsed.data.companyId ?? existing.companyId;
    if (!app || app.companyId !== companyId) {
      return {
        error: {
          applicationId: ["La candidature doit appartenir à cette entreprise"],
        },
      };
    }
  }
  const updateData = { ...parsed.data };
  await prisma.interview.update({ where: { id }, data: updateData });
  revalidatePath("/interviews");
  revalidatePath(`/companies/${existing.companyId}`);
  revalidatePath(`/applications/${existing.applicationId}`);
  redirect("/interviews");
}

export async function deleteInterview(id: string) {
  const interview = await prisma.interview.findUnique({ where: { id } });
  await prisma.interview.delete({ where: { id } });
  revalidatePath("/interviews");
  if (interview) {
    revalidatePath(`/companies/${interview.companyId}`);
    revalidatePath(`/applications/${interview.applicationId}`);
  }
  revalidatePath("/dashboard");
  redirect("/interviews");
}
