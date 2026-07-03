import { supabase } from "../config/supabase.js";
import { AppError } from "../utils/AppError.js";
import { generateText } from "./ai/gemini.service.js";
import {
  buildOnboardingChatPrompt,
  buildInsightSummaryPrompt,
} from "./ai/prompts/onboarding.prompt.js";
import { getProfileByGuestId } from "./profiles.service.js";

function ensureSupabaseConfigured() {
  if (!supabase) {
    throw new AppError(
      500,
      "SUPABASE_NOT_CONFIGURED",
      "Supabase environment variables are missing.",
    );
  }
}

function toSessionResponse(row) {
  return {
    sessionId: row.id,
    purpose: row.purpose,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toMessageResponse(row) {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

async function getSessionForGuest(sessionId, guestId) {
  ensureSupabaseConfigured();

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("guest_id", guestId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, "CHAT_SESSION_FETCH_FAILED", error.message);
  }

  if (!data) {
    throw new AppError(
      404,
      "CHAT_SESSION_NOT_FOUND",
      "Chat session was not found.",
    );
  }

  return data;
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

async function getRecentMessages(sessionId, guestId, limit = 10) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .eq("guest_id", guestId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new AppError(500, "CHAT_MESSAGES_FETCH_FAILED", error.message);
  }

  return [...data].reverse().map(toMessageResponse);
}

export async function createChatSession(guestId, payload) {
  ensureSupabaseConfigured();

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      guest_id: guestId,
      purpose: payload.purpose,
    })
    .select("*")
    .single();

  if (error) {
    throw new AppError(500, "CHAT_SESSION_CREATE_FAILED", error.message);
  }

  return toSessionResponse(data);
}

export async function getChatMessages(sessionId, guestId) {
  await getSessionForGuest(sessionId, guestId);

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .eq("guest_id", guestId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new AppError(500, "CHAT_MESSAGES_FETCH_FAILED", error.message);
  }

  return data.map(toMessageResponse);
}

export async function sendChatMessage(sessionId, guestId, payload) {
  const session = await getSessionForGuest(sessionId, guestId);

  const { data: userMessage, error: userMessageError } = await supabase
    .from("chat_messages")
    .insert({
      session_id: session.id,
      guest_id: guestId,
      role: "user",
      content: payload.message,
      metadata: {
        contextPage: payload.contextPage,
      },
    })
    .select("*")
    .single();

  if (userMessageError) {
    throw new AppError(
      500,
      "CHAT_MESSAGE_CREATE_FAILED",
      userMessageError.message,
    );
  }

  const profile = await getProfileOrNull(guestId);
  const recentMessages = await getRecentMessages(sessionId, guestId, 10);

  const prompt = buildOnboardingChatPrompt({
    profile,
    recentMessages,
    userMessage: payload.message,
  });

  const assistantText = await generateText(prompt);

  const { data: assistantMessage, error: assistantMessageError } =
    await supabase
      .from("chat_messages")
      .insert({
        session_id: session.id,
        guest_id: guestId,
        role: "assistant",
        content: assistantText,
        metadata: {
          contextPage: payload.contextPage,
          provider: "gemini",
        },
      })
      .select("*")
      .single();

  if (assistantMessageError) {
    throw new AppError(
      500,
      "CHAT_MESSAGE_CREATE_FAILED",
      assistantMessageError.message,
    );
  }

  await supabase
    .from("chat_sessions")
    .update({
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("guest_id", guestId);

  return {
    userMessage: toMessageResponse(userMessage),
    assistantMessage: toMessageResponse(assistantMessage),
    proposal: null,
  };
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

export async function summarizeChatSession(sessionId, guestId) {
  await getSessionForGuest(sessionId, guestId);

  const profile = await getProfileOrNull(guestId);
  const messages = await getChatMessages(sessionId, guestId);

  if (messages.length === 0) {
    throw new AppError(
      400,
      "CHAT_MESSAGES_EMPTY",
      "Cannot summarize an empty chat session.",
    );
  }

  const prompt = buildInsightSummaryPrompt({
    profile,
    messages,
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

  const insightRow = {
    guest_id: guestId,
    summary: parsed.summary ?? "",
    goals: parsed.goals ?? [],
    concerns: parsed.concerns ?? [],
    memorable_experiences: parsed.memorableExperiences ?? [],
    regrets: parsed.regrets ?? [],
    preferred_activities: parsed.preferredActivities ?? [],
    constraints: parsed.constraints ?? [],
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("user_insights")
    .upsert(insightRow, {
      onConflict: "guest_id",
    })
    .select("*")
    .single();

  if (error) {
    throw new AppError(500, "USER_INSIGHTS_SAVE_FAILED", error.message);
  }

  return {
    summary: data.summary,
    insights: {
      goals: data.goals,
      concerns: data.concerns,
      memorableExperiences: data.memorable_experiences,
      regrets: data.regrets,
      preferredActivities: data.preferred_activities,
      constraints: data.constraints,
    },
  };
}
