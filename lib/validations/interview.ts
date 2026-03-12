import { z } from "zod";
import { InterviewType, InterviewStatus } from "@prisma/client";

export const interviewCreateSchema = z.object({
  companyId: z.string().min(1, "L'entreprise est requise"),
  applicationId: z.string().min(1, "La candidature est requise"),
  interviewType: z.nativeEnum(InterviewType),
  interviewerName: z.string().optional(),
  scheduledAt: z.coerce.date().optional().nullable(),
  status: z.nativeEnum(InterviewStatus),
  feedback: z.string().optional(),
  strengths: z.string().optional(),
  improvements: z.string().optional(),
  nextStep: z.string().optional(),
});

export const interviewUpdateSchema = interviewCreateSchema.partial().extend({
  companyId: z.string().optional(),
  applicationId: z.string().optional(),
});

export type InterviewCreateInput = z.infer<typeof interviewCreateSchema>;
export type InterviewUpdateInput = z.infer<typeof interviewUpdateSchema>;
