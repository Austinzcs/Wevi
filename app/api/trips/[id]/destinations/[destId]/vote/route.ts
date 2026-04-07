import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/trips/:id/destinations/:destId/vote — toggle vote
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; destId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, destId } = await params;

  // Verify membership
  const isMember = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId: id, userId: session.user.id } },
  });
  if (!isMember) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  // Verify destination exists in this trip
  const destination = await prisma.destination.findFirst({
    where: { id: destId, tripId: id },
  });
  if (!destination) return NextResponse.json({ error: "Destination not found" }, { status: 404 });

  // Check if already voted — toggle
  const existingVote = await prisma.destinationVote.findUnique({
    where: { destinationId_userId: { destinationId: destId, userId: session.user.id } },
  });

  if (existingVote) {
    // Remove vote
    await prisma.$transaction([
      prisma.destinationVote.delete({ where: { id: existingVote.id } }),
      prisma.destination.update({
        where: { id: destId },
        data: { votes: { decrement: 1 } },
      }),
    ]);
    return NextResponse.json({ voted: false, votes: destination.votes - 1 });
  } else {
    // Add vote
    await prisma.$transaction([
      prisma.destinationVote.create({
        data: { destinationId: destId, userId: session.user.id },
      }),
      prisma.destination.update({
        where: { id: destId },
        data: { votes: { increment: 1 } },
      }),
    ]);
    return NextResponse.json({ voted: true, votes: destination.votes + 1 });
  }
}
