import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const confirmDatesSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

// POST /api/trips/:id/confirm-dates — owner confirms common dates and advances status
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const trip = await prisma.trip.findFirst({
    where: { id, ownerId: session.user.id },
  });
  if (!trip) return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });

  try {
    const body = await req.json();
    const { startDate, endDate } = confirmDatesSchema.parse(body);

    if (new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json({ error: "Start date must be before end date" }, { status: 400 });
    }

    const updated = await prisma.trip.update({
      where: { id },
      data: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "DESTINATION",
      },
    });

    return NextResponse.json({ trip: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[POST /api/trips/:id/confirm-dates]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
