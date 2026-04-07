import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createTripSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

// GET /api/trips — list all trips for the current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trips = await prisma.trip.findMany({
    where: {
      members: { some: { userId: session.user.id } },
    },
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
      _count: { select: { members: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ trips });
}

// POST /api/trips — create a new trip
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { title, description } = createTripSchema.parse(body);

    const trip = await prisma.trip.create({
      data: {
        title,
        description,
        ownerId: session.user.id,
        members: {
          create: { userId: session.user.id, role: "OWNER" },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true, image: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
    });

    return NextResponse.json({ trip }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[POST /api/trips]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
