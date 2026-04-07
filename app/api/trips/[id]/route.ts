import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/trips/:id
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const trip = await prisma.trip.findFirst({
    where: {
      id,
      members: { some: { userId: session.user.id } },
    },
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
      availabilities: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
      destinations: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { votes: "desc" },
      },
      itinerary: {
        include: { activities: { orderBy: { sortOrder: "asc" } } },
        orderBy: { dayNumber: "asc" },
      },
      invitations: { where: { status: "PENDING" } },
      meetings: { orderBy: { scheduledAt: "asc" } },
    },
  });

  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

  return NextResponse.json({ trip });
}

// PATCH /api/trips/:id — update trip (title, status, destination, dates)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const trip = await prisma.trip.findFirst({
    where: { id, ownerId: session.user.id },
  });
  if (!trip) return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });

  try {
    const body = await req.json();

    // Validate dates if provided
    const startDate = body.startDate ? new Date(body.startDate) : undefined;
    const endDate = body.endDate ? new Date(body.endDate) : undefined;

    if (startDate && endDate && startDate >= endDate) {
      return NextResponse.json({ error: "Start date must be before end date" }, { status: 400 });
    }

    const updated = await prisma.trip.update({
      where: { id },
      data: {
        title: body.title ?? undefined,
        description: body.description ?? undefined,
        status: body.status ?? undefined,
        destination: body.destination ?? undefined,
        country: body.country ?? undefined,
        startDate,
        endDate,
      },
    });

    return NextResponse.json({ trip: updated });
  } catch (err) {
    console.error("[PATCH /api/trips/:id]", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// DELETE /api/trips/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const trip = await prisma.trip.findFirst({
    where: { id, ownerId: session.user.id },
  });
  if (!trip) return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });

  await prisma.trip.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
