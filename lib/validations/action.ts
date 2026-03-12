import { z } from "zod";
import { ActionStatus, ActionPriority } from "@prisma/client";

export const actionCreateSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  status: z.nativeEnum(ActionStatus),
  priority: z.nativeEnum(ActionPriority),
  dueDate: z.coerce.date().optional().nullable(),
  companyId: z.string().optional().nullable(),
  entryPointId: z.string().optional().nullable(),
  applicationId: z.string().optional().nullable(),
  interviewId: z.string().optional().nullable(),
});

export const actionUpdateSchema = actionCreateSchema.partial().extend({
  dueDate: z.coerce.date().optional().nullable(),
  completedAt: z.coerce.date().optional().nullable(),
});

export type ActionCreateInput = z.infer<typeof actionCreateSchema>;
export type ActionUpdateInput = z.infer<typeof actionUpdateSchema>;
