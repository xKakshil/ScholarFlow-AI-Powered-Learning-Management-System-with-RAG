import jwt from "jsonwebtoken";

export type Role = "ADMIN" | "INSTRUCTOR" | "LEARNER";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
};

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET is not set");
  return value;
}

export function createToken(payload: AuthUser) {
  return jwt.sign(payload, secret(), { expiresIn: "7d" });
}

export function getUserFromToken(req: Request): AuthUser | null {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, secret());
    if (typeof decoded === "string") return null;
    const { id, email, role } = decoded as Partial<AuthUser>;
    if (!id || !email || !role) return null;
    return { id, email, role };
  } catch {
    return null;
  }
}
