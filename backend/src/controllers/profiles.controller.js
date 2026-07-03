import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createProfileSchema,
  updateProfileSchema,
} from "../schemas/profiles.schema.js";
import {
  createProfile,
  getProfileByGuestId,
  updateProfile,
} from "../services/profiles.service.js";
import { AppError } from "../utils/AppError.js";

function validateBody(schema, body) {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw new AppError(
      400,
      "INVALID_REQUEST_BODY",
      "Invalid request body.",
      result.error.flatten(),
    );
  }

  return result.data;
}

export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await getProfileByGuestId(req.guestId);

  res.json(successResponse(profile));
});

export const createMyProfile = asyncHandler(async (req, res) => {
  const payload = validateBody(createProfileSchema, req.body);

  const profile = await createProfile(req.guestId, payload);

  res.status(201).json(successResponse(profile));
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const payload = validateBody(updateProfileSchema, req.body);

  const profile = await updateProfile(req.guestId, payload);

  res.json(successResponse(profile));
});
