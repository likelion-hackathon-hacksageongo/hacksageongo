import { z } from "zod";

export const proposalStatusSchema = z.enum([
  "pending",
  "applied",
  "rejected",
  "expired",
]);

export const proposalContextPageSchema = z.enum([
  "activity_candidates",
  "timeline",
  "todos",
]);

export const proposalItemTypeSchema = z.enum([
  "add_activity_candidate",
  "update_activity_candidate",
  "exclude_activity_candidate",
  "add_plan_item",
  "update_plan_item",
  "delete_plan_item",
  "add_todo",
  "update_todo",
  "delete_todo",
]);

export const getAiProposalsQuerySchema = z.object({
  status: proposalStatusSchema.optional(),
  contextPage: proposalContextPageSchema.optional(),
});

export const createAiProposalSchema = z.object({
  contextPage: proposalContextPageSchema,
  summary: z.string().min(1).max(500),
  items: z
    .array(
      z.object({
        type: proposalItemTypeSchema,
        payload: z.record(z.any()),
        sortIndex: z.number().int().min(1).optional(),
      }),
    )
    .min(1),
});
