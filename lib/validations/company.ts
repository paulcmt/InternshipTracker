import { z } from "zod";
import { CompanyStatus } from "@prisma/client";

const urlOptional = z.union([
  z.string().url(),
  z.literal(""),
  z.undefined(),
]).optional();

export const companyCreateSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  sizeEstimate: z.string().optional(),
  country: z.string().min(1, "Le pays est requis"),
  city: z.string().optional(),
  careersUrl: urlOptional,
  linkedinUrl: urlOptional,
  personalInterest: z.number().min(1).max(10),
  status: z.nativeEnum(CompanyStatus),
  notes: z.string().optional(),
});

export const companyUpdateSchema = companyCreateSchema.partial();

export type CompanyCreateInput = z.infer<typeof companyCreateSchema>;
export type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>;
