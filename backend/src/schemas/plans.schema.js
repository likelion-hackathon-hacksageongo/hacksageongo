import { z } from "zod";
import {
  activityCategorySchema,
  periodKeySchema,
} from "./activityCandidates.schema.js";

export const planTypeSchema = z.enum(["ai_draft", "user_plan", "final"]);

export const planStatusSchema = z.enum(["draft", "active", "archived"]);

export const generatePlanSchema = z.object({
  candidateIds: z.array(z.string().uuid()).optional(),
  planType: planTypeSchema.default("ai_draft"),
});

export const getPlansQuerySchema = z.object({
  type: planTypeSchema.optional(),
  status: planStatusSchema.optional(),
});

export const forkPlanSchema = z.object({
  targetType: z.enum(["user_plan", "final"]).default("user_plan"),
  title: z.string().min(1).max(100).default("내가 선택한 대학생활 로드맵"),
});

export const createPlanItemSchema = z.object({
  periodKey: periodKeySchema,
  periodLabel: z.string().min(1).max(50),
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional().nullable(),
  category: activityCategorySchema,
  sourceActivityId: z.string().uuid().optional().nullable(),
  orderIndex: z.number().int().min(1).default(1),
});

export const updatePlanItemSchema = createPlanItemSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required.",
  });
