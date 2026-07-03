import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import {
  createTodoSchema,
  deferTodoSchema,
  generateTodosSchema,
  getTodosQuerySchema,
  updateTodoSchema,
} from "../schemas/todos.schema.js";
import {
  completeTodo,
  createTodo,
  deferTodo,
  deleteTodo,
  generateTodos,
  getTodos,
  updateTodo,
} from "../services/todos.service.js";

function validateBody(schema, body) {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw new AppError(
      400,
      "INVALID_REQUEST_BODY",
      "Invalid request body.",
      result.error.flatten(),
    );
  }

  return result.data;
}

function validateQuery(schema, query) {
  const result = schema.safeParse(query);

  if (!result.success) {
    throw new AppError(
      400,
      "INVALID_QUERY_PARAMS",
      "Invalid query parameters.",
      result.error.flatten(),
    );
  }

  return result.data;
}

export const generateTodosController = asyncHandler(async (req, res) => {
  const payload = validateBody(generateTodosSchema, req.body);

  const result = await generateTodos(req.guestId, payload);

  res.status(201).json(successResponse(result));
});

export const getMyTodosController = asyncHandler(async (req, res) => {
  const query = validateQuery(getTodosQuerySchema, req.query);

  const todos = await getTodos(req.guestId, query);

  res.json(
    successResponse({
      todos,
    }),
  );
});

export const createTodoController = asyncHandler(async (req, res) => {
  const payload = validateBody(createTodoSchema, req.body);

  const todo = await createTodo(req.guestId, payload);

  res.status(201).json(successResponse(todo));
});

export const updateTodoController = asyncHandler(async (req, res) => {
  const payload = validateBody(updateTodoSchema, req.body);

  const todo = await updateTodo(req.guestId, req.params.todoId, payload);

  res.json(successResponse(todo));
});

export const completeTodoController = asyncHandler(async (req, res) => {
  const todo = await completeTodo(req.guestId, req.params.todoId);

  res.json(successResponse(todo));
});

export const deferTodoController = asyncHandler(async (req, res) => {
  const payload = validateBody(deferTodoSchema, req.body);

  const todo = await deferTodo(req.guestId, req.params.todoId, payload);

  res.json(successResponse(todo));
});

export const deleteTodoController = asyncHandler(async (req, res) => {
  const result = await deleteTodo(req.guestId, req.params.todoId);

  res.json(successResponse(result));
});
