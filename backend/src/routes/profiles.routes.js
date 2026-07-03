import { Router } from "express";

import { requireGuestId } from "../middlewares/guestId.middleware.js";
import {
  createMyProfile,
  getMyProfile,
  updateMyProfile,
} from "../controllers/profiles.controller.js";

const router = Router();

router.get("/me", requireGuestId, getMyProfile);
router.post("/", requireGuestId, createMyProfile);
router.patch("/me", requireGuestId, updateMyProfile);

export default router;
