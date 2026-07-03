import { supabase } from "../config/supabase.js";
import { AppError } from "../utils/AppError.js";
import { generateText } from "./ai/gemini.service.js";
import { getProfileByGuestId } from "./profiles.service.js";
import { buildSurveyAnalysisPrompt } from "./ai/prompts/survey.prompt.js";
import {
  SURVEY_ID,
  SURVEY_TITLE,
  SURVEY_TYPE,
  SURVEY_QUESTIONS,
  SURVEY_QUESTION_IDS,
  SURVEY_SCORE_AXES,
} from "../constants/survey.constant.js";

function ensureSupabaseConfigured() {
  if (!supabase) {
    throw new AppError(
      500,
      "SUPABASE_NOT_CONFIGURED",
      "Supabase environment variables are missing.",
    );
  }
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

function buildAnswerMap(answers) {
  return answers.reduce((acc, answer) => {
    acc[answer.questionId] = answer.value;
    return acc;
  }, {});
}

function validateAllQuestionsAnswered(answerMap) {
  const missingQuestionIds = SURVEY_QUESTION_IDS.filter(
    (questionId) => answerMap[questionId] === undefined,
  );

  if (missingQuestionIds.length > 0) {
    throw new AppError(
      400,
      "SURVEY_ANSWERS_INCOMPLETE",
      "All survey questions must be answered.",
      { missingQuestionIds },
    );
  }
}

function clampScore(value) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return 3;
  }

  return Math.min(5, Math.max(1, numberValue));
}

function normalizeScores(scores = {}) {
  return SURVEY_SCORE_AXES.reduce((acc, axis) => {
    acc[axis] = clampScore(scores[axis]);
    return acc;
  }, {});
}

function normalizeSurveyResult(parsed, profile) {
  return {
    mbti: parsed.mbti ?? profile?.mbti ?? "unknown",
    typeLabel: parsed.type_label ?? "아직 탐색 중인 타입",
    typeSummary: parsed.type_summary ?? "",
    interestingPoints: Array.isArray(parsed.interesting_points)
      ? parsed.interesting_points
      : [],
    scores: normalizeScores(parsed.scores),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    watchouts: Array.isArray(parsed.watchouts) ? parsed.watchouts : [],
    recommendedPlanningStyle: parsed.recommended_planning_style ?? "",
    firstChatMessage: parsed.first_chat_message ?? "",
  };
}

function toSurveyResultResponse(row) {
  return {
    surveyId: row.survey_id,
    mbti: row.mbti,
    typeLabel: row.type_label,
    typeSummary: row.type_summary,
    interestingPoints: row.interesting_points ?? [],
    scores: row.scores ?? {},
    strengths: row.strengths ?? [],
    watchouts: row.watchouts ?? [],
    recommendedPlanningStyle: row.recommended_planning_style,
    firstChatMessage: row.first_chat_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getCurrentSurvey() {
  return {
    surveyId: SURVEY_ID,
    title: SURVEY_TITLE,
    type: SURVEY_TYPE,
    questions: SURVEY_QUESTIONS.map((question) => ({
      id: question.id,
      number: question.number,
      text: question.text,
      type: question.type,
      minLabel: question.minLabel,
      maxLabel: question.maxLabel,
    })),
  };
}

export async function submitSurveyResponses(guestId, payload) {
  ensureSupabaseConfigured();

  if (payload.surveyId !== SURVEY_ID) {
    throw new AppError(
      400,
      "INVALID_SURVEY_ID",
      `Only ${SURVEY_ID} is supported.`,
    );
  }

  const answerMap = buildAnswerMap(payload.answers);
  validateAllQuestionsAnswered(answerMap);

  const profile = await getProfileOrNull(guestId);

  const { error: responseError } = await supabase
    .from("survey_responses")
    .upsert(
      {
        guest_id: guestId,
        survey_id: SURVEY_ID,
        answers: payload.answers,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "guest_id,survey_id",
      },
    );

  if (responseError) {
    throw new AppError(
      500,
      "SURVEY_RESPONSE_SAVE_FAILED",
      responseError.message,
    );
  }

  const prompt = buildSurveyAnalysisPrompt({
    profile,
    answerMap,
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

  const normalized = normalizeSurveyResult(parsed, profile);

  const { data: resultRow, error: resultError } = await supabase
    .from("survey_results")
    .upsert(
      {
        guest_id: guestId,
        survey_id: SURVEY_ID,
        mbti: normalized.mbti,
        type_label: normalized.typeLabel,
        type_summary: normalized.typeSummary,
        interesting_points: normalized.interestingPoints,
        scores: normalized.scores,
        strengths: normalized.strengths,
        watchouts: normalized.watchouts,
        recommended_planning_style: normalized.recommendedPlanningStyle,
        first_chat_message: normalized.firstChatMessage,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "guest_id,survey_id",
      },
    )
    .select("*")
    .single();

  if (resultError) {
    throw new AppError(500, "SURVEY_RESULT_SAVE_FAILED", resultError.message);
  }

  return {
    surveyId: SURVEY_ID,
    answers: payload.answers,
    result: toSurveyResultResponse(resultRow),
  };
}

export async function getSurveyResultByGuestId(guestId) {
  ensureSupabaseConfigured();

  const { data, error } = await supabase
    .from("survey_results")
    .select("*")
    .eq("guest_id", guestId)
    .eq("survey_id", SURVEY_ID)
    .maybeSingle();

  if (error) {
    throw new AppError(500, "SURVEY_RESULT_FETCH_FAILED", error.message);
  }

  if (!data) {
    throw new AppError(
      404,
      "SURVEY_RESULT_NOT_FOUND",
      "Survey result has not been created yet.",
    );
  }

  return toSurveyResultResponse(data);
}

export async function getSurveyResultOrNull(guestId) {
  try {
    return await getSurveyResultByGuestId(guestId);
  } catch (error) {
    if (error.code === "SURVEY_RESULT_NOT_FOUND") {
      return null;
    }

    throw error;
  }
}
