"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Zap, Trophy, BarChart3, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/quiz?type=quick_quiz&track=written_knowledge", label: "Quiz", icon: Zap },
  { href: "/exam?track=written_knowledge", label: "Exam", icon: Trophy },
  { href: "/history", label: "Progress", icon: BarChart3 },
];

// Pages where the bottom nav should NOT appear
const HIDDEN_PATHS = ["/", "/auth", "/onboarding"];

function shouldHideNav(pathname: string): boolean {
  if (pathname === "/") return true;
  return HIDDEN_PATHS.some(
    (p) => p !== "/" && pathname.startsWith(p)
  );
}

export function BottomNav() {
  const pathname = usePathname();

  if (shouldHideNav(pathname)) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/dashboard" && pathname === "/dashboard") ||
            (item.href.startsWith("/quiz") && pathname === "/quiz") ||
            (item.href.startsWith("/exam") && pathname === "/exam") ||
            (item.href === "/history" && pathname === "/history");

          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                isActive
                  ? "text-amber-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
