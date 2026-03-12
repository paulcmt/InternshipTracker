import { z } from "zod";
import { EntryPointType, EntryPointStatus } from "@prisma/client";

const urlOptional = z
  .union([z.string().url(), z.literal(""), z.undefined()])
  .optional();
const emailOptional = z
  .union([z.string().email(), z.literal(""), z.undefined()])
  .optional();

export const entryPointCreateSchema = z.object({
  companyId: z.string().min(1, "L'entreprise est requise"),
  type: z.nativeEnum(EntryPointType),
  personName: z.string().optional(),
  personRole: z.string().optional(),
  linkedinUrl: urlOptional,
  email: emailOptional,
  channel: z.string().optional(),
  status: z.nativeEnum(EntryPointStatus),
  nextAction: z.string().optional(),
  nextActionDate: z.coerce.date().optional().nullable(),
  notes: z.string().optional(),
});

export const entryPointUpdateSchema = entryPointCreateSchema.partial().extend({
  companyId: z.string().optional(),
});

export type EntryPointCreateInput = z.infer<typeof entryPointCreateSchema>;
export type EntryPointUpdateInput = z.infer<typeof entryPointUpdateSchema>;
