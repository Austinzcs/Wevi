import type { Trip, TripMember, User, Availability, Destination, ItineraryDay, ItineraryItem, Invitation, TripStatus } from "@prisma/client";

export type { TripStatus };

// ─── Extended types with relations ───────────────────────────────────────────

export type TripWithMembers = Trip & {
  members: (TripMember & { user: Pick<User, "id" | "name" | "email" | "image"> })[];
  owner: Pick<User, "id" | "name" | "email" | "image">;
  _count?: { members: number };
};

export type TripWithAll = TripWithMembers & {
  availabilities: (Availability & { user: Pick<User, "id" | "name" | "email" | "image"> })[];
  destinations: (Destination & { user: Pick<User, "id" | "name" | "email"> })[];
  itinerary: (ItineraryDay & { activities: ItineraryItem[] })[];
  invitations: Invitation[];
};

export type MemberWithUser = TripMember & {
  user: Pick<User, "id" | "name" | "email" | "image">;
};

// ─── API request/response shapes ─────────────────────────────────────────────

export interface CreateTripInput {
  title: string;
  description?: string;
}

export interface InviteMemberInput {
  email: string;
}

export interface SetAvailabilityInput {
  startTime: string; // ISO datetime
  endTime: string;
}

export interface AddDestinationInput {
  name: string;
  country?: string;
  description?: string;
  imageUrl?: string;
}

export interface GenerateItineraryInput {
  preferences?: string;
}

// ─── Availability helpers ─────────────────────────────────────────────────────

export interface CommonWindow {
  start: Date;
  end: Date;
  durationHours: number;
}
