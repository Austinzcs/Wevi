import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wevi — Plan trips with friends",
  description: "Coordinate group travel effortlessly. Find a common time, vote on destinations, and build a shared itinerary together.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
