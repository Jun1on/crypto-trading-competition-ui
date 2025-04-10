"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const Header = () => {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/" },
    { name: "Leaderboard", href: "/leaderboard" },
    { name: "Participation", href: "/participation" },
    { name: "Swap", href: "/swap" }, // Added Swap link
  ];

  return (
    <header className="bg-gray-900 text-white py-4 shadow-md">
      <nav className="container mx-auto px-4 flex justify-center space-x-8">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <span
                className={`px-3 py-2 rounded-md text-lg font-medium transition-colors ${
                  isActive
                    ? "text-orange-500 border-b-2 border-orange-500"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
};

export default Header;
