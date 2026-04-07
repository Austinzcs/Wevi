import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/trips/:id/leave — current user leaves the trip
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const member = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId: id, userId: session.user.id } },
  });

  if (!member) return NextResponse.json({ error: "Not a member of this trip" }, { status: 404 });

  // Trip owner cannot leave — they must delete the trip instead
  if (member.role === "OWNER") {
    return NextResponse.json(
      { error: "Trip owner cannot leave. Delete the trip instead." },
      { status: 400 }
    );
  }

  // Remove member and their availability
  await prisma.$transaction([
    prisma.tripMember.delete({ where: { id: member.id } }),
    prisma.availability.deleteMany({ where: { tripId: id, userId: session.user.id } }),
  ]);

  return NextResponse.json({ success: true });
}
