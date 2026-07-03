import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import {
  createActivityCandidateSchema,
  generateActivityCandidatesSchema,
  getActivityCandidatesQuerySchema,
  updateActivityCandidateSchema,
} from "../schemas/activityCandidates.schema.js";
import {
  createActivityCandidate,
  generateActivityCandidates,
  getActivityCandidates,
  setActivityCandidateStatus,
  updateActivityCandidate,
} from "../services/activityCandidates.service.js";

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

function validateQuery(schema, query) {
  const result = schema.safeParse(query);

  if (!result.success) {
    throw new AppError(
      400,
      "INVALID_QUERY_PARAMS",
      "Invalid query parameters.",
      result.error.flatten(),
    );
  }

  return result.data;
}

export const generateCandidates = asyncHandler(async (req, res) => {
  const payload = validateBody(generateActivityCandidatesSchema, req.body);

  const candidates = await generateActivityCandidates(req.guestId, payload);

  res.status(201).json(
    successResponse({
      candidates,
    }),
  );
});

export const getMyCandidates = asyncHandler(async (req, res) => {
  const query = validateQuery(getActivityCandidatesQuerySchema, req.query);

  const candidates = await getActivityCandidates(req.guestId, query);

  res.json(
    successResponse({
      candidates,
    }),
  );
});

export const createCandidate = asyncHandler(async (req, res) => {
  const payload = validateBody(createActivityCandidateSchema, req.body);

  const candidate = await createActivityCandidate(req.guestId, payload);

  res.status(201).json(successResponse(candidate));
});

export const updateCandidate = asyncHandler(async (req, res) => {
  const payload = validateBody(updateActivityCandidateSchema, req.body);

  const candidate = await updateActivityCandidate(
    req.guestId,
    req.params.candidateId,
    payload,
  );

  res.json(successResponse(candidate));
});

export const selectCandidate = asyncHandler(async (req, res) => {
  const candidate = await setActivityCandidateStatus(
    req.guestId,
    req.params.candidateId,
    "selected",
  );

  res.json(successResponse(candidate));
});

export const excludeCandidate = asyncHandler(async (req, res) => {
  const candidate = await setActivityCandidateStatus(
    req.guestId,
    req.params.candidateId,
    "excluded",
  );

  res.json(successResponse(candidate));
});
