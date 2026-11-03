/**
 * Error monitoring with Sentry.
 *
 * Off unless VITE_SENTRY_DSN is set. When it is off nothing is downloaded: Sentry is a
 * separate chunk that is only fetched if a DSN exists. Only the error and where it
 * happened are sent: no cookies, headers, request bodies, query strings or user details.
 */

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

type SentryModule = typeof import("@sentry/react");
let sentry: Promise<SentryModule> | null = null;

export const monitoringEnabled = Boolean(dsn);

/** Starts Sentry (if configured). Call once when the app starts. */
export const initMonitoring = (): void => {
  if (!dsn || sentry) return;
  sentry = import("@sentry/react").then((mod) => {
    mod.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
      dataCollection: {
        userInfo: false,
        cookies: false,
        httpHeaders: false,
        httpBodies: [],
        urlQueryParams: false,
      },
    });
    return mod;
  });
};

/** Reports an unexpected error. Always logs to the console; sends to Sentry when it is on. */
export const reportError = (error: unknown, context?: Record<string, unknown>): void => {
  console.error(error);
  sentry?.then((mod) => mod.captureException(error, { extra: context }));
};
