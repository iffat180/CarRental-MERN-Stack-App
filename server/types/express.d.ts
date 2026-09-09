import type { UserDocument } from "../models/User.js";

// The `protect` middleware attaches the authenticated user to the request.
declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}

export {};
