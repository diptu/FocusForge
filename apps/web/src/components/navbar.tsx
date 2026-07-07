"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/log", label: "Log" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/plan", label: "Plan" },
  { href: "/goals", label: "Goals" },
  { href: "/design-system", label: "Design tokens" },
] as const;

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full bg-surface py-1.5 pl-1.5 pr-3.5"
        >
          <span
            aria-hidden
            className="h-6 w-6 shrink-0 rounded-full bg-[image:var(--gradient-sunset)]"
          />
          <span className="text-xs font-bold uppercase tracking-wide text-foreground">
            FocusForge
          </span>
        </Link>
        <ul className="flex items-center gap-1 rounded-full bg-surface p-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors duration-[var(--duration-fast)] ease-standard ${
                    active
                      ? "bg-brand text-brand-foreground shadow-sm"
                      : "text-foreground-muted hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
