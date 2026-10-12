import { friendlyError } from "./ai";

// Maps thrown errors to a user-safe JSON response.
export function route<A extends unknown[]>(handler: (...args: A) => Promise<Response>, fallback?: string) {
  return async (...args: A) => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error("[roleflow]", err);
      return Response.json({ error: friendlyError(err, fallback) }, { status: 500 });
    }
  };
}

export const badRequest = (error: string, status = 400) => Response.json({ error }, { status });
