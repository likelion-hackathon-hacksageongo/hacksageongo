import { supabase } from "../config/supabase.js";
import { AppError } from "../utils/AppError.js";
import { generateText } from "./ai/gemini.service.js";
import { getProfileByGuestId } from "./profiles.service.js";
import { buildActivityCandidatesPrompt } from "./ai/prompts/activityCandidates.prompt.js";

function ensureSupabaseConfigured() {
  if (!supabase) {
    throw new AppError(
      500,
      "SUPABASE_NOT_CONFIGURED",
      "Supabase environment variables are missing.",
    );
  }
}

function toCandidateResponse(row) {
  return {
    id: row.id,
    guestId: row.guest_id,
    title: row.title,
    category: row.category,
    description: row.description,
    reason: row.reason,
    priority: row.priority,
    difficulty: row.difficulty,
    estimatedDuration: row.estimated_duration,
    recommendedTiming: row.recommended_timing ?? [],
    status: row.status,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCandidateRow(guestId, payload, source = "manual") {
  const row = {
    guest_id: guestId,
  };

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

  row.source = source;

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
    if (error.code === "PROFILE_NOT_FOUND") {
      return null;
    }

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

function normalizeAiCandidate(candidate) {
  return {
    title: candidate.title,
    category: candidate.category,
    description: candidate.description ?? null,
    reason: candidate.reason ?? null,
    priority: candidate.priority ?? "medium",
    difficulty: candidate.difficulty ?? "medium",
    estimatedDuration: candidate.estimatedDuration ?? null,
    recommendedTiming: Array.isArray(candidate.recommendedTiming)
      ? candidate.recommendedTiming
      : [],
  };
}

export async function generateActivityCandidates(guestId, options = {}) {
  ensureSupabaseConfigured();

  const profile = await getProfileOrNull(guestId);
  const insights = await getUserInsightsOrNull(guestId);

  const prompt = buildActivityCandidatesPrompt({
    profile,
    insights,
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

  const candidates = Array.isArray(parsed.candidates)
    ? parsed.candidates.map(normalizeAiCandidate)
    : [];

  if (candidates.length === 0) {
    throw new AppError(
      502,
      "AI_EMPTY_CANDIDATES",
      "Gemini did not return any activity candidates.",
    );
  }

  if (options.replaceExisting) {
    const { error: deleteError } = await supabase
      .from("activity_candidates")
      .delete()
      .eq("guest_id", guestId)
      .eq("source", "ai");

    if (deleteError) {
      throw new AppError(
        500,
        "ACTIVITY_CANDIDATES_DELETE_FAILED",
        deleteError.message,
      );
    }
  }

  const rows = candidates.map((candidate) => ({
    ...toCandidateRow(guestId, candidate, "ai"),
    status: "candidate",
  }));

  const { data, error } = await supabase
    .from("activity_candidates")
    .insert(rows)
    .select("*");

  if (error) {
    throw new AppError(500, "ACTIVITY_CANDIDATES_CREATE_FAILED", error.message);
  }

  return data.map(toCandidateResponse);
}

export async function getActivityCandidates(guestId, query = {}) {
  ensureSupabaseConfigured();

  let request = supabase
    .from("activity_candidates")
    .select("*")
    .eq("guest_id", guestId)
    .order("created_at", { ascending: true });

  if (query.status) {
    request = request.eq("status", query.status);
  }

  const { data, error } = await request;

  if (error) {
    throw new AppError(500, "ACTIVITY_CANDIDATES_FETCH_FAILED", error.message);
  }

  return data.map(toCandidateResponse);
}

export async function createActivityCandidate(guestId, payload) {
  ensureSupabaseConfigured();

  const { data, error } = await supabase
    .from("activity_candidates")
    .insert({
      ...toCandidateRow(guestId, payload, "manual"),
      status: "candidate",
    })
    .select("*")
    .single();

  if (error) {
    throw new AppError(500, "ACTIVITY_CANDIDATE_CREATE_FAILED", error.message);
  }

  return toCandidateResponse(data);
}

export async function updateActivityCandidate(guestId, candidateId, payload) {
  ensureSupabaseConfigured();

  const updateRow = {
    ...toCandidateRow(guestId, payload, "manual"),
    updated_at: new Date().toISOString(),
  };

  delete updateRow.guest_id;
  delete updateRow.source;

  if ("status" in payload) {
    updateRow.status = payload.status;
  }

  const { data, error } = await supabase
    .from("activity_candidates")
    .update(updateRow)
    .eq("id", candidateId)
    .eq("guest_id", guestId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new AppError(500, "ACTIVITY_CANDIDATE_UPDATE_FAILED", error.message);
  }

  if (!data) {
    throw new AppError(
      404,
      "ACTIVITY_CANDIDATE_NOT_FOUND",
      "Activity candidate was not found.",
    );
  }

  return toCandidateResponse(data);
}

export async function setActivityCandidateStatus(guestId, candidateId, status) {
  ensureSupabaseConfigured();

  const { data, error } = await supabase
    .from("activity_candidates")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", candidateId)
    .eq("guest_id", guestId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new AppError(
      500,
      "ACTIVITY_CANDIDATE_STATUS_UPDATE_FAILED",
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

  return toCandidateResponse(data);
}
