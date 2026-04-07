import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addDays } from "date-fns";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInvitationEmail } from "@/lib/email";

const inviteSchema = z.object({
  email: z.string().email(),
});

// POST /api/trips/:id/invite
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const trip = await prisma.trip.findFirst({
    where: { id, members: { some: { userId: session.user.id } } },
    include: { owner: { select: { name: true } } },
  });
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  let email: string;
  try {
    ({ email } = inviteSchema.parse(body));
  } catch {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // Check if already a member
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const isMember = await prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId: id, userId: existingUser.id } },
    });
    if (isMember) {
      return NextResponse.json({ error: "This person is already in the trip." }, { status: 409 });
    }
  }

  // Check for existing pending invitation
  const existingInvite = await prisma.invitation.findFirst({
    where: { tripId: id, email, status: "PENDING" },
  });
  if (existingInvite) {
    return NextResponse.json({ error: "An invitation has already been sent to this email." }, { status: 409 });
  }

  const invitation = await prisma.invitation.create({
    data: {
      tripId: id,
      email,
      expiresAt: addDays(new Date(), 7),
    },
  });

  // Send email (non-blocking)
  sendInvitationEmail({
    to: email,
    inviterName: session.user.name ?? "Someone",
    tripTitle: trip.title,
    token: invitation.token,
  }).catch(console.error);

  return NextResponse.json({ invitation }, { status: 201 });
}
