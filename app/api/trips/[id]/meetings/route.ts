import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const meetingSchema = z.object({
  title: z.string().min(1).max(200),
  scheduledAt: z.string().datetime(),
  duration: z.number().int().min(5).max(480).default(30),
  meetingUrl: z.string().url().optional(),
});

// GET /api/trips/:id/meetings
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const isMember = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId: id, userId: session.user.id } },
  });
  if (!isMember) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const meetings = await prisma.meeting.findMany({
    where: { tripId: id },
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json({ meetings });
}

// POST /api/trips/:id/meetings — create a meeting
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const isMember = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId: id, userId: session.user.id } },
  });
  if (!isMember) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  try {
    const body = await req.json();
    const data = meetingSchema.parse(body);

    if (new Date(data.scheduledAt) < new Date()) {
      return NextResponse.json({ error: "Meeting time must be in the future" }, { status: 400 });
    }

    const meeting = await prisma.meeting.create({
      data: {
        tripId: id,
        title: data.title,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration,
        meetingUrl: data.meetingUrl,
      },
    });

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[POST /api/trips/:id/meetings]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
