import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, MapPin, Users, Calendar } from "lucide-react";
import CreateTripButton from "@/components/trips/CreateTripButton";
import { formatDate, tripStatusLabel, tripStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const trips = await prisma.trip.findMany({
    where: { members: { some: { userId } } },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      members: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      _count: { select: { members: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
          <p className="text-gray-500 mt-1">Plan and manage your group travel</p>
        </div>
        <CreateTripButton />
      </div>

      {trips.length === 0 ? (
        <div className="card p-16 text-center">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No trips yet</h3>
          <p className="text-gray-500 mb-6">Create your first trip and invite your friends!</p>
          <CreateTripButton />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => (
            <Link key={trip.id} href={`/trips/${trip.id}`} className="card p-6 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-brand-600 transition-colors">
                    {trip.title}
                  </h3>
                  {trip.destination && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {trip.destination}
                    </p>
                  )}
                </div>
                <span className={cn("text-xs font-medium px-2 py-1 rounded-full ml-2 shrink-0", tripStatusColor(trip.status))}>
                  {tripStatusLabel(trip.status)}
                </span>
              </div>

              {trip.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{trip.description}</p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{trip._count.members} {trip._count.members === 1 ? "member" : "members"}</span>
                </div>
                {trip.startDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(trip.startDate)}</span>
                  </div>
                )}
              </div>

              {/* Member avatars */}
              <div className="flex -space-x-2 mt-4">
                {trip.members.slice(0, 5).map((m) => (
                  <div
                    key={m.userId}
                    className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center ring-2 ring-white"
                    title={m.user.name ?? ""}
                  >
                    {(m.user.name ?? "?")[0].toUpperCase()}
                  </div>
                ))}
                {trip._count.members > 5 && (
                  <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center ring-2 ring-white">
                    +{trip._count.members - 5}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
