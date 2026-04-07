import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { computeCommonAvailability } from "@/lib/utils";
import AvailabilityForm from "@/components/availability/AvailabilityForm";
import ConfirmDatesButton from "@/components/availability/ConfirmDatesButton";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session!.user!.id!;
  const { id } = await params;

  const [trip, availabilities, members] = await Promise.all([
    prisma.trip.findFirst({
      where: { id, members: { some: { userId } } },
      select: { id: true, title: true, status: true, ownerId: true, startDate: true, endDate: true },
    }),
    prisma.availability.findMany({
      where: { tripId: id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { startTime: "asc" },
    }),
    prisma.tripMember.findMany({
      where: { tripId: id },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  if (!trip) notFound();

  const myAvailability = availabilities.find((a) => a.userId === userId);
  const missingUsers = members
    .filter((m) => !availabilities.find((a) => a.userId === m.userId))
    .map((m) => m.user);

  const latestPerUser = Object.values(
    availabilities.reduce<Record<string, { startTime: Date; endTime: Date }>>((acc, av) => {
      acc[av.userId] = { startTime: av.startTime, endTime: av.endTime };
      return acc;
    }, {})
  );
  const commonWindow = computeCommonAvailability(latestPerUser);
  const isOwner = trip.ownerId === userId;
  const datesConfirmed = !!(trip.startDate && trip.endDate);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/dashboard" className="hover:text-brand-600">My Trips</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/trips/${id}`} className="hover:text-brand-600">{trip.title}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-700">Availability</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Find a common time</h1>
      <p className="text-gray-500 mb-8">
        Submit your available window and Wevi will calculate the longest time that works for everyone.
      </p>

      {/* Common window result */}
      {commonWindow ? (
        <div className="card p-5 bg-green-50 border border-green-200 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-800">Common window found! 🎉</p>
              <p className="text-green-700 text-sm mt-1">
                {formatDateTime(commonWindow.start)} → {formatDateTime(commonWindow.end)}
              </p>
              <p className="text-green-600 text-xs mt-1">
                {Math.round((commonWindow.end.getTime() - commonWindow.start.getTime()) / 3_600_000)} hours overlap
              </p>
              {isOwner && !datesConfirmed && (
                <div className="mt-3">
                  <ConfirmDatesButton
                    tripId={id}
                    commonStart={commonWindow.start.toISOString()}
                    commonEnd={commonWindow.end.toISOString()}
                  />
                </div>
              )}
              {datesConfirmed && (
                <p className="text-green-600 text-xs mt-2 font-medium">✓ Trip dates have been confirmed</p>
              )}
            </div>
          </div>
        </div>
      ) : availabilities.length >= 2 ? (
        <div className="card p-5 bg-yellow-50 border border-yellow-200 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-800">No overlap found yet</p>
              <p className="text-yellow-700 text-sm mt-1">
                The current windows don&apos;t overlap. Ask everyone to widen their availability.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* My availability form */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-500" />
          Your availability
        </h2>
        <AvailabilityForm tripId={id} existing={myAvailability ?? null} />
      </div>

      {/* All member submissions */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Group availability</h2>
        <div className="space-y-3">
          {members.map((m) => {
            const av = availabilities.find((a) => a.userId === m.userId);
            return (
              <div key={m.userId} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0">
                  {(m.user.name ?? m.user.email ?? "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{m.user.name ?? m.user.email}</p>
                  {av ? (
                    <p className="text-xs text-gray-500">
                      {formatDateTime(av.startTime)} → {formatDateTime(av.endTime)}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Not submitted yet</p>
                  )}
                </div>
                {av ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {missingUsers.length > 0 && (
          <p className="text-xs text-gray-500 mt-4">
            ⏳ Waiting for {missingUsers.length} {missingUsers.length === 1 ? "person" : "people"} to submit.
            They&apos;ll receive a daily reminder email.
          </p>
        )}
      </div>
    </div>
  );
}
