import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/invite/:token — fetch invitation info (for the accept page)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      trip: {
        select: { id: true, title: true, description: true, owner: { select: { name: true } } },
      },
    },
  });

  if (!invitation) return NextResponse.json({ error: "Invalid invitation link." }, { status: 404 });
  if (invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invitation has expired or already been used." }, { status: 410 });
  }

  return NextResponse.json({ invitation });
}

// POST /api/invite/:token — accept the invitation
export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be logged in to accept an invitation." }, { status: 401 });
  }

  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
  });

  if (!invitation) return NextResponse.json({ error: "Invalid invitation." }, { status: 404 });
  if (invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invitation expired." }, { status: 410 });
  }

  // Add user to trip
  await prisma.$transaction([
    prisma.tripMember.upsert({
      where: { tripId_userId: { tripId: invitation.tripId, userId: session.user.id } },
      create: { tripId: invitation.tripId, userId: session.user.id, role: "MEMBER" },
      update: {},
    }),
    prisma.invitation.update({
      where: { token },
      data: { status: "ACCEPTED" },
    }),
  ]);

  return NextResponse.json({ tripId: invitation.tripId });
}
