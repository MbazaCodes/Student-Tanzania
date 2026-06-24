/**
 * App error reporting — logs errors to the console in development,
 * ready to be wired to any real error service (Sentry, etc.) in production.
 */
export function reportError(
  error: unknown,
  context: Record<string, unknown> = {},
) {
  if (import.meta.env.DEV) {
    console.error("[TSID Error]", error, context);
  }
  // TODO: wire to Sentry / your preferred error monitoring service
  // Example: Sentry.captureException(error, { extra: context });
}
