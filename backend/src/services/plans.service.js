import { supabase } from "../config/supabase.js";
import { AppError } from "../utils/AppError.js";
import { generateText } from "./ai/gemini.service.js";
import { getProfileByGuestId } from "./profiles.service.js";
import { buildTimelinePrompt } from "./ai/prompts/timeline.prompt.js";

function ensureSupabaseConfigured() {
  if (!supabase) {
    throw new AppError(
      500,
      "SUPABASE_NOT_CONFIGURED",
      "Supabase environment variables are missing.",
    );
  }
}

function toPlanResponse(row) {
  return {
    id: row.id,
    guestId: row.guest_id,
    type: row.type,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPlanItemResponse(row) {
  return {
    id: row.id,
    guestId: row.guest_id,
    planId: row.plan_id,
    periodKey: row.period_key,
    periodLabel: row.period_label,
    title: row.title,
    description: row.description,
    category: row.category,
    sourceActivityId: row.source_activity_id,
    orderIndex: row.order_index,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPlanItemRow(guestId, planId, payload) {
  const row = {
    guest_id: guestId,
    plan_id: planId,
  };

  if ("periodKey" in payload) row.period_key = payload.periodKey;
  if ("periodLabel" in payload) row.period_label = payload.periodLabel;
  if ("title" in payload) row.title = payload.title;
  if ("description" in payload) row.description = payload.description ?? null;
  if ("category" in payload) row.category = payload.category;
  if ("sourceActivityId" in payload) {
    row.source_activity_id = payload.sourceActivityId ?? null;
  }
  if ("orderIndex" in payload) row.order_index = payload.orderIndex;

  return row;
}

function extractJson(text) {
  const trimmed = text.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return JSON.parse(trimmed);
  }

  const match = trimmed.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new AppError(
      502,
      "AI_INVALID_JSON",
      "Gemini response did not contain valid JSON.",
    );
  }

  return JSON.parse(match[0]);
}

async function getProfileOrNull(guestId) {
  try {
    return await getProfileByGuestId(guestId);
  } catch (error) {
    if (error.code === "PROFILE_NOT_FOUND") return null;
    throw error;
  }
}

async function getUserInsightsOrNull(guestId) {
  const { data, error } = await supabase
    .from("user_insights")
    .select("*")
    .eq("guest_id", guestId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, "USER_INSIGHTS_FETCH_FAILED", error.message);
  }

  if (!data) return null;

  return {
    summary: data.summary,
    goals: data.goals,
    concerns: data.concerns,
    memorableExperiences: data.memorable_experiences,
    regrets: data.regrets,
    preferredActivities: data.preferred_activities,
    constraints: data.constraints,
  };
}

async function getSelectedCandidates(guestId, candidateIds) {
  let request = supabase
    .from("activity_candidates")
    .select("*")
    .eq("guest_id", guestId);

  if (candidateIds?.length > 0) {
    request = request.in("id", candidateIds);
  } else {
    request = request.eq("status", "selected");
  }

  const { data, error } = await request;

  if (error) {
    throw new AppError(500, "ACTIVITY_CANDIDATES_FETCH_FAILED", error.message);
  }

  if (!data || data.length === 0) {
    throw new AppError(
      400,
      "NO_SELECTED_ACTIVITY_CANDIDATES",
      "No selected activity candidates were found.",
    );
  }

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    reason: row.reason,
    priority: row.priority,
    difficulty: row.difficulty,
    estimatedDuration: row.estimated_duration,
    recommendedTiming: row.recommended_timing ?? [],
  }));
}

function normalizeAiPlanItem(item) {
  return {
    periodKey: item.periodKey,
    periodLabel: item.periodLabel,
    title: item.title,
    description: item.description ?? null,
    category: item.category,
    sourceActivityId: item.sourceActivityId ?? null,
    orderIndex: Number(item.orderIndex ?? 1),
  };
}

export async function generatePlan(guestId, payload) {
  ensureSupabaseConfigured();

  const profile = await getProfileOrNull(guestId);
  const insights = await getUserInsightsOrNull(guestId);
  const candidates = await getSelectedCandidates(guestId, payload.candidateIds);

  const prompt = buildTimelinePrompt({
    profile,
    insights,
    candidates,
  });

  const aiText = await generateText(prompt);

  let parsed;
  try {
    parsed = extractJson(aiText);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new AppError(
        502,
        "AI_INVALID_JSON",
        "Gemini response was not valid JSON.",
      );
    }

    throw error;
  }

  const items = Array.isArray(parsed.items)
    ? parsed.items.map(normalizeAiPlanItem)
    : [];

  if (items.length === 0) {
    throw new AppError(
      502,
      "AI_EMPTY_PLAN_ITEMS",
      "Gemini did not return any plan items.",
    );
  }

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .insert({
      guest_id: guestId,
      type: payload.planType ?? "ai_draft",
      title: parsed.title ?? "AI 추천 대학생활 로드맵",
      status: "draft",
    })
    .select("*")
    .single();

  if (planError) {
    throw new AppError(500, "PLAN_CREATE_FAILED", planError.message);
  }

  const itemRows = items.map((item) => toPlanItemRow(guestId, plan.id, item));

  const { data: insertedItems, error: itemsError } = await supabase
    .from("plan_items")
    .insert(itemRows)
    .select("*");

  if (itemsError) {
    throw new AppError(500, "PLAN_ITEMS_CREATE_FAILED", itemsError.message);
  }

  return {
    plan: toPlanResponse(plan),
    items: insertedItems.map(toPlanItemResponse),
  };
}

