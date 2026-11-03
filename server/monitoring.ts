/**
 * Error monitoring with Sentry.
 *
 * It is off unless SENTRY_DSN is set, and then costs nothing: the Sentry library is
 * only imported when a DSN exists, so a deployment without one does not load it (which
 * also keeps serverless cold starts fast). Only the error and where it happened are sent: no cookies,
 * headers, request bodies, query strings or user details.
 */
import { errMessage } from "./utils/errors.js";

export type ErrorReporter = (error: unknown, context?: Record<string, unknown>) => void;

type SentryModule = typeof import("@sentry/node");
let sentry: SentryModule | null = null;
let starting: Promise<boolean> | null = null;

/** Starts Sentry if SENTRY_DSN is set. Safe to call many times; returns whether it is on. */
export const initMonitoring = (
  dsn: string | undefined = process.env.SENTRY_DSN
): Promise<boolean> => {
  if (!dsn) return Promise.resolve(false);
  starting ??= import("@sentry/node")
    .then((mod) => {
      mod.init({
        dsn,
        environment: process.env.NODE_ENV || "development",
        // send the error and where it happened, nothing about the person or their request
        dataCollection: {
          userInfo: false,
          cookies: false,
          httpHeaders: false,
          httpBodies: [],
          urlQueryParams: false,
        },
        tracesSampleRate: 0.1,
      });
      sentry = mod;
      return true;
    })
    .catch((err: unknown) => {
      console.error("[monitoring] could not start Sentry:", errMessage(err));
      starting = null;
      return false;
    });
  return starting;
};

const sentryReporter: ErrorReporter = (error, context) => {
  sentry?.captureException(error, { extra: context });
};

let reporter: ErrorReporter = sentryReporter;

/** Reports an unexpected error. Does nothing when monitoring is off. */
export const reportError: ErrorReporter = (error, context) => reporter(error, context);

/** For tests: swap the reporter, and get back a function that restores the real one. */
export const setErrorReporter = (custom: ErrorReporter): (() => void) => {
  reporter = custom;
  return () => {
    reporter = sentryReporter;
  };
};

/**
 * On a serverless host the function can be frozen as soon as the response is sent, so
 * pending events must be flushed first. Only waits when monitoring is on.
 */
export const flushMonitoring = async (timeoutMs = 1500): Promise<void> => {
  if (sentry) await sentry.flush(timeoutMs);
};
