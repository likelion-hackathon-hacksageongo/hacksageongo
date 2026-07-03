import { z } from "zod";

export const createChatSessionSchema = z.object({
  purpose: z
    .enum([
      "onboarding",
      "activity_planning",
      "timeline_planning",
      "todo_planning",
    ])
    .default("onboarding"),
});

export const sendChatMessageSchema = z.object({
  message: z.string().min(1).max(3000),
  contextPage: z
    .enum(["onboarding", "activity_candidates", "timeline", "todos"])
    .default("onboarding"),
});
