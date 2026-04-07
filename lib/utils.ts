import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, fmt = "MMM d, yyyy") {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt);
}

export function formatDateTime(date: Date | string) {
  return formatDate(date, "MMM d, yyyy 'at' HH:mm");
}

export function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Calculate the overlapping time window across all user availabilities.
 * Returns { start, end } or null if no overlap exists.
 */
export function computeCommonAvailability(
  availabilities: Array<{ startTime: Date; endTime: Date }>
): { start: Date; end: Date } | null {
  if (availabilities.length === 0) return null;

  let commonStart = availabilities[0].startTime;
  let commonEnd = availabilities[0].endTime;

  for (const av of availabilities.slice(1)) {
    if (av.startTime > commonStart) commonStart = av.startTime;
    if (av.endTime < commonEnd) commonEnd = av.endTime;
  }

  if (commonStart >= commonEnd) return null;
  return { start: commonStart, end: commonEnd };
}

export function generateInviteUrl(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/invite/${token}`;
}

export function tripStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PLANNING: "Planning",
    SCHEDULING: "Scheduling",
    DESTINATION: "Choosing Destination",
    ITINERARY: "Building Itinerary",
    CONFIRMED: "Confirmed",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  return labels[status] ?? status;
}

export function tripStatusColor(status: string) {
  const colors: Record<string, string> = {
    PLANNING: "bg-yellow-100 text-yellow-800",
    SCHEDULING: "bg-blue-100 text-blue-800",
    DESTINATION: "bg-purple-100 text-purple-800",
    ITINERARY: "bg-orange-100 text-orange-800",
    CONFIRMED: "bg-green-100 text-green-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return colors[status] ?? "bg-gray-100 text-gray-800";
}
