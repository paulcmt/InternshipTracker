"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import {
  entryPointCreateSchema,
  entryPointUpdateSchema,
} from "@/lib/validations/entry-point";
import type { EntryPointStatus, EntryPointType } from "@prisma/client";

function formDataToEntryPoint(data: FormData) {
  const nextActionDateVal = data.get("nextActionDate") as string;
  return {
    companyId: data.get("companyId") as string,
    type: data.get("type") as EntryPointType,
    personName: (data.get("personName") as string) || undefined,
    personRole: (data.get("personRole") as string) || undefined,
    linkedinUrl: (data.get("linkedinUrl") as string) || undefined,
    email: (data.get("email") as string) || undefined,
    channel: (data.get("channel") as string) || undefined,
    status: data.get("status") as EntryPointStatus,
    nextAction: (data.get("nextAction") as string) || undefined,
    nextActionDate: nextActionDateVal || undefined,
    notes: (data.get("notes") as string) || undefined,
  };
}

export async function createEntryPoint(_prev: unknown, formData: FormData) {
  const data = formDataToEntryPoint(formData);
  const parsed = entryPointCreateSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const entry = await prisma.entryPoint.create({
    data: {
      ...parsed.data,
      nextActionDate: parsed.data.nextActionDate ?? undefined,
    },
  });
  revalidatePath("/entry-points");
  revalidatePath(`/companies/${entry.companyId}`);
  revalidatePath("/dashboard");
  const redirectTo = formData.get("redirectTo") as string | null;
  if (redirectTo?.startsWith("/companies/")) {
    redirect(redirectTo);
  }
  redirect("/entry-points");
}

export async function updateEntryPoint(_prev: unknown, formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return { error: { id: ["ID manquant"] } };
  const raw = formDataToEntryPoint(formData);
  const data = {
    ...raw,
    nextActionDate: raw.nextActionDate === "" ? null : raw.nextActionDate,
  };
  const parsed = entryPointUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const entry = await prisma.entryPoint.findUnique({ where: { id } });
  if (!entry) return { error: { id: ["Point d'entrée introuvable"] } };
  const updateData = { ...parsed.data };
  await prisma.entryPoint.update({ where: { id }, data: updateData });
  revalidatePath("/entry-points");
  revalidatePath(`/companies/${entry.companyId}`);
  revalidatePath("/dashboard");
  redirect("/entry-points");
}

export async function deleteEntryPoint(id: string) {
  const entry = await prisma.entryPoint.findUnique({ where: { id } });
  await prisma.entryPoint.delete({ where: { id } });
  revalidatePath("/entry-points");
  if (entry) revalidatePath(`/companies/${entry.companyId}`);
  revalidatePath("/dashboard");
  redirect("/entry-points");
}
