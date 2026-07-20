/**
 * Next.js instrumentation — validate production-critical env on Node startup.
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  const { assertAuthEnvironment } = await import("./auth/config/auth-env");
  assertAuthEnvironment();
}
