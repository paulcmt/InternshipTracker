import { z } from "zod";
import { ApplicationType, ApplicationStatus } from "@prisma/client";

const urlOptional = z
  .union([z.string().url(), z.literal(""), z.undefined()])
  .optional();

export const applicationCreateSchema = z.object({
  companyId: z.string().min(1, "L'entreprise est requise"),
  entryPointId: z.string().optional().nullable(),
  roleTitle: z.string().min(1, "Le titre du poste est requis"),
  location: z.string().optional(),
  offerUrl: urlOptional,
  applicationType: z.nativeEnum(ApplicationType),
  appliedAt: z.coerce.date().optional().nullable(),
  status: z.nativeEnum(ApplicationStatus),
  notes: z.string().optional(),
});

export const applicationUpdateSchema = applicationCreateSchema.partial().extend({
  companyId: z.string().optional(),
  entryPointId: z.string().optional().nullable(),
});

export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>;
export type ApplicationUpdateInput = z.infer<typeof applicationUpdateSchema>;
