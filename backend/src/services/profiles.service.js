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

function toProfileResponse(row) {
  if (!row) return null;

  return {
    id: row.id,
    guestId: row.guest_id,
    nickname: row.nickname,
    birthYear: row.birth_year,
    school: row.school,
    department: row.department,
    gpa: row.gpa === null ? null : Number(row.gpa),
    gender: row.gender,
    mbti: row.mbti,
    completedSemesters: row.completed_semesters,
    expectedGraduation: row.expected_graduation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toProfileRow(guestId, payload) {
  const row = {
    guest_id: guestId,
  };

  if ("nickname" in payload) row.nickname = payload.nickname;
  if ("birthYear" in payload) row.birth_year = payload.birthYear;
  if ("school" in payload) row.school = payload.school ?? null;
  if ("department" in payload) row.department = payload.department ?? null;
  if ("gpa" in payload) row.gpa = payload.gpa ?? null;
  if ("gender" in payload) row.gender = payload.gender;
  if ("mbti" in payload) row.mbti = payload.mbti ?? "unknown";
  if ("completedSemesters" in payload) {
    row.completed_semesters = payload.completedSemesters;
  }
  if ("expectedGraduation" in payload) {
    row.expected_graduation = payload.expectedGraduation;
  }

  return row;
}

export async function getProfileByGuestId(guestId) {
  ensureSupabaseConfigured();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("guest_id", guestId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, "PROFILE_FETCH_FAILED", error.message);
  }

  if (!data) {
    throw new AppError(
      404,
      "PROFILE_NOT_FOUND",
      "Profile has not been created yet.",
    );
  }

  return toProfileResponse(data);
}

export async function createProfile(guestId, payload) {
  ensureSupabaseConfigured();

  const existing = await supabase
    .from("profiles")
    .select("id")
    .eq("guest_id", guestId)
    .maybeSingle();

  if (existing.error) {
    throw new AppError(500, "PROFILE_FETCH_FAILED", existing.error.message);
  }

  if (existing.data) {
    throw new AppError(
      409,
      "PROFILE_ALREADY_EXISTS",
      "Profile already exists for this guest.",
    );
  }

  const insertRow = toProfileRow(guestId, payload);

  const { data, error } = await supabase
    .from("profiles")
    .insert(insertRow)
    .select("*")
    .single();

  if (error) {
    throw new AppError(500, "PROFILE_CREATE_FAILED", error.message);
  }

  return toProfileResponse(data);
}

export async function updateProfile(guestId, payload) {
  ensureSupabaseConfigured();

  const updateRow = {
    ...toProfileRow(guestId, payload),
    updated_at: new Date().toISOString(),
  };

  delete updateRow.guest_id;

  const { data, error } = await supabase
    .from("profiles")
    .update(updateRow)
    .eq("guest_id", guestId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new AppError(500, "PROFILE_UPDATE_FAILED", error.message);
  }

  if (!data) {
    throw new AppError(
      404,
      "PROFILE_NOT_FOUND",
      "Profile has not been created yet.",
    );
  }

  return toProfileResponse(data);
}
