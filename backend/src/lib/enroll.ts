import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/lib/auth";
import { HttpError } from "@/lib/http";

// PAYMENT_MODE=demo records paid enrollments without charging. Other values
// reject paid enrollments until a payment gateway is integrated.
export async function enrollLearner(user: AuthUser, courseId: unknown) {
  if (user.role !== "LEARNER") throw new HttpError("Only learner accounts can enroll in courses", 403);
  if (typeof courseId !== "string" || !courseId) throw new HttpError("courseId is required", 400);

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, price: true },
  });
  if (!course) throw new HttpError("Course not found", 404);

  const existing = await prisma.enrollment.findFirst({ where: { userId: user.id, courseId } });
  if (existing) throw new HttpError("Already enrolled", 400);

  const mode = process.env.PAYMENT_MODE ?? "demo";
  if (course.price > 0 && mode !== "demo") {
    throw new HttpError("Payments are not configured on this server", 402);
  }

  const [payment, enrollment] = await prisma.$transaction(async (tx) => {
    const payment =
      course.price > 0
        ? await tx.payment.create({
            data: { userId: user.id, courseId, amount: course.price, status: "SUCCESS" },
          })
        : null;
    const enrollment = await tx.enrollment.create({
      data: { userId: user.id, courseId },
      include: { course: true },
    });
    await tx.progress.create({ data: { userId: user.id, courseId, percentage: 0 } });
    return [payment, enrollment] as const;
  });

  return {
    ...enrollment,
    payment: payment ? { id: payment.id, amount: payment.amount, status: payment.status, mode } : null,
  };
}
