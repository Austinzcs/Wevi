import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:mm format").optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:mm format").optional(),
  location: z.string().optional(),
});

async function getItemAndVerifyMembership(itemId: string, userId: string) {
  const item = await prisma.itineraryItem.findUnique({
    where: { id: itemId },
    include: { day: { select: { tripId: true } } },
  });

  if (!item) return { error: "Not found", status: 404 };

  const isMember = await prisma.tripMember.findUnique({
    where: {
      tripId_userId: { tripId: item.day.tripId, userId },
    },
  });
  if (!isMember) return { error: "Forbidden", status: 403 };

  return { item };
}

// PATCH /api/itinerary/items/:itemId
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;
  const result = await getItemAndVerifyMembership(itemId, session.user.id);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  try {
    const body = await req.json();
    const data = patchSchema.parse(body);

    // Validate time order
    const startTime = data.startTime ?? result.item.startTime;
    const endTime = data.endTime ?? result.item.endTime;
    if (startTime && endTime && startTime >= endTime) {
      return NextResponse.json({ error: "Start time must be before end time" }, { status: 400 });
    }

    const updated = await prisma.itineraryItem.update({
      where: { id: itemId },
      data: { ...data, isAiGenerated: false },
    });

    return NextResponse.json({ item: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[PATCH /api/itinerary/items/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/itinerary/items/:itemId
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;
  const result = await getItemAndVerifyMembership(itemId, session.user.id);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await prisma.itineraryItem.delete({ where: { id: itemId } });

  return NextResponse.json({ success: true });
}
