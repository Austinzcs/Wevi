import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ItineraryGenerationParams {
  destination: string;
  startDate: string; // ISO
  endDate: string;   // ISO
  groupSize: number;
  preferences?: string;
}

export interface GeneratedItineraryDay {
  date: string;
  dayNumber: number;
  activities: Array<{
    startTime: string;
    endTime: string;
    title: string;
    description: string;
    location: string;
    category: "accommodation" | "activity" | "food" | "transport";
  }>;
}

export async function generateItinerary(
  params: ItineraryGenerationParams
): Promise<GeneratedItineraryDay[]> {
  const { destination, startDate, endDate, groupSize, preferences } = params;

  const prompt = `
You are a travel planning assistant. Generate a detailed day-by-day itinerary for a group trip.

Trip details:
- Destination: ${destination}
- Start date: ${startDate}
- End date: ${endDate}
- Group size: ${groupSize} people
${preferences ? `- Preferences: ${preferences}` : ""}

Return ONLY a valid JSON array of days, where each day has this structure:
{
  "date": "YYYY-MM-DD",
  "dayNumber": 1,
  "activities": [
    {
      "startTime": "HH:mm",
      "endTime": "HH:mm",
      "title": "Activity name",
      "description": "Brief description",
      "location": "Place name",
      "category": "accommodation|activity|food|transport"
    }
  ]
}

Include breakfast, lunch, dinner, and main activities each day. Be specific with real locations.
`.trim();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const content = completion.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(content);

  // Handle both { days: [...] } and [...] formats
  const days: GeneratedItineraryDay[] = Array.isArray(parsed)
    ? parsed
    : (parsed.days ?? parsed.itinerary ?? []);

  return days;
}
