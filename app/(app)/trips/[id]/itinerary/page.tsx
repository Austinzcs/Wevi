import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Sparkles, MapPin, Clock, Utensils, Train, Home } from "lucide-react";
import { formatDate } from "@/lib/utils";
import GenerateItineraryButton from "@/components/itinerary/GenerateItineraryButton";
import EditItemButton from "@/components/itinerary/EditItemButton";

export const dynamic = "force-dynamic";

const categoryIcon = {
  accommodation: Home,
  food: Utensils,
  transport: Train,
  activity: MapPin,
};

const categoryColor = {
  accommodation: "bg-purple-100 text-purple-600",
  food: "bg-orange-100 text-orange-600",
  transport: "bg-blue-100 text-blue-600",
  activity: "bg-green-100 text-green-600",
};

export default async function ItineraryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session!.user!.id!;
  const { id } = await params;

  const trip = await prisma.trip.findFirst({
    where: { id, members: { some: { userId } } },
    select: {
      id: true, title: true, status: true, ownerId: true,
      destination: true, country: true, startDate: true, endDate: true,
      _count: { select: { members: true } },
    },
  });

  if (!trip) notFound();

  const days = await prisma.itineraryDay.findMany({
    where: { tripId: id },
    include: { activities: { orderBy: { sortOrder: "asc" } } },
    orderBy: { dayNumber: "asc" },
  });

  const isOwner = trip.ownerId === userId;
  const canGenerate = !!(trip.destination && trip.startDate && trip.endDate);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/dashboard" className="hover:text-brand-600">My Trips</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/trips/${id}`} className="hover:text-brand-600">{trip.title}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-700">Itinerary</span>
      </div>

      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {trip.destination ? `${trip.destination} Itinerary` : "Itinerary"}
          </h1>
          {trip.startDate && trip.endDate && (
            <p className="text-gray-500 text-sm">
              {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
            </p>
          )}
        </div>
        {canGenerate && (
          <GenerateItineraryButton tripId={id} hasItinerary={days.length > 0} />
        )}
      </div>

      {!canGenerate && (
        <div className="card p-8 text-center text-gray-400 mb-8">
          <Sparkles className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-600 mb-1">Set destination &amp; dates first</p>
          <p className="text-sm">Confirm your destination and travel dates before generating an itinerary.</p>
          <Link href={`/trips/${id}/destination`} className="btn-primary text-sm mt-4 inline-flex">
            Go to destination
          </Link>
        </div>
      )}

      {canGenerate && days.length === 0 && (
        <div className="card p-8 text-center text-gray-400">
          <Sparkles className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-600 mb-1">No itinerary yet</p>
          <p className="text-sm">Click &ldquo;Generate with AI&rdquo; to create a day-by-day plan!</p>
        </div>
      )}

      {/* Days */}
      <div className="space-y-6">
        {days.map((day) => (
          <div key={day.id} className="card overflow-hidden">
            <div className="bg-brand-50 border-b border-brand-100 px-5 py-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-brand-500 uppercase tracking-wide">
                  Day {day.dayNumber}
                </span>
                <h3 className="font-semibold text-gray-900">{formatDate(day.date)}</h3>
              </div>
              <span className="text-sm text-gray-400">{day.activities.length} activities</span>
            </div>

            <div className="divide-y divide-gray-50">
              {day.activities.map((item) => {
                const cat = (item.category ?? "activity") as keyof typeof categoryIcon;
                const Icon = categoryIcon[cat] ?? MapPin;
                const colorClass = categoryColor[cat] ?? "bg-gray-100 text-gray-600";

                return (
                  <div key={item.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 group">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                        {item.isAiGenerated && (
                          <span className="text-xs text-brand-400 bg-brand-50 px-1.5 py-0.5 rounded">AI</span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.startTime} – {item.endTime}
                        </span>
                        {item.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {item.location}
                          </span>
                        )}
                      </div>
                    </div>
                    {isOwner && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <EditItemButton item={item} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
