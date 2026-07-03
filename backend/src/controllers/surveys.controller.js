import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { submitSurveyResponsesSchema } from "../schemas/surveys.schema.js";
import {
  getCurrentSurvey,
  getSurveyResultByGuestId,
  submitSurveyResponses,
} from "../services/surveys.service.js";

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

export const getCurrentSurveyController = asyncHandler(async (req, res) => {
  res.json(successResponse(getCurrentSurvey()));
});

export const submitSurveyResponsesController = asyncHandler(
  async (req, res) => {
    const payload = validateBody(submitSurveyResponsesSchema, req.body);

    const result = await submitSurveyResponses(req.guestId, payload);

    res.status(201).json(successResponse(result));
  },
);

export const getMySurveyResultController = asyncHandler(async (req, res) => {
  const result = await getSurveyResultByGuestId(req.guestId);

  res.json(successResponse(result));
});
