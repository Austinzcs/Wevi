"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { MapPin, LogOut, User } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface NavbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "My Trips" },
  ];

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Wevi" className="h-8" />
        </Link>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User menu */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                {getInitials(user.name)}
              </div>
            )}
            <span className="hidden sm:block text-sm text-gray-700">{user.name}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
