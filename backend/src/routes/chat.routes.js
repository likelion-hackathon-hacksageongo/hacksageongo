import { Router } from "express";

import { requireGuestId } from "../middlewares/guestId.middleware.js";
import {
  createSession,
  getMessages,
  sendMessage,
  summarizeSession,
} from "../controllers/chat.controller.js";

const router = Router();

router.post("/sessions", requireGuestId, createSession);

router.get("/sessions/:sessionId/messages", requireGuestId, getMessages);

router.post("/sessions/:sessionId/messages", requireGuestId, sendMessage);

router.post("/sessions/:sessionId/summarize", requireGuestId, summarizeSession);

export default router;
