import { Router } from "express";

import { requireGuestId } from "../middlewares/guestId.middleware.js";
import {
  createPlanItemController,
  deletePlanItemController,
  forkPlanController,
  generatePlanController,
  getActivePlanController,
  getMyPlansController,
  getPlanDetailController,
  updatePlanItemController,
} from "../controllers/plans.controller.js";

const router = Router();

router.post("/generate", requireGuestId, generatePlanController);

router.get("/me", requireGuestId, getMyPlansController);
router.get("/me/active", requireGuestId, getActivePlanController);

router.get("/:planId", requireGuestId, getPlanDetailController);
router.post("/:planId/fork", requireGuestId, forkPlanController);
router.post("/:planId/items", requireGuestId, createPlanItemController);

router.patch("/items/:itemId", requireGuestId, updatePlanItemController);
router.delete("/items/:itemId", requireGuestId, deletePlanItemController);

export default router;
