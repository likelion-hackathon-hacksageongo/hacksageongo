import { Router } from "express";

import { requireGuestId } from "../middlewares/guestId.middleware.js";
import {
  completeTodoController,
  createTodoController,
  deferTodoController,
  deleteTodoController,
  generateTodosController,
  getMyTodosController,
  updateTodoController,
} from "../controllers/todos.controller.js";

const router = Router();

router.post("/generate", requireGuestId, generateTodosController);
router.get("/me", requireGuestId, getMyTodosController);
router.post("/", requireGuestId, createTodoController);
router.patch("/:todoId", requireGuestId, updateTodoController);
router.post("/:todoId/complete", requireGuestId, completeTodoController);
router.post("/:todoId/defer", requireGuestId, deferTodoController);
router.delete("/:todoId", requireGuestId, deleteTodoController);

export default router;
