import { supabase } from "../config/supabase.js";
import { AppError } from "../utils/AppError.js";

function ensureSupabaseConfigured() {
  if (!supabase) {
    throw new AppError(
      500,
      "SUPABASE_NOT_CONFIGURED",
      "Supabase environment variables are missing.",
    );
  }
}

function toProposalResponse(row, items = []) {
  return {
    id: row.id,
    guestId: row.guest_id,
    contextPage: row.context_page,
    summary: row.summary,
    status: row.status,
    items,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    appliedAt: row.applied_at,
    rejectedAt: row.rejected_at,
  };
}

function toProposalItemResponse(row) {
  return {
    id: row.id,
    proposalId: row.proposal_id,
    type: row.type,
    payload: row.payload,
    result: row.result,
    sortIndex: row.sort_index,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function requirePayloadId(payload, keys) {
  for (const key of keys) {
    if (payload[key]) return payload[key];
  }

  throw new AppError(
    400,
    "INVALID_PROPOSAL_PAYLOAD",
    `Payload must include one of: ${keys.join(", ")}`,
  );
}

function activityCandidateRowFromPayload(guestId, payload, source = "ai") {
  return {
    guest_id: guestId,
    title: payload.title,
    category: payload.category,
    description: payload.description ?? null,
    reason: payload.reason ?? null,
    priority: payload.priority ?? "medium",
    difficulty: payload.difficulty ?? "medium",
    estimated_duration: payload.estimatedDuration ?? null,
    recommended_timing: payload.recommendedTiming ?? [],
    status: payload.status ?? "candidate",
    source,
  };
}

function activityCandidateUpdateRowFromPayload(payload) {
  const row = {};

  if ("title" in payload) row.title = payload.title;
  if ("category" in payload) row.category = payload.category;
  if ("description" in payload) row.description = payload.description ?? null;
  if ("reason" in payload) row.reason = payload.reason ?? null;
  if ("priority" in payload) row.priority = payload.priority;
  if ("difficulty" in payload) row.difficulty = payload.difficulty;
  if ("estimatedDuration" in payload) {
    row.estimated_duration = payload.estimatedDuration ?? null;
  }
  if ("recommendedTiming" in payload) {
    row.recommended_timing = payload.recommendedTiming ?? [];
  }
  if ("status" in payload) row.status = payload.status;

  row.updated_at = new Date().toISOString();

  return row;
}

function planItemRowFromPayload(guestId, payload) {
  return {
    guest_id: guestId,
    plan_id: payload.planId,
    period_key: payload.periodKey,
    period_label: payload.periodLabel,
    title: payload.title,
    description: payload.description ?? null,
    category: payload.category,
    source_activity_id: payload.sourceActivityId ?? null,
    order_index: payload.orderIndex ?? 1,
  };
}

function planItemUpdateRowFromPayload(payload) {
  const row = {};

  if ("periodKey" in payload) row.period_key = payload.periodKey;
  if ("periodLabel" in payload) row.period_label = payload.periodLabel;
  if ("title" in payload) row.title = payload.title;
  if ("description" in payload) row.description = payload.description ?? null;
  if ("category" in payload) row.category = payload.category;
  if ("sourceActivityId" in payload) {
    row.source_activity_id = payload.sourceActivityId ?? null;
  }
  if ("orderIndex" in payload) row.order_index = payload.orderIndex;

  row.updated_at = new Date().toISOString();

  return row;
}

function todoRowFromPayload(guestId, payload, source = "ai") {
  return {
    guest_id: guestId,
    title: payload.title,
    description: payload.description ?? null,
    scope: payload.scope,
    status: payload.status ?? "todo",
    priority: payload.priority ?? "medium",
    due_date: payload.dueDate ?? null,
    related_plan_id: payload.relatedPlanId ?? null,
    related_plan_item_id: payload.relatedPlanItemId ?? null,
    source,
  };
}

function todoUpdateRowFromPayload(payload) {
  const row = {};

  if ("title" in payload) row.title = payload.title;
  if ("description" in payload) row.description = payload.description ?? null;
  if ("scope" in payload) row.scope = payload.scope;
  if ("status" in payload) row.status = payload.status;
  if ("priority" in payload) row.priority = payload.priority;
  if ("dueDate" in payload) row.due_date = payload.dueDate ?? null;
  if ("relatedPlanId" in payload) {
    row.related_plan_id = payload.relatedPlanId ?? null;
  }
  if ("relatedPlanItemId" in payload) {
    row.related_plan_item_id = payload.relatedPlanItemId ?? null;
  }

  row.updated_at = new Date().toISOString();

  return row;
}

export async function createAiProposal(guestId, payload) {
  ensureSupabaseConfigured();

  const { data: proposal, error: proposalError } = await supabase
    .from("ai_proposals")
    .insert({
      guest_id: guestId,
      context_page: payload.contextPage,
      summary: payload.summary,
      status: "pending",
    })
    .select("*")
    .single();

  if (proposalError) {
    throw new AppError(500, "AI_PROPOSAL_CREATE_FAILED", proposalError.message);
  }

  const itemRows = payload.items.map((item, index) => ({
    proposal_id: proposal.id,
    guest_id: guestId,
    type: item.type,
    payload: item.payload,
    sort_index: item.sortIndex ?? index + 1,
  }));

  const { data: items, error: itemsError } = await supabase
    .from("ai_proposal_items")
    .insert(itemRows)
    .select("*");

  if (itemsError) {
    throw new AppError(
      500,
      "AI_PROPOSAL_ITEMS_CREATE_FAILED",
      itemsError.message,
    );
  }

  return toProposalResponse(
    proposal,
    items
      .sort((a, b) => a.sort_index - b.sort_index)
      .map(toProposalItemResponse),
  );
}

export async function getAiProposals(guestId, query = {}) {
  ensureSupabaseConfigured();

  let proposalRequest = supabase
    .from("ai_proposals")
    .select("*")
    .eq("guest_id", guestId)
    .order("created_at", { ascending: false });

  if (query.status) {
    proposalRequest = proposalRequest.eq("status", query.status);
  }

  if (query.contextPage) {
    proposalRequest = proposalRequest.eq("context_page", query.contextPage);
  }

  const { data: proposals, error: proposalError } = await proposalRequest;

  if (proposalError) {
    throw new AppError(500, "AI_PROPOSALS_FETCH_FAILED", proposalError.message);
  }

  if (proposals.length === 0) {
    return [];
  }

  const proposalIds = proposals.map((proposal) => proposal.id);

  const { data: items, error: itemsError } = await supabase
    .from("ai_proposal_items")
    .select("*")
    .eq("guest_id", guestId)
    .in("proposal_id", proposalIds)
    .order("sort_index", { ascending: true });

  if (itemsError) {
    throw new AppError(
      500,
      "AI_PROPOSAL_ITEMS_FETCH_FAILED",
      itemsError.message,
    );
  }

  const itemsByProposalId = items.reduce((acc, item) => {
    if (!acc[item.proposal_id]) {
      acc[item.proposal_id] = [];
    }

    acc[item.proposal_id].push(toProposalItemResponse(item));
    return acc;
  }, {});

  return proposals.map((proposal) =>
    toProposalResponse(proposal, itemsByProposalId[proposal.id] ?? []),
  );
}

async function getProposalDetail(guestId, proposalId) {
  const { data: proposal, error: proposalError } = await supabase
    .from("ai_proposals")
    .select("*")
    .eq("id", proposalId)
    .eq("guest_id", guestId)
    .maybeSingle();

  if (proposalError) {
    throw new AppError(500, "AI_PROPOSAL_FETCH_FAILED", proposalError.message);
  }

  if (!proposal) {
    throw new AppError(
      404,
      "AI_PROPOSAL_NOT_FOUND",
      "AI proposal was not found.",
    );
  }

  const { data: items, error: itemsError } = await supabase
    .from("ai_proposal_items")
    .select("*")
    .eq("proposal_id", proposalId)
    .eq("guest_id", guestId)
    .order("sort_index", { ascending: true });

  if (itemsError) {
    throw new AppError(
      500,
      "AI_PROPOSAL_ITEMS_FETCH_FAILED",
      itemsError.message,
    );
  }

  return {
    proposal,
    items,
  };
}

async function updateProposalItemResult(itemId, result) {
  await supabase
    .from("ai_proposal_items")
    .update({
      result,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId);
}

async function applyAddActivityCandidate(guestId, payload) {
  const row = activityCandidateRowFromPayload(guestId, payload, "ai");

  const { data, error } = await supabase
    .from("activity_candidates")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    throw new AppError(
      500,
      "APPLY_ADD_ACTIVITY_CANDIDATE_FAILED",
      error.message,
    );
  }

  return {
    type: "add_activity_candidate",
    createdId: data.id,
  };
}

async function applyUpdateActivityCandidate(guestId, payload) {
  const candidateId = requirePayloadId(payload, ["candidateId", "id"]);
  const row = activityCandidateUpdateRowFromPayload(payload);

  const { data, error } = await supabase
    .from("activity_candidates")
    .update(row)
    .eq("id", candidateId)
    .eq("guest_id", guestId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new AppError(
      500,
      "APPLY_UPDATE_ACTIVITY_CANDIDATE_FAILED",
      error.message,
    );
  }

  if (!data) {
    throw new AppError(
      404,
      "ACTIVITY_CANDIDATE_NOT_FOUND",
      "Activity candidate was not found.",
    );
  }

  return {
    type: "update_activity_candidate",
    updatedId: data.id,
  };
}

async function applyExcludeActivityCandidate(guestId, payload) {
  const candidateId = requirePayloadId(payload, ["candidateId", "id"]);

  const { data, error } = await supabase
    .from("activity_candidates")
    .update({
      status: "excluded",
      updated_at: new Date().toISOString(),
    })
    .eq("id", candidateId)
    .eq("guest_id", guestId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new AppError(
      500,
      "APPLY_EXCLUDE_ACTIVITY_CANDIDATE_FAILED",
      error.message,
    );
  }

  if (!data) {
    throw new AppError(
      404,
      "ACTIVITY_CANDIDATE_NOT_FOUND",
      "Activity candidate was not found.",
    );
  }

  return {
    type: "exclude_activity_candidate",
    updatedId: data.id,
  };
}

async function applyAddPlanItem(guestId, payload) {
  if (!payload.planId) {
    throw new AppError(
      400,
      "INVALID_PROPOSAL_PAYLOAD",
      "payload.planId is required.",
    );
  }

  const { data, error } = await supabase
    .from("plan_items")
    .insert(planItemRowFromPayload(guestId, payload))
    .select("id")
    .single();

  if (error) {
    throw new AppError(500, "APPLY_ADD_PLAN_ITEM_FAILED", error.message);
  }

  return {
    type: "add_plan_item",
    createdId: data.id,
  };
}

async function applyUpdatePlanItem(guestId, payload) {
  const itemId = requirePayloadId(payload, ["itemId", "planItemId", "id"]);
  const row = planItemUpdateRowFromPayload(payload);

  const { data, error } = await supabase
    .from("plan_items")
    .update(row)
    .eq("id", itemId)
    .eq("guest_id", guestId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new AppError(500, "APPLY_UPDATE_PLAN_ITEM_FAILED", error.message);
  }

  if (!data) {
    throw new AppError(404, "PLAN_ITEM_NOT_FOUND", "Plan item was not found.");
  }

  return {
    type: "update_plan_item",
    updatedId: data.id,
  };
}

async function applyDeletePlanItem(guestId, payload) {
  const itemId = requirePayloadId(payload, ["itemId", "planItemId", "id"]);

  const { data, error } = await supabase
    .from("plan_items")
    .delete()
    .eq("id", itemId)
    .eq("guest_id", guestId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new AppError(500, "APPLY_DELETE_PLAN_ITEM_FAILED", error.message);
  }

  if (!data) {
    throw new AppError(404, "PLAN_ITEM_NOT_FOUND", "Plan item was not found.");
  }

  return {
    type: "delete_plan_item",
    deletedId: data.id,
  };
}

async function applyAddTodo(guestId, payload) {
  const { data, error } = await supabase
    .from("todo_items")
    .insert(todoRowFromPayload(guestId, payload, "ai"))
    .select("id")
    .single();

  if (error) {
    throw new AppError(500, "APPLY_ADD_TODO_FAILED", error.message);
  }

  return {
    type: "add_todo",
    createdId: data.id,
  };
}

async function applyUpdateTodo(guestId, payload) {
  const todoId = requirePayloadId(payload, ["todoId", "id"]);
  const row = todoUpdateRowFromPayload(payload);

  const { data, error } = await supabase
    .from("todo_items")
    .update(row)
    .eq("id", todoId)
    .eq("guest_id", guestId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new AppError(500, "APPLY_UPDATE_TODO_FAILED", error.message);
  }

  if (!data) {
    throw new AppError(404, "TODO_NOT_FOUND", "Todo was not found.");
  }

  return {
    type: "update_todo",
    updatedId: data.id,
  };
}

async function applyDeleteTodo(guestId, payload) {
  const todoId = requirePayloadId(payload, ["todoId", "id"]);

  const { data, error } = await supabase
    .from("todo_items")
    .delete()
    .eq("id", todoId)
    .eq("guest_id", guestId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new AppError(500, "APPLY_DELETE_TODO_FAILED", error.message);
  }

  if (!data) {
    throw new AppError(404, "TODO_NOT_FOUND", "Todo was not found.");
  }

  return {
    type: "delete_todo",
    deletedId: data.id,
  };
}

async function applyProposalItem(guestId, item) {
  switch (item.type) {
    case "add_activity_candidate":
      return applyAddActivityCandidate(guestId, item.payload);

    case "update_activity_candidate":
      return applyUpdateActivityCandidate(guestId, item.payload);

    case "exclude_activity_candidate":
      return applyExcludeActivityCandidate(guestId, item.payload);

    case "add_plan_item":
      return applyAddPlanItem(guestId, item.payload);

    case "update_plan_item":
      return applyUpdatePlanItem(guestId, item.payload);

    case "delete_plan_item":
      return applyDeletePlanItem(guestId, item.payload);

    case "add_todo":
      return applyAddTodo(guestId, item.payload);

    case "update_todo":
      return applyUpdateTodo(guestId, item.payload);

    case "delete_todo":
      return applyDeleteTodo(guestId, item.payload);

    default:
      throw new AppError(
        400,
        "UNSUPPORTED_PROPOSAL_ITEM_TYPE",
        `Unsupported proposal item type: ${item.type}`,
      );
  }
}

export async function applyAiProposal(guestId, proposalId) {
  ensureSupabaseConfigured();

  const { proposal, items } = await getProposalDetail(guestId, proposalId);

  if (proposal.status !== "pending") {
    throw new AppError(
      409,
      "AI_PROPOSAL_NOT_PENDING",
      "Only pending proposals can be applied.",
    );
  }

  const appliedResults = [];

  for (const item of items) {
    const result = await applyProposalItem(guestId, item);
    await updateProposalItemResult(item.id, result);
    appliedResults.push(result);
  }

  const { data: updatedProposal, error } = await supabase
    .from("ai_proposals")
    .update({
      status: "applied",
      applied_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", proposalId)
    .eq("guest_id", guestId)
    .select("*")
    .single();

  if (error) {
    throw new AppError(500, "AI_PROPOSAL_APPLY_FAILED", error.message);
  }

  return {
    proposalId: updatedProposal.id,
    status: updatedProposal.status,
    appliedResults,
    appliedAt: updatedProposal.applied_at,
  };
}

export async function rejectAiProposal(guestId, proposalId) {
  ensureSupabaseConfigured();

  const { proposal } = await getProposalDetail(guestId, proposalId);

  if (proposal.status !== "pending") {
    throw new AppError(
      409,
      "AI_PROPOSAL_NOT_PENDING",
      "Only pending proposals can be rejected.",
    );
  }

  const { data, error } = await supabase
    .from("ai_proposals")
    .update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", proposalId)
    .eq("guest_id", guestId)
    .select("*")
    .single();

  if (error) {
    throw new AppError(500, "AI_PROPOSAL_REJECT_FAILED", error.message);
  }

  return {
    proposalId: data.id,
    status: data.status,
    rejectedAt: data.rejected_at,
  };
}
