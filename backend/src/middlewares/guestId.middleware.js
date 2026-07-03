import { AppError } from "../utils/AppError.js";

export function requireGuestId(req, res, next) {
  const guestId = req.header("X-Guest-Id");

  if (!guestId) {
    throw new AppError(
      400,
      "GUEST_ID_MISSING",
      "X-Guest-Id header is required.",
    );
  }

  req.guestId = guestId;
  next();
}
