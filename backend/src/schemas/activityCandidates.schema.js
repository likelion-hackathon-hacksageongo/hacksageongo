import { z } from "zod";

export const activityCategorySchema = z.enum([
  "career_required",
  "career_elective",
  "life_required",
  "life_elective",
]);

export const prioritySchema = z.enum(["low", "medium", "high"]);
export const difficultySchema = z.enum(["low", "medium", "high"]);

export const activityCandidateStatusSchema = z.enum([
  "candidate",
  "selected",
  "excluded",
]);

export const periodKeySchema = z.enum([
  "3-1",
  "summer",
  "3-2",
  "winter",
  "4-1",
  "final_summer",
  "4-2",
]);

export const generateActivityCandidatesSchema = z.object({
  replaceExisting: z.boolean().optional().default(false),
});

export const createActivityCandidateSchema = z.object({
  title: z.string().min(1).max(100),
  category: activityCategorySchema,
  description: z.string().max(1000).optional().nullable(),
  reason: z.string().max(1000).optional().nullable(),
  priority: prioritySchema.default("medium"),
  difficulty: difficultySchema.default("medium"),
  estimatedDuration: z.string().max(100).optional().nullable(),
  recommendedTiming: z.array(periodKeySchema).default([]),
});

export const updateActivityCandidateSchema = createActivityCandidateSchema
  .partial()
  .extend({
    status: activityCandidateStatusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required.",
  });

export const getActivityCandidatesQuerySchema = z.object({
  status: activityCandidateStatusSchema.optional(),
});
