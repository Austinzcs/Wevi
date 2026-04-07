import Link from "next/link";
import { MapPin, Calendar, Users, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-blue-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-2xl font-bold text-brand-600">wevi</span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-secondary text-sm">Log in</Link>
          <Link href="/register" className="btn-primary text-sm">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-6 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <Sparkles className="w-4 h-4" />
          AI-powered trip planning
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Plan group trips<br />
          <span className="text-brand-600">without the chaos</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Wevi helps old friends coordinate travel — find a common time window,
          vote on destinations, and let AI build the perfect itinerary together.
        </p>
        <Link href="/register" className="btn-primary text-base px-8 py-3">
          Start planning for free →
        </Link>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-24 text-left">
          {[
            {
              icon: <Calendar className="w-6 h-6 text-brand-500" />,
              title: "Smart scheduling",
              desc: "Everyone fills in their free time. Wevi instantly finds the longest window that works for the whole group.",
            },
            {
              icon: <MapPin className="w-6 h-6 text-brand-500" />,
              title: "Destination voting",
              desc: "Suggest places, vote on favourites, and schedule a 30-min call to finalise. No more endless WhatsApp threads.",
            },
            {
              icon: <Sparkles className="w-6 h-6 text-brand-500" />,
              title: "AI itinerary",
              desc: "Once dates and destination are locked in, our AI generates a day-by-day itinerary you can customise together.",
            },
          ].map((f) => (
            <div key={f.title} className="card p-6">
              <div className="mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
