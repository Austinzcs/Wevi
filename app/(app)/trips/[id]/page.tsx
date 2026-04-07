import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Calendar, MapPin, Users, Sparkles,
  ChevronRight, CheckCircle2, Circle
} from "lucide-react";
import { formatDate, tripStatusLabel, tripStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import InvitePanel from "@/components/trips/InvitePanel";
import SkipToSchedulingButton from "@/components/trips/SkipToSchedulingButton";
import LeaveTripButton from "@/components/trips/LeaveTripButton";

export const dynamic = "force-dynamic";

const STEPS = [
  { key: "PLANNING",     label: "Invite members (optional)", href: "",              icon: Users },
  { key: "SCHEDULING",   label: "Pick your dates",           href: "availability",  icon: Calendar },
  { key: "DESTINATION",  label: "Choose destination",        href: "destination",   icon: MapPin },
  { key: "ITINERARY",    label: "Build itinerary",           href: "itinerary",     icon: Sparkles },
  { key: "CONFIRMED",    label: "Confirmed!",                href: "",              icon: CheckCircle2 },
];

const STATUS_ORDER = ["PLANNING", "SCHEDULING", "DESTINATION", "ITINERARY", "CONFIRMED", "COMPLETED"];

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session!.user!.id!;
  const { id } = await params;

  const trip = await prisma.trip.findFirst({
    where: { id, members: { some: { userId } } },
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
      availabilities: { select: { userId: true } },
      destinations: { select: { id: true } },
      itinerary: { select: { id: true } },
      _count: { select: { members: true } },
    },
  });

  if (!trip) notFound();

  const currentStepIdx = STATUS_ORDER.indexOf(trip.status);
  const isOwner = trip.ownerId === userId;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-brand-600">My Trips</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-700">{trip.title}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{trip.title}</h1>
          {trip.description && <p className="text-gray-500 mt-1">{trip.description}</p>}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", tripStatusColor(trip.status))}>
              {tripStatusLabel(trip.status)}
            </span>
            {trip.destination && (
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="w-4 h-4" /> {trip.destination}
              </span>
            )}
            {trip.startDate && trip.endDate && (
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Journey steps */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold text-gray-700">Trip journey</h2>
          <div className="card divide-y divide-gray-100">
            {STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const done = idx < currentStepIdx;
              const active = idx === currentStepIdx;
              const locked = idx > currentStepIdx;

              return (
                <div key={step.key} className={cn("flex items-center gap-4 p-4", active && "bg-brand-50")}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    done ? "bg-green-100 text-green-600" :
                    active ? "bg-brand-100 text-brand-600" :
                    "bg-gray-100 text-gray-400"
                  )}>
                    {done ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-medium", locked ? "text-gray-400" : "text-gray-900")}>
                      {step.label}
                    </p>
                  </div>
                  {(active || done) && step.href && (
                    <Link
                      href={`/trips/${id}/${step.href}`}
                      className="btn-primary text-sm py-1.5"
                    >
                      {done ? "View" : "Go"}
                    </Link>
                  )}
                  {active && !step.href && isOwner && step.key === "PLANNING" && (
                    <SkipToSchedulingButton tripId={id} />
                  )}
                  {active && !step.href && isOwner && step.key !== "PLANNING" && (
                    <span className="text-xs text-brand-600 font-medium">Current step</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Members */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" /> Members ({trip._count.members})
            </h3>
            <div className="space-y-2">
              {trip.members.map((m) => (
                <div key={m.userId} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {(m.user.name ?? m.user.email ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{m.user.name ?? m.user.email}</p>
                    {m.role === "OWNER" && <p className="text-xs text-gray-400">Owner</p>}
                  </div>
                  {trip.availabilities.some((a) => a.userId === m.userId) && (
                    <span title="Availability submitted"><CheckCircle2 className="w-4 h-4 text-green-500 ml-auto shrink-0" /></span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Invite */}
          <InvitePanel tripId={id} />

          {/* Leave trip (only for non-owners) */}
          {!isOwner && (
            <div className="flex justify-center pt-2">
              <LeaveTripButton tripId={id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
