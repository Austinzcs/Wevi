import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import AcceptInviteButton from "@/components/invite/AcceptInviteButton";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      trip: {
        select: {
          id: true,
          title: true,
          description: true,
          destination: true,
          owner: { select: { name: true } },
          _count: { select: { members: true } },
        },
      },
    },
  });

  const session = await auth();

  // Invalid or expired
  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="card p-10 max-w-md w-full text-center">
          <p className="text-4xl mb-4">😕</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invitation not found</h1>
          <p className="text-gray-500 mb-6">
            This invitation link is invalid, expired, or has already been used.
          </p>
          <Link href="/" className="btn-primary">Go to Wevi</Link>
        </div>
      </div>
    );
  }

  const { trip } = invitation;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-blue-50 px-4">
      <div className="card p-10 max-w-md w-full text-center">
        <div className="text-4xl mb-4">✈️</div>
        <p className="text-sm text-gray-500 mb-2">
          <strong>{trip.owner.name}</strong> invited you to join
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{trip.title}</h1>
        {trip.destination && (
          <p className="text-brand-600 flex items-center justify-center gap-1 mb-2">
            <MapPin className="w-4 h-4" /> {trip.destination}
          </p>
        )}
        {trip.description && (
          <p className="text-gray-500 text-sm mb-4">{trip.description}</p>
        )}
        <p className="text-xs text-gray-400 mb-6">
          {trip._count.members} {trip._count.members === 1 ? "member" : "members"} so far
        </p>

        {session?.user ? (
          <AcceptInviteButton token={token} tripId={trip.id} />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">You need an account to accept this invitation.</p>
            <Link
              href={`/register?redirect=/invite/${token}`}
              className="btn-primary w-full justify-center"
            >
              Create account &amp; join
            </Link>
            <Link
              href={`/login?redirect=/invite/${token}`}
              className="btn-secondary w-full justify-center"
            >
              Sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
