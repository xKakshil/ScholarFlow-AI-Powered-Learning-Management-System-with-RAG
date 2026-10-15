import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/auth";
import { jsonError, withErrors } from "@/lib/http";
import { loginSchema } from "@/validations/auth";

export const POST = withErrors("auth/login", async (req) => {
  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Enter a valid email and password", 400);

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return jsonError("Invalid credentials", 401);
  }

  const token = createToken({ id: user.id, email: user.email, role: user.role });
  return NextResponse.json({
    token,
    user: { id: user.id, email: user.email, role: user.role },
  });
});
