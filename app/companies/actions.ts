"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import {
  companyCreateSchema,
  companyUpdateSchema,
} from "@/lib/validations/company";
import type { CompanyStatus } from "@prisma/client";

function formDataToCompany(data: FormData) {
  return {
    name: data.get("name") as string,
    sizeEstimate: (data.get("sizeEstimate") as string) || undefined,
    country: data.get("country") as string,
    city: (data.get("city") as string) || undefined,
    careersUrl: (data.get("careersUrl") as string) || undefined,
    linkedinUrl: (data.get("linkedinUrl") as string) || undefined,
    personalInterest: Number(data.get("personalInterest")),
    status: data.get("status") as CompanyStatus,
    notes: (data.get("notes") as string) || undefined,
  };
}

export async function createCompany(_prev: unknown, formData: FormData) {
  const data = formDataToCompany(formData);
  const parsed = companyCreateSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  await prisma.company.create({ data: parsed.data });
  revalidatePath("/companies");
  revalidatePath("/dashboard");
  redirect("/companies");
}

export async function updateCompany(_prev: unknown, formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return { error: { id: ["ID manquant"] } };
  const data = formDataToCompany(formData);
  const parsed = companyUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const updateData = { ...parsed.data };
  await prisma.company.update({ where: { id }, data: updateData });
  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
  revalidatePath("/dashboard");
  redirect(`/companies/${id}`);
}

export async function deleteCompany(id: string) {
  await prisma.company.delete({ where: { id } });
  revalidatePath("/companies");
  revalidatePath("/entry-points");
  revalidatePath("/applications");
  revalidatePath("/interviews");
  revalidatePath("/dashboard");
  redirect("/companies");
}
