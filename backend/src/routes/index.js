import { Router } from "express";

import healthRoutes from "./health.routes.js";
import profilesRoutes from "./profiles.routes.js";
import chatRoutes from "./chat.routes.js";
import activityCandidatesRoutes from "./activityCandidates.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/profiles", profilesRoutes);
router.use("/chat", chatRoutes);
router.use("/activity-candidates", activityCandidatesRoutes);

export default router;
