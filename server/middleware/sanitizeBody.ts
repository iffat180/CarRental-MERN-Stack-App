import type { RequestHandler } from "express";
import mongoSanitize from "express-mongo-sanitize";

/**
 * Strips MongoDB operator keys ("$ne", "$gt", keys containing ".") from the
 * request body, so a login body like { "email": { "$ne": null } } cannot be
 * passed through to a query as an operator.
 *
 * Why not the stock `mongoSanitize()` middleware? It also rewrites `req.query`,
 * and in Express 5 `req.query` is a read-only getter, so it throws. We only
 * sanitize the body. Query strings are safe already: Express 5's default
 * "simple" query parser never builds nested objects from `?a[$ne]=1`.
 */
export const sanitizeBody: RequestHandler = (req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    mongoSanitize.sanitize(req.body);
  }
  next();
};
