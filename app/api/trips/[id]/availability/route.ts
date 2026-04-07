import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeCommonAvailability } from "@/lib/utils";

const availabilitySchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});

// GET /api/trips/:id/availability
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [availabilities, members] = await Promise.all([
    prisma.availability.findMany({
      where: { tripId: id },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { startTime: "asc" },
    }),
    prisma.tripMember.findMany({
      where: { tripId: id },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  // Compute the common overlapping window (one slot per user — use their latest)
  const latestPerUser = Object.values(
    availabilities.reduce<Record<string, { startTime: Date; endTime: Date }>>((acc, av) => {
      acc[av.userId] = { startTime: av.startTime, endTime: av.endTime };
      return acc;
    }, {})
  );

  const commonWindow = computeCommonAvailability(latestPerUser);

  const missingUsers = members
    .filter((m) => !availabilities.find((a) => a.userId === m.userId))
    .map((m) => m.user);

  return NextResponse.json({ availabilities, commonWindow, missingUsers });
}

// POST /api/trips/:id/availability — set/replace current user's availability
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const isMember = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId: id, userId: session.user.id } },
  });
  if (!isMember) return NextResponse.json({ error: "Not a member of this trip" }, { status: 403 });

  try {
    const body = await req.json();
    const { startTime, endTime } = availabilitySchema.parse(body);

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return NextResponse.json({ error: "Start time must be before end time" }, { status: 400 });
    }

    if (start < new Date()) {
      return NextResponse.json({ error: "Start time cannot be in the past" }, { status: 400 });
    }

    // Upsert (replace) the user's availability for this trip
    await prisma.availability.deleteMany({
      where: { tripId: id, userId: session.user.id },
    });

    const availability = await prisma.availability.create({
      data: {
        tripId: id,
        userId: session.user.id,
        startTime: start,
        endTime: end,
      },
    });

    // Auto-advance trip status to SCHEDULING if still in PLANNING
    const trip = await prisma.trip.findUnique({ where: { id }, select: { status: true } });
    if (trip?.status === "PLANNING") {
      await prisma.trip.update({ where: { id }, data: { status: "SCHEDULING" } });
    }

    return NextResponse.json({ availability }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[POST /api/trips/:id/availability]", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
