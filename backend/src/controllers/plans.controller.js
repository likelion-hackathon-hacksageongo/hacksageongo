import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import {
  createPlanItemSchema,
  forkPlanSchema,
  generatePlanSchema,
  getPlansQuerySchema,
  updatePlanItemSchema,
} from "../schemas/plans.schema.js";
import {
  createPlanItem,
  deletePlanItem,
  forkPlan,
  generatePlan,
  getActivePlan,
  getPlanDetail,
  getPlans,
  updatePlanItem,
} from "../services/plans.service.js";

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

export const generatePlanController = asyncHandler(async (req, res) => {
  const payload = validateBody(generatePlanSchema, req.body);

  const result = await generatePlan(req.guestId, payload);

  res.status(201).json(successResponse(result));
});

export const getMyPlansController = asyncHandler(async (req, res) => {
  const query = validateQuery(getPlansQuerySchema, req.query);

  const plans = await getPlans(req.guestId, query);

  res.json(
    successResponse({
      plans,
    }),
  );
});

export const getActivePlanController = asyncHandler(async (req, res) => {
  const result = await getActivePlan(req.guestId);

  res.json(successResponse(result));
});

export const getPlanDetailController = asyncHandler(async (req, res) => {
  const result = await getPlanDetail(req.guestId, req.params.planId);

  res.json(successResponse(result));
});

export const forkPlanController = asyncHandler(async (req, res) => {
  const payload = validateBody(forkPlanSchema, req.body);

  const result = await forkPlan(req.guestId, req.params.planId, payload);

  res.status(201).json(successResponse(result));
});

export const createPlanItemController = asyncHandler(async (req, res) => {
  const payload = validateBody(createPlanItemSchema, req.body);

  const item = await createPlanItem(req.guestId, req.params.planId, payload);

  res.status(201).json(successResponse(item));
});

export const updatePlanItemController = asyncHandler(async (req, res) => {
  const payload = validateBody(updatePlanItemSchema, req.body);

  const item = await updatePlanItem(req.guestId, req.params.itemId, payload);

  res.json(successResponse(item));
});

export const deletePlanItemController = asyncHandler(async (req, res) => {
  const result = await deletePlanItem(req.guestId, req.params.itemId);

  res.json(successResponse(result));
});
