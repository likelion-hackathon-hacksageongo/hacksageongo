import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import {
  createAiProposalSchema,
  getAiProposalsQuerySchema,
} from "../schemas/aiProposals.schema.js";
import {
  applyAiProposal,
  createAiProposal,
  getAiProposals,
  rejectAiProposal,
} from "../services/aiProposals.service.js";

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

export const createAiProposalController = asyncHandler(async (req, res) => {
  const payload = validateBody(createAiProposalSchema, req.body);

  const proposal = await createAiProposal(req.guestId, payload);

  res.status(201).json(successResponse(proposal));
});

export const getMyAiProposalsController = asyncHandler(async (req, res) => {
  const query = validateQuery(getAiProposalsQuerySchema, req.query);

  const proposals = await getAiProposals(req.guestId, query);

  res.json(
    successResponse({
      proposals,
    }),
  );
});

export const applyAiProposalController = asyncHandler(async (req, res) => {
  const result = await applyAiProposal(req.guestId, req.params.proposalId);

  res.json(successResponse(result));
});

export const rejectAiProposalController = asyncHandler(async (req, res) => {
  const result = await rejectAiProposal(req.guestId, req.params.proposalId);

  res.json(successResponse(result));
});
