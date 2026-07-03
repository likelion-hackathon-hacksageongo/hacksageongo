import { Router } from "express";

import healthRoutes from "./health.routes.js";
import profilesRoutes from "./profiles.routes.js";
import chatRoutes from "./chat.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/profiles", profilesRoutes);
router.use("/chat", chatRoutes);

export default router;
