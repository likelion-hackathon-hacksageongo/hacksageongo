import { Router } from "express";

import { requireGuestId } from "../middlewares/guestId.middleware.js";
import {
  createCandidate,
  excludeCandidate,
  generateCandidates,
  getMyCandidates,
  selectCandidate,
  updateCandidate,
} from "../controllers/activityCandidates.controller.js";

const router = Router();

router.post("/generate", requireGuestId, generateCandidates);
router.get("/me", requireGuestId, getMyCandidates);
router.post("/", requireGuestId, createCandidate);
router.patch("/:candidateId", requireGuestId, updateCandidate);
router.post("/:candidateId/select", requireGuestId, selectCandidate);
router.post("/:candidateId/exclude", requireGuestId, excludeCandidate);

export default router;
