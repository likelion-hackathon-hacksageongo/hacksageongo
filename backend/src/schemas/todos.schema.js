import { z } from "zod";

export const todoScopeSchema = z.enum(["today", "month", "semester"]);

export const todoStatusSchema = z.enum([
  "todo",
  "in_progress",
  "done",
  "deferred",
]);

export const prioritySchema = z.enum(["low", "medium", "high"]);

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format.");

export const generateTodosSchema = z.object({
  planId: z.string().uuid(),
  scopes: z
    .array(todoScopeSchema)
    .min(1)
    .default(["today", "month", "semester"]),
  replaceExisting: z.boolean().optional().default(true),
});

export const getTodosQuerySchema = z.object({
  scope: todoScopeSchema.optional(),
  status: todoStatusSchema.optional(),
});

export const createTodoSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(1000).optional().nullable(),
  scope: todoScopeSchema,
  priority: prioritySchema.default("medium"),
  dueDate: dateSchema.optional().nullable(),
  relatedPlanId: z.string().uuid().optional().nullable(),
  relatedPlanItemId: z.string().uuid().optional().nullable(),
});

export const updateTodoSchema = createTodoSchema
  .partial()
  .extend({
    status: todoStatusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required.",
  });

export const deferTodoSchema = z.object({
  newDueDate: dateSchema,
  reason: z.string().max(500).optional().nullable(),
});
