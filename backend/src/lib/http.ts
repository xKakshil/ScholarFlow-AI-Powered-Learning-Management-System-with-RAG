import { NextResponse } from "next/server";
import { getUserFromToken, type AuthUser, type Role } from "@/lib/auth";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function requireUser(req: Request, roles?: Role[]): AuthUser {
  const user = getUserFromToken(req);
  if (!user) throw new HttpError("Unauthorized", 401);
  if (roles && !roles.includes(user.role)) throw new HttpError("Forbidden", 403);
  return user;
}

type Handler<C> = (req: Request, context: C) => Promise<Response>;

export function withErrors<C>(name: string, handler: Handler<C>): Handler<C> {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof HttpError) return jsonError(error.message, error.status);
      console.error(`[${name}]`, error);
      return jsonError("Something went wrong", 500);
    }
  };
}
