import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const destinationSchema = z.object({
  name: z.string().min(1).max(100),
  country: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
});

// GET /api/trips/:id/destinations
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const destinations = await prisma.destination.findMany({
    where: { tripId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { votes: "desc" },
  });

  return NextResponse.json({ destinations });
}

// POST /api/trips/:id/destinations
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
    const data = destinationSchema.parse(body);

    const destination = await prisma.destination.create({
      data: { ...data, tripId: id, userId: session.user.id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({ destination }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[POST /api/trips/:id/destinations]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
