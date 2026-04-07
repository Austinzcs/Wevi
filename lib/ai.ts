import Anthropic from "@anthropic-ai/sdk";

function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured. Please add it to your environment variables.");
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

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

Return ONLY a valid JSON array of days (no markdown, no code fences, no explanation), where each day has this structure:
[
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
]

Include breakfast, lunch, dinner, and main activities each day. Be specific with real locations.
`.trim();

  const client = getAnthropicClient();
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  // Extract text content from Claude's response
  const textBlock = message.content.find((block) => block.type === "text");
  const content = textBlock?.text ?? "[]";

  // Clean up potential markdown code fences
  const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const parsed = JSON.parse(cleaned);

  // Handle both { days: [...] } and [...] formats
  const days: GeneratedItineraryDay[] = Array.isArray(parsed)
    ? parsed
    : (parsed.days ?? parsed.itinerary ?? []);

  return days;
}
