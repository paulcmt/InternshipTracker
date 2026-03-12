import { z } from "zod";
import { CompanyStatus } from "@prisma/client";

const urlOptional = z.union([
  z.string().url(),
  z.literal(""),
  z.undefined(),
]).optional();

export const companyCreateSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  companyType: z.string().min(1, "Le type d'entreprise est requis"),
  sizeEstimate: z.string().optional(),
  country: z.string().min(1, "Le pays est requis"),
  city: z.string().optional(),
  careersUrl: urlOptional,
  linkedinUrl: urlOptional,
  targetRoles: z.string().min(1, "Les rôles cibles sont requis"),
  personalInterest: z.number().min(1).max(10),
  deadline: z
    .string()
    .min(1, "La date limite est requise")
    .pipe(z.coerce.date()),
  status: z.nativeEnum(CompanyStatus),
  notes: z.string().optional(),
});

export const companyUpdateSchema = companyCreateSchema.partial().extend({
  deadline: z.coerce.date().optional().nullable(),
});

export type CompanyCreateInput = z.infer<typeof companyCreateSchema>;
export type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>;
