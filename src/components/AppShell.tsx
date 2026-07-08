import { type ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-sage font-sans text-forest">
      <div className="max-w-md mx-auto relative pb-32 min-h-screen flex flex-col bg-sage">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
