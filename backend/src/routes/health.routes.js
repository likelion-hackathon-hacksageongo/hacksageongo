import { Router } from "express";
import { successResponse } from "../utils/apiResponse.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(
    successResponse({
      status: "ok",
      service: "haksagyeongo-backend",
    }),
  );
});

export default router;
