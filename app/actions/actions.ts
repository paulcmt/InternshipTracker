"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import {
  actionCreateSchema,
  actionUpdateSchema,
} from "@/lib/validations/action";
import type { ActionStatus, ActionPriority } from "@prisma/client";

function formDataToAction(data: FormData) {
  const dueDateVal = (data.get("dueDate") as string)?.trim();
  return {
    title: data.get("title") as string,
    description: (data.get("description") as string) || undefined,
    status: data.get("status") as ActionStatus,
    priority: data.get("priority") as ActionPriority,
    dueDate: dueDateVal ? dueDateVal : undefined,
    companyId: (() => {
      const v = (data.get("companyId") as string)?.trim();
      return v && v !== "none" ? v : undefined;
    })(),
    entryPointId: (data.get("entryPointId") as string) || undefined,
    applicationId: (data.get("applicationId") as string) || undefined,
    interviewId: (data.get("interviewId") as string) || undefined,
  };
}

export async function createAction(_prev: unknown, formData: FormData) {
  const raw = formDataToAction(formData);
  const data = {
    ...raw,
    companyId: raw.companyId || null,
    entryPointId: raw.entryPointId || null,
    applicationId: raw.applicationId || null,
    interviewId: raw.interviewId || null,
    dueDate: raw.dueDate ? new Date(raw.dueDate) : null,
  };
  const parsed = actionCreateSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const pd = parsed.data;
  const action = await prisma.action.create({
    data: {
      title: pd.title,
      description: pd.description ?? null,
      status: pd.status,
      priority: pd.priority,
      dueDate: pd.dueDate ?? null,
      companyId: pd.companyId ?? null,
      entryPointId: pd.entryPointId ?? null,
      applicationId: pd.applicationId ?? null,
      interviewId: pd.interviewId ?? null,
    },
  });
  revalidatePath("/actions");
  revalidatePath("/dashboard");
  if (action.companyId) revalidatePath(`/companies/${action.companyId}`);
  const redirectTo = formData.get("redirectTo") as string | null;
  if (redirectTo?.startsWith("/companies/")) {
    redirect(redirectTo);
  }
  redirect("/actions");
}

export async function updateAction(_prev: unknown, formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return { error: { id: ["ID manquant"] } };
  const raw = formDataToAction(formData);
  const data = {
    ...raw,
    companyId: raw.companyId || null,
    entryPointId: raw.entryPointId || null,
    applicationId: raw.applicationId || null,
    interviewId: raw.interviewId || null,
    dueDate: raw.dueDate ? new Date(raw.dueDate) : raw.dueDate === null ? null : undefined,
  };
  const parsed = actionUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const action = await prisma.action.findUnique({ where: { id } });
  if (!action) return { error: { id: ["Action introuvable"] } };
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "DONE" && action.status !== "DONE") {
    updateData.completedAt = new Date();
  } else if (parsed.data.status !== "DONE" && parsed.data.status !== undefined) {
    updateData.completedAt = null;
  }
  await prisma.action.update({
    where: { id },
    data: updateData as Parameters<typeof prisma.action.update>[0]["data"],
  });
  revalidatePath("/actions");
  revalidatePath("/dashboard");
  if (action.companyId) revalidatePath(`/companies/${action.companyId}`);
  redirect("/actions");
}

export async function completeAction(id: string) {
  const action = await prisma.action.findUnique({ where: { id } });
  if (!action) return { error: "Action introuvable" };
  if (action.status === "DONE" || action.status === "CANCELED") {
    return { ok: true }; // Already terminal, no-op
  }
  await prisma.action.update({
    where: { id },
    data: { status: "DONE", completedAt: new Date() },
  });
  revalidatePath("/actions");
  revalidatePath("/dashboard");
  if (action.companyId) revalidatePath(`/companies/${action.companyId}`);
  return { ok: true };
}

export async function deleteAction(id: string) {
  const action = await prisma.action.findUnique({ where: { id } });
  await prisma.action.delete({ where: { id } });
  revalidatePath("/actions");
  revalidatePath("/dashboard");
  if (action?.companyId) revalidatePath(`/companies/${action.companyId}`);
  redirect("/actions");
}
