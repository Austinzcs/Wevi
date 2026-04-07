import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateItinerary } from "@/lib/ai";
import { differenceInDays } from "date-fns";

const generateSchema = z.object({
  preferences: z.string().max(300).optional(),
});

// GET /api/trips/:id/itinerary
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const days = await prisma.itineraryDay.findMany({
    where: { tripId: id },
    include: { activities: { orderBy: { sortOrder: "asc" } } },
    orderBy: { dayNumber: "asc" },
  });

  return NextResponse.json({ days });
}

// POST /api/trips/:id/itinerary/generate — AI generation
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const trip = await prisma.trip.findFirst({
    where: { id, members: { some: { userId: session.user.id } } },
    include: { _count: { select: { members: true } } },
  });
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  if (!trip.destination || !trip.startDate || !trip.endDate) {
    return NextResponse.json(
      { error: "Trip must have a destination, start date, and end date before generating an itinerary." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { preferences } = generateSchema.parse(body);

  try {
    // Generate via Claude AI
    const generatedDays = await generateItinerary({
      destination: `${trip.destination}${trip.country ? `, ${trip.country}` : ""}`,
      startDate: trip.startDate.toISOString().split("T")[0],
      endDate: trip.endDate.toISOString().split("T")[0],
      groupSize: trip._count.members,
      preferences,
    });

    if (!generatedDays.length) {
      return NextResponse.json({ error: "AI returned an empty itinerary. Please try again." }, { status: 500 });
    }

    // Save to DB (replace existing itinerary)
    await prisma.itineraryDay.deleteMany({ where: { tripId: id } });

    for (const day of generatedDays) {
      const created = await prisma.itineraryDay.create({
        data: {
          tripId: id,
          date: new Date(day.date),
          dayNumber: day.dayNumber,
        },
      });

      await prisma.itineraryItem.createMany({
        data: day.activities.map((act, idx) => ({
          dayId: created.id,
          startTime: act.startTime,
          endTime: act.endTime,
          title: act.title,
          description: act.description,
          location: act.location,
          category: act.category,
          isAiGenerated: true,
          sortOrder: idx,
        })),
      });
    }

    // Advance trip status
    await prisma.trip.update({
      where: { id },
      data: { status: "ITINERARY" },
    });

    const days = await prisma.itineraryDay.findMany({
      where: { tripId: id },
      include: { activities: { orderBy: { sortOrder: "asc" } } },
      orderBy: { dayNumber: "asc" },
    });

    return NextResponse.json({ days });
  } catch (err: unknown) {
    console.error("[POST /api/trips/:id/itinerary]", err);
    const message = err instanceof Error ? err.message : "Failed to generate itinerary";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
