import { Router } from "express";

import { requireGuestId } from "../middlewares/guestId.middleware.js";
import {
  applyAiProposalController,
  createAiProposalController,
  getMyAiProposalsController,
  rejectAiProposalController,
} from "../controllers/aiProposals.controller.js";

const router = Router();

router.get("/me", requireGuestId, getMyAiProposalsController);

// 테스트/내부 연결용.
// 실제 서비스에서는 챗봇 service가 createAiProposal()을 직접 호출해도 된다.
router.post("/", requireGuestId, createAiProposalController);

router.post("/:proposalId/apply", requireGuestId, applyAiProposalController);
router.post("/:proposalId/reject", requireGuestId, rejectAiProposalController);

export default router;
