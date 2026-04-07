import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, MapPin, ThumbsUp, Video, Clock } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import AddDestinationForm from "@/components/destinations/AddDestinationForm";
import VoteButton from "@/components/destinations/VoteButton";
import ConfirmDestinationButton from "@/components/destinations/ConfirmDestinationButton";
import ScheduleMeetingButton from "@/components/meetings/ScheduleMeetingButton";

export const dynamic = "force-dynamic";

export default async function DestinationPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session!.user!.id!;
  const { id } = await params;

  const [trip, destinations, meetings] = await Promise.all([
    prisma.trip.findFirst({
      where: { id, members: { some: { userId } } },
      select: { id: true, title: true, status: true, ownerId: true, destination: true },
    }),
    prisma.destination.findMany({
      where: { tripId: id },
      include: {
        user: { select: { id: true, name: true } },
        votersList: { select: { userId: true } },
      },
      orderBy: { votes: "desc" },
    }),
    prisma.meeting.findMany({
      where: { tripId: id, status: "SCHEDULED" },
      orderBy: { scheduledAt: "asc" },
    }),
  ]);

  if (!trip) notFound();

  const isOwner = trip.ownerId === userId;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/dashboard" className="hover:text-brand-600">My Trips</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/trips/${id}`} className="hover:text-brand-600">{trip.title}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-700">Destination</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Choose a destination</h1>
      <p className="text-gray-500 mb-4">
        Everyone suggests their dream destinations and votes. Schedule a 30-min call to discuss and decide!
      </p>

      {/* Schedule meeting + upcoming meetings */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Video className="w-4 h-4 text-brand-500" />
            Discussion meetings
          </h2>
          <ScheduleMeetingButton tripId={id} />
        </div>
        {meetings.length > 0 ? (
          <div className="space-y-2">
            {meetings.map((m) => (
              <div key={m.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{m.title}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(m.scheduledAt)} · {m.duration} min</p>
                </div>
                {m.meetingUrl && (
                  <a href={m.meetingUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs py-1 px-2">
                    Join
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No meetings scheduled yet. Schedule one to discuss destinations!</p>
        )}
      </div>

      {/* Confirmed destination banner */}
      {trip.destination && (
        <div className="card p-5 bg-green-50 border border-green-200 mb-6">
          <p className="font-semibold text-green-800 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Destination confirmed: {trip.destination}
          </p>
        </div>
      )}

      {/* Add destination */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Suggest a destination</h2>
        <AddDestinationForm tripId={id} />
      </div>

      {/* Destination list */}
      {destinations.length > 0 && (
        <div className="space-y-3 mb-6">
          <h2 className="font-semibold text-gray-700">Suggestions ({destinations.length})</h2>
          {destinations.map((dest) => (
            <div key={dest.id} className="card p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{dest.name}</p>
                {dest.country && <p className="text-sm text-gray-500">{dest.country}</p>}
                {dest.description && <p className="text-sm text-gray-600 mt-1">{dest.description}</p>}
                <p className="text-xs text-gray-400 mt-1">Suggested by {dest.user.name}</p>
              </div>
              <VoteButton
                tripId={id}
                destId={dest.id}
                hasVoted={dest.votersList.some((v: { userId: string }) => v.userId === userId)}
                voteCount={dest.votes}
              />
              {isOwner && !trip.destination && (
                <ConfirmDestinationButton tripId={id} destination={dest.name} country={dest.country ?? ""} />
              )}
            </div>
          ))}
        </div>
      )}

      {destinations.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <MapPin className="w-10 h-10 mx-auto mb-3" />
          <p>No suggestions yet. Be the first!</p>
        </div>
      )}
    </div>
  );
}
