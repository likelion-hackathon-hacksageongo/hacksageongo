import { Router } from "express";

import { requireGuestId } from "../middlewares/guestId.middleware.js";
import {
  getCurrentSurveyController,
  getMySurveyResultController,
  submitSurveyResponsesController,
} from "../controllers/surveys.controller.js";

const router = Router();

router.get("/current", getCurrentSurveyController);
router.post("/responses", requireGuestId, submitSurveyResponsesController);
router.get("/result/me", requireGuestId, getMySurveyResultController);

export default router;
