import { Link, useRouterState } from "@tanstack/react-router";
import { Map, BookOpen, Sparkles, Camera } from "lucide-react";

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items: { to: string; label: string; Icon: typeof Map }[] = [
    { to: "/", label: "Field", Icon: Map },
    { to: "/herbarium", label: "Herbarium", Icon: BookOpen },
    { to: "/capture", label: "Capture", Icon: Camera },
    { to: "/discover", label: "Discover", Icon: Sparkles },
  ];
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
      <div className="mx-auto max-w-md px-4 pb-5 pt-3 bg-gradient-to-t from-sage via-sage/95 to-sage/0">
        <div className="pointer-events-auto grid grid-cols-4 items-center rounded-3xl bg-bone border border-forest/5 shadow-[0_8px_30px_-12px_rgba(26,47,35,0.25)] p-2">
          {items.map(({ to, label, Icon }) => (
            <NavItem
              key={to}
              to={to}
              label={label}
              Icon={Icon}
              active={to === "/" ? pathname === to : pathname.startsWith(to)}
              prominent={to === "/capture"}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

function NavItem({
  to,
  label,
  Icon,
  active,
  prominent = false,
}: {
  to: string;
  label: string;
  Icon: typeof Map;
  active: boolean;
  prominent?: boolean;
}) {
  return (
    <Link
      to={to}
      className="flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 active:scale-95 transition"
      data-active={active}
    >
      <span
        className={
          "grid size-9 place-items-center rounded-2xl transition " +
          (prominent
            ? active
              ? "bg-forest text-bone shadow-lg shadow-forest/20"
              : "bg-forest text-bone"
            : active
              ? "bg-sage text-forest"
              : "text-moss/50")
        }
      >
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <span
        className={
          "max-w-full truncate text-[9px] uppercase tracking-[0.12em] font-semibold " +
          (active ? "text-forest" : "text-moss/50")
        }
      >
        {label}
      </span>
    </Link>
  );
}
