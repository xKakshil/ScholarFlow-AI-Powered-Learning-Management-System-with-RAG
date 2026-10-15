import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { jsonError, withErrors } from "@/lib/http";
import { registerSchema } from "@/validations/auth";

export const POST = withErrors("auth/register", async (req) => {
  const body = await req.json().catch(() => null);
  if (body?.role === "ADMIN") return jsonError("Admin accounts cannot be created through sign-up", 403);

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Name (2+ characters), a valid email and a password (6+ characters) are required", 400);
  }

  const { name, email, password, role } = parsed.data;
  if (await prisma.user.findUnique({ where: { email } })) {
    return jsonError("User already exists", 400);
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: await bcrypt.hash(password, 10),
      role: role ?? "LEARNER",
    },
  });

  return NextResponse.json({ id: user.id, email: user.email, role: user.role }, { status: 201 });
});
