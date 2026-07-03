import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import {
  createChatSessionSchema,
  sendChatMessageSchema,
} from "../schemas/chat.schema.js";
import {
  createChatSession,
  getChatMessages,
  sendChatMessage,
  summarizeChatSession,
} from "../services/chat.service.js";

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

export const createSession = asyncHandler(async (req, res) => {
  const payload = validateBody(createChatSessionSchema, req.body);

  const session = await createChatSession(req.guestId, payload);

  res.status(201).json(successResponse(session));
});

export const sendMessage = asyncHandler(async (req, res) => {
  const payload = validateBody(sendChatMessageSchema, req.body);

  const result = await sendChatMessage(
    req.params.sessionId,
    req.guestId,
    payload,
  );

  res.json(successResponse(result));
});

export const getMessages = asyncHandler(async (req, res) => {
  const messages = await getChatMessages(req.params.sessionId, req.guestId);

  res.json(
    successResponse({
      sessionId: req.params.sessionId,
      messages,
    }),
  );
});

export const summarizeSession = asyncHandler(async (req, res) => {
  const result = await summarizeChatSession(req.params.sessionId, req.guestId);

  res.json(successResponse(result));
});