export async function getPlans(guestId, query = {}) {
  ensureSupabaseConfigured();

  let request = supabase
    .from("plans")
    .select("*")
    .eq("guest_id", guestId)
    .order("created_at", { ascending: false });

  if (query.type) request = request.eq("type", query.type);
  if (query.status) request = request.eq("status", query.status);

  const { data, error } = await request;

  if (error) {
    throw new AppError(500, "PLANS_FETCH_FAILED", error.message);
  }

  return data.map(toPlanResponse);
}

export async function getPlanDetail(guestId, planId) {
  ensureSupabaseConfigured();

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("*")
    .eq("id", planId)
    .eq("guest_id", guestId)
    .maybeSingle();

  if (planError) {
    throw new AppError(500, "PLAN_FETCH_FAILED", planError.message);
  }

  if (!plan) {
    throw new AppError(404, "PLAN_NOT_FOUND", "Plan was not found.");
  }

  const { data: items, error: itemsError } = await supabase
    .from("plan_items")
    .select("*")
    .eq("plan_id", planId)
    .eq("guest_id", guestId)
    .order("period_key", { ascending: true })
    .order("order_index", { ascending: true });

  if (itemsError) {
    throw new AppError(500, "PLAN_ITEMS_FETCH_FAILED", itemsError.message);
  }

  return {
    plan: toPlanResponse(plan),
    items: items.map(toPlanItemResponse),
  };
}

export async function getActivePlan(guestId) {
  ensureSupabaseConfigured();

  const { data: plan, error } = await supabase
    .from("plans")
    .select("*")
    .eq("guest_id", guestId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new AppError(500, "ACTIVE_PLAN_FETCH_FAILED", error.message);
  }

  if (!plan) {
    throw new AppError(
      404,
      "ACTIVE_PLAN_NOT_FOUND",
      "Active plan was not found.",
    );
  }

  return getPlanDetail(guestId, plan.id);
}

export async function forkPlan(guestId, sourcePlanId, payload) {
  ensureSupabaseConfigured();

  const source = await getPlanDetail(guestId, sourcePlanId);

  await supabase
    .from("plans")
    .update({
      status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("guest_id", guestId)
    .eq("status", "active");

  const { data: newPlan, error: planError } = await supabase
    .from("plans")
    .insert({
      guest_id: guestId,
      type: payload.targetType,
      title: payload.title,
      status: "active",
    })
    .select("*")
    .single();

  if (planError) {
    throw new AppError(500, "PLAN_FORK_FAILED", planError.message);
  }

  const copiedRows = source.items.map((item) => ({
    guest_id: guestId,
    plan_id: newPlan.id,
    period_key: item.periodKey,
    period_label: item.periodLabel,
    title: item.title,
    description: item.description,
    category: item.category,
    source_activity_id: item.sourceActivityId,
    order_index: item.orderIndex,
  }));

  const { data: copiedItems, error: itemsError } = await supabase
    .from("plan_items")
    .insert(copiedRows)
    .select("*");

  if (itemsError) {
    throw new AppError(500, "PLAN_ITEMS_COPY_FAILED", itemsError.message);
  }

  return {
    sourcePlanId,
    newPlanId: newPlan.id,
    type: newPlan.type,
    title: newPlan.title,
    itemsCopied: copiedItems.length,
  };
}

export async function createPlanItem(guestId, planId, payload) {
  ensureSupabaseConfigured();

  await getPlanDetail(guestId, planId);

  const { data, error } = await supabase
    .from("plan_items")
    .insert(toPlanItemRow(guestId, planId, payload))
    .select("*")
    .single();

  if (error) {
    throw new AppError(500, "PLAN_ITEM_CREATE_FAILED", error.message);
  }

  return toPlanItemResponse(data);
}

export async function updatePlanItem(guestId, itemId, payload) {
  ensureSupabaseConfigured();

  const updateRow = {
    ...toPlanItemRow(guestId, null, payload),
    updated_at: new Date().toISOString(),
  };

  delete updateRow.guest_id;
  delete updateRow.plan_id;

  const { data, error } = await supabase
    .from("plan_items")
    .update(updateRow)
    .eq("id", itemId)
    .eq("guest_id", guestId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new AppError(500, "PLAN_ITEM_UPDATE_FAILED", error.message);
  }

  if (!data) {
    throw new AppError(404, "PLAN_ITEM_NOT_FOUND", "Plan item was not found.");
  }

  return toPlanItemResponse(data);
}

export async function deletePlanItem(guestId, itemId) {
  ensureSupabaseConfigured();

  const { data, error } = await supabase
    .from("plan_items")
    .delete()
    .eq("id", itemId)
    .eq("guest_id", guestId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new AppError(500, "PLAN_ITEM_DELETE_FAILED", error.message);
  }

  if (!data) {
    throw new AppError(404, "PLAN_ITEM_NOT_FOUND", "Plan item was not found.");
  }

  return {
    deleted: true,
    id: data.id,
  };
}
