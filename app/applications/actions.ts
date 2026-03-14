"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import {
  applicationCreateSchema,
  applicationUpdateSchema,
} from "@/lib/validations/application";
import type {
  ApplicationStatus,
  ApplicationType,
} from "@prisma/client";

function formDataToApplication(data: FormData) {
  const appliedAtVal = data.get("appliedAt") as string;
  return {
    companyId: data.get("companyId") as string,
    entryPointId: (() => {
      const v = (data.get("entryPointId") as string) || undefined;
      return v && v !== "none" ? v : undefined;
    })(),
    roleTitle: data.get("roleTitle") as string,
    location: (data.get("location") as string) || undefined,
    offerUrl: (data.get("offerUrl") as string) || undefined,
    applicationType: data.get("applicationType") as ApplicationType,
    appliedAt: appliedAtVal || undefined,
    status: data.get("status") as ApplicationStatus,
    notes: (data.get("notes") as string) || undefined,
  };
}

export async function createApplication(_prev: unknown, formData: FormData) {
  const raw = formDataToApplication(formData);
  const data = {
    ...raw,
    entryPointId:
      raw.entryPointId && raw.entryPointId !== "none"
        ? raw.entryPointId
        : null,
    appliedAt: raw.appliedAt || null,
  };
  const parsed = applicationCreateSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  if (parsed.data.entryPointId) {
    const ep = await prisma.entryPoint.findUnique({
      where: { id: parsed.data.entryPointId },
    });
    if (!ep || ep.companyId !== parsed.data.companyId) {
      return { error: { entryPointId: ["Point d'entrée invalide pour cette entreprise"] } };
    }
  }
  const app = await prisma.application.create({
    data: {
      ...parsed.data,
      entryPointId: parsed.data.entryPointId ?? null,
      appliedAt: parsed.data.appliedAt ?? null,
    },
  });
  revalidatePath("/applications");
  revalidatePath(`/companies/${app.companyId}`);
  revalidatePath("/dashboard");
  const redirectTo = formData.get("redirectTo") as string | null;
  if (redirectTo?.startsWith("/companies/")) {
    redirect(redirectTo);
  }
  redirect("/applications");
}

export async function updateApplication(_prev: unknown, formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return { error: { id: ["ID manquant"] } };
  const raw = formDataToApplication(formData);
  const data = {
    ...raw,
    entryPointId:
      !raw.entryPointId || raw.entryPointId === "" || raw.entryPointId === "none"
        ? null
        : raw.entryPointId,
    appliedAt: raw.appliedAt === "" ? null : raw.appliedAt,
  };
  const parsed = applicationUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) return { error: { id: ["Candidature introuvable"] } };
  const companyId = parsed.data.companyId ?? app.companyId;
  if (parsed.data.entryPointId) {
    const ep = await prisma.entryPoint.findUnique({
      where: { id: parsed.data.entryPointId },
    });
    if (!ep || ep.companyId !== companyId) {
      return { error: { entryPointId: ["Point d'entrée invalide pour cette entreprise"] } };
    }
  }
  const updateData = { ...parsed.data };
  await prisma.application.update({ where: { id }, data: updateData });
  revalidatePath("/applications");
  revalidatePath(`/companies/${app.companyId}`);
  revalidatePath("/dashboard");
  redirect("/applications");
}

export async function deleteApplication(id: string) {
  const app = await prisma.application.findUnique({ where: { id } });
  await prisma.application.delete({ where: { id } });
  revalidatePath("/applications");
  revalidatePath("/interviews");
  if (app) revalidatePath(`/companies/${app.companyId}`);
  revalidatePath("/dashboard");
  redirect("/applications");
}
