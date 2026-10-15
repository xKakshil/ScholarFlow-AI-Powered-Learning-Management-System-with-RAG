import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, withErrors } from "@/lib/http";

export const GET = withErrors("admin/revenue", async (req) => {
  requireUser(req, ["ADMIN"]);

  const totals = await prisma.payment.aggregate({ _sum: { amount: true }, _count: true });

  return NextResponse.json({
    revenue: totals._sum.amount ?? 0,
    transactions: totals._count,
  });
});
